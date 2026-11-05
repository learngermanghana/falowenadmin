import { requestOrganisationAgreement as jsonRequest } from "../utils/organisationAgreementRequest.js";
import { saveOrganisationPartnerContext } from "../utils/organisationPartnerContext.js";
import { useState } from "react";
const newToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map(x => x.toString(16).padStart(2, "0")).join("");
export default function SignedPartnershipForm({ tab, agreement, loading, loadError, onRetry, onTabChange }) {
  const [receipt, setReceipt] = useState(null), [token] = useState(newToken);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const run = async fn => { setBusy(true); setError(""); try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const download = async reference => {
    const response = await fetch("/api/referrals/agreement-copy", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, receiptToken: token }) });
    if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error("Your application is saved. Please retry downloading your PDF receipt.");
    const url = URL.createObjectURL(await response.blob()), a = document.createElement("a"); a.href = url; a.download = "Falowen-signed-agreement.pdf"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const status = <>{loading && <p className="partner-status" role="status">Loading the organisation agreement…</p>}{loadError && <div className="partner-error" role="alert"><p>{loadError}</p><button className="partner-button" onClick={onRetry}>Retry loading agreement</button></div>}</>;
  return <>
    <section id="partner-panel-1" role="tabpanel" aria-labelledby="partner-tab-1" hidden={tab !== 1} className="partner-stage">
      <aside className="partner-stage-intro"><p className="partner-eyebrow">Step 02</p><h1>Organisation<br />partnership<br />agreement</h1><p>Please read the agreement carefully. You’ll confirm your consent and sign electronically in the next step.</p><ul className="partner-benefits"><li><strong>Clear terms</strong><span>Your 10% share is deducted from the invoice.</span></li><li><strong>Electronic record</strong><span>A saved receipt with both signatures.</span></li><li><strong>One group payment</strong><span>Every approved student has a clear allocation.</span></li></ul></aside>
      <div className="partner-paper">{status}{agreement && <><div className="partner-paper-meta"><span>Falowen · Partnerships</span><span>{agreement.version}</span></div><h2>Organisation Partnership Agreement</h2><p className="partner-paper-lead">How Falowen works with organisations arranging German language training for their clients.</p>
        <div className="partner-contract">{agreement.terms.map((text, index) => { const split = text.indexOf(" — "); return <section key={index}><span className="partner-clause-number">{String(index + 1).padStart(2, "0")}</span>{split > 0 ? <div><h3>{text.slice(0, split)}</h3><p>{text.slice(split + 3)}{text.startsWith("Class duration and Falowen access") && <> <a href="https://www.falowen.app/classes" target="_blank" rel="noopener noreferrer">View upcoming classes and current prices</a>. Check the fee for each student’s selected level and class before enrolment.</>}</p></div> : <p>{text}</p>}</section>; })}</div>
        <div className="partner-paper-actions"><a className="partner-download" href="/api/referrals/agreement-sample?kind=institutional" download>Download sample PDF ↓</a><button className="partner-button" onClick={() => onTabChange(2)}>Continue to registration <span aria-hidden="true">→</span></button></div></> }</div>
    </section>
    <section id="partner-panel-2" role="tabpanel" aria-labelledby="partner-tab-2" hidden={tab !== 2} className="partner-stage">
      <aside className="partner-stage-intro"><p className="partner-eyebrow">Step 03</p><h1>Register your<br />organisation</h1><p>Tell us about your organisation and sign the agreement. Keep a signed PDF copy for your records.</p><div className="partner-next"><p className="partner-eyebrow">What happens next?</p><ol><li>You add your students as a group</li><li>We review and approve your list</li><li>Your 10% share is deducted from the invoice</li><li>You pay the net total; we enrol the students</li></ol></div></aside>
      <div className="partner-paper partner-registration">{status}{error && <div className="partner-error" role="alert">{error}</div>}
      {agreement && !receipt && <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); run(async () => {
        const data = await jsonRequest("apply-signed", { ...Object.fromEntries(form), kind: "institutional", billingResponsibility: "organisation", termsVersion: agreement.version, receiptToken: token, consent: form.has("consent"), signatureConsent: form.has("signatureConsent") });
        saveOrganisationPartnerContext({ agreementReference: data.reference, organisation: { name: form.get("name"), contactName: form.get("signerName"), email: form.get("email"), phone: form.get("phone") } });
        setReceipt({ reference: data.reference }); await download(data.reference);
      }); }}><fieldset disabled={busy}><legend><span>01</span><div>Organisation details<small>Information about the business applying.</small></div></legend>
        <div className="partner-fields"><label className="partner-field-wide">Organisation name<input name="name" maxLength={150} placeholder="e.g. Horizon Education" autoComplete="organization" required /></label><label>Contact email<input name="email" type="email" autoComplete="email" maxLength={254} placeholder="name@organisation.com" required /></label><label>Phone<input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+233 00 000 0000" required /></label><label className="partner-field-wide">Address<input name="address" autoComplete="street-address" maxLength={300} placeholder="Full registered address" required /></label></div>
        <div className="partner-form-section-heading"><span>02</span><div>Authorised representative<small>The person signing on behalf of the organisation.</small></div></div>
        <div className="partner-fields"><label>Full name of person signing<input name="signerName" autoComplete="name" maxLength={150} placeholder="Your full legal name" required /></label><label>Role / capacity<input name="signerRole" autoComplete="organization-title" placeholder="Director or authorised representative" maxLength={100} required /></label></div>
        <label className="partner-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <div className="partner-signing"><div className="partner-form-section-heading"><span>03</span><div>Consent & electronic signature<small>Your typed full name above is your electronic signature.</small></div></div>
          <label className="partner-checkbox"><input name="consent" type="checkbox" required /><span>I have read and consent to the organisation partnership agreement, including the 10% share deducted from approved first tuition payments. <button type="button" className="partner-inline-button" onClick={() => onTabChange(1)}>Read agreement</button></span></label>
          <label className="partner-checkbox"><input name="signatureConsent" type="checkbox" required /><span>I am authorised to sign for this organisation. I agree to electronic signing and to receiving a saved PDF copy bearing my signature and Falowen’s signature.</span></label></div>
        <p className="partner-fine-print">Signing records your application. Falowen reviews the organisation and student list before payment and enrolment.</p>
        <button type="submit" className="partner-button partner-submit" disabled={busy}>{busy ? "Saving your signed agreement…" : "Sign, save and download receipt"}<span aria-hidden="true">→</span></button>
      </fieldset></form>}
      {receipt && <div className="partner-receipt" role="status"><span className="partner-receipt-check" aria-hidden="true">✓</span><p className="partner-eyebrow">Agreement saved</p><h2>Your organisation is registered for review.</h2><p>Your signed PDF includes the agreement and both signatures. Next, add the students your organisation will pay for.</p><small>Reference: {receipt.reference}</small><button className="partner-download" disabled={busy} onClick={() => run(() => download(receipt.reference))}>Download signed PDF receipt ↓</button><a className="partner-button" href="/organisation-enrolment">Continue to add your students <span aria-hidden="true">→</span></a></div>}
      </div>
    </section>
  </>;
}
