import { sendPasswordResetEmail } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { partnerAuth } from "../utils/organisationPartnerAccount.js";
import { auth } from "../firebase.js";
import { organisationEnrolmentRequest } from "../utils/organisationEnrolmentRequest.js";
import "./OrganisationDirectory.css";

const request = (path, body = null) => organisationEnrolmentRequest(path, body, {
  staff: true, getToken: () => auth.currentUser?.getIdToken(),
});
const money = value => value === null || value === undefined || !Number.isFinite(Number(value))
  ? "Not configured" : new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(Number(value));
const clean = value => String(value || "").trim();
const lower = value => clean(value).toLowerCase();

function whatsappNumber(value) {
  const phone = clean(value).replace(/[^0-9]/g, "");
  if (/^0[235][0-9]{8}$/.test(phone)) return "233" + phone.slice(1);
  if (/^233[235][0-9]{8}$/.test(phone)) return phone;
  return "";
}
function reminderText(org, ledger) {
  const owing = ledger.students.filter(student => student.balanceDue !== null && student.balanceDue > 0);
  const lines = owing.map(student =>
    "- " + (student.name || student.studentCode || "Student") + " (" + (student.level || "level not set") + "): " + money(student.balanceDue));
  const contact = org.contactName ? "Hello " + org.contactName + "," : "Hello,";
  const qualifier = ledger.unverifiedCount ? " Other students have unverified tuition balances and are not included in this total." : "";
  return [
    contact, "",
    "This is a tuition payment reminder for " + org.name + ".",
    "Our current Falowen records show the following outstanding balances:",
    ...lines, "",
    "Known outstanding total: " + money(ledger.outstandingTotal) + "." + qualifier,
    "Please contact Falowen to confirm payment arrangements or request your payment link.",
    "If you have already paid, please share the payment reference so we can verify it.", "",
    "Thank you,", "Falowen · Learn Language Education Academy",
  ].join("\n");
}
function reminderLinks(org, ledger) {
  if (!ledger || ledger.truncated || ledger.owingCount < 1) return null;
  const message = reminderText(org, ledger);
  const email = clean(org.billingEmail || org.contactEmail);
  const whatsapp = whatsappNumber(org.phone);
  return {
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "mailto:" + encodeURIComponent(email) + "?subject=" + encodeURIComponent("Falowen · Organisation tuition reminder") + "&body=" + encodeURIComponent(message) : "",
    whatsapp: whatsapp ? "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(message) : "",
  };
}

