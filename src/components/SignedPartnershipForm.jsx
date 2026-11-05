import { useState } from "react";
const newToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map(x => x.toString(16).padStart(2, "0")).join("");
async function jsonRequest(path, body) {
  const response = await fetch(`/api/referrals/${path}`, { method: body ? "POST" : "GET", cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let data; try { data = JSON.parse(await response.text()); } catch { throw new Error("Falowen could not confirm your request. Your entries are still here; retry shortly."); }
  if (!response.ok || data.ok !== true) throw new Error(data.error || "Request failed. Retry shortly.");
  return data;
}
export default function SignedPartnershipForm({ kind = "referral" }) {
  const [terms, setTerms] = useState(null), [receipt, setReceipt] = useState(null), [token] = useState(newToken);
  const [banks, setBanks] = useState([]), [type, setType] = useState("ghipss");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const run = async fn => { setBusy(true); setError(""); try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const download = async reference => {
    const response = await fetch("/api/referrals/agreement-copy", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, receiptToken: token }) });
    if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error("Your application is saved. Please retry downloading your PDF receipt.");
    const url = URL.createObjectURL(await response.blob()), a = document.createElement("a");
    a.href = url; a.download = "Falowen-signed-agreement.pdf"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const loadBanks = async selectedType => { const data = await jsonRequest(`payout-banks?type=${selectedType}`); setBanks(data.banks); };
  return <div>
    {error && <p role="alert">{error}</p>}
    {!terms && <button disabled={busy} onClick={() => run(async () => { const data = await jsonRequest(`agreement-terms?kind=${kind}`); setTerms(data); if (kind === "referral") await loadBanks(type); })}>Read agreement and {kind === "institutional" ? "register organisation" : "apply"}</button>}
    {terms && !receipt && <>
      <h3>Existing {kind === "institutional" ? "institutional partnership" : "referral"} terms</h3>
      {terms.terms.map((text, index) => <p key={index}>{text}</p>)}
      <p><a href={`/api/referrals/agreement-sample?kind=${kind}`} download>Download unsigned sample PDF</a></p>
      <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); run(async () => {
        const data = await jsonRequest("apply-signed", { ...Object.fromEntries(form), kind, termsVersion: terms.version, receiptToken: token,
          consent: form.has("consent"), signatureConsent: form.has("signatureConsent"), payoutConsent: form.has("payoutConsent") });
        setReceipt(data.reference); await download(data.reference);
      }); }}><fieldset disabled={busy}>
        <div className="org-contact">
          <label>Your name or organisation<input name="name" maxLength={150} required /></label>
          <label>Contact email<input name="email" type="email" maxLength={254} required /></label>
          <label>Phone<input name="phone" type="tel" maxLength={40} required /></label>
          <label>Address<input name="address" maxLength={300} required /></label>
          <label>Full name of person signing<input name="signerName" autoComplete="name" maxLength={150} required /></label>
          <label>Role / capacity<input name="signerRole" placeholder="Individual partner, director, authorised representative" maxLength={100} required /></label>
        </div>
        {kind === "institutional" ? <label>Who will pay tuition?<select name="billingResponsibility" required><option value="organisation">The organisation sponsors students</option><option value="learner">Each learner pays Falowen directly</option></select></label> : <>
          <h3>Commission payout details</h3>
          <p>After partner approval and payout-account verification, eligible commissions are processed automatically after the learner’s first verified tuition payment. Signup alone earns nothing. Completion depends on Paystack transfer availability and funding.</p>
          <label>Payout method<select name="payoutType" value={type} onChange={e => { const value = e.target.value; setType(value); setBanks([]); run(() => loadBanks(value)); }}><option value="ghipss">Ghana bank account</option><option value="mobile_money">Ghana mobile money</option></select></label>
          <label>Bank / mobile money network<select name="bankCode" required defaultValue=""><option value="" disabled>Select your bank or network</option>{banks.map(bank => <option key={bank.code} value={bank.code}>{bank.name}</option>)}</select></label>
          <button type="button" disabled={busy} onClick={() => run(() => loadBanks(type))}>Reload banks / networks</button>
          <label>Account holder name<input name="accountName" maxLength={150} required autoComplete="off" /></label>
          <label>Account number / mobile money number<input name="accountNumber" inputMode="numeric" pattern="[0-9]{8,20}" maxLength={20} required autoComplete="off" /></label>
          <label className="org-consent"><input name="payoutConsent" type="checkbox" required />I authorise Falowen to securely store these payout details and use them to verify my account and pay eligible referral commissions.</label>
        </>}
        <label className="org-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <label className="org-consent"><input name="consent" type="checkbox" required />I have read and consent to the existing agreement above.</label>
        <label className="org-consent"><input name="signatureConsent" type="checkbox" required />Typing my full name is my electronic signature. I confirm I am authorised to sign and agree to save an electronic record and receive a PDF copy bearing Falowen’s signature.</label>
        <p>The signed receipt confirms your consent and submission. Partnership approval remains separate.</p>
        <button type="submit">{busy ? "Saving…" : "Sign, save and download receipt"}</button>
      </fieldset></form>
    </>}
    {receipt && <div role="status"><strong>Signed application saved.</strong><p>Reference: {receipt}</p><p>Your receipt includes your signature, Falowen’s signature and the terms you accepted. Falowen will review your partnership application.</p><button disabled={busy} onClick={() => run(() => download(receipt))}>Download signed PDF receipt</button>{kind === "institutional" && <p><a href="/organisation-enrolment">Continue to submit your students</a></p>}</div>}
  </div>;
}
