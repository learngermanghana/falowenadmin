import { Link } from "react-router-dom";
import SessionDictionaryPicker from "./SessionDictionaryPicker.jsx";
import {
  scheduleSlotsLabel,
  sessionScheduleCheck,
  sessionTimeRange,
} from "../utils/liveClassSessionDisplay.js";

function normalize(value) {
  return String(value || "").trim();
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

function lessonLabel(session = {}) {
  const day = Number(session.curriculumDay);
  if (Number.isInteger(day) && day >= 0) return `Day ${day}`;
  const index = Number(session.curriculumIndex);
  if (Number.isInteger(index) && index > 0) return `Lesson ${index}`;
  return "Class session";
}

const badgeBase = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "5px 9px",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
};

const actionStyle = {
  minHeight: 44,
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "10px 12px",
  borderRadius: 9,
  boxSizing: "border-box",
  fontWeight: 750,
  textDecoration: "none",
};

export default function LiveClassSessionsPanel({
  sessions = [],
  scheduleRules = [],
  timezone = "Africa/Accra",
  classId = "",
  selectedClassId = "",
  dictionaryEntries = [],
  busy = false,
  sessionChange = null,
  onSaveDictionarySelection,
  onSessionAction,
  onOpenSessionChange,
  renderSessionChangeForm,
}) {
  if (!sessions.length) {
    return <p>No sessions were found for this class record. Open Class &amp; settings and save the timetable to generate them.</p>;
  }

  const timetableLabel = scheduleSlotsLabel(scheduleRules);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ padding: 12, borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a" }}>
        <strong>Saved weekly timetable:</strong> {timetableLabel}
        <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>Each card shows the weekday prominently. Red warnings identify dates or times outside this timetable.</div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {sessions.map((session) => {
          const status = normalize(session.status || "scheduled").toLowerCase();
          const contentLocked = ["cancelled", "completed"].includes(status);
          const changeLocked = status === "completed";
          const time = sessionTimeRange(session, timezone);
          const scheduleCheck = sessionScheduleCheck(session, scheduleRules, timezone);
          const changed = Boolean(session.rescheduledAt || session.previousStartsAt || session.rescheduleReason);
          const manualOverride = session.manualDateOverride === true;
          const attendanceClassId = classId || selectedClassId;

          return (
            <article
              key={session.id}
              style={{
                display: "grid",
                gap: 14,
                padding: 16,
                borderRadius: 14,
                border: scheduleCheck.valid ? "1px solid #dbe4f0" : "2px solid #ef4444",
                background: scheduleCheck.valid ? "#ffffff" : "#fff7f7",
                boxShadow: "0 5px 18px rgba(15, 23, 42, 0.06)",
                minWidth: 0,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, alignItems: "start" }}>
                <div style={{ display: "grid", gap: 6, padding: 14, borderRadius: 12, background: scheduleCheck.valid ? "#f8fafc" : "#fee2e2", border: scheduleCheck.valid ? "1px solid #e2e8f0" : "1px solid #fca5a5", minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", color: scheduleCheck.valid ? "#2563eb" : "#b91c1c", textTransform: "uppercase" }}>{time.start.weekday}</span>
                  <strong style={{ fontSize: 20, lineHeight: 1.2, color: "#0f172a" }}>{time.start.dateLabel}</strong>
                  <span style={{ fontSize: 18, fontWeight: 850, color: "#1e293b" }}>{time.label}</span>
                  <small style={{ color: "#64748b" }}>Ghana time</small>
                </div>

                <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ ...badgeBase, ...statusStyle(status) }}>{status}</span>
                    <span style={{ ...badgeBase, background: "#eef2ff", color: "#3730a3" }}>{lessonLabel(session)}</span>
                    {changed ? <span style={{ ...badgeBase, background: "#ffedd5", color: "#9a3412" }}>Rescheduled</span> : null}
                    {manualOverride ? <span style={{ ...badgeBase, background: "#fef3c7", color: "#92400e" }}>Manual override</span> : null}
                    {!scheduleCheck.valid ? <span style={{ ...badgeBase, background: "#dc2626", color: "#ffffff" }}>Timetable error</span> : null}
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Topic</div>
                    <div style={{ marginTop: 3, fontSize: 18, fontWeight: 800, lineHeight: 1.35, color: "#0f172a", overflowWrap: "anywhere" }}>{session.topic || "No topic"}</div>
                  </div>

                  {status === "cancelled" && session.cancellationReason ? <div style={{ padding: 10, borderRadius: 8, background: "#fee2e2", color: "#991b1b", overflowWrap: "anywhere" }}>{session.cancellationReason}</div> : null}
                  {changed && session.rescheduleReason ? <div style={{ fontSize: 13, color: "#475569", overflowWrap: "anywhere" }}><strong>Move reason:</strong> {session.rescheduleReason}</div> : null}
                </div>
              </div>

              {!scheduleCheck.valid ? (
                <div role="alert" style={{ padding: 12, borderRadius: 10, background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontWeight: 750 }}>
                  <strong>Check this session:</strong> {scheduleCheck.message}
                  <div style={{ marginTop: 4, fontSize: 13 }}>Allowed: {timetableLabel}</div>
                </div>
              ) : null}

              <div style={{ display: "grid", gap: 7, minWidth: 0 }}>
                <strong>Course content</strong>
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <SessionDictionaryPicker
                    entries={dictionaryEntries}
                    assignmentIds={curriculumIds(session)}
                    disabled={busy || contentLocked || !dictionaryEntries.length}
                    onChange={(nextIds) => onSaveDictionarySelection?.(session, nextIds)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 9 }}>
                <Link to={`/attendance/session/${attendanceClassId}?session=${encodeURIComponent(session.id)}`} style={{ ...actionStyle, border: "1px solid #93c5fd", background: "#eff6ff", color: "#1d4ed8" }}>Attendance</Link>
                <button type="button" style={actionStyle} disabled={busy || contentLocked} onClick={() => onSessionAction?.(session, "topic")}>Topic</button>
                <button type="button" style={actionStyle} disabled={busy || changeLocked} onClick={() => onOpenSessionChange?.(session)}>{sessionChange?.sessionId === session.id ? "Changing…" : status === "cancelled" ? "Move / reactivate" : "Change session"}</button>
                <button type="button" style={actionStyle} disabled={busy || contentLocked} onClick={() => onSessionAction?.(session, "complete")}>Complete</button>
              </div>

              {sessionChange?.sessionId === session.id ? renderSessionChangeForm?.(session) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
