export default function WritingScoreExplanation({ result = null }) {
  if (!result) return null;

  const evidence = Array.isArray(result.taskPointEvidence) ? result.taskPointEvidence : [];
  const dimensions = result.writingDimensions && typeof result.writingDimensions === "object" ? result.writingDimensions : null;
  const contradictions = Array.isArray(result.ai?.markingContradictions) ? result.ai.markingContradictions : [];
  const reviewReasons = Array.isArray(result.reviewReasons) && result.reviewReasons.length
    ? result.reviewReasons
    : contradictions.map((message) => ({ code: "marking_contradiction", message, source: "question_aware_writing" }));
  const corrections = (Array.isArray(result.corrections) ? result.corrections : [])
    .filter((item) => !item?.partId || String(item.partId).toLowerCase() === "teil2")
    .slice(0, 3);
  const task = result.ai?.questionAwareWritingTask || null;
  const completion = result.taskCompletion || null;
  const rubricVersion = result.markingRubricVersion || task?.rubricVersion || "";

  if (!evidence.length && !dimensions && !reviewReasons.length && !corrections.length && !rubricVersion) return null;

  const badge = (status) => {
    if (status === "met") return { label: "Met", background: "#f0fdf4", border: "#bbf7d0", color: "#166534" };
    if (status === "missing") return { label: "Missing", background: "#fff7ed", border: "#fed7aa", color: "#9a3412" };
    return { label: "Review", background: "#f8fafc", border: "#cbd5e1", color: "#475569" };
  };

  return (
    <section
      data-writing-score-explanation="true"
      style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, background: "#fff", display: "grid", gap: 10 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
        <strong>Why this writing score?</strong>
        {rubricVersion ? <span style={{ fontSize: 11, color: "#64748b" }}>Rubric: {rubricVersion}</span> : null}
      </div>

      {completion ? (
        <div style={{ fontSize: 13 }}>
          Task fulfilment: <b>{Number(completion.completed || 0)}/{Number(completion.total || 0)}</b>
          {result.writingScorePercent !== null && result.writingScorePercent !== undefined
            ? <> · Writing: <b>{Math.round(Number(result.writingScorePercent))}%</b></>
            : null}
        </div>
      ) : null}

      {dimensions ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: 6, fontSize: 12 }}>
          {dimensions.taskFulfilment !== null && dimensions.taskFulfilment !== undefined ? <span>Task fulfilment: <b>{dimensions.taskFulfilment}%</b></span> : null}
          {dimensions.languageControl !== null && dimensions.languageControl !== undefined ? <span>Language control: <b>{dimensions.languageControl}%</b></span> : null}
          {dimensions.coherence !== null && dimensions.coherence !== undefined ? <span>Coherence: <b>{dimensions.coherence}%</b></span> : null}
          {dimensions.registerAndTextType !== null && dimensions.registerAndTextType !== undefined ? <span>Register/text type: <b>{dimensions.registerAndTextType}%</b></span> : null}
        </div>
      ) : null}

      {task ? (
        <div style={{ fontSize: 12, color: "#475569" }}>
          Expected: <b>{task.textType || "writing"}</b>{task.register ? <> · Register: <b>{task.register}</b></> : null}
        </div>
      ) : null}

      {evidence.length ? (
        <div style={{ display: "grid", gap: 6 }}>
          {evidence.map((item, index) => {
            const state = badge(item.status);
            return (
              <div key={item.label || index} style={{ borderTop: index ? "1px solid #e2e8f0" : "none", paddingTop: index ? 6 : 0, display: "grid", gap: 3 }}>
                <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", fontSize: 12 }}>
                  <span style={{ border: `1px solid ${state.border}`, background: state.background, color: state.color, borderRadius: 999, padding: "1px 7px", fontWeight: 700 }}>
                    {state.label}
                  </span>
                  <strong>{item.label}</strong>
                </div>
                {item.evidence ? (
                  <div style={{ fontSize: 12, color: "#334155", paddingLeft: 2 }}>Evidence: “{item.evidence}”</div>
                ) : (
                  <div style={{ fontSize: 12, color: "#64748b", paddingLeft: 2 }}>{item.reason || "No supporting evidence found."}</div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {corrections.length ? (
        <div style={{ border: "1px solid #dbeafe", background: "#f8fbff", borderRadius: 6, padding: 8, display: "grid", gap: 5, fontSize: 12 }}>
          <strong>Writing corrections</strong>
          {corrections.map((correction, index) => {
            if (typeof correction === "string") return <div key={correction + index}>{correction}</div>;
            const from = String(correction?.from || "").trim();
            const to = String(correction?.to || "").trim();
            const reason = String(correction?.reason || "").trim();
            return (
              <div key={`${from}|${to}|${index}`}>
                {from && to ? <>“{from}” → <b>“{to}”</b></> : (to || from || reason)}
                {reason && from && to ? <span style={{ color: "#64748b" }}> · {reason}</span> : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {reviewReasons.length ? (
        <div style={{ border: "1px solid #fecaca", background: "#fff7f7", borderRadius: 6, padding: 8, display: "grid", gap: 4, fontSize: 12 }}>
          <strong>Review reasons</strong>
          {reviewReasons.map((reason, index) => {
            const message = typeof reason === "string" ? reason : reason?.message || reason?.reason || "";
            const code = typeof reason === "object" ? reason?.code : "";
            return <div key={`${code}|${message}|${index}`}>{code ? <code>{code}</code> : null}{code && message ? " · " : ""}{message}</div>;
          })}
        </div>
      ) : null}
    </section>
  );
}
