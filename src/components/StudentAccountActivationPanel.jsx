import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase.js";
import {
  getStudentAccountStatus,
  prepareStudentAccount,
  recordStudentInvitationSent,
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
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isOwner = Boolean(auth?.currentUser?.emailVerified)
    && auth.currentUser.email?.toLowerCase() === OWNER_EMAIL;
  if (!student || !isOwner) return null;

  const studentId = clean(student.id);
  const savedEmail = clean(student.email).toLowerCase();
  const savedName = clean(student.name);
  const unsavedProfileChanges = ["name", "email", "phone", "emergencyContactName", "emergencyContactPhoneNumber", "emergencyContactRelationship"].some((field) =>
    clean(draft[field]) !== clean(student[field]));
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

  return (
    <section
      aria-label="Student login and activation"
      style={{ padding: 14, border: "1px solid #a5b4fc", borderRadius: 12, background: "#f8faff", marginTop: 14, display: "grid", gap: 10 }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: 16 }}>Login & activation</h3>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#475569" }}>
          First save the student profile. Then manually send an invitation when everything is ready.
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
        <button type="button" onClick={send}
          disabled={Boolean(busy) || unsavedProfileChanges || !validEmail(savedEmail) || !savedName || accountState === "active" || accountState === "disabled"}>
          {busy === "send" ? "Sending..." : accountState === "invited" ? "Resend activation email" : "Send activation email"}
        </button>
        <button type="button" onClick={check} disabled={Boolean(busy)}
          style={{ background: "#fff", color: "#1e40af", border: "1px solid #93c5fd" }}>
          {busy === "check" ? "Checking..." : "Check activation status"}
        </button>
      </div>
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
