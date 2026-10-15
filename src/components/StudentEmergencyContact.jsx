import { callEmergencyContactUrl, getStudentEmergencyContact } from "../utils/studentEmergencyContact.js";

// Staff-only student directory detail, never shown in student-facing Campus.
export default function StudentEmergencyContact({ student }) {
  const { phone, name, relationship, source } = getStudentEmergencyContact(student);
  const callHref = callEmergencyContactUrl(phone);
  return (
    <section className="student-emergency-contact" aria-label="Emergency contact">
      <div className="student-emergency-contact-heading">
        <h4>Emergency contact</h4>
        {source === "guardian" ? (
          <span>Guardian / next of kin (not designated as emergency contact)</span>
        ) : null}
      </div>
      {source === "missing" ? (
        <p className="student-emergency-contact-empty">Not recorded in this student profile.</p>
      ) : (
        <dl className="student-emergency-contact-details">
          <div><dt>Contact name</dt><dd>{name || "Not provided"}</dd></div>
          <div><dt>Relationship</dt><dd>{relationship || "Not provided"}</dd></div>
          <div className="student-emergency-contact-phone">
            <dt>Phone number</dt>
            <dd>
              <span>{phone || "Not provided"}</span>
              {callHref ? (
                <a className="student-emergency-contact-call"
                  href={callHref} aria-label={"Call emergency contact at " + phone}>
                  Call
                </a>
              ) : null}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
