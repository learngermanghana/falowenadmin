import SignedPartnershipForm from "../components/SignedPartnershipForm.jsx";
import { Link, useSearchParams } from "react-router-dom";
import "./OrganisationEnrolmentPage.css";
import "./PartnershipPage.css";
export default function PartnershipPage() {
  const [params] = useSearchParams();
  if (params.has("ref")) return <section className="org-enrol partnerships"><h1>Join Falowen</h1><p>Clients who pay for themselves use normal student signup and pay the full advertised fee. No referral commission applies.</p><a href="https://www.falowen.app/signup?program=german">Continue to normal student signup →</a></section>;
  return <section className="org-enrol partnerships">
    <h1>Falowen Organisation Partnerships</h1>
    <p>For education consultants, travel agencies and organisations arranging German language training for their clients.</p>
    <ol className="partner-steps"><li>Sign the organisation agreement</li><li>Add your students</li><li>Falowen reviews the list and deducts your agreed share from the invoice</li><li>Pay the net total; Falowen enrols the students</li></ol>
    <section><h2>Register your organisation</h2>
      <p>Complete one organisation application, consent to the agreement and sign electronically. Download your signed PDF receipt immediately. Falowen reviews your organisation and confirms the payment arrangement.</p>
      <p>If your organisation pays for a group, submit the clients together after applying. Falowen will approve the list and issue one payment link showing each student's fee, your agreed share and the net amount to pay. After verified payment, Falowen enrols the approved students.</p>
      <SignedPartnershipForm kind="institutional" />
    </section>
    <section><h2>Clients paying for themselves</h2>
      <p>They use normal student signup and pay Falowen the full advertised tuition fee. There is no referral commission or partner payout for these payments.</p>
      <a href="https://www.falowen.app/signup?program=german">Normal student signup →</a>
    </section>
    <p>Already submitted your organisation application? <Link to="/organisation-enrolment">Submit your organisation-paid students →</Link></p>
  </section>;
}
