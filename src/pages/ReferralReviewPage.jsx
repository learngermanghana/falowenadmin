import { useState } from "react";
import { auth } from "../firebase.js";
import { organisationEnrolmentRequest } from "../utils/organisationEnrolmentRequest.js";
import "./OrganisationEnrolmentPage.css";
import "./PartnershipPage.css";

const request = (path, body) => organisationEnrolmentRequest("admin/referrals/" + path, body, {
  staff: true, getToken: () => auth?.currentUser?.getIdToken(),
});
async function downloadAgreement(id) {
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`/api/admin/referrals/agreements/${id}/copy`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}" });
  if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error("Agreement copy unavailable.");
  const url = URL.createObjectURL(await response.blob()), a = document.createElement("a"); a.href = url; a.download = "Falowen-signed-agreement.pdf"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
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
      {apps && row.signedAt && <><p>{row.kind === "institutional" ? "Institutional partnership" : "Referral partner"} · Signed by {row.signerName} · {row.signedAt}</p><button disabled={busy} onClick={() => run(() => downloadAgreement(row.id))}>Download signed agreement</button></>}
      {apps && row.payoutSummary && <p>Payout: {row.payoutSummary.accountName} · {row.payoutSummary.type} · account ending {row.payoutSummary.last4} · {row.autoPayoutEnabled ? "Payout destination approved" : "Payout review required"}</p>}
      {apps && row.status === "approved" && row.kind === "referral" && row.signedAt && !row.autoPayoutEnabled && <button disabled={busy} onClick={() => {
        if (window.confirm("Confirm you have verified this partner’s identity and payout destination. Enable eligible automatic commission payments to this account?")) run(async () => {
          const result = await request("payout-account/" + row.id, { confirmed: true }); await load(); setNotice(result.automaticTransfersConfigured ? "Payout account enabled." : "Payout account approved. Enable automatic transfers in backend configuration to start processing.");
        });
      }}>Verify payout destination and enable commissions</button>}
      {apps && row.status === "pending" && <div className="org-actions">{["approved", "rejected"].map(status =>
        <button key={status} disabled={busy} onClick={() => run(() => decide(row, { status }))}>{status === "approved" ? "Approve partner" : "Reject application"}</button>)}</div>}
      {apps && row.code && <p>Send this invitation to the approved contact<br />
        <a href={"https://www.falowen.app/partnerships?ref=" + row.code}>https://www.falowen.app/partnerships?ref={row.code}</a></p>}
      {!apps && <><p>Automatic payout: {row.payoutState || "awaiting eligible payment"}{row.recoveryRequired ? " · Refund recovery requires review" : ""}</p><button disabled={busy} onClick={() => run(async () => { const data = await request("process/" + row.id, {}); await load(); setNotice(data.result?.skipped || data.result?.state || "Checked."); })}>Process / recheck automatic commission</button></>}
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
      {row.payoutReference && <p>{row.payoutState && row.payoutState !== "success" ? "Transfer requires review" : "Paid"} · Receipt {row.payoutReference}{row.status === "reversed" ? " · Review recovery of this payout" : ""}</p>}
      {!apps && row.status === "approved" && !row.payoutReference && !row.transferReference && <button disabled={busy} onClick={() => {
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
  const [signatureStatus, setSignatureStatus] = useState("");
  return <section className="org-enrol partnerships"><h1>Partnership and referral review</h1>
    <p>Signed institutional and referral applications appear below. Signing creates a saved receipt; approval and payout verification remain separate.</p>
    <label>Install / replace the authorised Falowen director signature (private PNG, max 70 KB)<input type="file" accept="image/png" onChange={async event => {
      const file = event.target.files?.[0]; if (!file) return;
      try {
        if (file.size > 70000) throw new Error("Choose a PNG under 70 KB.");
        const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
        await request("signature", { png: btoa(binary) }); setSignatureStatus("Signature saved privately. New receipts use it; existing PDFs are unchanged.");
      } catch (e) { setSignatureStatus(e.message); }
    }} /></label>{signatureStatus && <p role="status">{signatureStatus}</p>}
    <a href="https://www.falowen.app/partnerships">Open public partnership programme</a>
    <ReviewList kind="applications" /><ReviewList kind="claims" />
  </section>;
}
