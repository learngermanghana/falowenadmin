import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CreateClassCard from "../components/CreateClassCard.jsx";
import ClassEditorCard from "../components/ClassEditorCard.jsx";
import {
  cancelSession,
  getClassDashboard,
  listClassCohorts,
  markSessionCompleted,
  rescheduleSession,
  resolveClassCohort,
  resolveSessionChapters,
  updateSession,
} from "../services/liveClassService.js";
import { buildClassUrl, calculateClassProgress, calculateCountdown } from "../utils/liveClassScheduling.js";

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function statusStyle(status) {
  if (status === "cancelled") return { background: "#fee2e2", color: "#991b1b" };
  if (status === "completed") return { background: "#dcfce7", color: "#166534" };
  if (status === "live") return { background: "#fef3c7", color: "#92400e" };
  return { background: "#dbeafe", color: "#1e40af" };
}

export default function LiveClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshClasses(nextSelectedId = selectedClassId) {
    const rows = await listClassCohorts();
    setClasses(rows);
    setSelectedClassId(nextSelectedId || rows[0]?.id || "");
    return rows;
  }

  async function refreshDashboard(classId = selectedClassId) {
    if (!classId) {
      setDashboard(null);
      return;
    }
    setDashboard(await getClassDashboard(classId));
  }

  async function handleCreated(classId) {
    await refreshClasses(classId);
    await refreshDashboard(classId);
  }

  async function handleDuplicate(className) {
    const existing = await resolveClassCohort(className);
    if (!existing) return;
    setSelectedClassId(existing.id);
    await refreshDashboard(existing.id);
    setMessage("The existing class is open below. Use Edit this class to update its dates.");
  }

  useEffect(() => {
    let active = true;
    listClassCohorts()
      .then((rows) => {
        if (!active) return;
        setClasses(rows);
        setSelectedClassId((current) => current || rows[0]?.id || "");
      })
      .catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedClassId) {
      setDashboard(null);
      return () => { active = false; };
    }
    getClassDashboard(selectedClassId)
      .then((next) => { if (active) setDashboard(next); })
      .catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [selectedClassId]);

  const progress = useMemo(() => calculateClassProgress(dashboard?.sessions || []), [dashboard]);
  const nextCountdown = dashboard?.nextSession ? calculateCountdown(dashboard.nextSession.startsAt) : null;
  const nextAssignments = dashboard?.klass && dashboard?.nextSession
    ? resolveSessionChapters(dashboard.klass.levelId, dashboard.nextSession)
    : [];

  async function handleSessionAction(session, action) {
    setBusy(true);
    setMessage("");
    try {
      if (action === "cancel") {
        const reason = window.prompt("Why is this class cancelled? Students will see this reason.", session.cancellationReason || "");
        if (reason === null) return;
        if (!window.confirm("Cancel this session and email all active students in this class?")) return;
        const result = await cancelSession(session.id, { reason, adminId: user?.uid || user?.email || "admin" });
        setMessage(result?.emailSubmitted
          ? `Session cancelled and the email was submitted for ${result.recipientCount || 0} active student(s).`
          : `Session cancelled, but the email could not be submitted: ${result?.emailMessage || "Unknown email error"}`);
      }

      if (action === "reschedule") {
        const startInput = window.prompt("New start date and time (YYYY-MM-DDTHH:mm)", toDateTimeLocal(session.startsAt));
        if (!startInput) return;
        const endInput = window.prompt("New end date and time (YYYY-MM-DDTHH:mm)", toDateTimeLocal(session.endsAt));
        if (!endInput) return;
        const startsAt = new Date(startInput).toISOString();
        const endsAt = new Date(endInput).toISOString();
        if (new Date(endsAt) <= new Date(startsAt)) throw new Error("End time must be after the start time");
        const reason = window.prompt("Reason for rescheduling", "") || "";
        await rescheduleSession(session.id, { startsAt, endsAt, reason, adminId: user?.uid || user?.email || "admin" });
        setMessage("Session rescheduled in attendance and the student calendar.");
      }

      if (action === "topic") {
        const topic = window.prompt("Session topic", session.topic || "");
        if (topic === null) return;
        await updateSession(session.id, { topic: topic.trim() });
      }

      if (action === "assignments") {
        const assignmentIds = (window.prompt(
          "Canonical curriculum IDs, comma-separated (example: A1-2, A1-2.1)",
          (session.assignmentIds || session.chapterIds || []).join(","),
        ) || "")
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean);
        await updateSession(session.id, { assignmentIds, chapterIds: assignmentIds });
        setMessage("Curriculum IDs updated for the class and attendance check-in.");
      }

      if (action === "complete") {
        if (!window.confirm("Mark this live class as completed?")) return;
        await markSessionCompleted(session.id, user?.uid || user?.email || "admin");
        setMessage("Session marked completed and attendance status updated.");
      }

      await refreshDashboard(session.classId);
    } catch (error) {
      setMessage(error?.message || "Session update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1>Live Classes</h1>
          <p>Create a class once. Falowen uses the same class for public registration, sessions, attendance and student calendars.</p>
        </div>
        <Link to="/attendance">Attendance overview</Link>
      </div>

      {message ? <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe" }}>{message}</div> : null}

      <CreateClassCard onCreated={handleCreated} onDuplicate={handleDuplicate} />

      <article className="card">
        <label>
          <strong>Manage class</strong>{" "}
          <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
            <option value="">Select a class</option>
            {classes.map((klass) => <option key={klass.id} value={klass.id}>{klass.name}</option>)}
          </select>
        </label>
      </article>

      {dashboard ? (
        <>
          <article className="card">
            <h2>{dashboard.klass.name}</h2>
            <p>Status: <strong>{dashboard.klass.status}</strong> · Progress: <strong>{progress}%</strong></p>
            <p>Stable student URL: <code>{buildClassUrl(dashboard.klass)}</code></p>
            <p>Start: {dashboard.klass.startDate} · Graduation: {dashboard.klass.endDate} · Timezone: {dashboard.klass.timezone}</p>
            <p>Public listing: <strong>{dashboard.klass.publicVisible === false ? "Hidden" : "Visible"}</strong> · Registration: <strong>{dashboard.klass.registrationOpen === false ? "Closed" : "Open"}</strong></p>
          </article>

          <ClassEditorCard klass={dashboard.klass} onSaved={async (classId) => {
            await refreshClasses(classId);
            await refreshDashboard(classId);
          }} />

          <article className="card">
            <h2>Schedule and communication</h2>
            <p>Next valid session: {formatDateTime(dashboard.nextSession?.startsAt)} {nextCountdown ? `(${nextCountdown.days}d ${nextCountdown.hours}h ${nextCountdown.minutes}m)` : ""}</p>
            <p>Latest completed: {formatDateTime(dashboard.latestCompletedSession?.startsAt)}</p>
            <p>Next curriculum: {nextAssignments.map((entry) => entry.en || entry.de).join(", ") || "Not assigned"}</p>
            <p>Calendar: <a href={`/api/calendar/class/${dashboard.klass.id}.ics`}>Open class calendar feed</a></p>
          </article>

          <article className="card" style={{ overflowX: "auto" }}>
            <h2>Generated sessions</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th>Ghana date and time</th><th>Status</th><th>Topic / curriculum</th><th>Actions</th></tr></thead>
              <tbody>
                {dashboard.sessions.map((session) => {
                  const locked = session.status === "cancelled" || session.status === "completed";
                  return (
                    <tr key={session.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: 8 }}>{formatDateTime(session.startsAt)}<br /><small>to {formatDateTime(session.endsAt)}</small></td>
                      <td style={{ padding: 8 }}><span style={{ ...statusStyle(session.status), padding: "4px 8px", borderRadius: 999, fontWeight: 700 }}>{session.status}</span>{session.cancellationReason ? <div style={{ marginTop: 6, color: "#991b1b" }}>{session.cancellationReason}</div> : null}</td>
                      <td style={{ padding: 8 }}>{session.topic || "No topic"}<br /><small>{(session.assignmentIds || session.chapterIds || []).join(", ") || "No curriculum ID"}</small></td>
                      <td style={{ padding: 8 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Link to={`/attendance/session/${dashboard.klass.id}?session=${encodeURIComponent(session.id)}`}>Attendance</Link>
                          <button disabled={busy || locked} onClick={() => handleSessionAction(session, "topic")}>Topic</button>
                          <button disabled={busy || locked} onClick={() => handleSessionAction(session, "assignments")}>Curriculum</button>
                          <button disabled={busy || locked} onClick={() => handleSessionAction(session, "reschedule")}>Reschedule</button>
                          <button disabled={busy || locked} onClick={() => handleSessionAction(session, "cancel")}>Cancel</button>
                          <button disabled={busy || locked} onClick={() => handleSessionAction(session, "complete")}>Complete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>
        </>
      ) : null}
    </section>
  );
}
