import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CreateClassCard from "../components/CreateClassCard.jsx";
import ClassEditorCard from "../components/ClassEditorCard.jsx";
import {
  cancelSession,
  listClassCohorts,
  markSessionCompleted,
  rescheduleSession,
  resolveClassCohort,
  resolveSessionChapters,
  updateSession,
} from "../services/liveClassService.js";
import {
  getCompatibleClassDashboard,
  syncCompatibleClassCurriculum,
} from "../services/liveClassCompatibilityService.js";
import { buildClassUrl, calculateClassProgress, calculateCountdown, zonedLocalToUtcIso } from "../utils/liveClassScheduling.js";

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
  const parsed = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
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
  const parsed = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function rescheduledTimes(session, startInput, timezone = "Africa/Accra") {
  const match = String(startInput || "").trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
  if (!match) throw new Error("Enter the new start as YYYY-MM-DDTHH:mm.");
  const startsAt = zonedLocalToUtcIso(match[1], match[2], timezone || "Africa/Accra");
  const oldStart = new Date(session.startsAt || 0).getTime();
  const oldEnd = new Date(session.endsAt || 0).getTime();
  const savedDuration = oldEnd - oldStart;
  const fallbackDuration = Math.max(30, Number(session.durationMinutes || 60)) * 60000;
  const durationMs = Number.isFinite(savedDuration) && savedDuration > 0 ? savedDuration : fallbackDuration;
  return {
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + durationMs).toISOString(),
  };
}

function curriculumIds(session = {}) {
  const arrays = [session.assignmentIds, session.chapterIds, session.curriculumIds];
  const ids = arrays.find((value) => Array.isArray(value) && value.length) || [];
  return ids.length ? ids : session.assignment_id ? [session.assignment_id] : [];
}

