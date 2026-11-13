import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isTeachingWorkspace } from "../utils/authRoles";

export default function ProtectedRoute({ children }) {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!user || !role) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role === "staff" && !isTeachingWorkspace(location.pathname)) return <Navigate to="/marking" replace />;
  return children;
}
