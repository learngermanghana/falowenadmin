import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canOpenStaffPage, staffHomePath } from "../utils/staffPageAccess.js";

export default function ProtectedRoute({ children }) {
  const { user, loading, role, staffLanguages, staffPages } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!user || !role) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role === "staff" && !canOpenStaffPage(location.pathname, staffPages)) {
    if (!staffPages.length) return <section role="alert">Your account has no staff pages assigned. Contact the Falowen administrator.</section>;
    return <Navigate to={staffHomePath(staffPages, staffLanguages)} replace />;
  }
  if (role === "staff" && staffLanguages) {
    const requested = location.pathname.includes("/SWAHILI") || new URLSearchParams(location.search).get("language") === "swahili" ? "swahili" : "german";
    const directCourse = location.pathname.includes("/teaching-slides/course/");
    if (directCourse && !staffLanguages.includes(requested)) return <section role="alert">Your account does not have {requested} teaching access. Contact the Falowen administrator.</section>;
  }
  return children;
}
