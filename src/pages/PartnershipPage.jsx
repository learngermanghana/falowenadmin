import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { organisationEnrolmentRequest as request } from "../utils/organisationEnrolmentRequest.js";
import "./OrganisationEnrolmentPage.css";
import "./PartnershipPage.css";

const signup = "https://www.falowen.app/signup?program=german";

export default function PartnershipPage() {
  const [params] = useSearchParams();
  const invited = params.has("ref");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      await request(invited ? "referrals/claim" : "referrals/apply", {
        ...Object.fromEntries(form), consent: form.has("consent"), code: params.get("ref"),
      });
      setDone(true);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section className="org-enrol partnerships">
    <h1>{invited ? "Your Falowen course invitation" : "Partnership & Referral Programme"}</h1>
    {!invited && <section><h2>Institutional partnerships</h2>
      <p>Schools, employers and sponsoring organisations can enrol a group under an agreement with Falowen. Our team reviews the group and confirms who will pay before inviting students.</p>
      <Link to="/organisation-enrolment">Open the organisation enrolment form →</Link>
    </section>}
    <section><h2>{invited ? "Register your referral" : "Referral partnerships"}</h2>
      <p>{invited ? "Use the same email for this invitation and your Falowen course account so we can match your enrolment." : "Individuals and organisations can apply to introduce new learners. Falowen reviews your application and, if approved, sends you a unique link to share."}</p>
      <p><strong>Standard referral terms.</strong> Subject to Falowen approval, an approved partner earns 10% of a referred learner’s first completed, non-refunded course payment. The amount is based on tuition received, excluding processing fees. Later instalments, renewals, institutional enrolments and self-referrals are excluded. A refund cancels the commission.</p>
      {done ? <div role="status"><strong>{invited ? "Invitation received." : "Application received."}</strong>
        <p>{invited ? <a href={signup}>Continue to Falowen course signup →</a> : "Falowen will contact you by email after review."}</p></div> :
        <form onSubmit={submit}><fieldset disabled={busy}>
          <div className="org-contact">
            {!invited && <label>Your name or organisation<input name="name" maxLength={150} required /></label>}
            <label>{invited ? "Learner email" : "Contact email"}<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          </div>
          <label className="org-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <label className="org-consent"><input name="consent" type="checkbox" required />
            {invited ? "I agree that Falowen may use my email to match my enrolment and check this referral." : "I agree to the standard referral terms and Falowen’s approval process."}</label>
          {error && <p role="alert">{error}</p>}
          <button type="submit">{busy ? "Submitting…" : invited ? "Register referral" : "Apply for a referral partnership"}</button>
        </fieldset></form>}
    </section>
    {invited && <p><a href={signup}>Continue to course signup without a referral</a></p>}
  </section>;
}
