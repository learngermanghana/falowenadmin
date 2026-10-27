import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowStaff = true }) {
  const { user, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (isStaff && !allowStaff) return <Navigate to="/students" replace />;

  return children;
}
