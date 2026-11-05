import { sendPasswordResetEmail } from "firebase/auth";
import { partnerAuth } from "../utils/organisationPartnerAccount.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase.js";
import { organisationEnrolmentRequest } from "../utils/organisationEnrolmentRequest.js";

const request = (path, body = null) => organisationEnrolmentRequest(path, body, {
  staff: true, getToken: () => auth.currentUser?.getIdToken(),
});
const money = amount => "GH₵" + Number(amount || 0).toFixed(2);

export default function OrganisationDirectory() {
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [details, setDetails] = useState({});
  const [inviting, setInviting] = useState(null), [notice, setNotice] = useState("");
  async function activatePartner(org) {
    if (!window.confirm(`Prepare the partner account for ${org.name} (${org.contactEmail}) and send a password setup/reset email? Verify this is the authorised company contact first.`)) return;
    setInviting(org.id); setError(""); setNotice("");
    try {
      const result = await request("admin/organisation-partners/prepare", { email: org.contactEmail });
      await sendPasswordResetEmail(partnerAuth, result.email, { url: "https://www.falowen.app/partnerships" });
      setNotice(`Partner account prepared. Password setup/reset email requested for ${result.email}. They must also verify their email before accessing records.`);
    } catch(e) { setError(e.message + " If the account was prepared but email failed, retry this action or ask the partner to use Set password on the public page."); }
    finally { setInviting(null); }
  }
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
  async function showPayments(batchId) {
    try {
      const data = await request("payments/organisations/" + encodeURIComponent(batchId));
      setDetails(previous => ({ ...previous, [batchId]: { payments: data.payments || [] } }));
    } catch (e) {
      setDetails(previous => ({ ...previous, [batchId]: { error: e.message } }));
    }
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
    } catch (e) { setError(e.message); }
  }
  return <section aria-label="Organisation directory">
    <h2>Organisation directory</h2>
    <p>Signed registrations appear here immediately, even when no students have been submitted. Each organisation keeps one partner profile. Verify the authorised contact before preparing account access; historical student and payment records remain unchanged.</p>
    <button type="button" disabled={loading} onClick={load}>{loading ? "Loading…" : "Refresh organisations"}</button>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {loaded && !organisations.length && <p>No registered organisations or submitted student groups found.</p>}
    {truncated && <p role="status">Showing up to 100 profiles, 100 agreements and 100 submissions. Older records remain stored; use the agreement/submission history pages for older entries.</p>}
    {organisations.map(org => <article key={org.id}>
      <h3>{org.name || "Organisation (name awaiting verification)"}</h3><button type="button" disabled={Boolean(inviting)} onClick={() => activatePartner(org)}>{inviting === org.id ? "Preparing…" : "Prepare partner account / send setup email"}</button>
      <p><strong>Partner account:</strong> {org.accountPrepared ? org.accountDisabled ? "Disabled" : "Prepared" : "Not prepared"}</p>{org.possibleDuplicate && <p role="alert">Possible duplicate company name. Verify these records before preparing access. Names alone do not link accounts; contact Falowen support for a reviewed correction.</p>}<p><strong>Agreement:</strong> {org.agreementSignedAt ? "Signed · " + org.agreementStatus : "Not linked"}{org.agreementSignedAt && <span> · {String(org.agreementSignedAt).slice(0,10)}</span>}</p>
      <p><strong>Contact:</strong> {org.contactName || "—"} · {org.contactEmail} · {org.phone || "—"}</p>
      <p><strong>Billing email:</strong> {org.billingEmail} · <strong>Student submissions:</strong> {org.submissions.length} · <strong>Students:</strong> {org.studentCount} ({org.approvedCount} approved)</p>
      {org.agreementReference && org.agreementSignedAt && <button type="button" onClick={() => downloadAgreement(org.agreementReference)}>Download signed agreement</button>}
      {org.submissions.length === 0 ? <p>Agreement registered. Awaiting a student list and payment request.</p> : org.submissions.map(batch => <section key={batch.id}>
        <p><strong>Submission:</strong> {batch.id} · {batch.studentCount} students · {batch.approvedCount} approved</p>
        <Link to={"/paystack?batch=" + encodeURIComponent(batch.id)}>Manage payment link</Link>{" · "}<Link to={"/paystack?batch=" + encodeURIComponent(batch.id) + "&mode=manual"}>Record manual payment</Link>
        {" · "}<button type="button" onClick={() => showPayments(batch.id)}>View payment allocations</button>
        {details[batch.id]?.error && <p role="alert">{details[batch.id].error}</p>}
        {details[batch.id]?.payments?.length === 0 && <p>No group payments have been created.</p>}
        {details[batch.id]?.payments?.filter(p => ["organisation_group", "organisation_manual"].includes(p.purpose)).map(payment => <div key={payment.id || payment.reference}>
          <p><strong>{payment.reference}:</strong> {payment.status} · Gross tuition {money(Number(payment.tuitionCredit || 0) + Number(payment.discount || 0))} · Retained share {money(payment.discount)} · Net tuition {money(payment.tuitionCredit)} · Processing {money(payment.processingShare)} · Checkout {money(payment.checkoutAmount)} · Receipt {payment.receiptStatus || "not sent"}</p>
          <p>Billing: {payment.email}</p>
        </div>)}
      </section>)}
    </article>)}
  </section>;
}
