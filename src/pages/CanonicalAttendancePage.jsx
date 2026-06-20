import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import { listStudentsByClass } from "../services/studentsService";
import {
  listSessionCheckins,
  loadAttendanceFromFirestore,
  saveCanonicalAttendanceSession,
} from "../services/attendanceService";
import { getClassDashboard, resolveClassCohort } from "../services/liveClassService.js";

const GHANA_TIMEZONE = "Africa/Accra";

function normalizeApiBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function resolveOpenSessionApiUrl() {
  const explicitUrl = String(import.meta.env.VITE_OPEN_SESSION_API_URL || "").trim();
  if (explicitUrl) return explicitUrl;
  const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (apiBaseUrl) return `${apiBaseUrl}/openSession`;
  throw new Error("Missing check-in API configuration. Set VITE_OPEN_SESSION_API_URL or VITE_API_BASE_URL.");
}

function studentCode(student = {}) {
  return String(student.studentCode || student.studentcode || student.uid || student.id || "").trim();
}

function buildStudentTemplate(students = []) {
  return Object.fromEntries(
    students
      .map((student) => {
        const code = studentCode(student);
        if (!code) return null;
        return [code, {
          name: String(student.name || "").trim(),
          email: String(student.email || "").trim(),
          present: false,
        }];
      })
      .filter(Boolean),
  );
}

function mergeStudents(template = {}, saved = {}) {
  return Object.fromEntries(
    Object.entries(template).map(([code, student]) => [
      code,
      {
        ...student,
        present: Boolean(saved?.[code]?.present),
        email: student.email || String(saved?.[code]?.email || "").trim(),
      },
    ]),
  );
}

function dateParts(value) {
  if (!value) return { date: "-", time: "-" };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: String(value), time: "-" };
  return {
    date: new Intl.DateTimeFormat("en-GB", {
      timeZone: GHANA_TIMEZONE,
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsed),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: GHANA_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parsed),
  };
}

function sessionLabel(session, klass) {
  const starts = dateParts(session?.startsAt);
  const assignments = (session?.assignmentIds || []).join(", ");
  const detail = String(session?.topic || assignments || klass?.name || "").trim();
  return `${starts.date} · ${starts.time}${detail ? ` · ${detail}` : ""}`;
}

