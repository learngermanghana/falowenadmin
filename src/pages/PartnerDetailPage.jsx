import { sendPasswordResetEmail } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { auth } from "../firebase.js";
import { partnerAuth } from "../utils/organisationPartnerAccount.js";
import { organisationEnrolmentRequest } from "../utils/organisationEnrolmentRequest.js";
import { loadPartnerSubmissionFallback } from "../utils/partnerSubmissionFallback.js";
import { buildPartnerPaymentDeadlineReminder } from "../utils/partnerPaymentDeadlineReminder.js";
import "./OrganisationEnrolmentPage.css";
import "./PartnerDetailPage.css";

const request = (path, body) => organisationEnrolmentRequest(path, body, {
  staff: true, getToken: () => auth.currentUser?.getIdToken(),
});
const clean = value => String(value ?? "").trim();
const money = value => value === null || value === undefined || !Number.isFinite(Number(value))
  ? "—" : new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(Number(value));
function whatsappNumber(value) {
  const digits = clean(value).replace(/[^0-9]/g, "");
  if (/^0[235][0-9]{8}$/.test(digits)) return "233" + digits.slice(1);
  return /^233[235][0-9]{8}$/.test(digits) ? digits : "";
}
function contactLinks(org) {
  const email = clean(org.billingEmail || org.contactEmail);
  const phone = whatsappNumber(org.phone);
  return {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "mailto:" + encodeURIComponent(email) : "",
    whatsapp: phone ? "https://wa.me/" + phone : "",
  };
}
function reminderLinks(org, ledger) {
  if (!ledger || ledger.truncated || ledger.owingCount === 0) return null;
  const message = buildPartnerPaymentDeadlineReminder(org, ledger);
  const base = contactLinks(org);
  return {
    email: base.email ? base.email + "?subject=" + encodeURIComponent("Falowen · Upcoming tuition payment deadline") + "&body=" + encodeURIComponent(message) : "",
    whatsapp: base.whatsapp ? base.whatsapp + "?text=" + encodeURIComponent(message) : "",
  };
}

