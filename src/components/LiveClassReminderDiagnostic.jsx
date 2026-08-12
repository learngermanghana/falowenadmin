import { useEffect, useMemo, useState } from "react";
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

export default function LiveClassReminderDiagnostic({ classId = "", dashboard = null }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkedAt, setCheckedAt] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    if (!classId || !dashboard?.klass) {
      setStudents([]);
      setError("");
      return () => { active = false; };
    }
    setLoading(true);
    setError("");
    listStudentsByClass(classId, {
      className: dashboard.klass?.name || dashboard.klass?.className || "",
    })
      .then((rows) => {
        if (!active) return;
        setStudents(rows);
        setCheckedAt(new Date());
      })
      .catch((err) => {
        if (!active) return;
        setStudents([]);
        setError(err?.message || "Could not load the class roster for reminder diagnostics.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [classId, dashboard?.klass?.name, dashboard?.klass?.className]);

  const diagnostic = useMemo(() => buildClassReminderDiagnostic({
    klass: dashboard?.klass || {},
    sessions: dashboard?.sessions || [],
    students,
    now: checkedAt,
  }), [dashboard, students, checkedAt]);

  if (!dashboard) return null;

  return (
    <section style={{ display: "grid", gap: 7, padding: 12, borderRadius: 10, background: "#eff6ff", border: "1px solid #93c5fd", color: "#1e3a8a" }}>
      <strong>Class reminder diagnostic</strong>
      {loading ? <div>Checking reminder eligibility and student matching…</div> : null}
      {error ? <div role="alert" style={{ color: "#991b1b" }}>{error}</div> : null}
      {!loading ? (
        <>
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
            <div>The class/session/roster checks pass. If mail still does not send during the 30- or 10-minute window, inspect the server reminder worker/webhook delivery next.</div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
