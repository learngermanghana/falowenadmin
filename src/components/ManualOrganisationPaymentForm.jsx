import { useEffect, useState } from "react";
import { auth } from "../firebase.js";
import { organisationEnrolmentRequest } from "../utils/organisationEnrolmentRequest.js";

const request = (path, body) => organisationEnrolmentRequest(path, body, {
  staff: true, getToken: () => auth.currentUser?.getIdToken(),
});
const money = value => "GH₵" + Number(value || 0).toFixed(2);

export default function ManualOrganisationPaymentForm({ batch, onRecorded }) {
  const [selected, setSelected] = useState({});
  const [amounts, setAmounts] = useState({});
  const [method, setMethod] = useState("bank_transfer");
  const [transactionReference, setTransactionReference] = useState("");
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [agreementNote, setAgreementNote] = useState("");
  const [verificationNote, setVerificationNote] = useState("");
  const [fundsVerified, setFundsVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    setSelected(Object.fromEntries((batch?.students || []).filter(row => row.status === "approved" && row.studentId)
      .map(row => [row.studentId, true])));
    setAmounts({}); setMethod("bank_transfer"); setTransactionReference("");
    setAgreementNote(""); setVerificationNote(""); setFundsVerified(false);
    setError(""); setResult(null);
  }, [batch?.id]);

  if (!batch) return <p>Select an organisation submission to record a manual payment.</p>;
  const approved = (batch.students || []).filter(row => row.status === "approved" && row.studentId);
  const lines = approved.filter(row => selected[row.studentId]).map(row => ({
    studentId: row.studentId, amount: amounts[row.studentId] || "", discount: 0,
  }));
  const total = lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const submit = async event => {
    event.preventDefault();
    if (!window.confirm("Have you independently verified that Falowen already received this money? This will permanently credit the selected student accounts. No Paystack charge will be created.")) return;
    setBusy(true); setError("");
    try {
      const data = await request("payments/organisations/manual", {
        batchId: batch.id, agreementType: "legacy_full_tuition", method, transactionReference,
        receivedDate, agreementNote, verificationNote, fundsVerified, lines,
      });
      setResult(data);
      await onRecorded?.();
    } catch (failure) { setError(failure?.message || "Could not record this payment."); }
    finally { setBusy(false); }
  };
  const retryReceipt = async () => {
    setBusy(true); setError("");
    try {
      await request("payments/organisations/receipt/" + encodeURIComponent(result.reference), {});
      setResult(old => ({ ...old, receiptStatus: "sent" }));
      await onRecorded?.();
    } catch (failure) { setError(failure?.message || "Company receipt could not be sent."); }
    finally { setBusy(false); }
  };

  return <section aria-label="Record verified manual organisation payment">
    <h2>Record manual organisation payment</h2>
    <p>For a previously agreed <strong>full-tuition arrangement</strong> where the organisation already transferred money directly. No new Paystack link, 10% partner deduction or second payment will be created.</p>
    <p>Verify the transfer in Falowen's bank/MoMo account and configure each approved student's <strong>tuition fee and unpaid balance</strong> in Students before recording. Each amount must equal that student's outstanding balance.</p>
    <p><strong>Organisation:</strong> {batch.organisation?.name} · <strong>Company receipt email:</strong> {batch.organisation?.email}</p>
    {!batch.agreementReference && <p role="note">No signed agreement is linked to this submission. Verify the original agreement separately and describe it below; this form will not create or backdate an agreement.</p>}
    <form onSubmit={submit}>
      <fieldset disabled={busy || Boolean(result)}><legend>Verified payment details</legend>
        <label>Payment method
          <select required value={method} onChange={event => setMethod(event.target.value)}>
            <option value="bank_transfer">Bank transfer</option>
            <option value="mobile_money">Mobile money</option>
            <option value="cash">Cash</option>
          </select>
        </label>
        <label>Bank / MoMo transaction or cash receipt reference
          <input required minLength={5} maxLength={120} value={transactionReference}
            onChange={event => setTransactionReference(event.target.value)}
            placeholder="Enter the actual receipt reference" />
        </label>
        <label>Date funds were received
          <input required type="date" max={new Date().toISOString().slice(0, 10)} value={receivedDate}
            onChange={event => setReceivedDate(event.target.value)} />
        </label>
        <label>Original full-tuition agreement
          <textarea required minLength={12} maxLength={500} value={agreementNote}
            onChange={event => setAgreementNote(event.target.value)}
            placeholder="Describe the existing agreement and why no new 10% deduction applies" />
        </label>
        <label>How receipt of funds was verified
          <textarea required minLength={12} maxLength={500} value={verificationNote}
            onChange={event => setVerificationNote(event.target.value)}
            placeholder="State which financial record was checked (do not include account numbers or secrets)" />
        </label>
        <div className="org-scroll"><table><thead><tr><th>Include</th><th>Approved student</th><th>Full outstanding tuition (GHS)</th></tr></thead><tbody>
          {approved.map(row => <tr key={row.studentId}>
            <td><input aria-label={"Include " + row.name} type="checkbox" checked={Boolean(selected[row.studentId])}
              onChange={event => setSelected(old => ({ ...old, [row.studentId]: event.target.checked }))} /></td>
            <td>{row.name}<br/><small>{row.studentId}</small></td>
            <td><input aria-label={row.name + " manual tuition"} type="number" min="0.01" step="0.01"
              required={Boolean(selected[row.studentId])} disabled={!selected[row.studentId]}
              value={amounts[row.studentId] || ""} onChange={event => setAmounts(old => ({ ...old, [row.studentId]: event.target.value }))} /></td>
          </tr>)}
        </tbody></table></div>
        {!approved.length && <p>Approve the student in Organisation submissions first.</p>}
        <p><strong>Full tuition received:</strong> {money(total)} · <strong>Partner deduction:</strong> GH₵0.00 · <strong>Paystack charge:</strong> GH₵0.00</p>
        <label><input type="checkbox" checked={fundsVerified} required onChange={event => setFundsVerified(event.target.checked)} />
          I have independently confirmed that Falowen received the funds and that they have not already been credited to these students.
        </label>
        <button type="submit" disabled={busy || !fundsVerified || !lines.length || lines.some(line => !line.amount || Number(line.amount) <= 0)}>
          {busy ? "Recording…" : "Record verified manual payment and email company receipt"}
        </button>
      </fieldset>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <div role="status">
      <p><strong>Payment recorded:</strong> {result.reference}{result.duplicate ? " · Existing record (not credited again)" : ""}</p>
      <p>Company receipt: {result.receiptStatus === "sent" ? "Sent" : "Delivery failed — student credits remain recorded"}</p>
      {result.receiptStatus !== "sent" && <button type="button" disabled={busy} onClick={retryReceipt}>Retry company receipt</button>}
    </div>}
  </section>;
}