export default function PartnerDetailPage() {
  const { organisationId } = useParams();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ledger, setLedger] = useState(null);
  const [fallbackSubmissions, setFallbackSubmissions] = useState([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState("");
  const [fallbackMissingIds, setFallbackMissingIds] = useState([]);
  const [ledgerError, setLedgerError] = useState("");
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [allocations, setAllocations] = useState({});
  const [allocationLoading, setAllocationLoading] = useState("");
  const ledgerRequestId = useRef(0);

  async function loadLedger(id) {
    const requestId = ++ledgerRequestId.current;
    setLedgerLoading(true);
    setLedgerError("");
    try {
      const result = await request("admin/organisations/" + encodeURIComponent(id) + "/students");
      if (requestId === ledgerRequestId.current) setLedger(result);
    } catch (e) {
      if (requestId === ledgerRequestId.current) setLedgerError(e.message);
    } finally { if (requestId === ledgerRequestId.current) setLedgerLoading(false); }
  }
  useEffect(() => {
    let cancelled = false;
    ledgerRequestId.current += 1;
    setLoading(true);
    setError("");
    setPartner(null);
    setLedger(null);
    setFallbackSubmissions([]);
    setFallbackLoading(false);
    setFallbackError("");
    setFallbackMissingIds([]);
    setLedgerError("");
    request("admin/organisations").then(result => {
      if (cancelled) return;
      const match = (result.organisations || []).find(row => row.id === organisationId);
      if (!match) { setError("This partner is not in the current directory. Try refreshing the partner list."); return; }
      setPartner(match);
      // Load only the matching submission rosters when this profile opens. History is
      // paginated globally in 50-record pages, so older partner batches may be later.
      if ((match.submissions || []).some(batch => !Array.isArray(batch.students))) {
        setFallbackLoading(true);
        void loadPartnerSubmissionFallback(match.submissions, request, {
          isCancelled: () => cancelled,
          onPage: batches => {
            if (cancelled) return;
            setFallbackSubmissions(old => {
              const byId = new Map(old.map(batch => [batch.id, batch]));
              batches.forEach(batch => byId.set(batch.id, batch));
              return [...byId.values()];
            });
          },
        }).then(({ missingIds }) => {
          if (!cancelled) setFallbackMissingIds(missingIds);
        }).catch(e => {
          if (!cancelled) setFallbackError(e.message);
        }).finally(() => {
          if (!cancelled) setFallbackLoading(false);
        });
      }
      // A financial query is only made when the individual profile opens, never for every directory row.
      void loadLedger(match.id);
    }).catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; ledgerRequestId.current += 1; };
  }, [organisationId]);

  const roster = useMemo(() => {
    const rows = new Map();
    for (const batch of partner?.submissions || []) {
      const submission = fallbackSubmissions.find(row => row.id === batch.id);
      (batch.students || submission?.students || []).forEach((student, index) => {
        const key = student.studentId || clean(student.email).toLowerCase() || batch.id + ":" + index;
        rows.set(key, {
          id: student.studentId || "",
          name: student.name || "",
          email: student.email || "",
          level: student.level || "",
          submissionStatus: student.status || "pending",
          paymentStatus: "",
          tuitionFee: null, paid: null, balanceDue: null,
        });
      });
    }
    for (const student of ledger?.students || []) {
      const key = student.id || clean(student.email).toLowerCase();
      const prior = rows.get(key) || {};
      rows.set(key, { ...prior, ...student, submissionStatus: prior.submissionStatus || "Linked" });
    }
    return [...rows.values()];
  }, [partner, ledger, fallbackSubmissions]);

  const contact = partner ? contactLinks(partner) : {};
  const reminders = partner ? reminderLinks(partner, ledger) : null;
  const submitted = partner?.studentCount || 0;
  const approved = partner?.approvedCount || 0;

  async function preparePartner() {
    if (!partner || !window.confirm("Verify the authorised company contact before emailing account setup instructions to " + partner.contactEmail + ". Continue?")) return;
    setInviting(true); setActionError(""); setNotice("");
    try {
      const result = await request("admin/organisation-partners/prepare", { email: partner.contactEmail });
      await sendPasswordResetEmail(partnerAuth, result.email, { url: "https://www.falowen.app/partnerships" });
      setPartner(old => ({ ...old, accountPrepared: true }));
      setNotice("Partner setup/reset email requested for " + result.email + ". Email verification is still required.");
    } catch (e) { setActionError(e.message); }
    finally { setInviting(false); }
  }
  async function downloadAgreement(reference) {
    setActionError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sign in again to download the agreement.");
      const response = await fetch("/api/admin/referrals/agreements/" + encodeURIComponent(reference) + "/copy", {
        method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: "{}",
      });
      if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error("Signed agreement unavailable.");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url; a.download = "Falowen-organisation-agreement.pdf"; a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setActionError(e.message); }
  }
  async function viewAllocations(batchId) {
    setAllocationLoading(batchId);
    try {
      const result = await request("payments/organisations/" + encodeURIComponent(batchId));
      setAllocations(old => ({ ...old, [batchId]: { rows: (result.payments || []).filter(p => ["organisation_group", "organisation_manual"].includes(p.purpose)) } }));
    } catch (e) { setAllocations(old => ({ ...old, [batchId]: { error: e.message } })); }
    finally { setAllocationLoading(""); }
  }

  return <section className="org-enrol partner-profile">
    <Link className="partner-back" to="/partners">← Back to all partners</Link>
    {loading && <p role="status">Loading partner profile…</p>}
    {error && <p role="alert">{error} <Link to="/partners">View directory</Link></p>}
    {partner && <>
      <header className="partner-profile-heading">
        <div>
          <p className="partner-profile-eyebrow">Organisation partner profile</p>
          <h1>{partner.name || "Organisation awaiting verification"}</h1>
          <p>{partner.contactName || "Contact not set"} · {partner.contactEmail}</p>
          <div className="partner-status">
            <span>{partner.accountDisabled ? "Account disabled" : partner.accountPrepared ? "Account prepared" : "Account not prepared"}</span>
            <span>{partner.agreementSignedAt ? "Agreement: " + partner.agreementStatus : "Agreement not linked"}</span>
          </div>
        </div>
        <Link className="partner-outline-link" to="/partners?tab=students">Review student submissions</Link>
      </header>
      <div className="partner-profile-metrics" aria-label="Partner student and tuition totals">
        <div><span>Students submitted</span><strong>{submitted}</strong></div>
        <div><span>Students approved</span><strong>{approved}</strong></div>
        <div><span>Linked student records</span><strong>{ledger ? String(ledger.students.length) + (ledger.truncated ? "+" : "") : "—"}</strong></div>
        <div><span>Students owing</span><strong>{ledger ? ledger.owingCount : "—"}</strong></div>
        <div className="partner-profile-money"><span>Outstanding tuition</span><strong>{ledger ? money(ledger.outstandingTotal) : "Not available"}</strong></div>
        <div className="partner-profile-money"><span>Recorded payments</span><strong>{ledger ? money(ledger.confirmedPaidTotal) : "Not available"}</strong></div>
      </div>
      {ledger?.truncated && <p role="alert">This partner has more than 100 linked student records. The financial totals above are partial, and reminders are disabled until a complete review is available.</p>}
      {ledger?.unverifiedCount > 0 && <p className="partner-profile-note">{ledger.unverifiedCount} linked student balance(s) need verification and are not included in outstanding tuition.</p>}
      {ledger?.unknownPaidCount > 0 && <p className="partner-profile-note">{ledger.unknownPaidCount} student payment record(s) have no confirmed paid amount. Recorded payments show only configured values.</p>}
      {ledgerError && <div className="partner-profile-warning" role="alert">
        <strong>Financial records are temporarily unavailable.</strong>
        <p>The linked student and balance service returned an error: {ledgerError}. Submission counts and available student names are shown, but no amounts have been assumed.</p>
        <button type="button" disabled={ledgerLoading} onClick={() => loadLedger(partner.id)}>{ledgerLoading ? "Trying…" : "Retry loading balances"}</button>
      </div>}
      <div className="partner-profile-layout">
        <div className="partner-profile-main">
          <section className="partner-profile-panel">
            <div className="partner-profile-panel-heading">
              <div><h2>Students and outstanding fees</h2><p>Approved students, course levels, tuition and balances linked to this organisation.</p></div>
              <button type="button" disabled={ledgerLoading} onClick={() => loadLedger(partner.id)}>{ledgerLoading ? "Loading…" : "Refresh student balances"}</button>
            </div>
            {fallbackLoading && <p role="status">Loading older organisation submissions to complete the student list…</p>}
            {fallbackError && <p role="alert">Some student names could not be retrieved from submission history: {fallbackError}</p>}
            {fallbackMissingIds.length > 0 && <p role="alert">{fallbackMissingIds.length} referenced submission(s) were not found in available history. Student names may be incomplete; check the submission records.</p>}
            {roster.length ? <div className="org-scroll"><table>
              <thead><tr><th>Student</th><th>Level</th><th>Tuition</th><th>Paid</th><th>Balance due</th><th>Status</th><th></th></tr></thead>
              <tbody>{roster.map((student, index) => <tr key={student.id || student.email || index}>
                <td><strong>{student.name || "Name unavailable"}</strong><small>{student.studentCode || student.email}</small></td>
                <td>{student.level || "—"}</td>
                <td>{money(student.tuitionFee)}</td>
                <td>{money(student.paid)}</td>
                <td className={student.balanceDue > 0 ? "partner-amount-owing" : ""}>{ledger && student.balanceDue !== null ? money(student.balanceDue) : "Not verified"}</td>
                <td>{student.paymentStatus || student.submissionStatus || "—"}</td>
                <td><Link to={"/students?search=" + encodeURIComponent(student.email || student.studentCode || student.name)}>Open student</Link></td>
              </tr>)}</tbody>
            </table></div> : <p>{ledgerLoading ? "Loading students…" : "The submission count is available, but no named student records could be loaded. Open Student submissions to review the original list."}</p>}
            <p className="partner-profile-helper">Financial information is read from verified student records. A missing balance is never treated as zero owed.</p>
          </section>
          <section className="partner-profile-panel">
            <h2>Submission and payment history</h2>
            {!partner.submissions?.length ? <p>No student submissions yet.</p> : partner.submissions.map(batch =>
              <div className="partner-profile-batch" key={batch.id}>
                <div><strong>Submission {batch.id}</strong><p>{batch.studentCount} students submitted · {batch.approvedCount} approved</p></div>
                <div className="partner-profile-batch-links">
                  <Link to={"/paystack?batch=" + encodeURIComponent(batch.id)}>Manage group payment</Link>
                  <Link to={"/paystack?batch=" + encodeURIComponent(batch.id) + "&mode=manual"}>Record verified offline payment</Link>
                  <button type="button" disabled={allocationLoading === batch.id} onClick={() => viewAllocations(batch.id)}>
                    {allocationLoading === batch.id ? "Loading…" : "View allocations"}
                  </button>
                </div>
                {allocations[batch.id]?.error && <p role="alert">{allocations[batch.id].error}</p>}
                {allocations[batch.id]?.rows?.length === 0 && <p>No group payment allocations recorded.</p>}
                {allocations[batch.id]?.rows?.map(p => <p key={p.id || p.reference}>
                  <strong>{p.reference}</strong> · {p.status} · Tuition credited {money(p.tuitionCredit)} · Organisation share {money(p.discount)} · Checkout {money(p.checkoutAmount)}
                </p>)}
              </div>)}
          </section>
        </div>
        <aside className="partner-profile-aside">
          <section className="partner-profile-panel">
            <h2>Partner contact</h2>
            <dl>
              <dt>Contact person</dt><dd>{partner.contactName || "Not set"}</dd>
              <dt>Phone</dt><dd>{partner.phone || "Not set"}</dd>
              <dt>Contact email</dt><dd>{partner.contactEmail}</dd>
              <dt>Billing email</dt><dd>{partner.billingEmail || partner.contactEmail}</dd>
            </dl>
            <div className="partner-profile-contact-actions">
              {contact.email && <a href={contact.email}>Email partner</a>}
              {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}
            </div>
          </section>
          <section className="partner-profile-panel">
            <h2>Payment follow-up</h2>
            {ledger?.owingCount > 0 && !ledger.truncated ? <>
              <p>{ledger.owingCount} student(s) with confirmed outstanding tuition totalling <strong>{money(ledger.outstandingTotal)}</strong>.</p>
              <p>The reminder shows the recorded payment deadline or paid-access end date and days remaining. Check the details before sending.</p>
              <details className="partner-reminder-preview"><summary>Preview payment deadline message</summary><pre>{buildPartnerPaymentDeadlineReminder(partner, ledger)}</pre></details>
              <div className="partner-profile-contact-actions">
                {reminders?.email ? <a href={reminders.email}>Email payment reminder</a> : <span>Email unavailable</span>}
                {reminders?.whatsapp ? <a href={reminders.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp reminder</a> : <span>WhatsApp unavailable</span>}
              </div>
            </> : <p>{!ledger ? "Verify the tuition ledger before composing a payment reminder." : ledger.truncated ? "Complete the balance review before sending reminders." : "No confirmed outstanding fees in the linked student records."}</p>}
            <p className="partner-profile-helper">Opening an email or WhatsApp draft does not send it automatically.</p>
          </section>
          <section className="partner-profile-panel">
            <h2>Account and agreement</h2>
            <p><strong>Account:</strong> {partner.accountDisabled ? "Disabled" : partner.accountPrepared ? "Prepared" : "Not prepared"}</p>
            <p><strong>Agreement:</strong> {partner.agreementSignedAt ? partner.agreementStatus : "Not linked"}</p>
            <div className="partner-profile-actions">
              <button type="button" disabled={inviting || partner.accountDisabled} onClick={preparePartner}>
                {inviting ? "Preparing…" : partner.accountPrepared ? "Resend account setup email" : "Prepare partner account"}
              </button>
              {partner.agreementSignedAt && partner.agreementReference && <button type="button" onClick={() => downloadAgreement(partner.agreementReference)}>Download agreement</button>}
              <Link to="/referral-review">Review agreement approvals</Link>
            </div>
            {notice && <p role="status">{notice}</p>}
            {actionError && <p role="alert">{actionError}</p>}
          </section>
        </aside>
      </div>
    </>}
  </section>;
}
