import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LiveClassNextLesson from "../components/LiveClassNextLesson.jsx";
import LiveClassSessionEditor from "../components/LiveClassSessionEditor.jsx";
import { orderedWorkspaceSessions, completionLabel } from "../utils/liveClassWorkspace.js";
import { undoLastScheduleChange } from "../services/liveClassUndoService.js";
import "./LiveClassWorkspace.css";
import LiveClassStudentsPanel from "../components/LiveClassStudentsPanel.jsx";
import { reopenSession } from "../services/liveClassReopenService.js";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import CreateClassCard from "../components/CreateClassCard.jsx";
import ClassEditorCard from "../components/ClassEditorCard.jsx";
import SessionDictionaryPicker from "../components/SessionDictionaryPicker.jsx";
import { compareCourseDictionaryEntries, courseDictionary } from "../data/courseDictionary.js";
import {
  listClassCohorts,
  markSessionCompleted,
  resolveClassCohort,
  updateSession,
} from "../services/liveClassService.js";
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";
import {
  buildDictionarySelectionTopic,
  canonicalDictionarySelection,
} from "../utils/liveClassDictionarySelection.js";
import {
  buildClassUrl,
  calculateClassProgress,
  getEffectiveClassEndDate,
  calculateCountdown,
} from "../utils/liveClassScheduling.js";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "Class & settings" },
  { id: "timetable", label: "Timetable" },
  { id: "sessions", label: "Sessions" },
  { id: "students", label: "Students" },
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

function emailStatusStyle(status) {
  const value = normalize(status).toLowerCase();
  if (["sent", "retry_sent"].includes(value)) return { background: "#dcfce7", color: "#166534" };
  if (["failed", "retry_failed"].includes(value)) return { background: "#fee2e2", color: "#991b1b" };
  if (["skipped", "no_recipients", "no_sessions"].includes(value)) return { background: "#fef3c7", color: "#92400e" };
  return { background: "#e2e8f0", color: "#334155" };
}

