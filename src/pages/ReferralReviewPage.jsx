import { useState } from "react";
import { auth } from "../firebase.js";
import { organisationEnrolmentRequest } from "../utils/organisationEnrolmentRequest.js";
import "./OrganisationEnrolmentPage.css";
import "./PartnershipPage.css";

const request = (path, body) => organisationEnrolmentRequest("admin/referrals/" + path, body, {
  staff: true, getToken: () => auth?.currentUser?.getIdToken(),
});
const money = minor => new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(minor / 100);

function ReviewList({ kind }) {
  const apps = kind === "applications";
  const [rows, setRows] = useState(null);
  const [notice, setNotice] = useState("");
  const [cursor, setCursor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState({});
  async function run(fn) {
    setNotice("");
    setBusy(true);
    setError("");
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function load(next) {
    const data = await request(kind + (next ? "?cursor=" + encodeURIComponent(next) : ""));
    setRows(old => next ? [...old, ...data.rows] : data.rows);
    setCursor(data.cursor);
    if (!next) setPreview({});
  }
  async function decide(row, body) {
    await request(kind + "/" + row.id, body);
    await load();
  }
  return <section><h2>{apps ? "Partner applications" : "Referrals and commissions"}</h2>
    <button disabled={busy} onClick={() => run(() => load())}>Load / refresh {kind}</button>
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error}</p>}
    {rows?.length === 0 && <p>No {kind} yet.</p>}
    {rows?.map(row => <article key={row.id}><h3>{row.name || row.email}</h3>
      <p>{apps ? row.email : [row.partnerName, row.partnerEmail].filter(Boolean).join(" · ") || row.partnerId} · {row.status}</p>
      {apps && row.status === "pending" && <div className="org-actions">{["approved", "rejected"].map(status =>
        <button key={status} disabled={busy} onClick={() => run(() => decide(row, { status }))}>{status === "approved" ? "Approve partner" : "Reject application"}</button>)}</div>}
      {apps && row.code && <p>Send this invitation to the approved contact<br />
        <a href={"https://www.falowen.app/partnerships?ref=" + row.code}>https://www.falowen.app/partnerships?ref={row.code}</a></p>}
      {!apps && row.reference && <p>{row.reference} · {money(row.tuitionMinor)} tuition · {money(row.commissionMinor)} commission {row.status === "reversed" ? "(cancelled)" : ""}</p>}
      {!apps && row.status === "pending" && <button disabled={busy} onClick={() => run(async () => {
        const { payment } = await request(kind + "/" + row.id, { action: "inspect" });
        setPreview(old => ({ ...old, [row.id]: payment }));
      })}>Check first tuition payment</button>}
      {!apps && row.status === "pending" && preview[row.id] && <div><p>{preview[row.id].reference} · {money(preview[row.id].tuitionMinor)} tuition · {money(preview[row.id].commissionMinor)} proposed commission</p>
        <button disabled={busy} onClick={() => {
          if (window.confirm("Confirm this learner used this partner’s link, this was their first course payment (including offline payments), and no refund or dispute exists. Approve this commission?")) {
            run(() => decide(row, { action: "approve", confirmed: true, ...preview[row.id] }));
          }
        }}>Confirm and approve commission</button></div>}
      {row.payoutReference && <p>Paid · Receipt {row.payoutReference}{row.status === "reversed" ? " · Review recovery of this payout" : ""}</p>}
      {!apps && row.status === "approved" && !row.payoutReference && <button disabled={busy} onClick={() => {
        const payoutReference = window.prompt("Enter the receipt reference of the commission you have already paid.");
        if (payoutReference?.trim()) run(() => decide(row, { action: "record-payout", reference: row.reference, confirmed: true, payoutReference }));
      }}>Record completed payout</button>}
      {!apps && row.status === "approved" && <button disabled={busy} onClick={() => run(async () => {
        const result = await request(kind + "/" + row.id, { action: "check-refund", reference: row.reference });
        await load();
        setNotice(result.refunded ? "Refund found. Commission cancelled." : "Paystack reports no refund.");
      })}>Recheck refund with Paystack</button>}
      {!apps && row.status !== "reversed" && <button disabled={busy} onClick={() => {
        if (window.confirm("Close this referral and cancel any commission due to a refund or ineligibility?")) run(() => decide(row, { action: "reverse", confirmed: true }));
      }}>Cancel referral / record refund</button>}
    </article>)}
    {cursor && <button disabled={busy} onClick={() => run(() => load(cursor))}>Load older {kind}</button>}
  </section>;
}
export default function ReferralReviewPage() {
  return <section className="org-enrol partnerships"><h1>Referral review</h1>
    <a href="https://www.falowen.app/partnerships">Open public partnership programme</a>
    <ReviewList kind="applications" /><ReviewList kind="claims" />
  </section>;
}
