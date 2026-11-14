/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onIdTokenChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebaseAuth";
import { getAdminRole } from "../utils/authRoles";
import { normalizeStaffAccess, normalizeStaffLanguages } from "../utils/staffAccess.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ user: null, role: null, staffLanguages: null, staffRole: null, staffAccess: null, loading: Boolean(auth) });

  const [workspaceLanguage, setWorkspaceLanguage] = useState("german");

  useEffect(() => {
    if (!auth) return undefined;
    let revision = 0;
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      const current = ++revision;
      let role = null;
      let staffLanguages = null;
      let staffRole = null;
      let staffAccess = null;
      try {
        if (user) {
          const claims = (await user.getIdTokenResult()).claims;
          role = getAdminRole(claims);
          staffLanguages = Array.isArray(claims.staffLanguages) ? claims.staffLanguages.filter(lang => ["german", "swahili"].includes(lang)) : null;
          staffRole = claims.staffRole || null;
          staffAccess = role === "staff" ? normalizeStaffAccess(claims.staffAccess, staffLanguages || ["german"], staffRole) : null;
          if (role === "staff") setWorkspaceLanguage(previous => (staffLanguages || []).includes(previous) ? previous : (staffLanguages?.[0] || "german"));
        }
      } catch {
        // Keep protected routes closed when the token cannot be read.
      }
      if (current === revision) setSession({ user, role, staffLanguages, staffRole, staffAccess, loading: false });
    });
    return () => { revision += 1; unsubscribe(); };
  }, []);

  const value = useMemo(() => ({
    ...session,
    isStaff: session.role === "staff",
    workspaceLanguage, setWorkspaceLanguage,
    permittedStaffLanguages: normalizeStaffLanguages(session.staffLanguages),
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    logout: () => signOut(auth),
  }), [session, workspaceLanguage]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
