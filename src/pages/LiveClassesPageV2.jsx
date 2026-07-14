import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import OperationsCommunicationPanel from "../components/OperationsCommunicationPanel";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import CreateClassCard from "../components/CreateClassCard.jsx";
import ClassEditorCard from "../components/ClassEditorCard.jsx";
import SessionDictionaryPicker from "../components/SessionDictionaryPicker.jsx";
import { compareCourseDictionaryEntries, courseDictionary } from "../data/courseDictionary.js";
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
  { id: "curriculum", label: "Curriculum" },
  { id: "communication", label: "Communication" },
  { id: "create", label: "Create class" },
];

const SESSION_CHANGE_REASONS = [
  { label: "Wrong date", value: "This class had the wrong date in the timetable, so the class date has been corrected." },
  { label: "Raining / light out", value: "The class cannot hold because of heavy rain and a power outage." },
  { label: "Tutor travelled", value: "The class cannot hold because the tutor is unavailable due to travel." },
  { label: "Emergency", value: "The class cannot hold because of an emergency." },
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

function ghanaParts(value) {
  const parsed = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(parsed);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function toDateTimeLocal(value) {
  const parts = ghanaParts(value);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function splitDateTimeLocal(value) {
  const [localDate = "", localTime = ""] = String(value || "").split("T");
  const time = localTime.slice(0, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate) || !/^\d{2}:\d{2}$/.test(time)) return null;
  return { localDate, localTime: time };
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

function sessionDurationMinutes(session = {}) {
  const startsAt = new Date(session.startsAt || 0);
  const endsAt = new Date(session.endsAt || 0);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return 60;
  const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  return minutes > 0 ? minutes : 60;
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
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
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
  const dictionaryEntries = useMemo(() => Object.values(courseDictionary[levelId] || {}).sort(compareCourseDictionaryEntries), [levelId]);
  const progress = useMemo(
    () => calculateClassProgress(dashboard?.sessions || [], new Date(), dashboard?.klass || {}),
    [dashboard],
  );
  const nextCountdown = dashboard?.nextSession ? calculateCountdown(dashboard.nextSession.startsAt) : null;
  const mappedCount = (dashboard?.sessions || []).filter((session) => curriculumIds(session).length).length;
  const messageIsSuccess = /successfully|updated automatically|assigned|created|saved|checked|cancelled|rescheduled|moved|shifted/i.test(message);

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

  function openSessionChange(session) {
    const status = String(session.status || "scheduled").toLowerCase();
    setMessage("");
    setSessionChange({
      sessionId: session.id,
      classId: session.classId || session.classRecordId || dashboard?.klass?.id || selectedClassId,
      className: dashboard?.klass?.name || session.className || "",
      action: "reschedule",
      moveMode: "single",
      startsAt: toDateTimeLocal(session.startsAt),
      reason: status === "cancelled"
        ? (session.cancellationReason || "This cancelled session has been moved to a new date and reactivated.")
        : (session.rescheduleReason || SESSION_CHANGE_REASONS[0].value),
      durationMinutes: sessionDurationMinutes(session),
      originalStatus: status,
    });
  }

  async function handleSessionChangeSubmit(event) {
    event.preventDefault();
    if (!sessionChange?.sessionId) return;
    setBusy(true);
    setMessage("");

    try {
      const adminId = user?.uid || user?.email || "admin";
      const classId = sessionChange.classId || dashboard?.klass?.id || selectedClassId;
      const className = sessionChange.className || dashboard?.klass?.name || "";
      const reason = String(sessionChange.reason || "").trim();
      if (!reason) throw new Error("Write the reason or message students should receive.");

      if (sessionChange.action === "cancel") {
        const cancelResult = await cancelSession(sessionChange.sessionId, {
          reason,
          adminId,
          classId,
          className,
        });
        const emailNote = cancelResult?.emailSubmitted === false
          ? ` Communication email could not be confirmed: ${cancelResult.emailMessage || "check Communication"}.`
          : "";
        const successMessage = `Session cancelled. Attendance and check-in are locked, the class schedule and calendar feed were updated, and student communication was prepared.${emailNote}`;
        setSessionChange(null);
        await refreshDashboard(selectedClassId);
        setMessage(successMessage);
        toast.success(successMessage, { durationMs: 8000 });
        return;
      }

      const parts = splitDateTimeLocal(sessionChange.startsAt);
      if (!parts) throw new Error("Choose the new Ghana date and time.");
      const rescheduleResult = await rescheduleSession(sessionChange.sessionId, {
        localDate: parts.localDate,
        localTime: parts.localTime,
        startsAt: sessionChange.startsAt,
        moveMode: sessionChange.moveMode,
        reason,
        adminId,
        classId,
        className,
        timezone: dashboard?.klass?.timezone || "Africa/Accra",
        durationMinutes: sessionChange.durationMinutes,
      });
      const emailNote = rescheduleResult?.emailSubmitted === false
        ? ` Communication email could not be confirmed: ${rescheduleResult.emailMessage || "check Communication"}.`
        : "";
      const movedCount = Number(rescheduleResult?.movedSessions || 1);
      const successMessage = rescheduleResult?.moveMode === "following"
        ? `${movedCount} sessions shifted. The selected lesson now starts ${formatDateTime(rescheduleResult?.startsAt || sessionChange.startsAt)}, and every following lesson kept its curriculum order. Attendance, class dates, reminders and calendar feed were updated atomically.${emailNote}`
        : `Session moved to ${formatDateTime(rescheduleResult?.startsAt || sessionChange.startsAt)}. Curriculum order, overlaps, Attendance, class dates, reminders and calendar feed were checked and updated atomically.${emailNote}`;
      setSessionChange(null);
      await refreshDashboard(selectedClassId);
      setMessage(successMessage);
      toast.success(successMessage, { durationMs: 8000 });
    } catch (error) {
      setMessage(error?.message || "Session update failed");
      toast.error(error?.message || "Session update failed", { durationMs: 7000 });
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

  function renderSessionChangeForm(session) {
    if (!sessionChange || sessionChange.sessionId !== session.id) return null;
    const cancelling = sessionChange.action === "cancel";
    const alreadyCancelled = sessionChange.originalStatus === "cancelled";
    const shiftingFollowing = sessionChange.moveMode === "following";

    return (
      <form onSubmit={handleSessionChangeSubmit} style={{ display: "grid", gap: 12, padding: 14, border: "1px solid #bfdbfe", borderRadius: 10, background: "#eff6ff" }}>
        <div>
          <strong>Change session: {formatDateTime(session.startsAt)}</strong>
          <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>One atomic workflow updates Live Classes, Attendance, class dates, reminders, calendar feed and the audit history.</div>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <strong>What should happen?</strong>
          <select value={sessionChange.action} onChange={(event) => setSessionChange((current) => ({ ...current, action: event.target.value }))}>
            <option value="reschedule">Move to another date or time</option>
            <option value="cancel" disabled={alreadyCancelled}>Cancel without a new date</option>
          </select>
        </label>

        {!cancelling ? (
          <>
            <label style={{ display: "grid", gap: 6 }}>
              <strong>Which lessons should move?</strong>
              <select value={sessionChange.moveMode || "single"} onChange={(event) => setSessionChange((current) => ({ ...current, moveMode: event.target.value }))}>
                <option value="single">Move only this session</option>
                <option value="following">Move this and all following sessions</option>
              </select>
            </label>

            <div style={{ padding: 10, borderRadius: 8, background: shiftingFollowing ? "#fff7ed" : "#fff", border: shiftingFollowing ? "1px solid #fdba74" : "1px solid #bfdbfe", color: shiftingFollowing ? "#9a3412" : "#334155" }}>
              {shiftingFollowing
                ? "The selected lesson and every later curriculum lesson will shift by the same amount. Cancelled future lessons stay cancelled. The operation stops if a completed/live lesson would be moved or any new time would overlap another lesson."
                : "Only this lesson will move. Its new time must remain after the previous curriculum lesson and before the next one, with no partial or full overlap."}
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <strong>{shiftingFollowing ? "New date and time for this lesson (Ghana)" : "New Ghana date and time"}</strong>
              <input type="datetime-local" value={sessionChange.startsAt} onChange={(event) => setSessionChange((current) => ({ ...current, startsAt: event.target.value }))} required />
            </label>
          </>
        ) : (
          <div style={{ padding: 10, borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412" }}>
            The session will remain visible as cancelled. Attendance and QR check-in will be locked, reminders will stop, and students will be notified.
          </div>
        )}

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Message template</strong>
          <select value="" onChange={(event) => event.target.value && setSessionChange((current) => ({ ...current, reason: event.target.value }))}>
            <option value="">Choose a ready reason</option>
            {SESSION_CHANGE_REASONS.map((template) => <option key={template.label} value={template.value}>{template.label}</option>)}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Reason / message to students</strong>
          <textarea rows={3} value={sessionChange.reason} onChange={(event) => setSessionChange((current) => ({ ...current, reason: event.target.value }))} placeholder="Write the message students should receive" required />
        </label>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="submit" disabled={busy}>{busy ? "Saving…" : cancelling ? "Cancel session and notify students" : shiftingFollowing ? "Shift this and following sessions" : alreadyCancelled ? "Move and reactivate session" : "Move only this session"}</button>
          <button type="button" disabled={busy} onClick={() => setSessionChange(null)}>Close</button>
        </div>
      </form>
    );
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
              const status = String(session.status || "scheduled").toLowerCase();
              const contentLocked = ["cancelled", "completed"].includes(status);
              const changeLocked = status === "completed";
              return [
                <tr key={session.id} style={{ borderTop: "1px solid #e5e7eb", verticalAlign: "top" }}>
                  <td style={{ padding: 8 }}>{formatDateTime(session.startsAt)}<br /><small>to {formatDateTime(session.endsAt)}</small></td>
                  <td style={{ padding: 8 }}>
                    <span style={{ ...statusStyle(status), padding: "4px 8px", borderRadius: 999, fontWeight: 700 }}>{status}</span>
                    {status === "cancelled" && session.cancellationReason ? <small style={{ display: "block", marginTop: 6, color: "#991b1b" }}>{session.cancellationReason}</small> : null}
                    {status === "scheduled" && session.rescheduleReason ? <small style={{ display: "block", marginTop: 6, color: "#475569" }}>Moved: {session.rescheduleReason}</small> : null}
                  </td>
                  <td style={{ padding: 8 }}>{session.topic || "No topic"}</td>
                  <td style={{ padding: 8, minWidth: 350 }}>
                    <SessionDictionaryPicker
                      entries={dictionaryEntries}
                      assignmentIds={curriculumIds(session)}
                      disabled={busy || contentLocked || !dictionaryEntries.length}
                      onChange={(nextIds) => saveDictionarySelection(session, nextIds)}
                    />
                  </td>
                  <td style={{ padding: 8 }}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Link to={`/attendance/session/${dashboard.klass.id || selectedClassId}?session=${encodeURIComponent(session.id)}`}>Attendance</Link>
                    <button type="button" disabled={busy || contentLocked} onClick={() => handleSessionAction(session, "topic")}>Topic</button>
                    <button type="button" disabled={busy || changeLocked} onClick={() => openSessionChange(session)}>{sessionChange?.sessionId === session.id ? "Changing…" : status === "cancelled" ? "Move / reactivate" : "Change session"}</button>
                    <button type="button" disabled={busy || contentLocked} onClick={() => handleSessionAction(session, "complete")}>Complete</button>
                  </div></td>
                </tr>,
                sessionChange?.sessionId === session.id ? (
                  <tr key={`${session.id}-change`}>
                    <td colSpan={5} style={{ padding: "0 8px 12px" }}>{renderSessionChangeForm(session)}</td>
                  </tr>
                ) : null,
              ];
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
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><Link to="/attendance">Attendance overview</Link><Link to="/class-schedule-setup">Class schedule page</Link></div>
      </div>

      <OperationsCommunicationPanel context="live-classes" />

      {message ? <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: messageIsSuccess ? "#f0fdf4" : "#eff6ff", border: messageIsSuccess ? "1px solid #bbf7d0" : "1px solid #bfdbfe" }}>{message}</div> : null}

      <article className="card" style={{ display: "grid", gap: 12 }}>
        <label><strong>Manage class</strong>{" "}<select value={selectedClassId} onChange={(event) => { setSelectedClassId(event.target.value); setActiveTab("overview"); setMessage(""); setSessionChange(null); }}>
          <option value="">Select a class</option>
          {classes.map((klass) => <option key={klass.id} value={klass.id}>{klass.name || klass.className || klass.id}</option>)}
        </select></label>
        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((tab) => {
            const disabled = tab.id !== "create" && !dashboard;
            return <button key={tab.id} type="button" disabled={disabled} style={tabStyle(activeTab === tab.id, disabled)} onClick={() => { setActiveTab(tab.id); setSessionChange(null); }}>{tab.label}</button>;
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

      {!loading && dashboard && activeTab === "sessions" ? <article className="card"><h2>Generated sessions</h2><p>Use <strong>Change session</strong> to move one lesson safely, shift it together with all following lessons, or cancel it without a replacement date. The system blocks overlaps and curriculum-order errors before saving.</p><p>Click a session dictionary control to open the complete {levelId} dictionary, search all {dictionaryEntries.length} items and select one or several assignments.</p>{renderSessions()}</article> : null}

      {!loading && dashboard && activeTab === "curriculum" ? <article className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div><h2>Complete {levelId || "course"} dictionary</h2><p>Showing <strong>{dictionaryEntries.length}</strong> dictionary item(s), not only the items already attached to generated sessions.</p><p>Mapped sessions: <strong>{mappedCount}</strong> of <strong>{dashboard.sessions.length}</strong></p></div>
          <button type="button" disabled={busy} onClick={synchronizeCurriculum}>{busy ? "Synchronizing…" : "Repair and synchronize curriculum"}</button>
        </div>
        {renderFullDictionary()}
      </article> : null}

      {!loading && dashboard && activeTab === "communication" ? <article className="card"><h2>Schedule and communication</h2><p>Next valid session: {formatDateTime(dashboard.nextSession?.startsAt)}</p><p>Latest completed: {formatDateTime(dashboard.latestCompletedSession?.startsAt)}</p><p>Calendar: <a href={`/api/calendar/class/${dashboard.klass.id}.ics`}>Open class calendar feed</a></p><p>Moving or cancelling a session creates the matching student notification and communication record automatically.</p></article> : null}
    </section>
  );
}
