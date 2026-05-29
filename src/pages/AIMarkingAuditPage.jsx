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

function formatComparisonValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
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

function AuditCard({ row, onSynced }) {
  const { success, error } = useToast();
  const [score, setScore] = useState(row.finalScore ?? "");
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
        <span>Writing: <b>{row.writingScore ?? "—"}</b></span>
        <span>Sheet: <b>{row.sheetSynced ? "Synced" : "Not synced"}</b></span>
      </div>

      {row.reviewReason ? (
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8, padding: 8 }}>
          <b>Reason:</b> {row.reviewReason}
        </div>
      ) : null}

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
            expectedParts: row.expectedParts,
            parts: row.parts,
            detectedParts: row.detectedParts,
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
