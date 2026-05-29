import { useEffect, useMemo, useState } from "react";
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

  const refresh = async () => {
    setLoading(true);
    try {
      setRows(await loadAIMarkingAudit());
    } catch (err) {
      error(err?.message || "Failed to load AI audit.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

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
