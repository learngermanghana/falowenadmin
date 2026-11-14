import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isTeachingWorkspace, pageForStaffPath } from "../utils/authRoles";

export default function ProtectedRoute({ children }) {
  const { user, loading, role, staffLanguages, staffRole, staffPagePermissions } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!user || !role) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role === "staff" && !isTeachingWorkspace(location.pathname)) return <Navigate to="/marking" replace />;
  if (role === "staff") {
    const page = pageForStaffPath(location.pathname);
    const requestedLanguage = location.pathname.toLowerCase().includes("/swahili") || new URLSearchParams(location.search).get("language") === "swahili" ? "swahili" : null;
    const available = staffLanguages || [];
    const language = requestedLanguage || (available.length === 1 ? available[0] : "german");
    const legacy = staffRole === "reviewer" ? ["marking"] : ["marking", "slides"];
    const granted = staffPagePermissions?.[language] || (available.includes(language) ? legacy : []);
    if (!available.includes(language) || !page || !granted.includes(page)) {
      return <section role="alert">Your staff account does not have {language} access to this page. Contact the Falowen administrator.</section>;
    }
  }
  if (role === "staff" && staffLanguages) {
    const requested = location.pathname.includes("/SWAHILI") || new URLSearchParams(location.search).get("language") === "swahili" ? "swahili" : "german";
    const directCourse = location.pathname.includes("/teaching-slides/course/");
    if (directCourse && !staffLanguages.includes(requested)) return <section role="alert">Your account does not have {requested} teaching access. Contact the Falowen administrator.</section>;
  }
  return children;
}
