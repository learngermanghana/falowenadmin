import { useCallback, useEffect, useMemo, useState } from "react";
import { approveAndSyncAIMarkingAudit, loadAIMarkingAudit } from "../services/aiAuditService.js";
import { useToast } from "../context/ToastContext.jsx";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function dateLabel(value) {
  if (!value) return "—";
  try {
    return value.toLocaleString?.() || new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function statusText(row) {
  if (row.sheetSynced) return "Sheet synced";
  if (row.scoreSaveReceipt?.skippedForReview) return "Blocked for review";
  if (row.status === "needs_review") return "Needs review";
  return row.status || "Unknown";
}

function wordCount(value = "") {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function numericValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatComparisonValue(value) {
  if (!hasValue(value)) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function formatScoreValue(value, suffix = "") {
  if (!hasValue(value)) return "—";
  const parsed = numericValue(value);
  if (parsed === null) return String(value);
  return `${Math.round(parsed)}${suffix}`;
}

function percentLabel(weight) {
  const parsed = numericValue(weight);
  if (parsed === null) return "";
  return parsed <= 1 ? `${Math.round(parsed * 100)}%` : `${Math.round(parsed)}%`;
}

function answerRowsFromMap(answers = {}, partLabel = "") {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return [];
  return Object.entries(answers).map(([key, value]) => ({
    key: partLabel ? `${partLabel} · ${key}` : key,
    value: formatComparisonValue(value),
  }));
}

function answerRowsFromAnswerKey(answerKey = null) {
  if (!answerKey) return [];

  const rows = [];
  if (answerKey.parts && typeof answerKey.parts === "object" && !Array.isArray(answerKey.parts)) {
    Object.entries(answerKey.parts).forEach(([partId, part]) => {
      const answers = Array.isArray(part?.answers) ? part.answers : [];
      answers.forEach((answer, index) => {
        rows.push({
          key: `${part?.label || partId} · ${answer?.key || answer?.question || `Answer ${index + 1}`}`,
          value: formatComparisonValue(answer?.answer ?? answer?.value ?? answer?.correctAnswer ?? answer),
        });
      });
    });
  }

  if (!rows.length) rows.push(...answerRowsFromMap(answerKey.answers));
  return rows;
}

function ComparisonBox({ title, subtitle, children, tone = "neutral" }) {
  const borderColor = tone === "student" ? "#bbf7d0" : tone === "key" ? "#fde68a" : "#e5e7eb";
  const background = tone === "student" ? "#f0fdf4" : tone === "key" ? "#fffbeb" : "#fff";

  return (
    <section style={{ border: `1px solid ${borderColor}`, background, borderRadius: 8, padding: 10, display: "grid", gap: 8, minWidth: 0 }}>
      <div>
        <b>{title}</b>
        {subtitle ? <div style={{ fontSize: 12, opacity: 0.72 }}>{subtitle}</div> : null}
      </div>
      {children}
    </section>
  );
}

function StudentWorkPanel({ row }) {
  const workText = row.studentWorkText || "";
  const answerRows = answerRowsFromMap(row.studentAnswers);

  return (
    <ComparisonBox
      title="Student work"
      subtitle={row.submissionPath ? `From ${row.submissionPath}` : "Submission snapshot was not found"}
      tone="student"
    >
      {workText ? (
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowX: "auto", fontFamily: "inherit", fontSize: 13, lineHeight: 1.45 }}>
          {workText}
        </pre>
      ) : (
        <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>No student work text was available for this audit record.</p>
      )}

      {answerRows.length ? (
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>Structured answers ({answerRows.length})</summary>
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
            {answerRows.map((answer) => (
              <div key={answer.key} style={{ display: "grid", gridTemplateColumns: "minmax(90px, 160px) 1fr", gap: 8, fontSize: 13 }}>
                <b>{answer.key}</b>
                <span style={{ whiteSpace: "pre-wrap" }}>{answer.value}</span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </ComparisonBox>
  );
}

function AnswerKeyPanel({ row }) {
  const answerKey = row.answerKey;
  const answerRows = answerRowsFromAnswerKey(answerKey);

  return (
    <ComparisonBox
      title="Answer key / expected answers"
      subtitle={answerKey ? `${answerKey.assignmentKey || answerKey.id || "Answer key"}${answerKey.format ? ` · ${answerKey.format}` : ""}` : "No matching answer key was found"}
      tone="key"
    >
      {answerKey?.answerUrl ? (
        <a href={answerKey.answerUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>Open source answer key</a>
      ) : null}

      {answerRows.length ? (
        <div style={{ display: "grid", gap: 6, maxHeight: 280, overflow: "auto", paddingRight: 4 }}>
          {answerRows.map((answer) => (
            <div key={answer.key} style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: 6, display: "grid", gridTemplateColumns: "minmax(100px, 180px) 1fr", gap: 8, fontSize: 13 }}>
              <b>{answer.key}</b>
              <span style={{ whiteSpace: "pre-wrap" }}>{answer.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>No objective answer rows were available. Check the technical details for writing-part grading instructions.</p>
      )}

      {answerKey?.partGrading ? (
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>Part grading instructions</summary>
          <pre style={{ marginBottom: 0, whiteSpace: "pre-wrap", overflowX: "auto", fontSize: 12 }}>
            {JSON.stringify(answerKey.partGrading, null, 2)}
          </pre>
        </details>
      ) : null}
    </ComparisonBox>
  );
}

function normalizeScoreCandidate(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function writingScoreFromParts(parts = []) {
  const scores = (Array.isArray(parts) ? parts : [])
    .filter((part) => part?.partType === "writing" || part?.partId === "teil2")
    .map((part) => normalizeScoreCandidate(part?.result?.score ?? part?.result?.writingScore ?? part?.score ?? part?.writingScore))
    .filter((score) => score !== null);

  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function buildScoreBreakdown(row = {}) {
  const savedBreakdown = row.scoreBreakdown || row.result?.scoreBreakdown || {};
  const aiMeta = row.result?.ai || row.ai || {};
  const objectiveScore = savedBreakdown.objectiveScore ?? row.objectiveScore ?? row.result?.objectiveScore;
  const partWritingScore = writingScoreFromParts(row.parts || row.result?.parts);
  const writingScore = partWritingScore ?? savedBreakdown.writingScore ?? row.writingScore ?? row.result?.writingScore;
  const objectiveWeight = savedBreakdown.objectiveWeight ?? aiMeta.deterministicObjectiveWeight;
  const writingWeight = savedBreakdown.writingWeight ?? aiMeta.deterministicWritingWeight;
  const normalizedObjectiveWeight = Number(objectiveWeight);
  const normalizedWritingWeight = Number(writingWeight);
  const canRecalculateFinal = partWritingScore !== null
    && Number.isFinite(Number(objectiveScore))
    && Number.isFinite(Number(writingScore));
  const recalculatedFinal = canRecalculateFinal
    ? Math.round((Number(objectiveScore) * (Number.isFinite(normalizedObjectiveWeight) ? normalizedObjectiveWeight : 0.5))
      + (Number(writingScore) * (Number.isFinite(normalizedWritingWeight) ? normalizedWritingWeight : 0.5)))
    : null;

  return {
    finalScore: recalculatedFinal ?? savedBreakdown.finalScore ?? row.finalScore ?? row.result?.finalScore ?? row.result?.score,
    objectiveScore,
    objectiveCorrect: savedBreakdown.objectiveCorrect ?? row.objectiveCorrect ?? row.result?.objectiveCorrect,
    objectiveTotal: savedBreakdown.objectiveTotal ?? row.objectiveTotal ?? row.result?.objectiveTotal,
    writingScore,
    confidence: row.confidence ?? row.result?.confidence,
    objectiveWeight,
    writingWeight,
  };
}

function metricCard(title, value, subtitle = "") {
  return (
    <div key={title} style={{ border: "1px solid #bfdbfe", background: "#fff", borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.68, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 3 }}>{value}</div>
      {subtitle ? <div style={{ fontSize: 12, opacity: 0.72, marginTop: 3 }}>{subtitle}</div> : null}
    </div>
  );
}

function partRowsFromRow(row = {}) {
  const rows = [];
  const detectedParts = Array.isArray(row.detectedParts) ? row.detectedParts : [];
  const scoredParts = Array.isArray(row.parts) ? row.parts : [];

  detectedParts.forEach((part) => {
    if (!part) return;
    rows.push({
      key: `detected-${part.partId || part.id || rows.length}`,
      partId: part.partId || part.id || "—",
      partType: part.partType || part.type || "detected",
      score: part.score ?? part.percentage ?? part.result?.percentage ?? "",
      correct: part.correct ?? part.result?.correct?.length ?? "",
      total: part.total ?? part.answerCount ?? part.result?.total ?? "",
      source: "Detected",
    });
  });

  scoredParts.forEach((part, index) => {
    if (!part) return;
    const result = part.result || part;
    const partId = part.partId || result.partId || `part-${index + 1}`;
    const partType = part.partType || result.partType || result.type || "scored";
    const correct = result.correctCount ?? result.correct?.length ?? part.correct;
    const total = result.totalCount ?? result.total ?? part.total;
    rows.push({
      key: `scored-${partId}-${index}`,
      partId,
      partType,
      score: result.percentage ?? result.score ?? result.objectiveScore ?? result.writingScore ?? "",
      correct,
      total,
      source: "Scored",
    });
  });

  const seen = new Set();
  return rows.filter((rowItem) => {
    const key = `${rowItem.partId}-${rowItem.partType}-${rowItem.source}-${rowItem.score}-${rowItem.correct}-${rowItem.total}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function wrongAnswerRowsFromRow(row = {}) {
  const rows = [];

  const addItems = (items = [], fallback = {}) => {
    if (!Array.isArray(items)) return;
    items.forEach((item, index) => {
      if (!item) return;
      const question = item.questionNumber ?? item.question ?? item.key ?? item.sourceKey ?? item.id ?? `Item ${index + 1}`;
      rows.push({
        partId: item.partId || fallback.partId || "—",
        question,
        student: item.submitted ?? item.student ?? item.given ?? item.answer ?? item.rawSubmitted ?? "—",
        expected: item.expected ?? item.rawExpected ?? item.correct ?? item.correctAnswer ?? "—",
        status: item.status || fallback.status || "Wrong",
      });
    });
  };

  addItems(row.wrongAnswers, { status: "Wrong" });
  addItems(row.corrections, { status: "Correction" });
  addItems(row.result?.wrongAnswers, { status: "Wrong" });
  addItems(row.result?.corrections, { status: "Correction" });

  (Array.isArray(row.parts) ? row.parts : []).forEach((part) => {
    const result = part?.result || part || {};
    const partId = part?.partId || result.partId || "—";
    addItems(result.wrong, { partId, status: "Wrong" });
    addItems(result.missing, { partId, status: "Missing" });
    addItems(result.needsReview, { partId, status: "Needs review" });
  });

  const seen = new Set();
  return rows.filter((item) => {
    const key = `${item.partId}-${item.question}-${item.student}-${item.expected}-${item.status}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ScoreBreakdownPanel({ row }) {
  const breakdown = buildScoreBreakdown(row);
  const partRows = partRowsFromRow(row);
  const wrongRows = wrongAnswerRowsFromRow(row);
  const objectiveWeight = percentLabel(breakdown.objectiveWeight);
  const writingWeight = percentLabel(breakdown.writingWeight);
  const formula = objectiveWeight || writingWeight
    ? `Final = Objective ${objectiveWeight || "—"} + Writing ${writingWeight || "—"}`
    : "Final score is saved as AI/tutor draft until approval";

  return (
    <section style={{ border: "1px solid #93c5fd", background: "#eff6ff", borderRadius: 8, padding: 10, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "start" }}>
        <div>
          <b>AI score breakdown</b>
          <div style={{ fontSize: 12, opacity: 0.72 }}>
            Objective answers are checked from the answer key; writing is kept for AI/tutor review before syncing.
          </div>
        </div>
        <span style={{ fontSize: 12, border: "1px solid #bfdbfe", background: "#fff", borderRadius: 999, padding: "4px 8px", fontWeight: 700 }}>
          {formula}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
        {metricCard("Final score", formatScoreValue(breakdown.finalScore, "%"), "Draft until approved")}
        {metricCard(
          "Objective",
          formatScoreValue(breakdown.objectiveScore, "%"),
          hasValue(breakdown.objectiveCorrect) || hasValue(breakdown.objectiveTotal)
            ? `${formatComparisonValue(breakdown.objectiveCorrect)} / ${formatComparisonValue(breakdown.objectiveTotal)} correct`
            : "No objective count",
        )}
        {metricCard("Writing", formatScoreValue(breakdown.writingScore, "%"), hasValue(breakdown.writingScore) ? "Schreiben / free response" : "Not detected")}
        {metricCard("Confidence", hasValue(breakdown.confidence) ? formatScoreValue(Number(breakdown.confidence) * 100, "%") : "—", "Use tutor judgment")}
      </div>

      {partRows.length ? (
        <details open>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>Part-level marks ({partRows.length})</summary>
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#fff" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #bfdbfe" }}>Part</th>
                  <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #bfdbfe" }}>Type</th>
                  <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #bfdbfe" }}>Score</th>
                  <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #bfdbfe" }}>Correct / Total</th>
                  <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #bfdbfe" }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {partRows.map((part) => (
                  <tr key={part.key}>
                    <td style={{ padding: 6, borderBottom: "1px solid #dbeafe" }}>{part.partId}</td>
                    <td style={{ padding: 6, borderBottom: "1px solid #dbeafe" }}>{part.partType}</td>
                    <td style={{ padding: 6, borderBottom: "1px solid #dbeafe" }}>{hasValue(part.score) ? formatScoreValue(part.score, "%") : "—"}</td>
                    <td style={{ padding: 6, borderBottom: "1px solid #dbeafe" }}>{hasValue(part.correct) || hasValue(part.total) ? `${formatComparisonValue(part.correct)} / ${formatComparisonValue(part.total)}` : "—"}</td>
                    <td style={{ padding: 6, borderBottom: "1px solid #dbeafe" }}>{part.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      {wrongRows.length ? (
        <details open>
          <summary style={{ cursor: "pointer", fontWeight: 700, color: "#7f1d1d" }}>Wrong answers / corrections ({wrongRows.length})</summary>
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#fff" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #fecaca" }}>Part</th>
                  <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #fecaca" }}>Question</th>
                  <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #fecaca" }}>Student</th>
                  <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #fecaca" }}>Expected</th>
                  <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #fecaca" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {wrongRows.map((item) => (
                  <tr key={`${item.partId}-${item.question}-${item.status}-${item.student}-${item.expected}`}>
                    <td style={{ padding: 6, borderBottom: "1px solid #fee2e2" }}>{item.partId}</td>
                    <td style={{ padding: 6, borderBottom: "1px solid #fee2e2" }}>{item.question}</td>
                    <td style={{ padding: 6, borderBottom: "1px solid #fee2e2", whiteSpace: "pre-wrap" }}>{formatComparisonValue(item.student)}</td>
                    <td style={{ padding: 6, borderBottom: "1px solid #fee2e2", whiteSpace: "pre-wrap" }}>{formatComparisonValue(item.expected)}</td>
                    <td style={{ padding: 6, borderBottom: "1px solid #fee2e2" }}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : (
        <div style={{ fontSize: 13, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: 8 }}>
          No wrong objective answers or corrections were captured for this audit record.
        </div>
      )}
    </section>
  );
}

function AuditCard({ row, onSynced }) {
  const { success, error } = useToast();
  const breakdown = buildScoreBreakdown(row);
  const [score, setScore] = useState(breakdown.finalScore ?? "");
  const [feedback, setFeedback] = useState(row.feedback || "");
  const [saving, setSaving] = useState(false);

  const handleApproveAndSync = async () => {
    const confirmed = window.confirm("Approve this edited AI result and sync it to the score sheet and Firestore?");
    if (!confirmed) return;

    setSaving(true);
    try {
      const receipt = await approveAndSyncAIMarkingAudit({
        auditId: row.id,
        score,
        feedback,
      });
      success(receipt?.sheet?.message || "AI audit result approved and synced.");
      await onSynced();
    } catch (err) {
      error(err?.message || "Failed to approve and sync AI audit result.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <strong>{row.studentName || "Unknown student"}</strong>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            {row.studentCode || "—"} · {row.level || "—"} · {row.assignmentKey || row.assignment || "Unknown assignment"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <strong>{statusText(row)}</strong>
          <div style={{ fontSize: 13, opacity: 0.75 }}>{dateLabel(row.createdAtDate || row.createdAt)}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
        <span>Original score: <b>{row.finalScore ?? "—"}</b></span>
        <span>Confidence: <b>{row.confidence ?? "—"}</b></span>
        <span>Objective: <b>{row.objectiveCorrect ?? "—"}/{row.objectiveTotal ?? "—"}</b></span>
        <span>Writing: <b>{breakdown.writingScore ?? "—"}</b></span>
        <span>Sheet: <b>{row.sheetSynced ? "Synced" : "Not synced"}</b></span>
      </div>

      {row.reviewReason ? (
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8, padding: 8 }}>
          <b>Reason:</b> {row.reviewReason}
        </div>
      ) : null}

      <ScoreBreakdownPanel row={row} />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
        <StudentWorkPanel row={row} />
        <AnswerKeyPanel row={row} />
      </section>

      <section style={{ border: "1px solid #dbeafe", background: "#eff6ff", borderRadius: 8, padding: 10, display: "grid", gap: 8 }}>
        <b>Edit before syncing</b>
        <label style={{ display: "grid", gap: 4 }}>
          Final score
          <input
            type="number"
            min="0"
            max="100"
            value={score}
            onChange={(event) => setScore(event.target.value)}
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          Feedback to save
          <textarea
            rows={5}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
          />
        </label>
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, opacity: 0.75 }}>Words: {wordCount(feedback)}</span>
          <button type="button" onClick={handleApproveAndSync} disabled={saving}>
            {saving ? "Syncing..." : "Approve & Sync to Sheet"}
          </button>
        </div>
      </section>

      <details>
        <summary style={{ cursor: "pointer" }}>View original AI text and technical details</summary>
        <div style={{ marginTop: 8 }}>
          <b>Original AI feedback</b>
          <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{row.feedback || "—"}</p>
        </div>
        <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto", fontSize: 12 }}>
          {JSON.stringify({
            id: row.id,
            submissionPath: row.submissionPath,
            scoreBreakdown: row.scoreBreakdown,
            finalScore: row.finalScore,
            objectiveScore: row.objectiveScore,
            objectiveCorrect: row.objectiveCorrect,
            objectiveTotal: row.objectiveTotal,
            writingScore: row.writingScore,
            wrongAnswers: row.wrongAnswers,
            corrections: row.corrections,
            expectedParts: row.expectedParts,
            parts: row.parts,
            detectedParts: row.detectedParts,
            result: row.result,
            scoreSaveReceipt: row.scoreSaveReceipt,
            submissionSnapshot: row.submissionSnapshot,
            answerKey: row.answerKey,
          }, null, 2)}
        </pre>
      </details>
    </article>
  );
}

export default function AIMarkingAuditPage() {
  const { error } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("blocked");
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await loadAIMarkingAudit());
    } catch (err) {
      error(err?.message || "Failed to load AI audit.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredRows = useMemo(() => {
    const q = normalize(query);
    return rows.filter((row) => {
      if (filter === "blocked" && row.sheetSynced) return false;
      if (filter === "synced" && !row.sheetSynced) return false;
      if (filter === "review" && normalize(row.status) !== "needs_review") return false;
      if (!q) return true;
      return [
        row.studentName,
        row.studentCode,
        row.assignment,
        row.assignmentKey,
        row.level,
        row.feedback,
        row.reviewReason,
        row.studentWorkText,
        row.answerKey?.assignmentKey,
        row.answerKey?.title,
      ].some((value) => normalize(value).includes(q));
    });
  }, [rows, filter, query]);

  const counts = useMemo(() => {
    return {
      all: rows.length,
      blocked: rows.filter((row) => !row.sheetSynced).length,
      synced: rows.filter((row) => row.sheetSynced).length,
      review: rows.filter((row) => normalize(row.status) === "needs_review").length,
    };
  }, [rows]);

  return (
    <div style={{ padding: 16, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>AI Marking Audit</h2>
          <p style={{ margin: 0, opacity: 0.75 }}>
            Review AI scores before trusting them. Edit score/feedback, then approve and sync to the score sheet.
          </p>
        </div>
        <button type="button" onClick={refresh} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setFilter("blocked")} style={{ fontWeight: filter === "blocked" ? 700 : 400 }}>
            Blocked ({counts.blocked})
          </button>
          <button type="button" onClick={() => setFilter("review")} style={{ fontWeight: filter === "review" ? 700 : 400 }}>
            Needs Review ({counts.review})
          </button>
          <button type="button" onClick={() => setFilter("synced")} style={{ fontWeight: filter === "synced" ? 700 : 400 }}>
            Synced ({counts.synced})
          </button>
          <button type="button" onClick={() => setFilter("all")} style={{ fontWeight: filter === "all" ? 700 : 400 }}>
            All ({counts.all})
          </button>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student, code, assignment, level, feedback..."
        />
      </section>

      <section style={{ display: "grid", gap: 10 }}>
        {!filteredRows.length ? (
          <p>{loading ? "Loading AI audit..." : "No AI audit results found for this filter."}</p>
        ) : filteredRows.map((row) => (
          <AuditCard key={row.id} row={row} onSynced={refresh} />
        ))}
      </section>
    </div>
  );
}
