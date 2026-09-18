export default function MarkingHistoryPanel({ submission = null }) {
  if (!submission) return null;
  const version = String(submission.markingRubricVersion || submission.raw?.markingRubricVersion || "").trim();
  const history = Array.isArray(submission.markingHistory)
    ? submission.markingHistory
    : Array.isArray(submission.raw?.markingHistory)
      ? submission.raw.markingHistory
      : [];

  if (!version && !history.length) return null;

  return (
    <div data-marking-history-panel="true" style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: 8, background: "#f8fafc", display: "grid", gap: 6, fontSize: 12 }}>
      {version ? <div>Current marking rubric: <b>{version}</b></div> : null}
      {history.length ? (
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>Previous marking results ({history.length})</summary>
          <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
            {[...history].reverse().map((item, index) => (
              <div key={String(item.savedAt || index)} style={{ borderTop: index ? "1px solid #e2e8f0" : "none", paddingTop: index ? 6 : 0 }}>
                <div>
                  Final: <b>{item.finalScore ?? "—"}</b>
                  {" · "}Writing: <b>{item.writingScore ?? "—"}</b>
                  {item.markingRubricVersion ? <>{" · "}Rubric: <b>{item.markingRubricVersion}</b></> : null}
                </div>
                {item.savedAt ? <div style={{ color: "#64748b" }}>{item.savedAt}</div> : null}
                {item.taskCompletion ? <div>Task: {item.taskCompletion.completed ?? 0}/{item.taskCompletion.total ?? 0}</div> : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
