import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase.js";
import { emergencyContactEditedFields } from "../utils/studentEmergencyContact.js";
import {
  changeStudentLoginEmail,
  getStudentAccountStatus,
  lookupExistingStudentLogin,
  linkExistingStudentLogin,
  prepareStudentAccount,
  recordStudentInvitationSent,
  sendOrganisationEnrolmentConfirmation,
} from "../services/studentAccountActivationService.js";

const OWNER_EMAIL = "moxflex@gmail.com";
const clean = (value) => String(value ?? "").trim();
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(email));

function statusLabel(state) {
  switch (state) {
    case "active": return "Activated — student has signed in";
    case "invited": return "Invitation requested — awaiting first sign-in";
    case "ready_to_invite": return "Firebase login prepared — email not sent";
    case "disabled": return "Login disabled — review required";
    default: return "No Firebase login prepared";
  }
}

export default function StudentAccountActivationPanel({ student, draft = {}, onStudentUpdated, pushToast }) {
  const [busy, setBusy] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailReason, setEmailReason] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [status, setStatus] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isOwner = Boolean(auth?.currentUser?.emailVerified)
    && auth.currentUser.email?.toLowerCase() === OWNER_EMAIL;
  if (!student || !isOwner) return null;

  const studentId = clean(student.id);
  const savedEmail = clean(student.email).toLowerCase();
  const savedName = clean(student.name);
  const unsavedProfileChanges = ["name", "email", "phone"].some((field) =>
    clean(draft[field]) !== clean(student[field]))
    || Object.keys(emergencyContactEditedFields(student, draft)).length > 0;
  const accountState = status?.state
    || (student.uid ? student.activationEmailSentAt ? "invited" : "ready_to_invite" : "not_prepared");

  const check = async () => {
    setBusy("check");
    setError("");
    setNotice("");
    try {
      const result = await getStudentAccountStatus(studentId);
      setStatus(result);
    } catch (err) {
      setError(err?.message || "Could not check account.");
    } finally {
      setBusy("");
    }
  };


  const lookup = async () => {
    if (unsavedProfileChanges) {
      setError("Save profile edits before checking the Firebase login.");
      return;
    }
    setBusy("lookup"); setError(""); setNotice(""); setCandidate(null);
    try {
      const result = await lookupExistingStudentLogin(studentId);
      setCandidate(result);
      if (!result.existingLogin && !result.uid) setNotice("No existing Firebase login was found for this email.");
      else if (result.linkAvailable) setNotice("An existing Firebase login was found. Verify the email and link it to this student.");
      else setStatus(result);
    } catch (err) { setError(err?.message || "Could not check Firebase registration."); }
    finally { setBusy(""); }
  };

  const link = async () => {
    if (!candidate?.linkAvailable || unsavedProfileChanges) return;
    if (!window.confirm(`Link the existing Firebase account for ${savedEmail} to this student? No login, password, payment, or course data will be recreated.`)) return;
    setBusy("link"); setError(""); setNotice("");
    try {
      const result = await linkExistingStudentLogin(studentId);
      setStatus(result); setCandidate(null);
      onStudentUpdated?.(studentId, { uid: result.uid, authEmail: result.email, accountActivationState: result.state });
      setNotice("Existing Firebase sign-in linked successfully. No activation email or trial was created.");
      pushToast?.({ type: "success", message: "Existing Firebase account linked." });
    } catch (err) { setError(err?.message || "Could not link existing login."); }
    finally { setBusy(""); }
  };

  const send = async () => {
    if (unsavedProfileChanges) {
      setError("Save the edited student profile before sending an activation email.");
      return;
    }
    if (!validEmail(savedEmail) || !savedName) {
      setError("Save a valid student name and email in the profile first.");
      return;
    }
    if (!auth) {
      setError("Firebase Authentication is unavailable.");
      return;
    }
    const confirmed = window.confirm(
      `Send a Falowen account setup email to ${savedName} (${savedEmail})?\n\nSave all student details first. This is a manual action and does not bill the student.`,
    );
    if (!confirmed) return;

    setBusy("send");
    setError("");
    setNotice("");
    try {
      // Only the backend creates Auth identities. It refuses unrelated existing logins.
      const prepared = await prepareStudentAccount(studentId);
      setStatus(prepared);
      onStudentUpdated?.(studentId, {
        uid: prepared.uid,
        authEmail: prepared.email,
        accountActivationState: prepared.state,
      });
      if (prepared.state === "active") {
        setNotice("This student already signed in. Use Reset password in Student support if needed.");
        return;
      }
      if (prepared.state === "disabled") {
        throw new Error("This login is disabled. Do not send an invitation.");
      }
      if (prepared.email !== savedEmail) {
        throw new Error("The saved student email does not match Firebase. Review the account.");
      }
      // Firebase sends its own secure password-setup/reset message. No password
      // or reset link passes through Admin, Firestore, a CSV, or a partner.
      await sendPasswordResetEmail(auth, prepared.email);
      try {
        await recordStudentInvitationSent(studentId);
        onStudentUpdated?.(studentId, {
          uid: prepared.uid,
          authEmail: prepared.email,
          accountActivationState: "invited",
          activationEmailSentAt: new Date().toISOString(),
        });
        setStatus((previous) => ({ ...previous, state: "invited", invitationRequestedAt: new Date().toISOString() }));
        setNotice(`Account setup email requested for ${prepared.email}. Ask the student to check their inbox and spam folder.`);
        pushToast?.({ type: "success", message: "Student activation email requested." });
      } catch (recordError) {
        // Do not auto-retry: the email has already been requested from Firebase.
        setNotice(`Firebase accepted the email request to ${prepared.email}, but the invitation history could not be saved. Check account status before resending.`);
        setError(recordError?.message || "Could not save invitation history.");
      }
    } catch (err) {
      setError(err?.message || "Could not send account activation email.");
    } finally {
      setBusy("");
    }
  };


  const changeEmail = async () => {
    const expectedEmail = clean(status?.email || student.authEmail || student.email).toLowerCase();
    const nextEmail = clean(newEmail).toLowerCase();
    if (busy || unsavedProfileChanges || !validEmail(nextEmail) || nextEmail === expectedEmail || !emailReason.trim()) return;
    if (!window.confirm("Change the student's login AND contact email to " + nextEmail + "? The existing UID stays the same, and email verification will be required again. No password or account will be recreated.")) return;
    setBusy("change-email"); setError(""); setNotice("");
    try {
      const result = await changeStudentLoginEmail(studentId, { newEmail: nextEmail, expectedEmail, reason: emailReason.trim() });
      onStudentUpdated?.(studentId, result.updates);
      setStatus(null); setChangingEmail(false); setNewEmail(""); setEmailReason("");
      setNotice("Login and contact email updated. Existing UID preserved. Ask the student to verify the new email. Sheet synchronization is queued.");
    } catch (err) { setError(err?.message || "Could not change login email."); }
    finally { setBusy(""); }
  };
  const orgFunded = String(student.billingResponsibility || "").toLowerCase() === "organisation";
  const sendOrgNotice = async () => {
    setBusy("org-confirmation"); setError(""); setNotice("");
    try {
      const result = await sendOrganisationEnrolmentConfirmation(studentId);
      setNotice(result.sent ? "Organisation-funded enrolment confirmation accepted for delivery." : "No new confirmation: " + (result.reason || "already sent or not ready"));
    } catch (err) { setError(err?.message || "Could not send organisation enrolment confirmation."); }
    finally { setBusy(""); }
  };
  return (
    <section
      aria-label="Student login and activation"
      style={{ padding: 14, border: "1px solid #a5b4fc", borderRadius: 12, background: "#f8faff", marginTop: 14, display: "grid", gap: 10 }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: 16 }}>Login & activation</h3>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#475569" }}>
          First save the student profile. Check for an existing Firebase login before sending an invitation.
          Firebase creates the UID and emails a secure link for the student to choose a password.
          Never collect or email passwords.
        </p>
      </div>
      <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
        <div><strong>Login email:</strong> {savedEmail || "Not saved"}</div>
        <div><strong>Status:</strong> {statusLabel(accountState)}</div>
        {status?.uid || student.uid ? <div><strong>Firebase UID:</strong> <code>{status?.uid || student.uid}</code></div> : null}
        {status?.lastSignInAt ? <div><strong>Last sign-in:</strong> {status.lastSignInAt}</div> : null}
        {status?.invitationRequestedAt || student.activationEmailSentAt
          ? <div><strong>Invitation requested:</strong> {String(status?.invitationRequestedAt || student.activationEmailSentAt)}</div>
          : null}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!student.uid && <button type="button" onClick={lookup}
          disabled={Boolean(busy) || unsavedProfileChanges || !validEmail(savedEmail)}
          style={{ background: "#fff", color: "#1e40af", border: "1px solid #93c5fd" }}>
          {busy === "lookup" ? "Checking..." : "Find existing Firebase login"}
        </button>}
        {candidate?.linkAvailable && !student.uid && <button type="button" onClick={link}
          disabled={Boolean(busy) || unsavedProfileChanges}>
          {busy === "link" ? "Linking..." : "Link existing Firebase account"}
        </button>}
        <button type="button" onClick={send}
          disabled={Boolean(busy) || unsavedProfileChanges || !validEmail(savedEmail) || !savedName || accountState === "active" || accountState === "disabled"}>
          {busy === "send" ? "Sending..." : accountState === "invited" ? "Resend activation email" : "Send activation email"}
        </button>
        {orgFunded && ["invited", "active"].includes(accountState) && <button type="button" onClick={sendOrgNotice}
          disabled={Boolean(busy) || unsavedProfileChanges || !clean(student.className) || Number(student.paid || student.amountPaid || 0) <= 0}>
          {busy === "org-confirmation" ? "Sending confirmation…" : "Send organisation-paid confirmation"}
        </button>}
        <button type="button" onClick={check} disabled={Boolean(busy)}
          style={{ background: "#fff", color: "#1e40af", border: "1px solid #93c5fd" }}>
          {busy === "check" ? "Checking..." : "Check activation status"}
        </button>
      </div>
      {student.uid && <button type="button" disabled={Boolean(busy) || unsavedProfileChanges} onClick={() => setChangingEmail(value => !value)}>{changingEmail ? "Cancel email change" : "Change login email"}</button>}
      {changingEmail && <div style={{ display: "grid", gap: 8, borderTop: "1px solid #cbd5e1", paddingTop: 10 }}>
        <p style={{ margin: 0 }}>Current login: <strong>{status?.email || student.authEmail || student.email}</strong></p>
        <label>New login and contact email <input type="email" value={newEmail} onChange={event => setNewEmail(event.target.value)} disabled={Boolean(busy)} /></label>
        <label>Reason <textarea value={emailReason} maxLength={500} onChange={event => setEmailReason(event.target.value)} disabled={Boolean(busy)} /></label>
        <small>Existing UID and payment records stay unchanged. Email/password accounts only. No automatic email is sent.</small>
        <button type="button" onClick={changeEmail} disabled={Boolean(busy) || unsavedProfileChanges || !validEmail(newEmail) || !emailReason.trim()}>{busy === "change-email" ? "Saving…" : "Confirm login email change"}</button>
      </div>}
      {unsavedProfileChanges ? <small style={{ color: "#92400e" }}>Unsaved profile changes detected. Save the student before sending an invitation.</small> : null}
      <small style={{ color: "#64748b" }}>
        Firebase currently sends its configured password-reset email as the secure account-setup invitation.
        "Email requested" does not prove delivery or activation; only a subsequent student sign-in confirms activation.
      </small>
      {notice ? <p role="status" style={{ color: "#166534", margin: 0 }}>{notice}</p> : null}
      {error ? <p role="alert" style={{ color: "#991b1b", margin: 0 }}>{error}</p> : null}
    </section>
  );
}
