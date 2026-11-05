import { saveOrganisationPartnerContext } from "../utils/organisationPartnerContext.js";
import { useState } from "react";
const newToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map(x => x.toString(16).padStart(2, "0")).join("");
async function jsonRequest(path, body) {
  const response = await fetch(`/api/referrals/${path}`, { method: body ? "POST" : "GET", cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let data; try { data = JSON.parse(await response.text()); } catch { throw new Error("Falowen could not confirm your request. Your entries are still here; retry shortly."); }
  if (!response.ok || data.ok !== true) throw new Error(data.error || "Request failed. Retry shortly.");
  return data;
}
export default function SignedPartnershipForm({ kind = "institutional" }) {
  const [terms, setTerms] = useState(null), [receipt, setReceipt] = useState(null), [token] = useState(newToken);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const run = async fn => { setBusy(true); setError(""); try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const download = async reference => {
    const response = await fetch("/api/referrals/agreement-copy", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, receiptToken: token }) });
    if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error("Your application is saved. Please retry downloading your PDF receipt.");
    const url = URL.createObjectURL(await response.blob()), a = document.createElement("a");
    a.href = url; a.download = "Falowen-signed-agreement.pdf"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div>
    {error && <p role="alert">{error}</p>}
    {!terms && <button disabled={busy} onClick={() => run(async () => { const data = await jsonRequest(`agreement-terms?kind=${kind}`); setTerms(data); })}>Read agreement and register organisation</button>}
    {terms && !receipt && <>
      <h3>Organisation partnership agreement</h3>
      {terms.terms.map((text, index) => <p key={index}>{text}</p>)}
      <p><a href={`/api/referrals/agreement-sample?kind=${kind}`} download>Download unsigned sample PDF</a></p>
      <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); run(async () => {
        const data = await jsonRequest("apply-signed", { ...Object.fromEntries(form), kind, billingResponsibility: "organisation", termsVersion: terms.version, receiptToken: token,
          consent: form.has("consent"), signatureConsent: form.has("signatureConsent") });
        saveOrganisationPartnerContext({ agreementReference: data.reference, organisation: { name: form.get("name"), contactName: form.get("signerName"), email: form.get("email"), phone: form.get("phone") } });
        setReceipt({ reference: data.reference }); await download(data.reference);
      }); }}><fieldset disabled={busy}>
        <div className="org-contact">
          <label>Organisation name<input name="name" maxLength={150} required /></label>
          <label>Contact email<input name="email" type="email" maxLength={254} required /></label>
          <label>Phone<input name="phone" type="tel" maxLength={40} required /></label>
          <label>Address<input name="address" maxLength={300} required /></label>
          <label>Full name of person signing<input name="signerName" autoComplete="name" maxLength={150} required /></label>
          <label>Role / capacity<input name="signerRole" placeholder="Director or authorised representative" maxLength={100} required /></label>
        </div>
        <p>After signing, add your students in the organisation form. Falowen reviews the list and sends one group payment link. Your agreed partner share is deducted from that invoice, so you keep it and pay the remaining amount. No separate payout or Paystack split is needed.</p>
        <label className="org-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <label className="org-consent"><input name="consent" type="checkbox" required />I have read and consent to the existing agreement above.</label>
        <label className="org-consent"><input name="signatureConsent" type="checkbox" required />Typing my full name is my electronic signature. I confirm I am authorised to sign and agree to save an electronic record and receive a PDF copy bearing Falowen’s signature.</label>
        <p>The signed receipt confirms your consent and submission. Partnership approval remains separate.</p>
        <button type="submit">{busy ? "Saving…" : "Sign, save and download receipt"}</button>
      </fieldset></form>
    </>}
    {receipt && <div role="status"><strong>Signed application saved.</strong><p>Reference: {receipt.reference}</p><p>Your receipt includes your signature, Falowen’s signature and the terms you accepted. Falowen will review your partnership application.</p><button disabled={busy} onClick={() => run(() => download(receipt.reference))}>Download signed PDF receipt</button><p><a href="/organisation-enrolment">Continue to add your students →</a></p></div>}
  </div>;
}