function EmailDeliveryStatus({ title, status, lastRunAt, lastSentAt, sentCount, recipientCount, detail }) {
  const normalizedStatus = normalize(status) || "Not checked yet";
  const sent = ["sent", "retry_sent"].includes(normalizedStatus.toLowerCase());
  return (
    <div style={{ border: "1px solid #dbe3ee", borderRadius: 10, padding: 12, background: "#fff", display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <strong>{title}</strong>
        <span style={{ ...emailStatusStyle(normalizedStatus), borderRadius: 999, padding: "4px 9px", fontWeight: 800, fontSize: 12 }}>
          {sent ? "SENT" : normalizedStatus.replace(/[_-]+/g, " ").toUpperCase()}
        </span>
      </div>
      <span>Last worker check: <strong>{formatDateTime(lastRunAt)}</strong></span>
      <span>Last successful send: <strong>{formatDateTime(lastSentAt)}</strong></span>
      <span>Recipients: <strong>{Number(recipientCount ?? sentCount ?? 0)}</strong> · Emails sent: <strong>{Number(sentCount || 0)}</strong></span>
      {detail ? <span style={{ color: normalizedStatus.toLowerCase().includes("fail") ? "#991b1b" : "#92400e" }}>Detail: <strong>{detail}</strong></span> : null}
    </div>
  );
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
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(() => searchParams.get("classId") || "");
  const [classSearch, setClassSearch] = useState("");
  const [classFilter, setClassFilter] = useState("active");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [sessionSort, setSessionSort] = useState("lesson");
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "sessions");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sessionChange, setSessionChange] = useState(null);

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
        setMessage(next.sessionRepair?.error || next.curriculumRepair?.error || next.curriculumSync?.error
          || (next.sessionRepair?.created ? `${next.sessionRepair.created} missing dictionary lessons restored after the last saved session.` : ""));
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
  const dictionaryEntries = useMemo(() => Object.values(courseDictionary[levelId] || {}).sort(compareCourseDictionaryEntries), [levelId]);
  const progress = useMemo(
    () => calculateClassProgress(dashboard?.sessions || [], new Date(), dashboard?.klass || {}),
    [dashboard],
  );
  const nextCountdown = dashboard?.nextSession ? calculateCountdown(dashboard.nextSession.startsAt) : null;
  const messageIsSuccess = /successfully|updated automatically|assigned|created|saved|checked|cancelled|rescheduled|moved|shifted|undone|reopened/i.test(message);

  const visibleClasses = classes.filter(klass => {
    const status = String(klass.status || "active").toLowerCase();
    const matchesStatus = klass.id === selectedClassId || classFilter === "all" || (classFilter === "active" ? !["graduated", "archived", "cancelled", "draft"].includes(status) : classFilter === "completed" ? ["graduated", "archived"].includes(status) : status === "upcoming");
    return matchesStatus && (klass.id === selectedClassId || `${klass.name || klass.className || ""} ${klass.levelId || klass.level || ""}`.toLowerCase().includes(classSearch.toLowerCase()));
  });
  async function undoSchedule() {
    if (!window.confirm("Undo the last schedule change? Dates and calendar will be restored. Any notices already sent remain sent.")) return;
    setBusy(true); setMessage("");
    try {
      await undoLastScheduleChange(selectedClassId, user?.uid || "admin");
      await refreshDashboard(selectedClassId);
      setMessage("Last schedule change undone. Review Communication if students need an updated notice.");
    } catch (error) { setMessage(error.message || "Could not undo this change."); }
    finally { setBusy(false); }
  }

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

  async function saveDictionarySelection(session, assignmentIds) {
    const selectedIds = canonicalDictionarySelection(dictionaryEntries, assignmentIds);
    const topic = buildDictionarySelectionTopic({
      entries: dictionaryEntries,
      assignmentIds: selectedIds,
      levelId,
      existingTopic: session.topic,
    });

    setBusy(true);
    setMessage("");
    try {
      await updateSession(session.id, {
        assignmentIds: selectedIds,
        chapterIds: selectedIds,
        curriculumIds: selectedIds,
        assignment_id: selectedIds[0] || "",
        topic,
      });
      await refreshDashboard(selectedClassId);
      const successMessage = `${selectedIds.length} dictionary item(s) saved for ${formatDateTime(session.startsAt)}.`;
      setMessage(successMessage);
      toast.success(successMessage, { durationMs: 5000 });
    } catch (error) {
      setMessage(error?.message || "Could not save the session dictionary");
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
      if (action === "reopen") {
        const reason = window.prompt("Why should this completed session be reopened? Attendance records will be kept.");
        if (reason === null) return;
        await reopenSession(session.id, { reason, adminId: user?.uid || user?.email || "admin" });
        setSessionFilter("remaining");
        setMessage("Session reopened. Use Change session to choose its correct date, or Complete after teaching it.");
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

  function openSessionChange(session, action = "reschedule") {
    setMessage("");
    setSessionChange({ sessionId: session.id, action });
    window.requestAnimationFrame(() => document.getElementById("session-editor")?.focus());
  }

  const editingSession = dashboard?.sessions.find(({ id }) => id === sessionChange?.sessionId);

  function renderSessions() {
    const sessions = orderedWorkspaceSessions(dashboard?.sessions || [], levelId, sessionFilter, sessionSort);
    if (!sessions.length) {
      return <p>No lessons match this filter. Choose All lessons to see the full course.</p>;
    }

    return (
      <div className="live-class-session-table-wrap" style={{ overflowX: "auto" }}>
        <table className="live-class-sessions-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th>Ghana date and time</th><th>Status</th><th>Topic</th><th>Complete dictionary selection</th><th>Actions</th></tr></thead>
          <tbody>
            {sessions.map((session) => {
              const status = String(session.status || "scheduled").toLowerCase();
              const contentLocked = ["cancelled", "completed"].includes(status);
              const changeLocked = ["completed", "live"].includes(status);
              return (
                <tr key={session.id} style={{ borderTop: "1px solid #e5e7eb", verticalAlign: "top" }}>
                  <td data-label="Ghana date and time" style={{ padding: 8 }}>{formatDateTime(session.startsAt)}<br /><small>to {formatDateTime(session.endsAt)}</small></td>
                  <td data-label="Status" style={{ padding: 8 }}>
                    <span style={{ ...statusStyle(status), padding: "4px 8px", borderRadius: 999, fontWeight: 700 }}>{completionLabel(session)}</span>
                    {status === "cancelled" && session.cancellationReason ? <small style={{ display: "block", marginTop: 6, color: "#991b1b" }}>{session.cancellationReason}</small> : null}
                    {status === "scheduled" && session.rescheduleReason ? <small style={{ display: "block", marginTop: 6, color: "#475569" }}>Moved: {session.rescheduleReason}</small> : null}
                  </td>
                  <td data-label="Topic" style={{ padding: 8 }}>{session.topic || "No topic"}</td>
                  <td data-label="Dictionary selection" style={{ padding: 8, minWidth: 350 }}>
                    <SessionDictionaryPicker
                      entries={dictionaryEntries}
                      assignmentIds={curriculumIds(session)}
                      disabled={busy || contentLocked || !dictionaryEntries.length}
                      onChange={(nextIds) => saveDictionarySelection(session, nextIds)}
                    />
                  </td>
                  <td data-label="Actions" style={{ padding: 8 }}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Link to={`/attendance/session/${dashboard.klass.id || selectedClassId}?session=${encodeURIComponent(session.id)}`}>Attendance</Link>

                    <button type="button" disabled={busy || changeLocked} onClick={() => openSessionChange(session)}>{sessionChange?.sessionId === session.id ? "Changing…" : status === "cancelled" ? "Reactivate" : "Reschedule"}</button>
                    {!contentLocked ? <button type="button" disabled={busy} onClick={() => openSessionChange(session, "cancel")}>Cancel class</button> : null}
                    <details className="live-workspace-menu"><summary>More actions</summary>
                      <button type="button" disabled={busy || contentLocked} onClick={() => handleSessionAction(session, "topic")}>Edit topic</button>
                      {status === "completed"
                        ? <button type="button" disabled={busy} onClick={() => handleSessionAction(session, "reopen")}>Reopen session</button>
                        : <button type="button" disabled={busy || contentLocked} onClick={() => handleSessionAction(session, "complete")}>Mark completed</button>}
                    </details>

                  </div></td>
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
        <div><h1>Live Classes</h1><p>Manage classes, sessions, students, attendance and teaching records from the same class.</p></div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><Link to="/attendance">Attendance overview</Link><Link to="/class-schedule-setup">Class schedule page</Link></div>
      </div>

      {message ? <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: messageIsSuccess ? "#f0fdf4" : "#eff6ff", border: messageIsSuccess ? "1px solid #bbf7d0" : "1px solid #bfdbfe" }}>{message}</div> : null}

      <article className="card" style={{ display: "grid", gap: 12 }}>
        <div className="live-workspace-toolbar">
          <label>Find class<input type="search" value={classSearch} onChange={event => setClassSearch(event.target.value)} placeholder="Name or level" /></label>
          <label>Show classes<select value={classFilter} onChange={event => setClassFilter(event.target.value)}><option value="active">Active / upcoming</option><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="all">All classes</option></select></label>
        </div>
        <label><select aria-label="Select class" value={selectedClassId} onChange={(event) => { setSelectedClassId(event.target.value); setActiveTab("sessions"); setMessage(""); setSessionChange(null); }}>
          <option value="">Select a class</option>
          {visibleClasses.map((klass) => <option key={klass.id} value={klass.id}>{klass.name || klass.className || klass.id}</option>)}
        </select></label>
        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((tab) => {
            const disabled = tab.id !== "create" && !dashboard;
            return <button key={tab.id} type="button" disabled={disabled} style={tabStyle(activeTab === tab.id, disabled)} onClick={() => { setActiveTab(tab.id); setSessionChange(null); }}>{tab.label}</button>;
          })}
        </nav>
      </article>

      {!loading && dashboard ? <>
        <LiveClassNextLesson dashboard={dashboard} busy={busy} onComplete={session => handleSessionAction(session, "complete")} onChange={openSessionChange} />
        {dashboard.klass.lastScheduleUndo?.version === dashboard.klass.sessionScheduleVersion && dashboard.klass.lastScheduleUndo?.changes?.length ? <article className="card"><div className="live-workspace-actions"><span>Last date change can be reversed.</span><button type="button" disabled={busy} onClick={undoSchedule}>Undo last schedule change</button></div></article> : null}
      </> : null}

      {!loading && editingSession ? <LiveClassSessionEditor
        key={`${editingSession.id}:${sessionChange.action}`}
        klass={dashboard.klass}
        sessions={dashboard.sessions}
        session={editingSession}
        initialAction={sessionChange.action}
        adminId={user?.uid || user?.email || "admin"}
        onClose={() => setSessionChange(null)}
        onSaved={async message => {
          setSessionChange(null);
          await refreshDashboard(selectedClassId);
          setSessionFilter("all");
          setMessage(message);
          toast.success(message);
        }}
      /> : null}
      {loading ? <article className="card"><p>Loading selected class…</p></article> : null}
      {activeTab === "create" ? <CreateClassCard classes={classes} onCreated={handleCreated} onDuplicate={handleDuplicate} /> : null}

      {!loading && dashboard && activeTab === "overview" ? <article className="card">
        <h2>{dashboard.klass.name || dashboard.klass.className || selectedClassId}</h2>
        <p>Status: <strong>{dashboard.klass.status || "active"}</strong> · Progress: <strong>{progress}%</strong></p>
        <p>Level: <strong>{levelId || "Not set"}</strong> · Sessions found: <strong>{dashboard.sessions.length}</strong> · Dictionary items: <strong>{dictionaryEntries.length}</strong></p>
        <p>Stable student URL: <code>{buildClassUrl(dashboard.klass)}</code></p>
        <p>Start: {dashboard.klass.startDate || "Not set"} · Graduation: {getEffectiveClassEndDate(dashboard.klass, dashboard.sessions) || "Not set"} · Timezone: {dashboard.klass.timezone || "Africa/Accra"}</p>
      </article> : null}

      {!loading && dashboard && activeTab === "details" ? <ClassEditorCard klass={dashboard.klass} onSaved={async (classId) => { await refreshClasses(classId); await refreshDashboard(classId); setMessage("Class changes saved and sessions refreshed."); }} /> : null}

      {!loading && dashboard && activeTab === "timetable" ? <article className="card">
        <h2>Timetable</h2>
        <p><strong>Course dates:</strong> {dashboard.klass.startDate || "Not set"} to {getEffectiveClassEndDate(dashboard.klass, dashboard.sessions) || "Not set"}</p>
        <div style={{ display: "grid", gap: 8, margin: "14px 0" }}>{(dashboard.klass.scheduleRules || []).length ? dashboard.klass.scheduleRules.map((rule, index) => <div key={`${rule.day}-${rule.startTime}-${index}`} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }}>{scheduleRuleLabel(rule)}</div>) : <p>No weekly teaching times are saved.</p>}</div>
        <p>Next valid session: {formatDateTime(dashboard.nextSession?.startsAt)} {nextCountdown ? `(${nextCountdown.days}d ${nextCountdown.hours}h ${nextCountdown.minutes}m)` : ""}</p>
        <p><Link to="/class-schedule-setup">Open Class Schedule Setup</Link> to review the base weekly schedule. Individual moved or cancelled lessons remain controlled by the shared session record here.</p>
      </article> : null}

      {!loading && dashboard && activeTab === "sessions" ? <article className="card"><h2>Lessons</h2><div className="live-workspace-toolbar">
        <label>Show lessons<select value={sessionFilter} onChange={event => setSessionFilter(event.target.value)}><option value="remaining">Remaining</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="all">All lessons</option></select></label>
        <label>Order<select value={sessionSort} onChange={event => setSessionSort(event.target.value)}><option value="lesson">Lesson day</option><option value="date">Date</option></select></label>
      </div>{renderSessions()}</article> : null}

      {!loading && dashboard && activeTab === "students" ? (
        <LiveClassStudentsPanel
          classId={dashboard.klass.id || selectedClassId}
          className={dashboard.klass.name || dashboard.klass.className || selectedClassId}
          levelId={levelId}
        />
      ) : null}

      {!loading && dashboard && activeTab === "communication" ? <article className="card">
        <h2>Schedule and communication</h2>
        <p>Next valid session: {formatDateTime(dashboard.nextSession?.startsAt)}</p>
        <p>Latest completed: {formatDateTime(dashboard.latestCompletedSession?.startsAt)}</p>
        <p>Calendar: <a href={`/api/calendar/class/${dashboard.klass.id}.ics`}>Open class calendar feed</a></p>
        <h3>Email delivery status</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <EmailDeliveryStatus
            title="Class about-to-start reminder"
            status={dashboard.klass.classReminderEmailLastStatus}
            lastRunAt={dashboard.klass.classReminderEmailLastRunAt}
            lastSentAt={dashboard.klass.classReminderEmailLastSentAt}
            sentCount={dashboard.klass.classReminderEmailLastSentCount}
            recipientCount={dashboard.klass.classReminderEmailLastRecipientCount}
            detail={dashboard.klass.classReminderEmailLastSkipReason || dashboard.klass.classReminderEmailLastError}
          />
          <EmailDeliveryStatus
            title="Attendance summary email"
            status={dashboard.klass.attendanceConfirmationEmailLastStatus}
            lastRunAt={dashboard.klass.attendanceConfirmationEmailLastRunAt}
            lastSentAt={dashboard.klass.attendanceConfirmationEmailLastSentAt}
            sentCount={dashboard.klass.attendanceConfirmationEmailLastSentCount}
            recipientCount={dashboard.klass.attendanceConfirmationEmailLastRecipientCount}
            detail={dashboard.klass.attendanceConfirmationEmailLastError}
          />
        </div>
        <p><Link to="/communication">Open Communication settings</Link> to change the attendance email frequency or turn it off.</p>
        <p>Moving or cancelling a session creates the matching student notification and communication record automatically.</p>
      </article> : null}
    </section>
  );
}
