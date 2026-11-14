import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { staffCan, staffLandingRoute, staffRouteCapability, workspaceLanguage as resolveLanguage } from "../utils/staffAccess.js";

export default function ProtectedRoute({ children }) {
  const { user, loading, role, staffLanguages, staffRole, staffAccess, workspaceLanguage } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!user || !role) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role === "staff") {
    const fallback = staffLandingRoute(staffAccess, staffLanguages, workspaceLanguage, staffRole);
    if (location.pathname === "/no-staff-access") return children;
    const capability = staffRouteCapability(location.pathname);
    if (!capability) return <Navigate to={fallback} replace />;
    const language = resolveLanguage(location.pathname, location.search, workspaceLanguage);
    if (!staffCan(staffAccess, staffLanguages, language, capability, staffRole)) {
      return <section role="alert" style={{ padding: 24 }}>You do not have {language} {capability} access. Ask a Falowen administrator to update your staff permissions.</section>;
    }
    // Staff attendance uses the scoped API; never expose the legacy direct Firestore editor.
    if (location.pathname.startsWith("/attendance/")) return <Navigate to={"/attendance?language=" + language} replace />;
  }
  return children;
}
