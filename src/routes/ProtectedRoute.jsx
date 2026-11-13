import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isTeachingWorkspace } from "../utils/authRoles";

export default function ProtectedRoute({ children }) {
  const { user, loading, role, staffLanguages, staffRole } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!user || !role) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role === "staff" && !isTeachingWorkspace(location.pathname)) return <Navigate to="/marking" replace />;
  if (role === "staff" && location.pathname.startsWith("/teaching-slides") && staffRole === "reviewer") return <Navigate to="/marking" replace />;
  if (role === "staff" && staffLanguages) {
    const requested = location.pathname.includes("/SWAHILI") || new URLSearchParams(location.search).get("language") === "swahili" ? "swahili" : "german";
    const directCourse = location.pathname.includes("/teaching-slides/course/");
    if ((location.pathname === "/marking" || directCourse) && !staffLanguages.includes(requested)) return <section role="alert">Your account does not have {requested} teaching access. Contact the Falowen administrator.</section>;
  }
  return children;
}
