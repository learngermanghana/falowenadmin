import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  cancelSession,
  createClassCohort,
  getClassDashboard,
  listClassCohorts,
  markSessionCompleted,
  rescheduleSession,
  resolveSessionChapters,
  updateSession,
} from "../services/liveClassService.js";
import { buildClassUrl, calculateClassProgress, calculateCountdown } from "../utils/liveClassScheduling.js";

const defaultRule = { day: "Sat", startTime: "09:00", durationMinutes: 120 };
const emptyForm = {
  name: "",
  levelId: "A1",
  tutorId: "",
  startDate: "",
  endDate: "",
  timezone: "Africa/Accra",
  status: "upcoming",
  zoomProfileId: "",
  scheduleRules: [{ ...defaultRule }],
};

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
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshClasses(nextSelectedId = selectedClassId) {
    const rows = await listClassCohorts();
    setClasses(rows);
    setSelectedClassId(nextSelectedId || rows[0]?.id || "");
  }

  async function refreshDashboard(classId = selectedClassId) {
    if (!classId) {
      setDashboard(null);
      return;
    }
    setDashboard(await getClassDashboard(classId));
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

  function updateRule(index, field, value) {
    setForm((current) => ({
      ...current,
      scheduleRules: current.scheduleRules.map((rule, ruleIndex) => (
        ruleIndex === index ? { ...rule, [field]: field === "durationMinutes" ? Number(value) : value } : rule
      )),
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const record = await createClassCohort(form);
      setMessage(`Created ${record.name}. All class sessions and attendance dates were generated automatically.`);
      setForm({ ...emptyForm, scheduleRules: [{ ...defaultRule }] });
      await refreshClasses(record.id);
      await refreshDashboard(record.id);
    } catch (error) {
      setMessage(error?.message || "Class creation failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSessionAction(session, action) {
    setBusy(true);
    setMessage("");
    try {
      if (action === "cancel") {
        const reason = window.prompt("Why is this class cancelled? Students will see this reason.", session.cancellationReason || "");
        if (reason === null) return;
        await cancelSession(session.id, { reason, adminId: user?.uid || user?.email || "admin" });
        setMessage("Session cancelled. Attendance, reminders, student notice and calendar status were updated.");
      }

      if (action === "reschedule") {
        const startInput = window.prompt("New start date and time (YYYY-MM-DDTHH:mm)", toDateTimeLocal(session.startsAt));
        if (!startInput) return;
        const endInput = window.prompt("New end date and time (YYYY-MM-DDTHH:mm)", toDateTimeLocal(session.endsAt));
        if (!endInput) return;
        const reason = window.prompt("Reason for rescheduling", "") || "";
        const startsAt = new Date(startInput).toISOString();
        const endsAt = new Date(endInput).toISOString();
        if (new Date(endsAt) <= new Date(startsAt)) throw new Error("End time must be after the start time");
        await rescheduleSession(session.id, { startsAt, endsAt, reason, adminId: user?.uid || user?.email || "admin" });
        setMessage("Session rescheduled. The same session now has the new date in attendance and the student calendar.");
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
        const confirmed = window.confirm("Mark this live class as completed? It will count toward course progress.");
        if (!confirmed) return;
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
          <p>Create a class once. Its schedule, attendance dates, cancellations, reminders and student calendar all use the same sessions.</p>
        </div>
        <Link to="/attendance">Attendance overview</Link>
      </div>

      {message ? (
        <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe" }}>{message}</div>
      ) : null}

      <article className="card">
        <h2>Create a new class</h2>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            <label>Class name<input required value={form.name} placeholder="A1 Munich Klasse" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>Level<select value={form.levelId} onChange={(event) => setForm((current) => ({ ...current, levelId: event.target.value }))}>{["A1", "A2", "B1", "B2", "C1"].map((level) => <option key={level}>{level}</option>)}</select></label>
            <label>Start date<input required type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></label>
            <label>End date<input required type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} /></label>
            <label>Tutor ID<input value={form.tutorId} placeholder="Optional" onChange={(event) => setForm((current) => ({ ...current, tutorId: event.target.value }))} /></label>
            <label>Zoom profile ID<input value={form.zoomProfileId} placeholder="Optional" onChange={(event) => setForm((current) => ({ ...current, zoomProfileId: event.target.value }))} /></label>
            <label>Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>{["draft", "upcoming", "active"].map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Timezone<input required value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} /></label>
          </div>

          <div>
            <h3>Weekly class times</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {form.scheduleRules.map((rule, index) => (
                <div key={`${index}-${rule.day}`} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
                  <label>Day<select value={rule.day} onChange={(event) => updateRule(index, "day", event.target.value)}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <option key={day}>{day}</option>)}</select></label>
                  <label>Start time<input type="time" required value={rule.startTime} onChange={(event) => updateRule(index, "startTime", event.target.value)} /></label>
                  <label>Duration (minutes)<input type="number" min="30" step="15" required value={rule.durationMinutes} onChange={(event) => updateRule(index, "durationMinutes", event.target.value)} /></label>
                  {form.scheduleRules.length > 1 ? <button type="button" onClick={() => setForm((current) => ({ ...current, scheduleRules: current.scheduleRules.filter((_, ruleIndex) => ruleIndex !== index) }))}>Remove</button> : null}
                </div>
              ))}
            </div>
            <button type="button" style={{ marginTop: 8 }} onClick={() => setForm((current) => ({ ...current, scheduleRules: [...current.scheduleRules, { ...defaultRule }] }))}>Add another day</button>
          </div>

          <button type="submit" disabled={busy}>{busy ? "Creating…" : "Create class and generate sessions"}</button>
        </form>
      </article>

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
            <p>Zoom profile: {dashboard.klass.zoomProfileId || "Not assigned"}</p>
          </article>

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
