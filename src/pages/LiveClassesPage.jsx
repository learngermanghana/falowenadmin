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
  syncClassCurriculum,
  updateSession,
} from "../services/liveClassService.js";
import { buildClassUrl, calculateClassProgress, calculateCountdown } from "../utils/liveClassScheduling.js";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "Class & settings" },
  { id: "timetable", label: "Timetable" },
  { id: "sessions", label: "Sessions" },
  { id: "curriculum", label: "Curriculum" },
  { id: "communication", label: "Communication" },
  { id: "create", label: "Create class" },
];

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

function getCurriculumIds(session = {}) {
  const candidates = [session.assignmentIds, session.chapterIds, session.curriculumIds];
  const ids = candidates.find((value) => Array.isArray(value) && value.length) || [];
  if (ids.length) return ids;
  return session.assignment_id ? [session.assignment_id] : [];
}

function scheduleRuleLabel(rule = {}) {
  const minutes = Number(rule.durationMinutes || 0);
  return `${rule.day || "Day"} · ${rule.startTime || "--:--"}${minutes ? ` · ${minutes} minutes` : ""}`;
}

function tabStyle(active, disabled) {
  return {
    border: active ? "1px solid #2457ff" : "1px solid #cbd5e1",
    background: active ? "#2457ff" : "#fff",
    color: active ? "#fff" : "#1e293b",
    borderRadius: 999,
    padding: "9px 14px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
  };
}

