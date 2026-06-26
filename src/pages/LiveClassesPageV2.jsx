import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CreateClassCard from "../components/CreateClassCard.jsx";
import ClassEditorCard from "../components/ClassEditorCard.jsx";
import { courseDictionary, getUnifiedTopicLabel } from "../data/courseDictionary.js";
import {
  cancelSession,
  listClassCohorts,
  markSessionCompleted,
  rescheduleSession,
  resolveClassCohort,
  updateSession,
} from "../services/liveClassService.js";
import {
  getCompatibleClassDashboard,
  syncCompatibleClassCurriculum,
} from "../services/liveClassCompatibilityService.js";
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

function normalize(value) {
  return String(value || "").trim();
}

function resolveLevel(klass = {}) {
  const candidates = [klass.levelId, klass.level, klass.courseLevel, klass.name, klass.className, klass.classId, klass.id];
  for (const candidate of candidates) {
    const match = normalize(candidate).match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
    if (match) return match[1].toUpperCase();
  }
  return "";
}

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

export default function LiveClassesPageV2() {
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

  const levelId = useMemo(() => resolveLevel(dashboard?.klass || {}), [dashboard?.klass]);
  const dictionaryEntries = useMemo(() => Object.values(courseDictionary[levelId] || {}), [levelId]);
  const progress = useMemo(
    () => calculateClassProgress(dashboard?.sessions || [], new Date(), dashboard?.klass || {}),
    [dashboard],
  );
  const nextCountdown = dashboard?.nextSession ? calculateCountdown(dashboard.nextSession.startsAt) : null;
  const mappedCount = (dashboard?.sessions || []).filter((session) => curriculumIds(session).length).length;

  const sessionsByDictionaryId = useMemo(() => {
    const result = new Map();
    (dashboard?.sessions || []).forEach((session) => {
      curriculumIds(session).forEach((id) => {
        const normalizedId = normalize(id).toUpperCase();
        if (!result.has(normalizedId)) result.set(normalizedId, []);
        result.get(normalizedId).push(session);
      });
    });
    return result;
  }, [dashboard?.sessions]);

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
      setMessage(`Curriculum checked: ${result.mapped} of ${result.total} session(s) mapped. The full ${levelId || "course"} dictionary contains ${dictionaryEntries.length} item(s).`);
    } catch (error) {
      setMessage(error?.message || "Curriculum synchronization failed");
    } finally {
      setBusy(false);
    }
  }

  async function assignDictionaryItem(session, assignmentId) {
    if (!assignmentId) return;
    const entry = courseDictionary[levelId]?.[assignmentId];
    const topic = getUnifiedTopicLabel(assignmentId, entry?.en || entry?.de || session.topic || "");
    setBusy(true);
    setMessage("");
    try {
      await updateSession(session.id, {
        assignmentIds: [assignmentId],
        chapterIds: [assignmentId],
        curriculumIds: [assignmentId],
        assignment_id: assignmentId,
        topic,
      });
      await refreshDashboard(selectedClassId);
      setMessage(`${assignmentId} assigned to ${formatDateTime(session.startsAt)}.`);
    } catch (error) {
      setMessage(error?.message || "Could not assign curriculum");
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
      if (action === "reschedule") {
        const startInput = window.prompt("New start (YYYY-MM-DDTHH:mm)", toDateTimeLocal(session.startsAt));
        if (!startInput) return;
        const endInput = window.prompt("New end (YYYY-MM-DDTHH:mm)", toDateTimeLocal(session.endsAt));
        if (!endInput) return;
        await rescheduleSession(session.id, {
          startsAt: new Date(startInput).toISOString(),
          endsAt: new Date(endInput).toISOString(),
          reason: window.prompt("Reason for rescheduling", "") || "",
          adminId: user?.uid || user?.email || "admin",
        });
      }
      if (action === "cancel") {
        const reason = window.prompt("Reason for cancellation", session.cancellationReason || "");
        if (reason === null) return;
        await cancelSession(session.id, { reason, adminId: user?.uid || user?.email || "admin" });
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

  function renderSessions() {
    const sessions = dashboard?.sessions || [];
    if (!sessions.length) {
      return <p>No sessions were found for this class record. Open Class & settings and save the timetable to generate them.</p>;
    }
    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th>Ghana date and time</th><th>Status</th><th>Topic</th><th>Complete dictionary selection</th><th>Actions</th></tr></thead>
          <tbody>
            {sessions.map((session) => {
              const locked = ["cancelled", "completed"].includes(String(session.status || "").toLowerCase());
              const currentId = curriculumIds(session)[0] || "";
              return (
                <tr key={session.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 8 }}>{formatDateTime(session.startsAt)}<br /><small>to {formatDateTime(session.endsAt)}</small></td>
                  <td style={{ padding: 8 }}><span style={{ ...statusStyle(session.status), padding: "4px 8px", borderRadius: 999, fontWeight: 700 }}>{session.status || "scheduled"}</span></td>
                  <td style={{ padding: 8 }}>{session.topic || "No topic"}</td>
                  <td style={{ padding: 8 }}>
                    <select
                      value={currentId}
                      disabled={busy || locked || !dictionaryEntries.length}
                      onChange={(event) => assignDictionaryItem(session, event.target.value)}
                      style={{ minWidth: 280 }}
                    >
                      <option value="">Select from all {dictionaryEntries.length} items</option>
                      {dictionaryEntries.map((entry) => (
                        <option key={entry.assignment_id} value={entry.assignment_id}>
                          {entry.assignment_id} — {entry.en || entry.de}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: 8 }}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Link to={`/attendance/session/${dashboard.klass.id}?session=${encodeURIComponent(session.id)}`}>Attendance</Link>
                    <button disabled={busy || locked} onClick={() => handleSessionAction(session, "topic")}>Topic</button>
                    <button disabled={busy || locked} onClick={() => handleSessionAction(session, "reschedule")}>Reschedule</button>
                    <button disabled={busy || locked} onClick={() => handleSessionAction(session, "cancel")}>Cancel</button>
                    <button disabled={busy || locked} onClick={() => handleSessionAction(session, "complete")}>Complete</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderFullDictionary() {
    if (!levelId) return <p>The class level is missing. Save A1, A2 or B1 in Class & settings.</p>;
    if (!dictionaryEntries.length) return <p>No dictionary is configured for {levelId}.</p>;
    return (
      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th>#</th><th>Assignment ID</th><th>Chapter</th><th>English</th><th>German</th><th>Session mapping</th></tr></thead>
          <tbody>
            {dictionaryEntries.map((entry, index) => {
              const mappedSessions = sessionsByDictionaryId.get(entry.assignment_id.toUpperCase()) || [];
              return (
                <tr key={entry.assignment_id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 8 }}>{index + 1}</td>
                  <td style={{ padding: 8 }}><strong>{entry.assignment_id}</strong></td>
                  <td style={{ padding: 8 }}>{entry.chapter}</td>
                  <td style={{ padding: 8 }}>{entry.en}</td>
                  <td style={{ padding: 8 }}>{entry.de}</td>
                  <td style={{ padding: 8 }}>{mappedSessions.length ? mappedSessions.map((session) => formatDateTime(session.startsAt)).join(", ") : "Not mapped yet"}</td>
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
        <div><h1>Live Classes</h1><p>Manage classes, sessions, attendance and the complete course dictionary from the same record.</p></div>
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
        <p>Level: <strong>{levelId || "Not set"}</strong> · Sessions found: <strong>{dashboard.sessions.length}</strong> · Dictionary items: <strong>{dictionaryEntries.length}</strong></p>
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

      {!loading && dashboard && activeTab === "sessions" ? <article className="card"><h2>Generated sessions</h2><p>Every session curriculum selector now contains the complete {levelId} dictionary.</p>{renderSessions()}</article> : null}

      {!loading && dashboard && activeTab === "curriculum" ? <article className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div><h2>Complete {levelId || "course"} dictionary</h2><p>Showing <strong>{dictionaryEntries.length}</strong> dictionary item(s), not only the items already attached to generated sessions.</p><p>Mapped sessions: <strong>{mappedCount}</strong> of <strong>{dashboard.sessions.length}</strong></p></div>
          <button type="button" disabled={busy} onClick={synchronizeCurriculum}>{busy ? "Synchronizing…" : "Repair and synchronize curriculum"}</button>
        </div>
        {renderFullDictionary()}
      </article> : null}

      {!loading && dashboard && activeTab === "communication" ? <article className="card"><h2>Schedule and communication</h2><p>Next valid session: {formatDateTime(dashboard.nextSession?.startsAt)}</p><p>Latest completed: {formatDateTime(dashboard.latestCompletedSession?.startsAt)}</p><p>Calendar: <a href={`/api/calendar/class/${dashboard.klass.id}.ics`}>Open class calendar feed</a></p></article> : null}
    </section>
  );
}