export default function OrganisationDirectory() {
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [ledgers, setLedgers] = useState({});
  const [ledgerErrors, setLedgerErrors] = useState({});
  const [ledgerLoading, setLedgerLoading] = useState(null);
  const [inviting, setInviting] = useState(null);
  const [payments, setPayments] = useState({});
  const [paymentLoading, setPaymentLoading] = useState(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await request("admin/organisations");
      setOrganisations(response.organisations || []);
      setTruncated(Boolean(response.truncated));
      setLoaded(true);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function openPartner(org, refresh = false) {
    setSelectedId(org.id);
    if (ledgers[org.id] && !refresh) return;
    setLedgerLoading(org.id);
    setLedgerErrors(old => ({ ...old, [org.id]: "" }));
    try {
      const result = await request("admin/organisations/" + encodeURIComponent(org.id) + "/students");
      setLedgers(old => ({ ...old, [org.id]: result }));
    } catch (e) { setLedgerErrors(old => ({ ...old, [org.id]: e.message })); }
    finally { setLedgerLoading(null); }
  }
  async function activatePartner(org) {
    if (!window.confirm("Verify the authorised company contact before " + (org.accountPrepared ? "resending setup instructions to " : "preparing access for ") + org.name + " (" + org.contactEmail + "). Continue?")) return;
    setInviting(org.id); setError(""); setNotice("");
    try {
      const result = await request("admin/organisation-partners/prepare", { email: org.contactEmail });
      await sendPasswordResetEmail(partnerAuth, result.email, { url: "https://www.falowen.app/partnerships" });
      setNotice("Partner account prepared. Password setup/reset email requested for " + result.email + ". The partner must verify their email.");
      setOrganisations(old => old.map(row => row.id === org.id ? { ...row, accountPrepared: true } : row));
    } catch(e) {
      setError(e.message + " If access was prepared but email delivery failed, retry or ask the partner to use Set password on the public page.");
    } finally { setInviting(null); }
  }
  async function showPayments(batchId) {
    setPaymentLoading(batchId);
    try {
      const data = await request("payments/organisations/" + encodeURIComponent(batchId));
      setPayments(old => ({ ...old, [batchId]: { rows: (data.payments || []).filter(p => ["organisation_group", "organisation_manual"].includes(p.purpose)) } }));
    } catch(e) { setPayments(old => ({ ...old, [batchId]: { error: e.message } })); }
    finally { setPaymentLoading(null); }
  }
  async function downloadAgreement(reference) {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sign in again to download the agreement.");
      const response = await fetch("/api/admin/referrals/agreements/" + encodeURIComponent(reference) + "/copy", {
        method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: "{}",
      });
      if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error("Signed agreement is unavailable.");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = "Falowen-organisation-agreement.pdf"; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch(e) { setError(e.message); }
  }

  const visible = useMemo(() => organisations.filter(org => {
    const haystack = [org.name, org.contactName, org.contactEmail, org.phone].map(lower).join(" ");
    if (search && !haystack.includes(lower(search))) return false;
    if (filter === "agreement") return !org.agreementSignedAt;
    if (filter === "students") return org.studentCount > 0;
    if (filter === "prepared") return org.accountPrepared && !org.accountDisabled;
    return true;
  }), [organisations, search, filter]);
  const counts = useMemo(() => ({
    students: organisations.reduce((sum, row) => sum + (row.studentCount || 0), 0),
    approved: organisations.reduce((sum, row) => sum + (row.approvedCount || 0), 0),
    agreementMissing: organisations.filter(row => !row.agreementSignedAt).length,
  }), [organisations]);

  return <section className="partner-directory" aria-label="Organisation directory">
    <div className="partner-directory-header">
      <div><h2>Partner organisations</h2><p>Search partners, open their linked students and verified tuition records, or review billing. Student balances load only when you open a partner.</p></div>
      <button type="button" disabled={loading} onClick={load}>{loading ? "Refreshing…" : "Refresh partners"}</button>
    </div>
    <div className="partner-metrics">
      <div><span>Organisations</span><strong>{organisations.length}</strong></div>
      <div><span>Submitted students</span><strong>{counts.students}</strong></div>
      <div><span>Approved students</span><strong>{counts.approved}</strong></div>
      <div><span>Agreements to verify</span><strong>{counts.agreementMissing}</strong></div>
    </div>
    {truncated && <p role="status">Directory currently includes up to 100 profiles, 100 agreements and 100 recent submissions. Counts may be incomplete. Older records remain available in the history pages.</p>}
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <div className="partner-directory-filters">
      <label>Find organisation or contact <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search partner name, email or phone" /></label>
      <label>Show <select value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="all">All partners</option><option value="students">With student submissions</option><option value="agreement">Agreement not linked</option><option value="prepared">Account prepared</option>
      </select></label>
    </div>
    {loaded && !organisations.length && <p>No organisation profiles or student groups were found.</p>}
    {loaded && organisations.length > 0 && visible.length === 0 && <p>No partners match these filters.</p>}
    <div className="partner-entries">
      {visible.map(org => {
        const open = selectedId === org.id;
        const ledger = ledgers[org.id];
        const reminders = reminderLinks(org, ledger);
        return <article className="partner-entry" key={org.id}>
          <div className="partner-entry-heading">
            <div><h3>{org.name || "Organisation awaiting verification"}</h3>
              <p>{org.contactName || "Contact not set"} · {org.contactEmail}</p>
              <div className="partner-status">
                <span>{org.accountDisabled ? "Account disabled" : org.accountPrepared ? "Account prepared" : "Account not prepared"}</span>
                <span>{org.agreementSignedAt ? "Agreement: " + org.agreementStatus : "Agreement not linked"}</span>
                <span>{org.approvedCount} approved / {org.studentCount} submitted</span>
              </div>
            </div>
            <button type="button" aria-expanded={open} aria-controls={"partner-detail-" + org.id}
              onClick={() => open ? setSelectedId(null) : void openPartner(org)}>{open ? "Close details" : "View partner"}</button>
          </div>
          {org.possibleDuplicate && <p role="alert">Possible duplicate company name. Verify contacts before preparing account access. Records are not automatically merged.</p>}
          {open && <div className="partner-detail" id={"partner-detail-" + org.id}>
            <div className="partner-detail-actions">
              <button type="button" disabled={Boolean(inviting) || org.accountDisabled} onClick={() => activatePartner(org)}>
                {inviting === org.id ? "Preparing…" : org.accountPrepared ? "Resend account setup email" : "Prepare partner account / setup email"}
              </button>
              {org.agreementSignedAt && org.agreementReference && <button type="button" onClick={() => downloadAgreement(org.agreementReference)}>Download signed agreement</button>}
              <Link to="/referral-review">Review agreements</Link>
            </div>
            <p><strong>Contact:</strong> {org.contactName || "—"} · {org.phone || "Phone not available"} · <a href={"mailto:" + org.contactEmail}>{org.contactEmail}</a></p>
            <p><strong>Billing email:</strong> {org.billingEmail || org.contactEmail}</p>
            {ledgerLoading === org.id && <p role="status">Loading linked student balances…</p>}
            {ledgerErrors[org.id] && <p role="alert">{ledgerErrors[org.id]} <button type="button" onClick={() => openPartner(org, true)}>Retry</button></p>}
            {ledger && <section aria-label={"Student ledger for " + org.name}>
              <div className="partner-ledger-header">
                <div><h4>Linked students and payments</h4><p>Read from existing student records; amounts are in Ghana cedis.</p></div>
                <button type="button" disabled={ledgerLoading === org.id} onClick={() => openPartner(org, true)}>Refresh balances</button>
              </div>
              <div className="partner-metrics partner-ledger-metrics">
                <div><span>Linked students</span><strong>{ledger.students.length}{ledger.truncated ? "+" : ""}</strong></div>
                <div><span>Known outstanding</span><strong>{money(ledger.outstandingTotal)}</strong></div>
                <div><span>Students owing</span><strong>{ledger.owingCount}</strong></div>
                <div><span>Unverified balances</span><strong>{ledger.unverifiedCount}</strong></div>
              </div>
              {ledger.truncated && <p role="alert">More than 100 students are linked. Totals are partial; payment reminders are disabled until all records can be reviewed.</p>}
              {ledger.unverifiedCount > 0 && <p>Unverified students are excluded from outstanding totals. Configure their tuition and balance in Students first.</p>}
              {ledger.students.length === 0 ? <p>No approved student records are linked by organisation ID. Check historical submission details below.</p> :
              <div className="org-scroll"><table><thead><tr><th>Student</th><th>Level</th><th>Paid</th><th>Balance due</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{ledger.students.map(student => <tr key={student.id}>
                <td><strong>{student.name || "Unnamed student"}</strong><br/><small>{student.studentCode || student.email}</small></td>
                <td>{student.level || "—"}</td><td>{money(student.paid)}</td>
                <td>{student.balanceDue === null ? "Needs verification" : money(student.balanceDue)}</td>
                <td>{student.paymentStatus}</td>
                <td><Link to={"/students?search=" + encodeURIComponent(student.email || student.studentCode || student.name)}>Manage student</Link></td>
              </tr>)}</tbody></table></div>}
              <div className="partner-reminders">
                <h4>Partner payment reminder</h4>
                {ledger.owingCount === 0 ? <p>No confirmed outstanding balance appears in the loaded records. Verify any unconfigured fees in Students.</p> :
                  <><p>Draft addressed to the organisation billing contact. Review amounts before sending. No message is sent automatically.</p>
                  {reminders?.email ? <a href={reminders.email}>Email reminder</a> : <span>Email address unavailable</span>}
                  {reminders?.whatsapp ? <a href={reminders.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp reminder</a> : <span>WhatsApp number unavailable</span>}
                  {ledger.truncated && <p>Complete review of the partner's student balances before contacting them.</p>}</>}
              </div>
            </section>}
            <section className="partner-batches" aria-label="Partner submissions">
              <h4>Submission history</h4>
              {!org.submissions.length ? <p>No submitted student groups yet.</p> : org.submissions.map(batch => <div className="partner-batch" key={batch.id}>
                <p><strong>Reference:</strong> {batch.id} · {batch.studentCount} students · {batch.approvedCount} approved</p>
                <div className="partner-batch-actions">
                  <Link to={"/paystack?batch=" + encodeURIComponent(batch.id)}>Manage group payment</Link>
                  <Link to={"/paystack?batch=" + encodeURIComponent(batch.id) + "&mode=manual"}>Record verified offline payment</Link>
                  <button type="button" disabled={paymentLoading === batch.id} onClick={() => showPayments(batch.id)}>
                    {paymentLoading === batch.id ? "Loading…" : "View payment allocations"}
                  </button>
                </div>
                {payments[batch.id]?.error && <p role="alert">{payments[batch.id].error}</p>}
                {payments[batch.id]?.rows?.length === 0 && <p>No group payment allocations found.</p>}
                {payments[batch.id]?.rows?.map(payment => <p key={payment.id || payment.reference}>
                  <strong>{payment.reference}</strong> · {payment.status} · Gross tuition {money(Number(payment.tuitionCredit || 0) + Number(payment.discount || 0))}
                  {" · "}Retained share {money(payment.discount)} · Net tuition {money(payment.tuitionCredit)}
                  {" · "}Checkout {money(payment.checkoutAmount)} · Receipt {payment.receiptStatus || "not sent"}
                </p>)}
              </div>)}
            </section>
          </div>}
        </article>;
      })}
    </div>
  </section>;
}