export default function CanonicalAttendancePage() {
  const { classId: routeClassId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [klass, setKlass] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendanceBySession, setAttendanceBySession] = useState({});
  const [selectedSessionId, setSelectedSessionId] = useState(searchParams.get("session") || "");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const resolvedClass = await resolveClassCohort(decodeURIComponent(routeClassId || ""));
        if (!resolvedClass) throw new Error("This class has not been created in Live Classes yet.");

        const [dashboard, students, storedAttendance] = await Promise.all([
          getClassDashboard(resolvedClass.id),
          listStudentsByClass(resolvedClass.name),
          loadAttendanceFromFirestore(resolvedClass.id),
        ]);
        if (!active) return;

        const template = buildStudentTemplate(students);
        const attendanceMap = Object.fromEntries(
          dashboard.sessions.map((session) => {
            const saved = storedAttendance[session.id] || {};
            return [session.id, {
              ...session,
              assignmentIds: session.assignmentIds || session.chapterIds || saved.assignmentIds || [],
              students: mergeStudents(template, saved.students || {}),
            }];
          }),
        );

        setKlass(dashboard.klass);
        setSessions(dashboard.sessions);
        setAttendanceBySession(attendanceMap);
        setSelectedSessionId((current) => {
          if (current && attendanceMap[current]) return current;
          if (dashboard.nextSession?.id && attendanceMap[dashboard.nextSession.id]) return dashboard.nextSession.id;
          return dashboard.sessions.find((session) => session.status !== "cancelled")?.id || dashboard.sessions[0]?.id || "";
        });
      } catch (e) {
        error(e?.message || "Could not load live-class attendance");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [routeClassId, error]);

  useEffect(() => {
    if (!selectedSessionId) return;
    setSearchParams({ session: selectedSessionId }, { replace: true });
    setSessionOpen(false);
  }, [selectedSessionId, setSearchParams]);

  const selectedSession = attendanceBySession[selectedSessionId] || null;
  const isCancelled = selectedSession?.status === "cancelled";
  const isCompleted = selectedSession?.status === "completed";
  const assignmentId = String(selectedSession?.assignmentIds?.[0] || "").trim();

  const rows = useMemo(() => Object.entries(selectedSession?.students || {})
    .map(([code, student]) => ({ code, ...student }))
    .sort((a, b) => String(a.name || a.code).localeCompare(String(b.name || b.code))), [selectedSession]);

  const summary = useMemo(() => {
    const present = rows.filter((row) => row.present).length;
    return { present, absent: rows.length - present };
  }, [rows]);

  const checkinUrl = useMemo(() => {
    if (!klass || !selectedSession) return "";
    const startsAt = String(selectedSession.startsAt || "");
    const qs = new URLSearchParams({
      classId: klass.id,
      sessionId: selectedSession.id,
      date: startsAt.includes("T") ? startsAt.slice(0, 10) : startsAt,
      sessionLabel: sessionLabel(selectedSession, klass),
      assignmentId,
      startTime: dateParts(selectedSession.startsAt).time,
      endTime: dateParts(selectedSession.endsAt).time,
      expectedStudents: rows.map((row) => row.name).filter(Boolean).slice(0, 15).join(", "),
      expectedCount: String(rows.length),
    }).toString();
    return `${window.location.origin}/checkin?${qs}`;
  }, [assignmentId, klass, rows, selectedSession]);

  function markStudent(code, present) {
    if (isCancelled) return;
    setAttendanceBySession((current) => ({
      ...current,
      [selectedSessionId]: {
        ...current[selectedSessionId],
        students: {
          ...current[selectedSessionId].students,
          [code]: { ...current[selectedSessionId].students[code], present },
        },
      },
    }));
    info(`${selectedSession.students[code]?.name || code} marked ${present ? "present" : "absent"}.`);
  }

  async function refreshCheckins() {
    if (!klass || !selectedSession) return;
    try {
      const checkins = await listSessionCheckins({ classId: klass.id, sessionId: selectedSession.id });
      if (!checkins.length) {
        info("No student check-ins found yet.");
        return;
      }
      setAttendanceBySession((current) => {
        const next = { ...current };
        const students = { ...(next[selectedSessionId]?.students || {}) };
        checkins.forEach((checkin) => {
          const code = String(checkin.studentCode || checkin.uid || checkin.id || "").trim();
          if (students[code]) students[code] = { ...students[code], present: true };
        });
        next[selectedSessionId] = { ...next[selectedSessionId], students };
        return next;
      });
      success("Student check-ins refreshed.");
    } catch (e) {
      error(e?.message || "Could not refresh check-ins");
    }
  }

  async function saveAttendance() {
    if (!klass || !selectedSession) return;
    if (isCancelled) {
      error("Attendance cannot be marked for a cancelled class.");
      return;
    }
    setSaving(true);
    try {
      await saveCanonicalAttendanceSession({
        classRecordId: klass.id,
        className: klass.name,
        session: selectedSession,
        students: selectedSession.students,
        markedBy: user?.uid,
      });
      success("Attendance saved against the live-class session.");
    } catch (e) {
      error(e?.message || "Attendance save failed");
    } finally {
      setSaving(false);
    }
  }

  async function changeCheckin(action) {
    if (!klass || !selectedSession || isCancelled) return;
    if (action === "open" && !assignmentId) {
      error("Assign a curriculum ID to this session in Live Classes before opening check-in.");
      return;
    }
    setSessionBusy(true);
    try {
      const token = await user.getIdToken();
      const startsAt = String(selectedSession.startsAt || "");
      const response = await fetch(resolveOpenSessionApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          classId: klass.id,
          sessionId: selectedSession.id,
          date: startsAt.includes("T") ? startsAt.slice(0, 10) : startsAt,
          sessionLabel: sessionLabel(selectedSession, klass),
          assignmentId,
          topic: selectedSession.topic || klass.name,
          chapter: assignmentId.split("-").slice(1).join("-"),
          windowMinutes: 180,
          action,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Failed to ${action} check-in`);
      setSessionOpen(action === "open");
      success(`Check-in ${action === "open" ? "opened" : "closed"}.`);
    } catch (e) {
      error(e?.message || `Could not ${action} check-in`);
    } finally {
      setSessionBusy(false);
    }
  }

  if (loading) return <div className="page-container">Loading session attendance…</div>;
  if (!klass) return <div className="page-container"><h1>Session Attendance</h1><p>Create or migrate the class in <Link to="/live-classes">Live Classes</Link> first.</p></div>;

  const start = dateParts(selectedSession?.startsAt);
  const end = dateParts(selectedSession?.endsAt);

  return (
    <section className="page-container" style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1>Session Attendance</h1>
          <p><strong>{klass.name}</strong> · Dates and status come directly from Live Classes.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Link to="/live-classes">Manage schedule</Link>
          <Link to="/attendance">Legacy attendance</Link>
        </div>
      </div>

      <article className="card">
        <label style={{ display: "grid", gap: 6 }}>
          <strong>Class session</strong>
          <select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {sessionLabel(session, klass)} · {session.status}
              </option>
            ))}
          </select>
        </label>
      </article>

      {selectedSession ? (
        <>
          <article className="card" style={{ borderColor: isCancelled ? "#ef4444" : "#cbd5e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ marginTop: 0 }}>{selectedSession.topic || "Live class session"}</h2>
                <p>{start.date} · {start.time}–{end.time} Ghana time</p>
                <p>Curriculum: {(selectedSession.assignmentIds || []).join(", ") || "Not assigned"}</p>
              </div>
              <strong style={{ textTransform: "uppercase", color: isCancelled ? "#b91c1c" : isCompleted ? "#166534" : "#1d4ed8" }}>
                {selectedSession.status}
              </strong>
            </div>
            {isCancelled ? (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12 }}>
                <strong>No attendance is required.</strong>
                <div>{selectedSession.cancellationReason || "This class session was cancelled in Live Classes."}</div>
              </div>
            ) : null}
          </article>

          {!isCancelled ? (
            <article className="card">
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <strong>Student QR check-in</strong>
                <button disabled={sessionBusy || sessionOpen || !assignmentId || isCompleted} onClick={() => changeCheckin("open")}>Open check-in</button>
                <button disabled={sessionBusy || !sessionOpen} onClick={() => changeCheckin("close")}>Close check-in</button>
                <button type="button" onClick={refreshCheckins}>Refresh check-ins</button>
                <span style={{ marginLeft: "auto" }}>{sessionOpen ? "OPEN" : "CLOSED"}</span>
              </div>
              {sessionOpen && checkinUrl ? (
                <div style={{ marginTop: 14, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <QRCodeCanvas value={checkinUrl} size={170} />
                  <a href={checkinUrl} target="_blank" rel="noreferrer">Open student check-in link</a>
                </div>
              ) : null}
            </article>
          ) : null}

          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>Students</h2>
              <span>Present: {summary.present} · Absent: {summary.absent}</span>
            </div>
            {rows.length ? (
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {rows.map((row) => (
                  <div key={row.code} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <strong>{row.name || row.code}</strong>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{row.code}{row.email ? ` · ${row.email}` : ""}</div>
                    </div>
                    <button disabled={isCancelled} onClick={() => markStudent(row.code, true)} style={{ background: row.present ? "#166534" : undefined, color: row.present ? "white" : undefined }}>Present</button>
                    <button disabled={isCancelled} onClick={() => markStudent(row.code, false)} style={{ background: !row.present ? "#6b7280" : undefined, color: !row.present ? "white" : undefined }}>Absent</button>
                  </div>
                ))}
              </div>
            ) : <p>No students were found under the class name “{klass.name}”.</p>}
            <button style={{ marginTop: 14 }} disabled={saving || isCancelled || !rows.length} onClick={saveAttendance}>
              {saving ? "Saving…" : "Save attendance"}
            </button>
          </article>
        </>
      ) : <p>No generated sessions exist for this class.</p>}
    </section>
  );
}
