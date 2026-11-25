import "./CanonicalAttendancePage.css";
import AttendanceWeeklyEmailOutbox from "../components/AttendanceWeeklyEmailOutbox.jsx";
import { attendanceRequest } from "../services/assignedTutorAttendanceService.js";
import SessionDictionaryPicker from "../components/SessionDictionaryPicker.jsx";
import { getCourseSessionDictionary, resolveCourseDictionaryLevel } from "../data/courseSessionGroups.js";
import LiveClassSessionEditor from "../components/LiveClassSessionEditor.jsx";
import { isAppAssessment } from "../utils/appAssessment.js";

import { learnerLessonLinksForAttendanceSession, resolveTeacherLessonSlide } from "../utils/teacherLessonDashboard.js";
import { parseAssignmentChapter } from "../utils/assignmentChapter.js";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import { listStudentsByClass } from "../services/studentsService.js";
import {
  listSessionCheckins,
  loadAttendanceFromFirestore,
  saveCanonicalAttendanceSession,
} from "../services/attendanceService.js";
import { resolveClassCohort } from "../services/liveClassService.js";
import {
  getCompatibleClassDashboard,
} from "../services/liveClassCompatibilityService.js";

import { chooseAttendanceSession, isActiveCheckinSession, isActiveLiveClass } from "../utils/attendanceClassVisibility.js";

const TIMEZONE = "Africa/Accra";

