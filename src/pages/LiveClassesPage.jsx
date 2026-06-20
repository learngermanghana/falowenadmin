import { useEffect, useMemo, useState } from "react";
import { cancelSession, createClassCohort, getClassDashboard, listClassCohorts, rescheduleSession, resolveSessionChapters, updateSession } from "../services/liveClassService.js";
import { buildClassUrl, calculateClassProgress, calculateCountdown } from "../utils/liveClassScheduling.js";

const emptyForm = { name: "", levelId: "A1", tutorId: "", startDate: "", endDate: "", timezone: "Africa/Accra", status: "upcoming", zoomProfileId: "", day: "Sat", startTime: "09:00", durationMinutes: 120 };

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function LiveClassesPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadClasses() {
      const rows = await listClassCohorts();
      if (!active) return;
      setClasses(rows);
      setSelectedClassId((current) => current || rows[0]?.id || "");
    }
    loadClasses().catch((e) => { if (active) setMessage(e.message); });
    return () => { active = false; };
  }, []);

  async function refreshClasses(nextSelectedId = selectedClassId) {
    const rows = await listClassCohorts();
    setClasses(rows);
    setSelectedClassId(nextSelectedId || rows[0]?.id || "");
  }

  useEffect(() => {
    let active = true;
    if (selectedClassId) {
      getClassDashboard(selectedClassId).then((next) => { if (active) setDashboard(next); }).catch((e) => { if (active) setMessage(e.message); });
    }
    return () => { active = false; };
  }, [selectedClassId]);

  const progress = useMemo(() => calculateClassProgress(dashboard?.sessions || []), [dashboard]);
  const nextCountdown = dashboard?.nextSession ? calculateCountdown(dashboard.nextSession.startsAt) : null;
  const nextChapters = dashboard?.klass && dashboard?.nextSession ? resolveSessionChapters(dashboard.klass.levelId, dashboard.nextSession) : [];

  async function handleCreate(event) {
    event.preventDefault();
    const record = await createClassCohort({ ...form, scheduleRules: [{ day: form.day, startTime: form.startTime, durationMinutes: Number(form.durationMinutes) }] });
    setMessage(`Created ${record.name} at ${record.classUrl}`);
    setForm(emptyForm);
    await refreshClasses(record.id);
  }

  async function handleSessionAction(session, action) {
    if (action === "cancel") await cancelSession(session.id, { reason: "Cancelled by admin", adminId: "admin" });
    if (action === "reschedule") await rescheduleSession(session.id, { startsAt: new Date(new Date(session.startsAt).getTime() + 86400000).toISOString(), endsAt: new Date(new Date(session.endsAt).getTime() + 86400000).toISOString(), adminId: "admin" });
    if (action === "topic") await updateSession(session.id, { topic: window.prompt("Topic", session.topic || "") || session.topic || "" });
    if (action === "chapters") await updateSession(session.id, { chapterIds: (window.prompt("Chapter IDs, comma-separated", (session.chapterIds || []).join(",")) || "").split(",").map((v) => v.trim()).filter(Boolean) });
    const next = await getClassDashboard(session.classId);
    setDashboard(next);
  }

  return (
    <section className="page-container">
      <h1>Live Class Scheduling</h1>
      <p>Canonical class cohorts and generated class sessions. Class URLs are generated once and remain stable after cancellations or rescheduling.</p>
      {message ? <p>{message}</p> : null}

      <article className="card">
        <h2>Create class</h2>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {Object.keys(emptyForm).map((field) => <input key={field} required={!["tutorId", "zoomProfileId"].includes(field)} placeholder={field} value={form[field]} onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))} />)}
          <button type="submit">Create class + generate sessions</button>
        </form>
      </article>

      <div style={{ margin: "16px 0" }}>
        <label>Class: </label>
        <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
          {classes.map((klass) => <option key={klass.id} value={klass.id}>{klass.name}</option>)}
        </select>
      </div>

      {dashboard ? <>
        <article className="card">
          <h2>Class details</h2>
          <p><strong>{dashboard.klass.name}</strong> ({dashboard.klass.status})</p>
          <p>URL: {buildClassUrl(dashboard.klass)} | Calendar: <a href={`/api/calendar/class/${dashboard.klass.id}.ics`}>Subscribe</a></p>
          <p>Timezone: {dashboard.klass.timezone} | Start: {dashboard.klass.startDate} | Graduation: {dashboard.klass.endDate} | Progress: {progress}%</p>
          <p>Zoom profile: {dashboard.klass.zoomProfileId || "Not assigned"}</p>
        </article>

        <article className="card"><h2>Weekly schedule</h2>{(dashboard.klass.scheduleRules || []).map((rule) => <p key={`${rule.day}-${rule.startTime}`}>{rule.day} {rule.startTime} for {rule.durationMinutes} minutes</p>)}</article>
        <article className="card"><h2>Student communication</h2><p>Next non-cancelled session: {formatDateTime(dashboard.nextSession?.startsAt)} {nextCountdown ? `(${nextCountdown.days}d ${nextCountdown.hours}h)` : ""}</p><p>Latest completed session: {formatDateTime(dashboard.latestCompletedSession?.startsAt)}</p><p>Chapters: {nextChapters.map((c) => c.en || c.de).join(", ") || "None assigned"}</p></article>
        <article className="card"><h2>Audit history</h2><p>Session changes write auditLogs records server-side/client transaction workflows.</p></article>

        <article className="card"><h2>Sessions</h2><table><thead><tr><th>Starts</th><th>Status</th><th>Topic</th><th>Chapters</th><th>Actions</th></tr></thead><tbody>{dashboard.sessions.map((session) => <tr key={session.id}><td>{formatDateTime(session.startsAt)}</td><td>{session.status}</td><td>{session.topic || "-"}</td><td>{(session.chapterIds || []).join(", ")}</td><td><button onClick={() => handleSessionAction(session, "topic")}>Change topic</button><button onClick={() => handleSessionAction(session, "chapters")}>Change chapters</button><button onClick={() => handleSessionAction(session, "cancel")}>Cancel</button><button onClick={() => handleSessionAction(session, "reschedule")}>Reschedule</button><button onClick={() => handleSessionAction(session, "topic")}>Edit</button></td></tr>)}</tbody></table></article>
      </> : null}
    </section>
  );
}
