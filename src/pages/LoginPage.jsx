import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAdminRole, getPostLoginPath } from "../utils/authRoles";
import { normalizeStaffAccess } from "../utils/staffAccess.js";

export default function LoginPage() {
  const { login, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { user } = await login(normalizedEmail, password);
      const claims = (await user.getIdTokenResult()).claims;
      const role = getAdminRole(claims);
      if (!role) {
        await logout();
        setErr("This account needs Falowen staff or admin access.");
        return;
      }
      const languages = Array.isArray(claims.staffLanguages) ? claims.staffLanguages : ["german"];
      const activeLanguage = languages.length === 1 ? languages[0] : "german";
      nav(getPostLoginPath(location.state?.from, role, normalizeStaffAccess(claims.staffAccess, languages, claims.staffRole), languages, activeLanguage), { replace: true });
    } catch (error) {
      setErr(error?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Teacher Login</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div style={{ color: "crimson" }}>{err}</div>}
        <button disabled={busy}>{busy ? "Signing in..." : "Sign In"}</button>
      </form>
    </div>
  );
}
