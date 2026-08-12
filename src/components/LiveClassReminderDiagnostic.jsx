import { useEffect, useMemo, useState } from "react";
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";
import { listClassCohorts } from "../services/liveClassService.js";
import { listStudentsByClass } from "../services/studentsService.js";
import { buildClassReminderDiagnostic } from "../utils/liveClassReminderDiagnostic.js";

function formatDateTime(value) {
  if (!value) return "No future session";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";
  return parsed.toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function windowLabel(value) {
  const labels = {
    "pending-30min": "30-minute reminder pending",
    "30min-window": "30-minute reminder window is active",
    "pending-10min": "30-minute window passed; 10-minute reminder pending",
    "10min-window": "10-minute reminder window is active",
    "reminder-windows-passed": "Both reminder windows have passed",
    started: "Session has already started",
    "no-future-session": "No future active session found",
    "invalid-time": "Session time is invalid",
  };
  return labels[value] || value || "Unknown";
}

export default function LiveClassReminderDiagnostic() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkedAt, setCheckedAt] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    listClassCohorts()
      .then((rows) => {
        if (!active) return;
        setClasses(rows);
        const remembered = window.localStorage.getItem("falowen-live-class-repair-class-id") || "";
        const nextId = rows.some((item) => item.id === remembered) ? remembered : rows[0]?.id || "";
        setClassId(nextId);
      })
      .catch((err) => {
        if (active) setError(err?.message || "Could not load classes for reminder diagnostics.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!classId) {
      setDashboard(null);
      setStudents([]);
      return () => { active = false; };
    }
    setLoading(true);
    setError("");
    (async () => {
      try {
        const nextDashboard = await getCompatibleClassDashboard(classId);
        const className = nextDashboard.klass?.name || nextDashboard.klass?.className || "";
        const rows = await listStudentsByClass(classId, { className });
        if (!active) return;
        setDashboard(nextDashboard);
        setStudents(rows);
        setCheckedAt(new Date());
      } catch (err) {
        if (!active) return;
        setDashboard(null);
        setStudents([]);
        setError(err?.message || "Could not run the class reminder diagnostic.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [classId]);

  const diagnostic = useMemo(() => buildClassReminderDiagnostic({
    klass: dashboard?.klass || {},
    sessions: dashboard?.sessions || [],
    students,
    now: checkedAt,
  }), [dashboard, students, checkedAt]);

  return (
    <section className="card" style={{ display: "grid", gap: 9, marginBottom: 16, border: "2px solid #60a5fa", background: "#eff6ff", color: "#1e3a8a" }}>
      <div>
        <h2 style={{ marginBottom: 6 }}>Class reminder diagnostic</h2>
        <p style={{ margin: 0 }}>Checks the next session, reminder suppression, roster matching and the 30/10-minute reminder windows.</p>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <strong>Class to diagnose</strong>
        <select value={classId} onChange={(event) => setClassId(event.target.value)} disabled={loading}>
          <option value="">Select a class</option>
          {classes.map((klass) => (
            <option key={klass.id} value={klass.id}>{klass.name || klass.className || klass.id}</option>
          ))}
        </select>
      </label>

      {loading ? <div>Checking reminder eligibility and student matching…</div> : null}
      {error ? <div role="alert" style={{ color: "#991b1b" }}>{error}</div> : null}
      {!loading && dashboard ? (
        <div style={{ display: "grid", gap: 7, padding: 12, borderRadius: 9, background: "#fff", border: "1px solid #93c5fd", color: "#1f2937" }}>
          <div>Next session: <strong>{formatDateTime(diagnostic.nextStartsAt)}</strong></div>
          <div>Session reminder eligible: <strong>{diagnostic.eligible ? "Yes" : "No"}</strong></div>
          <div>Suppression: <strong>{diagnostic.suppressionReason || "None"}</strong></div>
          <div>Active matching students: <strong>{diagnostic.activeStudentCount}</strong></div>
          <div>Reminder timing: <strong>{windowLabel(diagnostic.reminderWindow)}</strong></div>
          <div>Timetable health: <strong>{diagnostic.timetableHealth || "unknown"}</strong></div>
          {diagnostic.warningCodes.length ? <div>Health codes: <strong>{diagnostic.warningCodes.join(", ")}</strong></div> : null}
          {!diagnostic.hasRecipients ? (
            <div style={{ color: "#991b1b" }}><strong>Likely cause:</strong> no active students matched this class record. Check student classId/className/group/cohort values.</div>
          ) : null}
          {diagnostic.hasRecipients && !diagnostic.eligible ? (
            <div style={{ color: "#991b1b" }}><strong>Likely cause:</strong> the next session is being excluded by its status or reminder suppression fields.</div>
          ) : null}
          {diagnostic.hasRecipients && diagnostic.eligible ? (
            <div>The class/session/roster checks pass. If mail still does not send during the 30- or 10-minute window, the next place to inspect is the server reminder worker/webhook delivery.</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
