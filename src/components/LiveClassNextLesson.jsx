import { Link } from "react-router-dom";
import { nextTeachingSession } from "../utils/liveClassWorkspace.js";

export default function LiveClassNextLesson({ dashboard, onComplete, busy }) {
  const session = nextTeachingSession(dashboard.sessions);
  const classId = dashboard.klass.id;
  if (!session) return <article className="card"><h2>Next class</h2><p>No remaining class is scheduled. Review the sessions if a lesson needs reopening.</p></article>;
  const attendanceUrl = `/attendance/session/${encodeURIComponent(classId)}?session=${encodeURIComponent(session.id)}`;
  return <article className="card" aria-label="Next teaching session">
    <h2>Next class · {session.topic || "Topic needed"}</h2>
    <p>{new Date(session.startsAt).toLocaleString("en-GB", { timeZone: "Africa/Accra", dateStyle: "full", timeStyle: "short" })} · Ghana time</p>
    <div className="live-workspace-actions">
      <Link to={`/lesson-dashboard?classId=${encodeURIComponent(classId)}`}>Prepare / start teaching</Link>
      <Link to={attendanceUrl}>Attendance / QR check-in</Link>
      <button type="button" disabled={busy} onClick={() => onComplete(session)}>Mark lesson completed</button>
    </div>
  </article>;
}
