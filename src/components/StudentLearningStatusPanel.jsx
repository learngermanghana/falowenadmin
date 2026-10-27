import { resolveStudentLearningStatus } from "../utils/studentAttention";

const fmtDateTime = (value) => {
  if (!value) return "Not synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not synced";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const metricBox = {
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: 10,
  background: "#fff",
  display: "grid",
  gap: 3,
};

export default function StudentLearningStatusPanel({ student }) {
  if (!student) return null;
  const status = resolveStudentLearningStatus(student);

  const lessonLabel = [
    status.level,
    status.currentDay ? `Day ${status.currentDay}` : "",
    status.currentLesson,
  ].filter(Boolean).join(" · ") || "Not synced";

  return (
    <section
      data-student-learning-status
      style={{
        marginBottom: 16,
        border: "1px solid #bfdbfe",
        borderRadius: 14,
        padding: 14,
        background: "linear-gradient(135deg, #eff6ff, #ffffff)",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "start" }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>Learning status</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
            Read-only summary from data already synced to the student record. No intervention write is created here.
          </p>
        </div>
        <span
          style={{
            borderRadius: 999,
            padding: "5px 9px",
            fontSize: 12,
            fontWeight: 800,
            background: status.attention ? "#fff7ed" : "#f0fdf4",
            color: status.attention ? "#c2410c" : "#166534",
            border: status.attention ? "1px solid #fdba74" : "1px solid #86efac",
          }}
        >
          {status.attention ? status.primaryReason?.label || "Needs attention" : "No attention flag"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        <div style={metricBox}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Current lesson</span>
          <strong style={{ fontSize: 13 }}>{lessonLabel}</strong>
          {status.currentSection ? <small style={{ color: "#64748b" }}>Section: {status.currentSection}</small> : null}
        </div>
        <div style={metricBox}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Last learning activity</span>
          <strong style={{ fontSize: 13 }}>{fmtDateTime(status.activity.lastActivityAt)}</strong>
          {status.activity.inactiveDays !== null ? (
            <small style={{ color: "#64748b" }}>{status.activity.inactiveDays} day(s) ago</small>
          ) : null}
        </div>
        <div style={metricBox}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Latest score</span>
          <strong style={{ fontSize: 13 }}>{status.latestScore !== null ? `${Math.round(status.latestScore)}%` : "Not synced"}</strong>
        </div>
        <div style={metricBox}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Attendance</span>
          <strong style={{ fontSize: 13 }}>{status.attendanceRate !== null ? `${Math.round(status.attendanceRate)}%` : "Not synced"}</strong>
        </div>
        <div style={metricBox}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Course completion</span>
          <strong style={{ fontSize: 13 }}>{status.completionPercent !== null ? `${Math.round(status.completionPercent)}%` : "Not synced"}</strong>
        </div>
        <div style={metricBox}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Tutor review</span>
          <strong style={{ fontSize: 13 }}>
            {status.awaitingReview > 0
              ? `${status.awaitingReview} waiting`
              : status.reviewStatus
                ? status.reviewStatus.replace(/_/g, " ")
                : "No synced review flag"}
          </strong>
        </div>
      </div>

      {status.reasons.length ? (
        <div style={{ display: "grid", gap: 6 }}>
          <strong style={{ fontSize: 13 }}>Why this student needs attention</strong>
          {status.reasons.map((reason) => (
            <div
              key={reason.key}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: 2,
                borderLeft: "3px solid #f59e0b",
                padding: "7px 9px",
                background: "#fffbeb",
                borderRadius: 8,
              }}
            >
              <strong style={{ fontSize: 12 }}>{reason.label}</strong>
              <span style={{ color: "#64748b", fontSize: 12 }}>{reason.helper}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
          No supported learning-risk signal is currently present on this student record.
        </p>
      )}
    </section>
  );
}
