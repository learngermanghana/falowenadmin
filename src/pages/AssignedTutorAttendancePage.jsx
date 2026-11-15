import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { attendanceRequest } from "../services/assignedTutorAttendanceService.js";

export default function AssignedTutorAttendancePage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    attendanceRequest(user, "assigned-tutor-attendance", { action: "list" }, abort.signal)
      .then(data => { if (!abort.signal.aborted) setClasses(data.classes); })
      .catch(cause => { if (!abort.signal.aborted) setError(cause.message); });
    return () => abort.abort();
  }, [user]);

  return <section className="page-container">
    <h1>My class attendance</h1>
    {error ? <p role="alert">{error}</p> : classes === null ? <p>Loading classes…</p> : classes.length ? (
      <ul>{classes.map(klass => <li key={klass.id}>
        <Link to={`/attendance/session/${encodeURIComponent(klass.id)}`}>{klass.name} · {klass.language || "German"}</Link>
      </li>)}</ul>
    ) : <p>Your administrator hasn’t assigned you a class yet.</p>}
  </section>;
}