export default function LiveClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
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
    setActiveTab("overview");
    setMessage("Class created. Its public listing, sessions, curriculum and calendars now use this class record.");
  }

  async function handleDuplicate(className) {
    const existing = await resolveClassCohort(className);
    if (!existing) return;
    setSelectedClassId(existing.id);
    await refreshDashboard(existing.id);
    setActiveTab("details");
    setMessage("This class already exists. Update the existing class instead of creating a second record.");
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
  const missingCoreDates = dashboard && (!dashboard.klass.startDate || !dashboard.klass.endDate);

  async function handleCurriculumSync() {
    if (!selectedClassId) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await syncClassCurriculum(selectedClassId);
      await refreshDashboard(selectedClassId);
      setMessage(result.updated
        ? `Curriculum synchronized for ${result.updated} session(s).`
        : "Curriculum is already synchronized. Manual topics and curriculum IDs were preserved.");
    } catch (error) {
      setMessage(error?.message || "Curriculum synchronization failed");
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
          getCurriculumIds(session).join(","),
        ) || "")
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean);
        await updateSession(session.id, {
          assignmentIds,
          chapterIds: assignmentIds,
          curriculumIds: assignmentIds,
        });
        setMessage("Curriculum IDs updated for the class, attendance and Falowen student view.");
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

  function renderSessionsTable({ curriculumOnly = false } = {}) {
    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Ghana date and time</th>
              {!curriculumOnly ? <th>Status</th> : null}
              <th>Topic / curriculum</th>
              {!curriculumOnly ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {(dashboard?.sessions || []).map((session) => {
              const locked = session.status === "cancelled" || session.status === "completed";
              const curriculumIds = getCurriculumIds(session);
              return (
                <tr key={session.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 8 }}>{formatDateTime(session.startsAt)}<br /><small>to {formatDateTime(session.endsAt)}</small></td>
                  {!curriculumOnly ? (
                    <td style={{ padding: 8 }}>
                      <span style={{ ...statusStyle(session.status), padding: "4px 8px", borderRadius: 999, fontWeight: 700 }}>{session.status}</span>
                      {session.cancellationReason ? <div style={{ marginTop: 6, color: "#991b1b" }}>{session.cancellationReason}</div> : null}
                    </td>
                  ) : null}
                  <td style={{ padding: 8 }}>{session.topic || "No topic"}<br /><small>{curriculumIds.join(", ") || "No curriculum ID"}</small></td>
                  {!curriculumOnly ? (
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
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <h1>Live Classes</h1>
          <p>Manage each class from one record shared by public registration, sessions, attendance and student calendars.</p>
        </div>
        <Link to="/attendance">Attendance overview</Link>
      </div>

      {message ? <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe" }}>{message}</div> : null}

      <article className="card" style={{ display: "grid", gap: 12 }}>
        <label>
          <strong>Manage class</strong>{" "}
          <select
            value={selectedClassId}
            onChange={(event) => {
              setSelectedClassId(event.target.value);
              setActiveTab("overview");
              setMessage("");
            }}
          >
            <option value="">Select a class</option>
            {classes.map((klass) => <option key={klass.id} value={klass.id}>{klass.name}</option>)}
          </select>
        </label>
        <nav aria-label="Live class sections" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((tab) => {
            const disabled = tab.id !== "create" && !dashboard;
            return (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                style={tabStyle(activeTab === tab.id, disabled)}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </article>

      {activeTab === "create" ? (
        <CreateClassCard onCreated={handleCreated} onDuplicate={handleDuplicate} />
      ) : null}

      {dashboard && activeTab === "overview" ? (
        <article className="card">
          <h2>{dashboard.klass.name}</h2>
          <p>Status: <strong>{dashboard.klass.status}</strong> · Progress: <strong>{progress}%</strong></p>
          <p>Stable student URL: <code>{buildClassUrl(dashboard.klass)}</code></p>
          <p>Start: {dashboard.klass.startDate || "Not set"} · Graduation: {dashboard.klass.endDate || "Not set"} · Timezone: {dashboard.klass.timezone || "Not set"}</p>
          <p>Public listing: <strong>{dashboard.klass.publicVisible === false ? "Hidden" : "Visible"}</strong> · Registration: <strong>{dashboard.klass.registrationOpen === false ? "Closed" : "Open"}</strong></p>
          {missingCoreDates ? (
            <div style={{ padding: 12, borderRadius: 8, background: "#fff7ed", border: "1px solid #fdba74" }}>
              This class is missing its start or end date. It will not be published as an upcoming class until the dates and status are corrected in <button type="button" onClick={() => setActiveTab("details")}>Class & settings</button>.
            </div>
          ) : null}
        </article>
      ) : null}

      {dashboard && activeTab === "details" ? (
        <ClassEditorCard klass={dashboard.klass} onSaved={async (classId) => {
          await refreshClasses(classId);
          await refreshDashboard(classId);
          setMessage("Class changes saved. Falowen public registration will read the same Firestore record.");
        }} />
      ) : null}

      {dashboard && activeTab === "timetable" ? (
        <article className="card">
          <h2>Timetable</h2>
          <p><strong>Course dates:</strong> {dashboard.klass.startDate || "Not set"} to {dashboard.klass.endDate || "Not set"}</p>
          <p><strong>Timezone:</strong> {dashboard.klass.timezone || "Africa/Accra"}</p>
          <div style={{ display: "grid", gap: 8, margin: "14px 0" }}>
            {(dashboard.klass.scheduleRules || []).length
              ? dashboard.klass.scheduleRules.map((rule, index) => <div key={`${rule.day}-${rule.startTime}-${index}`} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }}>{scheduleRuleLabel(rule)}</div>)
              : <p>No weekly teaching times are saved.</p>}
          </div>
          <p>Next valid session: {formatDateTime(dashboard.nextSession?.startsAt)} {nextCountdown ? `(${nextCountdown.days}d ${nextCountdown.hours}h ${nextCountdown.minutes}m)` : ""}</p>
          <button type="button" onClick={() => setActiveTab("details")}>Edit dates and weekly times</button>
        </article>
      ) : null}

      {dashboard && activeTab === "sessions" ? (
        <article className="card">
          <h2>Generated sessions</h2>
          <p>Rescheduling a session updates attendance and the student calendar without creating another class.</p>
          {renderSessionsTable()}
        </article>
      ) : null}

      {dashboard && activeTab === "curriculum" ? (
        <article className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h2>Curriculum</h2>
              <p>Next curriculum: {nextAssignments.map((entry) => entry.en || entry.de).join(", ") || "Not assigned"}</p>
              <p>Mapped sessions: <strong>{dashboard.klass.curriculumMappedSessionCount || 0}</strong> of <strong>{dashboard.sessions.length}</strong></p>
            </div>
            <button type="button" disabled={busy} onClick={handleCurriculumSync}>{busy ? "Synchronizing…" : "Synchronize missing curriculum"}</button>
          </div>
          {renderSessionsTable({ curriculumOnly: true })}
        </article>
      ) : null}

      {dashboard && activeTab === "communication" ? (
        <article className="card">
          <h2>Schedule and communication</h2>
          <p>Next valid session: {formatDateTime(dashboard.nextSession?.startsAt)} {nextCountdown ? `(${nextCountdown.days}d ${nextCountdown.hours}h ${nextCountdown.minutes}m)` : ""}</p>
          <p>Latest completed: {formatDateTime(dashboard.latestCompletedSession?.startsAt)}</p>
          <p>Calendar: <a href={`/api/calendar/class/${dashboard.klass.id}.ics`}>Open class calendar feed</a></p>
          <p>Cancellations and reschedules are handled from the Sessions tab. The same action updates attendance, reminders, student notices and calendars.</p>
          <button type="button" onClick={() => setActiveTab("sessions")}>Open session actions</button>
        </article>
      ) : null}
    </section>
  );
}
