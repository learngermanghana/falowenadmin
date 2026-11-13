/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onIdTokenChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebaseAuth";
import { getAdminRole } from "../utils/authRoles";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ user: null, role: null, loading: Boolean(auth) });

  useEffect(() => {
    if (!auth) return undefined;
    let revision = 0;
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      const current = ++revision;
      let role = null;
      try {
        if (user) role = getAdminRole((await user.getIdTokenResult()).claims);
      } catch {
        // Keep protected routes closed when the token cannot be read.
      }
      if (current === revision) setSession({ user, role, loading: false });
    });
    return () => { revision += 1; unsubscribe(); };
  }, []);

  const value = useMemo(() => ({
    ...session,
    isStaff: session.role === "staff",
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    logout: () => signOut(auth),
  }), [session]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
