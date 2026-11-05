import { useEffect, useState } from "react";
import ManualOrganisationPaymentForm from "../components/ManualOrganisationPaymentForm.jsx";
import { Link, useSearchParams } from "react-router-dom";
import { auth } from "../firebase.js";
import { organisationEnrolmentRequest } from "../utils/organisationEnrolmentRequest.js";
import "./OrganisationEnrolmentPage.css";
const money = value => `GH₵${Number(value || 0).toFixed(2)}`;
const manualCompanyConfirmation = payment => [
  "To: " + (payment.email || ""),
  "Subject: Falowen — Verified tuition payment confirmation — " + payment.reference,
  "",
  "Dear " + (payment.organisationName || "Organisation") + ",",
  "",
  "This confirms the manual tuition payment received by Falowen.",
  "Payment reference: " + payment.reference,
  "Your transfer / receipt reference: " + (payment.transactionReference || "See payment record"),
  "Payment method: " + String(payment.method || "Manual").replaceAll("_", " "),
  "Date received: " + (payment.receivedDate || "See payment record"),
  "Amount received: " + money(payment.tuitionCredit),
  "Organisation share deducted: GH₵0.00",
  "",
  ...(payment.lines || []).map(line =>
    (line.studentName || line.studentId) + ": Course tuition " + money(line.courseTuitionFee ?? line.grossAmount) +
    ", amount received " + money(line.tuitionCredit) +
    ", outstanding " + money(line.remainingBalance ?? 0) +
    (line.accessEndDate ? ", one-month access ends " + new Date(line.accessEndDate).toLocaleDateString("en-GB") : "")),
  "",
  "Any outstanding tuition remains payable under the original agreement.",
  "This is a manual copy of Falowen's recorded payment confirmation; the automatic receipt delivery has not been confirmed.",
  "",
  "Falowen · Learn Language Education Academy",
].join("\n");
const request = (path, body) => organisationEnrolmentRequest(path, body, { staff: true, getToken: () => auth.currentUser?.getIdToken() });
export default function PaystackPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(() => params.get("mode") === "manual" ? "manual" : "paystack");
  const [batches, setBatches] = useState([]), [cursor, setCursor] = useState(null);
  const [batchId, setBatchId] = useState(params.get("batch") || ""), [lines, setLines] = useState([]);
  const [email, setEmail] = useState(""), [agreement, setAgreement] = useState(""), [reason, setReason] = useState("");
  const [payments, setPayments] = useState([]), [result, setResult] = useState(null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const run = async action => { setBusy(true); setError(""); try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const clear = () => { setResult(null); setRequestId(crypto.randomUUID()); };
  const select = batch => {
    setBatchId(batch.id); setEmail(batch.organisation.email); setAgreement(batch.agreementReference || ""); setReason(""); setPayments([]); clear();
    setLines(batch.students.filter(row => row.status === "approved" && row.studentId).map(row => ({ studentId: row.studentId, name: row.name, selected: true, amount: "", discount: "0" })));
  };
  const load = async (next = "") => {
    const data = await request(`admin/organisation-enrolments${next ? `?cursor=${encodeURIComponent(next)}` : ""}`);
    const items = next ? [...batches, ...data.submissions] : data.submissions;
    setBatches(items); setCursor(data.nextCursor);
    const batch = items.find(item => item.id === batchId); if (batch && !lines.length) select(batch);
  };
  useEffect(() => {
    if (params.get("batch") && params.get("mode") === "manual") void load().catch(e => setError(e.message));
    // Deep-link loading is intentionally one-time; the refresh button handles subsequent reads.
  }, []);
  const update = (index, field, value) => { clear(); setLines(old => old.map((line, i) => i === index ? { ...line, [field]: value } : line)); };
  const selected = lines.filter(line => line.selected);
  const gross = selected.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const discount = selected.reduce((sum, line) => sum + Number(line.discount || 0), 0);
  const refresh = async () => { const data = await request(`payments/organisations/${encodeURIComponent(batchId)}`); setPayments(data.payments); };
  return <section className="org-enrol"><h1>Organisation payments</h1>
    <p>Generate Paystack checkout links for new agreements, or record money Falowen already received under a verified legacy full-tuition agreement.</p>
    <div className="org-actions"><button type="button" aria-pressed={mode === "paystack"} onClick={() => setMode("paystack")}>Paystack group link</button><button type="button" aria-pressed={mode === "manual"} onClick={() => setMode("manual")}>Record manual payment</button></div>
    <p><Link to="/organisation-submissions">Review organisation submissions</Link> · <Link to="/students">Individual student payments and account setup</Link></p>
    <button disabled={busy} onClick={() => run(() => load())}>Load organisations</button>
    {cursor && <button disabled={busy} onClick={() => run(() => load(cursor))}>Load older organisations</button>}
    {error && <p role="alert">{error}</p>}
    {mode === "manual" ? <ManualOrganisationPaymentForm batch={batches.find(batch => batch.id === batchId)} onRecorded={refresh} /> : <form onSubmit={event => { event.preventDefault(); run(async () => {
      const data = await request("payments/organisation-link", { batchId, email, agreement, discountReason: reason, requestId, lines: selected.map(({ studentId, amount, discount }) => ({ studentId, amount, discount })) });
      setResult(data.payment); await refresh();
    }); }}>
      <label>Organisation <select required value={batchId} disabled={busy} onChange={event => select(batches.find(batch => batch.id === event.target.value))}>
        <option value="" disabled>Select an organisation</option>{batches.map(batch => <option key={batch.id} value={batch.id}>{batch.organisation.name} — {batch.id}</option>)}
      </select></label>
      {batchId && <>
        <label>Company billing / receipt email <input type="email" required value={email} onChange={e => { clear(); setEmail(e.target.value); }} /></label>
        <label>Organisation agreement reference <input required maxLength={500} value={agreement} onChange={e => { clear(); setAgreement(e.target.value); }} /></label>
        <p>Configure each student’s tuition balance, class and contract in Students first. Enter the amount covered by this invoice before deducting the partner share.</p>
        <button type="button" disabled={busy || !selected.length} onClick={() => {
          clear(); setReason("10% organisation share on approved first tuition payments");
          setLines(old => old.map(line => line.selected ? { ...line, discount: (Math.round(Number(line.amount || 0) * 10) / 100).toFixed(2) } : line));
        }}>Apply 10% organisation share</button>
        <p>Apply the share to each student's first tuition payment only. Check previous payments before issuing another invoice; later instalments and renewals earn no additional share.</p>
        <div className="org-scroll"><table><thead><tr><th>Include</th><th>Student</th><th>Amount (GHS)</th><th>Partner share (GHS)</th><th>Tuition payable</th></tr></thead><tbody>
          {lines.map((line, i) => <tr key={line.studentId}><td><input aria-label={`Include ${line.name}`} type="checkbox" checked={line.selected} onChange={e => update(i, "selected", e.target.checked)} /></td><td>{line.name}<br /><small>{line.studentId}</small></td>
            <td><input aria-label={`${line.name} amount`} required={line.selected} type="number" min="0.01" step="0.01" value={line.amount} onChange={e => update(i, "amount", e.target.value)} /></td>
            <td><input aria-label={`${line.name} discount`} type="number" min="0" step="0.01" value={line.discount} onChange={e => update(i, "discount", e.target.value)} /></td><td>{money(Number(line.amount) - Number(line.discount))}</td></tr>)}
        </tbody></table></div>
        {!lines.length && <p>No approved students loaded. Approve students in Organisation submissions first.</p>}
        <label>Partner share / adjustment reason <input required={discount > 0} maxLength={500} value={reason} onChange={e => { clear(); setReason(e.target.value); }} /></label>
        <p>Amount: {money(gross)} · Partner share deduction: {money(discount)} · Tuition payable: <strong>{money(gross - discount)}</strong></p>
        <p>The checkout includes the existing processing-fee share. Only the tuition payment is recorded as money paid; the agreed share reduces the student balance separately.</p>
        <button disabled={busy || !selected.length || Boolean(result)}>{busy ? "Working…" : "Generate group payment link"}</button>
      </>}
    </form>}
    {mode === "paystack" && result && <article role="status"><h2>Payment link ready</h2><p>Checkout total: {money(result.checkoutAmount)} · Receipt email: {result.email}</p><a href={result.authorizationUrl} target="_blank" rel="noreferrer">Open Paystack checkout</a><p><input aria-label="Payment link" readOnly value={result.authorizationUrl} /></p><button onClick={() => run(() => navigator.clipboard.writeText(result.authorizationUrl))}>Copy payment link</button></article>}
    {batchId && <><h2>Payment history</h2><button disabled={busy} onClick={() => run(refresh)}>Refresh payment status</button>
      {payments.map(payment => <article key={payment.reference}><h3>{payment.reference}</h3><p>{payment.status} · {money(payment.checkoutAmount)} · {payment.email} · {payment.provider || "Paystack"}</p>{payment.purpose === "organisation_manual" && <p>Verified {payment.method?.replaceAll("_", " ")} · External reference: {payment.transactionReference} · Legacy full-tuition terms; no partner deduction</p>}
        {["pending", "initializing"].includes(payment.status) && <button disabled={busy} onClick={() => run(async () => { await request(`payments/organisations/verify/${payment.reference}`, {}); await refresh(); })}>Verify with Paystack</button>}
        {payment.authorizationUrl && <a href={payment.authorizationUrl} target="_blank" rel="noreferrer">Payment link</a>}
        <ul>{payment.lines?.map(line => <li key={line.studentId}>{line.studentName}: {money(line.tuitionCredit)} tuition · {money(line.discount)} partner share</li>)}</ul>
        {payment.purpose === "organisation_manual" && payment.lines?.map(line => <p key={line.studentId}>Tuition: {money(line.courseTuitionFee)} · Received: {money(line.tuitionCredit)} · Remaining: {money(line.remainingBalance)}{line.accessEndDate ? ` · One-month access until ${new Date(line.accessEndDate).toLocaleDateString("en-GB")}` : ""}</p>)}
        {payment.status === "paid" && <>
          <p>Company receipt: {payment.receiptStatus || "pending"}{payment.receiptErrorCode ? " · " + payment.receiptErrorCode.replaceAll("_", " ") : ""}</p>
          {payment.receiptStatus !== "sent" && <>
            <button disabled={busy} onClick={() => run(async () => {
              await request(`payments/organisations/receipt/${payment.reference}`, {}); await refresh();
            })}>Retry company receipt</button>
            {payment.purpose === "organisation_manual" && <button type="button" disabled={busy}
              onClick={() => run(async () => {
                await navigator.clipboard.writeText(manualCompanyConfirmation(payment));
              })}>Copy company payment confirmation for manual email</button>}
            <p>The recorded payment will not be credited again. If retry fails, the copied confirmation can be sent to the company's registered email manually. This is not proof the automatic receipt was emailed.</p>
          </>}
        </>}
      </article>)}
    </>}
  </section>;
}