function asDate(value) {
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = value instanceof Date ? value : new Date(value || 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function localDate(value, timezone = TIMEZONE) {
  const date = asDate(value) || new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function localTime(value, timezone = TIMEZONE) {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function lessonLabel(session, timezone = TIMEZONE) {
  const date = asDate(session?.startsAt);
  const assignmentId = String(session?.assignmentIds?.[0] || session?.assignment_id || "").trim();
  const topic = String(session?.topic || "Lesson details to be confirmed").trim();
  if (!date) return [assignmentId, topic].filter(Boolean).join(" — ");
  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${text} · ${assignmentId ? `${assignmentId} — ` : ""}${topic}`;
}

function codeOf(student = {}) {
  return String(student.studentCode || student.studentcode || student.uid || student.id || student.email || student.name || "").trim();
}

function studentTemplate(students = []) {
  return Object.fromEntries(students.map((student) => {
    const code = codeOf(student);
    if (!code) return null;
    return [code, {
      name: String(student.name || "").trim(),
      email: String(student.email || "").trim(),
      present: false,
    }];
  }).filter(Boolean));
}

function mergeStudents(template = {}, saved = {}) {
  const keys = new Set([...Object.keys(template), ...Object.keys(saved)]);
  return Object.fromEntries([...keys].map((code) => [code, {
    name: template[code]?.name || saved[code]?.name || code,
    email: template[code]?.email || saved[code]?.email || "",
    present: Boolean(saved[code]?.present),
  }]));
}

function normalizeApiBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function openSessionApiUrl() {
  const explicit = String(import.meta.env.VITE_OPEN_SESSION_API_URL || "").trim();
  if (explicit) return explicit;
  const base = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (base) return `${base}/openSession`;
  throw new Error("Missing check-in API configuration. Set VITE_OPEN_SESSION_API_URL or VITE_API_BASE_URL.");
}

function sessionApiError(errorValue, action) {
  const message = String(errorValue?.message || "").trim();
  if (errorValue instanceof TypeError || /failed to fetch|networkerror|network error/i.test(message)) {
    return `Network error while trying to ${action} check-in. Confirm the API URL and CORS settings.`;
  }
  return message || `Could not ${action} check-in.`;
}

async function readCheckins(user, isStaff, classId, sessionId) {
  if (!isStaff) return listSessionCheckins({ classId, sessionId });
  const result = await attendanceRequest(user, "assigned-tutor-attendance", { action: "checkins", classId, sessionId });
  return result.checkins;
}

export default function CanonicalAttendancePageV3() {
  const { classId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isStaff } = useAuth();
  const { success, error, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [scheduleAction, setScheduleAction] = useState("");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [klass, setKlass] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedId, setSelectedId] = useState("");
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [hasReminderRecipients, setHasReminderRecipients] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [sendingCheckinInvitation, setSendingCheckinInvitation] = useState(false);
  const [checkinEmailDiagnostic, setCheckinEmailDiagnostic] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setKlass(null);
      try {
        const requestedClass = decodeURIComponent(classId);
        let dashboard, students, saved;
        if (isStaff) {
          const response = await attendanceRequest(user, "assigned-tutor-attendance", { action: "load", classId: requestedClass });
          dashboard = response;
          students = response.students;
          saved = response.saved;
        } else {
          const resolved = await resolveClassCohort(requestedClass);
          if (!resolved) throw new Error("Class not found in Live Classes.");
          dashboard = await getCompatibleClassDashboard(resolved.id);
          const className = dashboard.klass.name || resolved.name || "";
          const [roster, savedById, savedByName] = await Promise.all([
            listStudentsByClass(resolved.id, { className }),
            loadAttendanceFromFirestore(resolved.id).catch(() => ({})),
            className ? loadAttendanceFromFirestore(className).catch(() => ({})) : {},
          ]);
          students = roster;
          saved = { ...savedByName, ...savedById };
        }
        if (!active) return;
        const template = studentTemplate(students);
        const map = Object.fromEntries(dashboard.sessions.map((session) => {
          const stored = saved[session.id] || {};
          const ids = session.assignmentIds || session.chapterIds || session.curriculumIds || stored.assignmentIds || [];
          return [session.id, {
            ...session,
            assignmentIds: ids,
            students: mergeStudents(template, stored.students || {}),
          }];
        }));
        const visibleSessions = dashboard.sessions.filter(session => !session.superseded && session.status !== "superseded");
        const requestedId = searchParams.get("session") || "";
        const chosen = chooseAttendanceSession(visibleSessions, dashboard.klass, requestedId);
        const explicitlyRequested = visibleSessions.some((session) => session.id === requestedId);
        setShowAttendanceHistory(explicitlyRequested && !isActiveCheckinSession(chosen, dashboard.klass));
        setHasReminderRecipients(students.some((student) => student.email?.trim()));
        setKlass(dashboard.klass);
        setSessions(visibleSessions);
        setAttendance(map);
        setSelectedId(chosen?.id || "");
      } catch (cause) {
        error(cause?.message || "Attendance could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [classId, error, isStaff, user]);

  useEffect(() => {
    if (!klass) return;
    const queryId = searchParams.get("session") || "";
    if (selectedId && queryId !== selectedId) {
      setSearchParams({ session: selectedId }, { replace: true });
    } else if (!selectedId && queryId) {
      setSearchParams({}, { replace: true });
    }
    setSessionOpen(false);
    setScheduleAction("");
  }, [klass, searchParams, selectedId, setSearchParams]);

  const selected = attendance[selectedId] || null;
  const timezone = klass?.timezone || TIMEZONE;
  const selectedDate = selected ? localDate(selected.startsAt, timezone) : "";
  const today = localDate(new Date(), timezone);
  const isToday = selectedDate === today;
  const assignmentId = String(selected?.assignmentIds?.[0] || selected?.assignment_id || "").trim();
  const dictionaryLevel = resolveCourseDictionaryLevel(klass || {});
  const dictionaryEntries = useMemo(() => klass?.language !== "Swahili" && ["A1", "A2", "B1"].includes(dictionaryLevel)
    ? getCourseSessionDictionary(dictionaryLevel)
    : [], [dictionaryLevel, klass?.language]);
  const lessonSlide = resolveTeacherLessonSlide({ dashboard: { klass }, session: selected });
  const lessonLinks = learnerLessonLinksForAttendanceSession({ session: selected, dashboard: { klass } });
  const slidesUrl = lessonSlide ? `/teaching-slides/course/${encodeURIComponent(lessonSlide.course)}/${encodeURIComponent(lessonSlide.id)}?${new URLSearchParams({ present: "1", classId: String(klass?.id || ""), classRecordId: String(klass?.id || ""), sessionId: String(selectedId || ""), assignmentId, curriculumDay: String(lessonSlide.dayNumber || ""), sessionDate: selectedDate })}` : "";
  const sessionLabel = String(selected?.topic || klass?.name || "Live class").trim();
  const startTime = localTime(selected?.startsAt, timezone);
  const endTime = localTime(selected?.endsAt, timezone);
  const status = String(selected?.status || "scheduled").toLowerCase();
  const classIsActive = isActiveLiveClass(klass || {}, new Date());
  const activeCheckinSessions = sessions.filter((session) => isActiveCheckinSession(session, klass || {}, new Date()));
  const sessionOptions = showAttendanceHistory ? sessions : activeCheckinSessions;
  const selectedIsActiveCheckin = selected ? isActiveCheckinSession(selected, klass || {}, new Date()) : false;
  const sessionLocked = status === "cancelled" || status === "completed" || !selectedIsActiveCheckin;

  const rows = useMemo(() => Object.entries(selected?.students || {})
    .map(([code, student]) => ({ code, ...student }))
    .sort((a, b) => String(a.name || a.code).localeCompare(String(b.name || b.code))), [selected]);
  const present = rows.filter((row) => row.present).length;

  const checkinQuery = useMemo(() => new URLSearchParams({
    classId: String(klass?.id || ""),
    sessionId: String(selected?.id || ""),
    date: selected ? localDate(selected.startsAt, TIMEZONE) : "",
    sessionLabel,
    assignmentId,
    startTime: localTime(selected?.startsAt, TIMEZONE),
    endTime: localTime(selected?.endsAt, TIMEZONE),
    // Never place the class roster into a URL, browser history or QR code.
    expectedCount: String(rows.length),
  }).toString(), [assignmentId, klass?.id, rows.length, selected, sessionLabel]);

  const checkinUrl = checkinQuery ? `${window.location.origin}/checkin?${checkinQuery}` : "";
  const displayUrl = checkinQuery ? `${window.location.origin}/checkin/display?${checkinQuery}` : "";

  useEffect(() => {
    if (!klass?.id || !selectedId) return;
    let active = true;
    readCheckins(user, isStaff, klass.id, selectedId)
      .then((checkins) => {
        if (!active || !checkins.length) return;
        setAttendance((current) => {
          const currentSession = current[selectedId];
          if (!currentSession) return current;
          const students = { ...(currentSession.students || {}) };
          checkins.forEach((checkin) => {
            const code = String(checkin.studentCode || checkin.uid || checkin.id || "").trim();
            if (!code || !students[code]) return;
            students[code] = { ...students[code], present: true };
          });
          return { ...current, [selectedId]: { ...currentSession, students } };
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [klass?.id, selectedId, isStaff, user]);

  function mark(code, value) {
    setAttendance((current) => ({
      ...current,
      [selectedId]: {
        ...current[selectedId],
        students: {
          ...current[selectedId].students,
          [code]: { ...current[selectedId].students[code], present: value },
        },
      },
    }));
  }


  async function refreshCheckins() {
    if (!klass?.id || !selectedId) return;
    try {
      const checkins = await readCheckins(user, isStaff, klass.id, selectedId);
      if (!checkins.length) {
        info("No student check-ins found yet.");
        return;
      }
      const codes = new Set(checkins.map((checkin) => String(checkin.studentCode || checkin.uid || checkin.id || "").trim()).filter(Boolean));
      setAttendance((current) => {
        const currentSession = current[selectedId];
        const students = { ...(currentSession?.students || {}) };
        Object.keys(students).forEach((code) => {
          if (codes.has(code)) students[code] = { ...students[code], present: true };
        });
        return { ...current, [selectedId]: { ...currentSession, students } };
      });
      success(`${codes.size} student check-in(s) loaded.`);
    } catch (cause) {
      error(cause?.message || "Could not refresh student check-ins.");
    }
  }

  async function changeCheckin(action) {
    if (!klass || !selected || isAppAssessment(selected)) return;
    setSessionBusy(true);
    try {
      if (action === "open") {
        if (!assignmentId) throw new Error("This lesson needs a curriculum ID before check-in can open. Set it under Live Classes.");
        if (!selectedIsActiveCheckin) throw new Error("This class or lesson has finished. Open historical attendance for review instead.");
        if (!isToday) throw new Error(`Select or move the lesson to today (${today}) before opening check-in.`);
        if (sessionLocked) throw new Error(`A ${status} session cannot be opened for check-in.`);
      }
      const token = await user.getIdToken();
      const response = await fetch(openSessionApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(action === "open" ? {
          classId: klass.id,
          sessionId: selected.id,
          date: selectedDate,
          sessionLabel,
          assignmentId,
          topic: selected.topic || sessionLabel,
          chapter: parseAssignmentChapter(assignmentId),
          windowMinutes: 180,
          action: "open",
        } : {
          classId: klass.id,
          sessionId: selected.id,
          date: selectedDate,
          action,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Failed to ${action} check-in`);
      if (action === "end" && data.status !== "completed") throw new Error("The server did not confirm class completion.");
      setSessionOpen(action === "open");
      if (action === "end") {
        const nextSessions = sessions.map((session) => session.id === selected.id
          ? { ...session, status: "completed" }
          : session);
        setSessions(nextSessions);
        setSelectedId(chooseAttendanceSession(nextSessions, klass)?.id || "");
        setShowAttendanceHistory(false);
        setAttendance((current) => ({
          ...current,
          [selected.id]: { ...current[selected.id], status: "completed" },
        }));
        setScheduleAction("");
        success("Class ended. Check-in closed and session marked complete.");
      } else {
        success(`Check-in ${action === "open" ? "opened" : "closed"}.`);
      }
    } catch (cause) {
      error(sessionApiError(cause, action));
    } finally {
      setSessionBusy(false);
    }
  }

  async function save() {
    if (!klass || !selected || isAppAssessment(selected)) return;
    setSaving(true);
    try {
      if (isStaff) {
        const marks = Object.fromEntries(Object.entries(selected.students).map(([code, student]) => [code, student.present]));
        await attendanceRequest(user, "assigned-tutor-attendance", { action: "save", classId: klass.id, sessionId: selected.id, marks });
      } else await saveCanonicalAttendanceSession({
        classRecordId: klass.id,
        className: klass.name,
        session: selected,
        students: selected.students,
        markedBy: user?.uid,
      });
      success("Attendance saved.");
    } catch (cause) {
      error(cause?.message || "Attendance save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function sendCheckinInvitation() {
    if (isStaff || !sessionOpen || !klass?.id || !selected?.id || sendingCheckinInvitation) return;
    setSendingCheckinInvitation(true);
    setCheckinEmailDiagnostic("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/checkin-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classId: klass.id, sessionId: selected.id }),
      });
      const raw = await response.text();
      let result = {};
      try { result = JSON.parse(raw); } catch { /* A non-JSON server error is explained below. */ }
      if (!response.ok || result.ok !== true) {
        const safeResponse = !/^\s*</.test(raw) ? raw.slice(0, 400) : "";
        const details = result.error || result.message || safeResponse || "The server returned an empty or HTML response.";
        const requestId = result.requestId ? ` · Reference: ${result.requestId}` : "";
        throw new Error(`HTTP ${response.status}: ${details}${requestId}`);
      }
      setCheckinEmailDiagnostic(`Success (HTTP ${response.status}): sent ${result.sent}, skipped ${result.skipped}, eligible ${result.recipients}.`);
      success(`Check-in invitations sent: ${result.sent}. Already sent: ${result.skipped}.`);
    } catch (cause) {
      const message = cause?.message || "Could not deliver check-in invitations.";
      setCheckinEmailDiagnostic(message);
      error(message);
    } finally {
      setSendingCheckinInvitation(false);
    }
  }

  async function sendClassReminder() {
    if (isStaff || !klass || !selected || sessionLocked || !classIsActive || isAppAssessment(selected) || sendingReminder || !hasReminderRecipients) return;
    setSendingReminder(true);
    try {
      const result = await attendanceRequest(user, "class-reminder", { classId: klass.id, sessionId: selected.id });
      if (!result.sent) {
        info(result.skipped === "already_sent_or_changed"
          ? "A reminder was already sent, is in progress, or the session changed."
          : "A reminder could not be sent for this session.");
      } else if (result.tutorCopyFailed) {
        info(`Reminder accepted for ${result.sent} students. The tutor copy failed.`);
      } else {
        success(`Class reminder accepted for ${result.sent} student(s).`);
      }
    } catch (cause) {
      error(cause?.message || "Could not send the class reminder.");
    } finally {
      setSendingReminder(false);
    }
  }

  if (loading) return <div className="page-container">Loading attendance…</div>;
  if (!klass) return <div className="page-container"><h1>Attendance</h1><p>The class could not be loaded.</p></div>;

  return (
    <section className="page-container session-attendance">
      <header className="session-attendance__header">
        <div>
          <h1>Attendance check-in</h1>
          <p>Manage the session, student check-ins and attendance corrections.</p>
        </div>
        {isStaff ? <Link to="/attendance">My classes</Link>
          : <Link className="session-attendance__button" to={`/live-classes?classId=${encodeURIComponent(klass.id)}&tab=sessions`}>Full timetable ↗</Link>}
      </header>

      {!isStaff && <AttendanceWeeklyEmailOutbox key={klass.id} classes={[klass]} sessionsByClass={{[klass.id]:sessions}} />}
      <article className="card session-attendance__card">
        <div className="session-attendance__header">
          <div>
            <h2>{klass.name}</h2>
            <p>{rows.length} {rows.length === 1 ? "student" : "students"} enrolled</p>
          </div>
          {selected && <span className="session-attendance__badge">{status}</span>}
        </div>
        {!classIsActive ? <div role="status" style={{ marginBottom: 12, padding: 12, border: "1px solid #cbd5e1", borderRadius: 8, background: "#f8fafc" }}>
          <strong>This class has finished.</strong> The official end date was {klass.endDate || "reached"}.
          No new check-in can be opened. Past sessions and saved attendance remain available for review.
        </div> : null}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={() => {
            const nextHistory = !showAttendanceHistory;
            setShowAttendanceHistory(nextHistory);
            if (!nextHistory) setSelectedId(chooseAttendanceSession(sessions, klass)?.id || "");
            else if (!selectedId) setSelectedId(sessions.at(-1)?.id || "");
          }}>{showAttendanceHistory ? "Show active check-ins" : "View past sessions"}</button>
          <small>{showAttendanceHistory ? "Historical attendance — not a live check-in" : "Only upcoming/live teaching sessions"}</small>
        </div>
        {sessionOptions.length ? <label className="session-attendance__selector">
          <strong>{showAttendanceHistory ? "Select historical session" : "Select session"}</strong>
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {sessionOptions.map((session) => <option key={session.id} value={session.id}>{lessonLabel(session, timezone)} · {session.status || "scheduled"}</option>)}
          </select>
        </label> : <p role="status">No active attendance check-ins remain for this class. Use View past sessions to inspect earlier records.</p>}

        {selected && dictionaryEntries.length ? <div className="session-attendance__lesson">
          <strong>{dictionaryLevel} lesson dictionary</strong>
          <SessionDictionaryPicker
            entries={dictionaryEntries}
            assignmentIds={selected?.assignmentIds?.length ? selected.assignmentIds : [assignmentId]}
            initiallyOpen
            disabled
          />
          {!isStaff && <Link to={`/live-classes?classId=${encodeURIComponent(klass.id)}&tab=repair`}>Override lesson and date</Link>}
        </div> : null}

        {selected ? <>
          <div className="session-attendance__summary">
            <div>
              <small>{new Intl.DateTimeFormat("en-GB", { timeZone: timezone, dateStyle: "full" }).format(asDate(selected.startsAt))}</small>
              <strong className="session-attendance__time">{startTime || "--:--"}–{endTime || "--:--"}</strong>
              <small>{timezone === TIMEZONE ? "Ghana time" : timezone}</small>
            </div>
            <div className="session-attendance__lesson">
              <small>Lesson</small>
              <strong>{assignmentId ? `${assignmentId} · ` : ""}{selected.topic || "Lesson details to be confirmed"}</strong>
            </div>
            {!isStaff && !isAppAssessment(selected) && selectedIsActiveCheckin ? <div className="session-attendance__actions">
              {!["completed", "live"].includes(status) && !sessionOpen ? <button type="button" disabled={sessionBusy || sendingReminder} onClick={() => setScheduleAction("reschedule")}>{status === "cancelled" ? "Reactivate lesson" : "Reschedule"}</button> : null}
              {!sessionLocked ? <button className="session-attendance__danger" type="button" disabled={sessionBusy || sendingReminder} onClick={() => setScheduleAction("cancel")}>Cancel class</button> : null}
            </div> : null}
          </div>
          {scheduleAction ? <LiveClassSessionEditor
            key={`${selected.id}:${scheduleAction}`}
            klass={klass}
            sessions={sessions}
            session={selected}
            initialAction={scheduleAction}
            adminId={user?.uid || user?.email || "admin"}
            onClose={() => setScheduleAction("")}
            onSaved={async message => {
              const dashboard = await getCompatibleClassDashboard(klass.id);
              setKlass(dashboard.klass);
              setSessions(dashboard.sessions);
              setAttendance(current => Object.fromEntries(dashboard.sessions.map(session => [
                session.id, { ...current[session.id], ...session, students: current[session.id]?.students || {} },
              ])));
              setSessionOpen(false);
              setScheduleAction("");
              success(message);
            }}
          /> : null}
        </> : null}

        {selected && !isAppAssessment(selected) && selectedIsActiveCheckin && <div className="session-attendance__tools">
          <section className="session-attendance__panel">
            <div className="session-attendance__header">
              <h3>Student QR check-in</h3>
              <span className="session-attendance__badge" data-closed={!sessionOpen}>{sessionOpen ? "Open" : "Closed"}</span>
            </div>
            <div className="session-attendance__actions">
              <button type="button" className="session-attendance__primary" disabled={sessionBusy || sessionOpen || !assignmentId || !isToday || sessionLocked} onClick={() => changeCheckin("open")}>{sessionBusy && !sessionOpen ? "Opening…" : "Open check-in"}</button>
              <button type="button" disabled={sessionBusy || !sessionOpen} onClick={() => changeCheckin("close")}>{sessionBusy && sessionOpen ? "Closing…" : "Close check-in"}</button>
              <button type="button" disabled={sessionBusy || sessionLocked || sendingReminder} onClick={() => changeCheckin("end")}>End class &amp; mark complete</button>
            </div>
            <div className="session-attendance__actions">
              <a href={displayUrl} target="_blank" rel="noreferrer">Open Full-Screen QR Page ↗</a>
              <button type="button" onClick={refreshCheckins}>Refresh check-ins</button>
            </div>
            {!isStaff && sessionOpen && checkinUrl && <div className="session-attendance__actions">
              <button type="button" className="session-attendance__primary" disabled={sendingCheckinInvitation || sessionBusy || !hasReminderRecipients} onClick={sendCheckinInvitation}>
                {sendingCheckinInvitation ? "Sending invitations…" : "Send check-in invitation emails"}
              </button>
              <small>Uses the existing Calender Apps Script. Sends only to enrolled students and skips duplicates.</small>
              {checkinEmailDiagnostic ? <div role="status" style={{ width: "100%", overflowWrap: "anywhere", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}><strong>Email delivery diagnostic:</strong> {checkinEmailDiagnostic}</div> : null}
            </div>}
            {sessionOpen && checkinUrl && <div className="session-attendance__qr">
              <QRCodeCanvas value={checkinUrl} size={170} />
              <a href={checkinUrl} target="_blank" rel="noreferrer">Open student check-in link ↗</a>
            </div>}
          </section>

          {!isStaff && <section className="session-attendance__panel">
            <h3>Backup class reminder</h3>
            <p>{sessionLocked ? "Reminders are available for scheduled and live sessions." : hasReminderRecipients ? "Use this when the automatic reminder didn’t go out." : "There are no enrolled students with an email address."}</p>
            <button type="button" className="session-attendance__button" disabled={!hasReminderRecipients || sessionLocked || sessionBusy || sendingReminder || Boolean(scheduleAction)} onClick={sendClassReminder}>
              {sendingReminder ? "Sending reminder…" : "Send class reminder"}
            </button>
          </section>}
        </div>}
        {selected && !isAppAssessment(selected) && (slidesUrl || lessonLinks.length > 0) ? <div className="session-attendance__actions">
          {slidesUrl && <a href={slidesUrl} target="_blank" rel="noopener noreferrer">Open slides</a>}
          {lessonLinks.map(({ assignmentId: linkedAssignment, url, label }) => <a key={`${linkedAssignment}:${url}`} href={url} target="_blank" rel="noopener noreferrer">{label}</a>)}
        </div> : null}
      </article>

      {selected && isAppAssessment(selected) ? <article className="card"><h2>App Assessment · No live class</h2><p>Students complete all three speaking parts with the Falowen AI examiner in the app. Progress and saved results appear in their assignment. This day is excluded from live attendance.</p>{lessonLinks.map(({ url, label }) => <a key={url} href={url} target="_blank" rel="noopener noreferrer">{label}</a>)}</article> : selected ? <>
        <article className="card session-attendance__card">
          <div className="session-attendance__header"><h2>Students</h2><span>Present: {present} · Absent: {rows.length - present}</span></div>
          {rows.length ? <div className="session-attendance__roster">{rows.map((row) => (
            <div key={row.code} className="session-attendance__student">
              <div><strong>{row.name || row.code}</strong><small>{row.code}</small></div>
              <button type="button" onClick={() => mark(row.code, true)} aria-pressed={row.present}>Present</button>
              <button type="button" onClick={() => mark(row.code, false)} aria-pressed={!row.present}>Absent</button>
            </div>
          ))}</div> : <p>No active students were found. Confirm the student's class in Student Directory.</p>}
          <button style={{ marginTop: 14 }} disabled={saving || !rows.length} onClick={save}>{saving ? "Saving…" : "Save attendance"}</button>
        </article>
      </> : <p>No active check-in session is available. Past attendance records can be opened using View past sessions.</p>}
    </section>
  );
}
