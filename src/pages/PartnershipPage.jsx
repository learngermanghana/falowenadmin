import { useRef, useState } from "react";
import SignedPartnershipForm from "../components/SignedPartnershipForm.jsx";
import { loadOrganisationAgreement } from "../utils/organisationAgreementRequest.js";
import "./PartnershipPage.css";
const tabs = ["Overview", "Agreement", "Register"];
const steps = [
  ["Sign the agreement", "Register your organisation and download your signed PDF receipt."],
  ["Add your students", "Continue to the organisation form and submit your student list."],
  ["Review & payment", "We approve the list and deduct your 10% share from the payment link."],
  ["We enrol your students", "Pay the net total. After payment is verified, Falowen completes enrolment."],
];
export default function PartnershipPage() {
  const [tab, setTab] = useState(0), [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState("");
  const inFlight = useRef(false);
  async function selectTab(next) {
    setTab(next);
    if (!next || agreement || inFlight.current) return;
    inFlight.current = true; setLoading(true); setError("");
    try { setAgreement(await loadOrganisationAgreement()); }
    catch (e) { setError(e.message); }
    finally { inFlight.current = false; setLoading(false); }
  }
  function tabKeys(event, index) {
    const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
    if (next === null) return;
    event.preventDefault(); document.getElementById(`partner-tab-${next}`)?.focus(); selectTab(next);
  }
  return <div className="partner-portal">
    <header className="partner-header"><a className="partner-brand" href="https://www.falowen.app" aria-label="Falowen home"><span className="partner-brand-mark" aria-hidden="true"><i /><i /></span>falowen</a>
      <nav aria-label="Partnership navigation"><button onClick={() => selectTab(0)}>How it works</button><button onClick={() => selectTab(1)}>Partnerships</button></nav>
      <button className="partner-button partner-button--nav" onClick={() => selectTab(2)}>Become a partner <span aria-hidden="true">→</span></button>
    </header>
    <div className="partner-tabs" role="tablist" aria-label="Organisation partnership steps">{tabs.map((name, index) => <button key={name} id={`partner-tab-${index}`} role="tab" aria-selected={tab === index} aria-controls={`partner-panel-${index}`} tabIndex={tab === index ? 0 : -1} onClick={() => selectTab(index)} onKeyDown={event => tabKeys(event, index)}><span className="partner-tab-number" aria-hidden="true">{index < tab ? "✓" : `0${index + 1}`}</span>{name}</button>)}</div>
    <section id="partner-panel-0" role="tabpanel" aria-labelledby="partner-tab-0" hidden={tab !== 0}>
      <div className="partner-hero"><div className="partner-hero-copy"><p className="partner-eyebrow">Organisation partnerships</p><h1>Grow your offering.<br /><span>We’ll handle the German.</span></h1><p className="partner-hero-description">A straightforward partnership for education consultants, travel agencies and organisations arranging German language training for their clients.</p>
        <div className="partner-hero-actions"><button className="partner-button partner-button--gold" onClick={() => selectTab(1)}>Read agreement <span aria-hidden="true">→</span></button><button className="partner-text-button" onClick={() => selectTab(2)}>Register your organisation</button></div></div>
        <div className="partner-orbit" aria-hidden="true"><div className="partner-orbit-inner"><span>Guten<br />Tag.</span></div><i /><i /></div>
      </div>
      <div className="partner-overview"><div className="partner-section-heading"><p className="partner-eyebrow">A clear path, together</p><h2>One organisation.<br />One simple process.</h2><p>You bring your clients. We take care of their German language training.</p></div>
        <div className="partner-process">{steps.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        <div className="partner-share-card"><div><p className="partner-eyebrow">Your organisation’s share</p><h2>You keep 10%.<br />Pay the remaining tuition.</h2><p>Your share is deducted from the approved first tuition payment for each student. No separate payout or bank details are needed.</p></div><dl><div><dt>Example first tuition total</dt><dd>GH₵5,000</dd></div><div><dt>Your 10% share</dt><dd>− GH₵500</dd></div><div><dt>Tuition payable to Falowen</dt><dd>GH₵4,500</dd></div></dl><small>Any checkout processing charge is shown separately. Later instalments and renewals do not earn another share.</small></div>
      </div>
    </section>
    <SignedPartnershipForm tab={tab} agreement={agreement} loading={loading} loadError={error} onRetry={() => selectTab(tab)} onTabChange={selectTab} />
    <footer className="partner-footer"><span>Learn Language Education Academy · Falowen</span><span>Organisation partnerships</span></footer>
  </div>;
}
