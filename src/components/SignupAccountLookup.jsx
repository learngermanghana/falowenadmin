import { useEffect, useState } from "react";
import { auth } from "../firebase.js";

// On-demand diagnostic only. Does not create, delete or modify any account.
export default function SignupAccountLookup({ email = "" }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const owner = auth?.currentUser?.emailVerified
    && auth.currentUser.email?.toLowerCase() === "moxflex@gmail.com";

  useEffect(() => { setResult(null); setError(""); }, [cleanEmail]);
  if (!owner || !cleanEmail.includes("@")) return null;

  const check = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/admin/signup-account-lookup?email=${encodeURIComponent(cleanEmail)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Account lookup failed.");
      setResult(data);
    } catch (err) {
      setError(err?.message || "Could not check this email.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const message = result?.outcome === "auth_without_student"
    ? "Firebase Authentication has this email, but no matching student profile is saved. This can happen after an interrupted signup. Do not delete the login automatically; ask the student to resume with the original password, or investigate the account safely."
    : result?.outcome === "linked_student"
      ? "A student profile exists. Check the All students and Archived views, and any login-email aliases."
      : result?.outcome === "student_without_auth"
        ? "A student record exists without this Firebase sign-in. Check whether the account uses a different login email."
        : result?.outcome === "not_found"
          ? "Neither Firebase Authentication nor the student directory has this email. The person may have only completed a lead form."
          : "";

  return (
    <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
      <button type="button" disabled={loading} onClick={check}
        style={{ justifySelf: "start", padding: "8px 12px", border: "1px solid #94a3b8", borderRadius: 8, background: "#f8fafc", cursor: "pointer" }}>
        {loading ? "Checking Firebase account..." : "Check Firebase registration"}
      </button>
      {error && <p role="alert" style={{ color: "#991b1b", margin: 0 }}>{error}</p>}
      {result && (
        <section role="status" aria-label="Firebase registration diagnostic" style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 12, background: "#fff", maxWidth: 650 }}>
          <strong>{result.authExists ? "Firebase sign-in: Found" : "Firebase sign-in: Not found"}</strong>
          <p style={{ margin: "6px 0" }}>{message}</p>
          <p style={{ margin: "6px 0" }}>Student profiles: {result.students?.length || 0}
            {result.students?.length ? ` — ${result.students.map(item => `${item.studentCode} (${item.status || "unknown status"})`).join(", ")}` : ""}
          </p>
          {result.authCreatedAt && <small>Sign-in created: {result.authCreatedAt}</small>}
        </section>
      )}
    </div>
  );
}