function statusStyle(status) {
  if (status === "cancelled") return { background: "#fee2e2", color: "#991b1b" };
  if (status === "completed") return { background: "#dcfce7", color: "#166534" };
  if (status === "live") return { background: "#fef3c7", color: "#92400e" };
  return { background: "#dbeafe", color: "#1e40af" };
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

function scheduleRuleLabel(rule = {}) {
  const minutes = Number(rule.durationMinutes || 0);
  return `${rule.day || "Day"} · ${rule.startTime || "--:--"}${minutes ? ` · ${minutes} minutes` : ""}`;
}

export default function LiveClassesPageCompat() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refreshClasses(nextSelectedId = selectedClassId) {
    const rows = await listClassCohorts();
    setClasses(rows);
    const nextId = nextSelectedId || rows[0]?.id || "";
    setSelectedClassId(nextId);
    return rows;
  }

  async function refreshDashboard(classId = selectedClassId) {
    if (!classId) {
      setDashboard(null);
      return null;
    }
    setLoading(true);
    try {
      const next = await getCompatibleClassDashboard(classId);
      setDashboard(next);
      if (next.curriculumSync?.error) setMessage(next.curriculumSync.error);
      return next;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    listClassCohorts()
      .then((rows) => {
        if (!active) return;
        setClasses(rows);
        setSelectedClassId((current) => current || rows[0]?.id || "");
      })
      .catch((error) => { if (active) setMessage(error?.message || "Could not load classes"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedClassId) {
      setDashboard(null);
      return () => { active = false; };
    }
    setLoading(true);
    getCompatibleClassDashboard(selectedClassId)
      .then((next) => {
        if (!active) return;
        setDashboard(next);
        setMessage(next.curriculumSync?.error || "");
      })
      .catch((error) => {
        if (!active) return;
        setDashboard(null);
        setMessage(error?.message || "Could not load this live class");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedClassId]);

  const progress = useMemo(
    () => calculateClassProgress(dashboard?.sessions || [], new Date(), dashboard?.klass || {}),
    [dashboard],
  );
  const nextCountdown = dashboard?.nextSession ? calculateCountdown(dashboard.nextSession.startsAt) : null;
  const nextAssignments = dashboard?.klass && dashboard?.nextSession
    ? resolveSessionChapters(dashboard.klass.levelId, dashboard.nextSession)
    : [];
  const mappedCount = (dashboard?.sessions || []).filter((session) => curriculumIds(session).length).length;

  async function handleCreated(classId) {
    await refreshClasses(classId);
    await refreshDashboard(classId);
    setActiveTab("overview");
    setMessage("Class created and loaded.");
  }

  async function handleDuplicate(className) {
    const existing = await resolveClassCohort(className);
    if (!existing) return;
    setSelectedClassId(existing.id);
    setActiveTab("details");
    setMessage("This class already exists. Update the existing class instead.");
  }

  async function synchronizeCurriculum() {
    if (!selectedClassId) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await syncCompatibleClassCurriculum(selectedClassId);
      await refreshDashboard(selectedClassId);
      setMessage(`Curriculum checked: ${result.mapped} of ${result.total} session(s) mapped; ${result.updated} record(s) repaired.`);
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
      if (action === "topic") {
        const topic = window.prompt("Session topic", session.topic || "");
        if (topic === null) return;
        await updateSession(session.id, { topic: topic.trim() });
      }
      if (action === "curriculum") {
        const values = window.prompt("Curriculum IDs, comma-separated", curriculumIds(session).join(","));
        if (values === null) return;
        const ids = values.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean);
        await updateSession(session.id, { assignmentIds: ids, chapterIds: ids, curriculumIds: ids });
      }
      if (action === "change") {
        const choice = window.prompt("Change this session:\n1 = Reschedule\n2 = Cancel", "1");
        if (choice === null) return;
        const normalized = choice.trim().toLowerCase();
        if (["1", "r", "reschedule"].includes(normalized)) {
          const startInput = window.prompt("New start (YYYY-MM-DDTHH:mm)", toDateTimeLocal(session.startsAt));
          if (!startInput) return;
          const times = rescheduledTimes(session, startInput, dashboard?.klass?.timezone || "Africa/Accra");
          const result = await rescheduleSession(session.id, {
            ...times,
            adminId: user?.uid || user?.email || "admin",
          });
          setMessage(result?.emailSubmitted === false
            ? `Session rescheduled and schedule updated, but the communication email could not be confirmed: ${result.emailMessage || "Unknown delivery error"}`
            : "Session rescheduled. The schedule, calendar and Communication-sheet email were updated automatically.");
        } else if (["2", "c", "cancel"].includes(normalized)) {
          const reason = window.prompt("Reason for cancellation", session.cancellationReason || "");
          if (reason === null) return;
          const result = await cancelSession(session.id, { reason, adminId: user?.uid || user?.email || "admin" });
          setMessage(result?.emailSubmitted === false
            ? `Session cancelled, but the communication email could not be confirmed: ${result.emailMessage || "Unknown delivery error"}`
            : "Session cancelled and the Communication-sheet email was submitted.");
        } else {
          setMessage("No change was made. Enter 1 to reschedule or 2 to cancel.");
          return;
        }
      }
      if (action === "complete") {
        if (!window.confirm("Mark this session completed?")) return;
        await markSessionCompleted(session.id, user?.uid || user?.email || "admin");
      }
      await refreshDashboard(selectedClassId);
    } catch (error) {
      setMessage(error?.message || "Session update failed");
    } finally {
      setBusy(false);
    }
  }

  function renderSessions(curriculumOnly = false) {
    const sessions = dashboard?.sessions || [];
    if (!sessions.length) {
      return <p>No sessions were found for this class record. Open Class & settings and save the timetable to generate them.</p>;
    }
    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th>Ghana date and time</th>{!curriculumOnly ? <th>Status</th> : null}<th>Topic / curriculum</th>{!curriculumOnly ? <th>Actions</th> : null}</tr></thead>
          <tbody>
            {sessions.map((session) => {
              const locked = ["cancelled", "completed"].includes(String(session.status || "").toLowerCase());
              return (
                <tr key={session.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 8 }}>{formatDateTime(session.startsAt)}<br /><small>to {formatDateTime(session.endsAt)}</small></td>
                  {!curriculumOnly ? <td style={{ padding: 8 }}><span style={{ ...statusStyle(session.status), padding: "4px 8px", borderRadius: 999, fontWeight: 700 }}>{session.status || "scheduled"}</span></td> : null}
                  <td style={{ padding: 8 }}>{session.topic || "No topic"}<br /><small>{curriculumIds(session).join(", ") || "No curriculum ID"}</small></td>
                  {!curriculumOnly ? (
                    <td style={{ padding: 8 }}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Link to={`/attendance/session/${dashboard.klass.id}?session=${encodeURIComponent(session.id)}`}>Attendance</Link>
                      <button disabled={busy || locked} onClick={() => handleSessionAction(session, "topic")}>Topic</button>
                      <button disabled={busy || locked} onClick={() => handleSessionAction(session, "curriculum")}>Curriculum</button>
                      <button disabled={busy || locked} onClick={() => handleSessionAction(session, "change")}>Change session</button>
                      <button disabled={busy || locked} onClick={() => handleSessionAction(session, "complete")}>Complete</button>
                    </div></td>
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><h1>Live Classes</h1><p>Manage classes, sessions, attendance and curriculum from the same record.</p></div>
        <Link to="/attendance">Attendance overview</Link>
      </div>

      {message ? <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe" }}>{message}</div> : null}

      <article className="card" style={{ display: "grid", gap: 12 }}>
        <label><strong>Manage class</strong>{" "}<select value={selectedClassId} onChange={(event) => { setSelectedClassId(event.target.value); setActiveTab("overview"); setMessage(""); }}>
          <option value="">Select a class</option>
          {classes.map((klass) => <option key={klass.id} value={klass.id}>{klass.name || klass.className || klass.id}</option>)}
        </select></label>
        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((tab) => {
            const disabled = tab.id !== "create" && !dashboard;
            return <button key={tab.id} type="button" disabled={disabled} style={tabStyle(activeTab === tab.id, disabled)} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>;
          })}
        </nav>
      </article>

      {loading ? <article className="card"><p>Loading selected class…</p></article> : null}
      {activeTab === "create" ? <CreateClassCard onCreated={handleCreated} onDuplicate={handleDuplicate} /> : null}

      {!loading && dashboard && activeTab === "overview" ? <article className="card">
        <h2>{dashboard.klass.name || dashboard.klass.className || selectedClassId}</h2>
        <p>Status: <strong>{dashboard.klass.status || "active"}</strong> · Progress: <strong>{progress}%</strong></p>
        <p>Level: <strong>{dashboard.klass.levelId || "Not set"}</strong> · Sessions found: <strong>{dashboard.sessions.length}</strong></p>
        <p>Stable student URL: <code>{buildClassUrl(dashboard.klass)}</code></p>
        <p>Start: {dashboard.klass.startDate || "Not set"} · Graduation: {dashboard.klass.endDate || "Not set"} · Timezone: {dashboard.klass.timezone || "Africa/Accra"}</p>
      </article> : null}

      {!loading && dashboard && activeTab === "details" ? <ClassEditorCard klass={dashboard.klass} onSaved={async (classId) => { await refreshClasses(classId); await refreshDashboard(classId); setMessage("Class changes saved and sessions refreshed."); }} /> : null}

      {!loading && dashboard && activeTab === "timetable" ? <article className="card">
        <h2>Timetable</h2>
        <p><strong>Course dates:</strong> {dashboard.klass.startDate || "Not set"} to {dashboard.klass.endDate || "Not set"}</p>
        <div style={{ display: "grid", gap: 8, margin: "14px 0" }}>{(dashboard.klass.scheduleRules || []).length ? dashboard.klass.scheduleRules.map((rule, index) => <div key={`${rule.day}-${rule.startTime}-${index}`} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }}>{scheduleRuleLabel(rule)}</div>) : <p>No weekly teaching times are saved.</p>}</div>
        <p>Next valid session: {formatDateTime(dashboard.nextSession?.startsAt)} {nextCountdown ? `(${nextCountdown.days}d ${nextCountdown.hours}h ${nextCountdown.minutes}m)` : ""}</p>
      </article> : null}

      {!loading && dashboard && activeTab === "sessions" ? <article className="card"><h2>Generated sessions</h2>{renderSessions(false)}</article> : null}

      {!loading && dashboard && activeTab === "curriculum" ? <article className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><h2>Curriculum</h2><p>Next curriculum: {nextAssignments.map((entry) => entry.en || entry.de).join(", ") || "Not assigned"}</p><p>Mapped sessions: <strong>{mappedCount}</strong> of <strong>{dashboard.sessions.length}</strong></p></div><button type="button" disabled={busy} onClick={synchronizeCurriculum}>{busy ? "Synchronizing…" : "Repair and synchronize curriculum"}</button></div>
        {renderSessions(true)}
      </article> : null}

      {!loading && dashboard && activeTab === "communication" ? <article className="card"><h2>Schedule and communication</h2><p>Next valid session: {formatDateTime(dashboard.nextSession?.startsAt)}</p><p>Latest completed: {formatDateTime(dashboard.latestCompletedSession?.startsAt)}</p><p>Calendar: <a href={`/api/calendar/class/${dashboard.klass.id}.ics`}>Open class calendar feed</a></p></article> : null}
    </section>
  );
}
