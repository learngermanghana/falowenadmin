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
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";

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

function label(session, timezone = TIMEZONE) {
  const date = asDate(session?.startsAt);
  if (!date) return session?.topic || "Live class";
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
  return `${text} · ${session.topic || "Live class"}`;
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

function chooseSession(sessions, timezone, requestedId) {
  const today = localDate(new Date(), timezone);
  const requested = sessions.find((session) => session.id === requestedId);
  if (requested && localDate(requested.startsAt, timezone) === today) return requested;
  return sessions.find((session) => String(session.status || "").toLowerCase() !== "cancelled" && localDate(session.startsAt, timezone) === today)
    || sessions.find((session) => String(session.status || "").toLowerCase() !== "cancelled" && (asDate(session.startsAt)?.getTime() || 0) >= Date.now())
    || requested
    || sessions[0]
    || null;
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

export default function CanonicalAttendancePageCompat() {
  const { classId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [klass, setKlass] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedId, setSelectedId] = useState("");
  const [selectedEmailCodes, setSelectedEmailCodes] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const resolved = await resolveClassCohort(decodeURIComponent(classId));
        if (!resolved) throw new Error("Class not found in Live Classes.");
        const dashboard = await getCompatibleClassDashboard(resolved.id);
        const className = dashboard.klass.name || resolved.name || "";
        const [students, savedById, savedByName] = await Promise.all([
          listStudentsByClass(resolved.id, { className }),
          loadAttendanceFromFirestore(resolved.id).catch(() => ({})),
          className ? loadAttendanceFromFirestore(className).catch(() => ({})) : {},
        ]);
        if (!active) return;
        const saved = { ...savedByName, ...savedById };
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
        const timezone = dashboard.klass.timezone || TIMEZONE;
        const chosen = chooseSession(dashboard.sessions, timezone, searchParams.get("session") || "");
        setKlass(dashboard.klass);
        setSessions(dashboard.sessions);
        setAttendance(map);
        setSelectedId(chosen?.id || "");
      } catch (cause) {
        error(cause?.message || "Attendance could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [classId, error]);

  useEffect(() => {
    if (!selectedId) return;
    setSearchParams({ session: selectedId }, { replace: true });
    setSessionOpen(false);
    setSelectedEmailCodes([]);
  }, [selectedId, setSearchParams]);

  const selected = attendance[selectedId] || null;
  const timezone = klass?.timezone || TIMEZONE;
  const selectedDate = selected ? localDate(selected.startsAt, timezone) : "";
  const today = localDate(new Date(), timezone);
  const isToday = selectedDate === today;
  const assignmentId = String(selected?.assignmentIds?.[0] || selected?.assignment_id || "").trim();
  const sessionLabel = String(selected?.topic || klass?.name || "Live class").trim();
  const startTime = localTime(selected?.startsAt, timezone);
  const endTime = localTime(selected?.endsAt, timezone);
  const status = String(selected?.status || "scheduled").toLowerCase();
  const sessionLocked = status === "cancelled" || status === "completed";

  const rows = useMemo(() => Object.entries(selected?.students || {})
    .map(([code, student]) => ({ code, ...student }))
    .sort((a, b) => String(a.name || a.code).localeCompare(String(b.name || b.code))), [selected]);
  const present = rows.filter((row) => row.present).length;

  const expectedNames = useMemo(() => rows
    .map((row) => String(row.name || "").trim())
    .filter(Boolean)
    .slice(0, 15), [rows]);

  const checkinQuery = useMemo(() => new URLSearchParams({
    classId: String(klass?.id || ""),
    sessionId: String(selected?.id || ""),
    date: selectedDate,
    sessionLabel,
    assignmentId,
    startTime,
    endTime,
    expectedStudents: expectedNames.join(", "),
    expectedCount: String(rows.length),
  }).toString(), [assignmentId, endTime, expectedNames, klass?.id, rows.length, selected?.id, selectedDate, sessionLabel, startTime]);

  const checkinUrl = checkinQuery ? `${window.location.origin}/checkin?${checkinQuery}` : "";
  const displayUrl = checkinQuery ? `${window.location.origin}/checkin/display?${checkinQuery}` : "";

  const selectedEmailRows = useMemo(() => {
    const codes = new Set(selectedEmailCodes);
    return rows.filter((row) => codes.has(row.code) && row.email);
  }, [rows, selectedEmailCodes]);

  const backupMailto = useMemo(() => {
    const emails = selectedEmailRows.map((row) => row.email).filter(Boolean);
    if (!emails.length || !checkinUrl) return "";
    const subject = `Backup check-in link for ${klass?.name || "class"} (${sessionLabel})`;
    const body = [
      "Hi student,",
      "",
      "Please use this backup link to check in for the live class:",
      checkinUrl,
      "",
      `Class: ${klass?.name || ""}`,
      `Session: ${sessionLabel}`,
      `Date: ${selectedDate}`,
      "",
      "Thank you.",
    ].join("\n");
    return `mailto:${emails.join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [checkinUrl, klass?.name, selectedDate, selectedEmailRows, sessionLabel]);

  useEffect(() => {
    if (!klass?.id || !selectedId) return;
    let active = true;
    listSessionCheckins({ classId: klass.id, sessionId: selectedId })
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
  }, [klass?.id, selectedId]);

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
      const checkins = await listSessionCheckins({ classId: klass.id, sessionId: selectedId });
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
    if (!klass || !selected) return;
    setSessionBusy(true);
    try {
      if (action === "open") {
        if (!assignmentId) throw new Error("This session needs a curriculum ID before check-in can open.");
        if (!isToday) throw new Error(`Select today's session (${today}) before opening check-in.`);
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
          chapter: assignmentId.split("-").slice(1).join("-"),
          windowMinutes: 180,
          action: "open",
        } : {
          classId: klass.id,
          sessionId: selected.id,
          date: selectedDate,
          action: "close",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Failed to ${action} check-in`);
      setSessionOpen(action === "open");
      success(`Check-in ${action === "open" ? "opened" : "closed"}.`);
    } catch (cause) {
      error(sessionApiError(cause, action));
    } finally {
      setSessionBusy(false);
    }
  }

  async function save() {
    if (!klass || !selected) return;
    setSaving(true);
    try {
      await saveCanonicalAttendanceSession({
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

  function selectEmailTargets(mode) {
    setSelectedEmailCodes(rows
      .filter((row) => row.email && (mode === "all" || !row.present))
      .map((row) => row.code));
  }

  if (loading) return <div className="page-container">Loading attendance…</div>;
  if (!klass) return <div className="page-container"><h1>Attendance</h1><p>The class could not be loaded.</p></div>;

  return (
    <section className="page-container" style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><h1>Session Attendance</h1><p><strong>{klass.name}</strong> · {rows.length} student(s)</p></div>
        <Link to="/live-classes">Manage schedule</Link>
      </div>

      <article className="card">
        <label style={{ display: "grid", gap: 6 }}><strong>Class session</strong><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{sessions.map((session) => <option key={session.id} value={session.id}>{label(session, klass.timezone || TIMEZONE)} · {session.status || "scheduled"}</option>)}</select></label>
      </article>

      {selected ? <>
        <article className="card">
          <h2 style={{ marginTop: 0 }}>{selected.topic || "Live class"}</h2>
          <p>Curriculum: {assignmentId || "Not assigned"}</p>
          <p>Date and time: {selectedDate} · {startTime || "--:--"}–{endTime || "--:--"}</p>
          <p>Status: <strong>{selected.status || "scheduled"}</strong></p>
          {!isToday && !sessionLocked ? <div style={{ padding: 10, border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 8 }}>This is not today's session. Select the {today} session to open check-in.</div> : null}
        </article>

        <article className="card">
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <strong>Student QR Check-in</strong>
            <button disabled={sessionBusy || sessionOpen || !assignmentId || !isToday || sessionLocked} onClick={() => changeCheckin("open")}>{sessionBusy && !sessionOpen ? "Opening…" : "Open Check-in"}</button>
            <button disabled={sessionBusy || !sessionOpen} onClick={() => changeCheckin("close")}>{sessionBusy && sessionOpen ? "Closing…" : "Close Check-in"}</button>
            <button type="button" onClick={refreshCheckins}>Refresh Check-ins</button>
            <a href={displayUrl} target="_blank" rel="noreferrer">Open Full-Screen QR Page</a>
            <span style={{ marginLeft: "auto", fontSize: 12 }}>Status: <strong>{sessionOpen ? "OPEN" : "CLOSED"}</strong></span>
          </div>
          {sessionOpen && checkinUrl ? <div style={{ marginTop: 14, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}><div style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 10 }}><QRCodeCanvas value={checkinUrl} size={170} /><div style={{ maxWidth: 360, fontSize: 12, opacity: 0.8, marginTop: 8, wordBreak: "break-all" }}>{checkinUrl}</div></div></div> : null}
        </article>

        <article className="card">
          <strong>Backup Email Check-in Link</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button type="button" onClick={() => selectEmailTargets("all")}>Select all with email</button>
            <button type="button" onClick={() => selectEmailTargets("absent")}>Select absent with email</button>
            <button type="button" onClick={() => setSelectedEmailCodes([])}>Clear selection</button>
            {backupMailto ? <a href={backupMailto} role="button">Email selected students</a> : <button type="button" disabled>Email selected students</button>}
          </div>
          <div style={{ marginTop: 8, fontSize: 12 }}>Selected recipients: {selectedEmailRows.length}</div>
        </article>

        <article className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h2 style={{ margin: 0 }}>Students</h2><span>Present: {present} · Absent: {rows.length - present}</span></div>
          {rows.length ? <div style={{ display: "grid", gap: 8, marginTop: 12 }}>{rows.map((row) => <div key={row.code} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" checked={selectedEmailCodes.includes(row.code)} disabled={!row.email} onChange={(event) => setSelectedEmailCodes((current) => event.target.checked ? [...new Set([...current, row.code])] : current.filter((code) => code !== row.code))} aria-label={`Select ${row.name || row.code} for email`} /><div style={{ flex: 1 }}><strong>{row.name || row.code}</strong><div style={{ fontSize: 12, opacity: 0.75 }}>{row.code}{row.email ? ` · ${row.email}` : ""}</div></div><button onClick={() => mark(row.code, true)} style={{ background: row.present ? "#166534" : undefined, color: row.present ? "white" : undefined }}>Present</button><button onClick={() => mark(row.code, false)} style={{ background: !row.present ? "#6b7280" : undefined, color: !row.present ? "white" : undefined }}>Absent</button></div>)}</div> : <p>No active students were found. Confirm the student's Class name in Student Directory.</p>}
          <button style={{ marginTop: 14 }} disabled={saving || !rows.length} onClick={save}>{saving ? "Saving…" : "Save attendance"}</button>
        </article>
      </> : <p>No sessions were found for this class.</p>}
    </section>
  );
}
