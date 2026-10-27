import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import { listStudentsByClass } from "../services/studentsService.js";
import { loadAttendanceFromFirestore, saveCanonicalAttendanceSession } from "../services/attendanceService.js";
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

export default function CanonicalAttendancePageCompat() {
  const { classId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [klass, setKlass] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedId, setSelectedId] = useState("");

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
    if (selectedId) setSearchParams({ session: selectedId }, { replace: true });
  }, [selectedId, setSearchParams]);

  const selected = attendance[selectedId] || null;
  const rows = useMemo(() => Object.entries(selected?.students || {})
    .map(([code, student]) => ({ code, ...student }))
    .sort((a, b) => String(a.name || a.code).localeCompare(String(b.name || b.code))), [selected]);
  const present = rows.filter((row) => row.present).length;

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
        <article className="card"><h2 style={{ marginTop: 0 }}>{selected.topic || "Live class"}</h2><p>Curriculum: {selected.assignmentIds?.join(", ") || "Not assigned"}</p><p>Status: <strong>{selected.status || "scheduled"}</strong></p></article>
        <article className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h2 style={{ margin: 0 }}>Students</h2><span>Present: {present} · Absent: {rows.length - present}</span></div>
          {rows.length ? <div style={{ display: "grid", gap: 8, marginTop: 12 }}>{rows.map((row) => <div key={row.code} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, display: "flex", alignItems: "center", gap: 10 }}><div style={{ flex: 1 }}><strong>{row.name || row.code}</strong><div style={{ fontSize: 12, opacity: 0.75 }}>{row.code}{row.email ? ` · ${row.email}` : ""}</div></div><button onClick={() => mark(row.code, true)} style={{ background: row.present ? "#166534" : undefined, color: row.present ? "white" : undefined }}>Present</button><button onClick={() => mark(row.code, false)} style={{ background: !row.present ? "#6b7280" : undefined, color: !row.present ? "white" : undefined }}>Absent</button></div>)}</div> : <p>No active students were found. Confirm the student's Class name in Student Directory.</p>}
          <button style={{ marginTop: 14 }} disabled={saving || !rows.length} onClick={save}>{saving ? "Saving…" : "Save attendance"}</button>
        </article>
      </> : <p>No sessions were found for this class.</p>}
    </section>
  );
}
