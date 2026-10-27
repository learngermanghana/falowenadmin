import { Link } from "react-router-dom";

function formatDateTime(value) {
  if (!value) return "Not checked yet";
  const parsed = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not checked yet";
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

function statusTheme(status) {
  if (status === "broken") {
    return {
      background: "#fef2f2",
      border: "#fca5a5",
      color: "#991b1b",
      badge: "#fee2e2",
    };
  }
  if (status === "warning") {
    return {
      background: "#fffbeb",
      border: "#fcd34d",
      color: "#92400e",
      badge: "#fef3c7",
    };
  }
  return {
    background: "#ecfdf5",
    border: "#86efac",
    color: "#166534",
    badge: "#dcfce7",
  };
}

function Metric({ label, value }) {
  return (
    <div style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 3 }}>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

export default function ScheduleHealthPanel({
  health,
  klass = {},
  busy = false,
  onValidate,
} = {}) {
  if (!health) return null;
  const theme = statusTheme(health.status);
  const counts = health.counts || {};
  const persistedStatus = String(klass.timetableIntegrityStatus || "").trim().toLowerCase();
  const reminderPaused = health.status === "broken"
    || klass.scheduleRemindersSuppressed === true
    || klass.remindersSuppressed === true;
  const findings = health.findings || [];

  return (
    <article style={{ display: "grid", gap: 14, padding: 16, borderRadius: 12, background: theme.background, border: `2px solid ${theme.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0 }}>Schedule Health</h2>
          <p style={{ margin: "6px 0 0", color: theme.color }}>
            The timetable is checked for session count, duplicate or overlapping times, curriculum order, curriculum metadata and class end-date consistency.
          </p>
        </div>
        <span style={{ padding: "7px 12px", borderRadius: 999, background: theme.badge, color: theme.color, fontWeight: 800 }}>
          {health.label}
        </span>
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))" }}>
        <Metric label="Visible / required" value={`${health.actualCount || 0} / ${health.expectedCount || 0}`} />
        <Metric label="Duplicate times" value={counts.duplicateTimes || 0} />
        <Metric label="Overlaps" value={counts.overlaps || 0} />
        <Metric label="Missing lessons" value={counts.missingLessons || 0} />
        <Metric label="Order errors" value={counts.outOfOrder || 0} />
        <Metric label="End-date mismatch" value={counts.endDateMismatch || 0} />
        <Metric label="Curriculum metadata" value={counts.curriculumMetadata || 0} />
        <Metric label="Derived end date" value={health.derivedEndDate || "Not available"} />
      </div>

      <div style={{ padding: 11, borderRadius: 9, background: "#fff", border: `1px solid ${theme.border}` }}>
        <strong>{reminderPaused ? "Future reminders paused" : "Future reminders active"}</strong>
        <p style={{ margin: "5px 0 0", color: "#475569" }}>
          {reminderPaused
            ? "The class has a Broken timetable. Future session reminders stay paused until the timetable is repaired and health is checked again."
            : health.status === "warning"
              ? "Warnings do not stop reminders, but they should be corrected before the next timetable change."
              : "The timetable is healthy, so scheduled reminders can continue normally."}
        </p>
      </div>

      {findings.length ? (
        <div style={{ padding: 12, borderRadius: 9, background: "#fff", border: `1px solid ${theme.border}` }}>
          <strong>What needs attention</strong>
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {findings.slice(0, 8).map((finding, index) => (
              <div key={`${finding.code}-${finding.sessionId || finding.sessionNumber || index}`}>
                <code>{finding.code}</code>: {finding.message}
              </div>
            ))}
            {findings.length > 8 ? <small>Plus {findings.length - 8} more finding(s).</small> : null}
          </div>
        </div>
      ) : (
        <div style={{ padding: 12, borderRadius: 9, background: "#fff", border: "1px solid #86efac", color: "#166534" }}>
          No timetable problems were found.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <small>
          Last saved validation: {formatDateTime(klass.timetableIntegrityValidatedAt)}
          {persistedStatus ? ` · Saved status: ${persistedStatus}` : ""}
        </small>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {health.status === "broken" ? <Link to="/live-classes">Review sessions</Link> : null}
          <button type="button" onClick={onValidate} disabled={busy || typeof onValidate !== "function"}>
            {busy ? "Checking schedule…" : "Check and save health"}
          </button>
        </div>
      </div>
    </article>
  );
}
