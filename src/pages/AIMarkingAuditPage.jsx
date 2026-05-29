import { useEffect, useMemo, useState } from "react";
import { loadAIMarkingAudit } from "../services/aiAuditService.js";
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
            Review AI scores before trusting them. Unsafe 0 or missing-key results are blocked from the score sheet and kept here.
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
          <article key={row.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}>
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
              <span>Score: <b>{row.finalScore ?? "—"}</b></span>
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

            <div>
              <b>AI feedback</b>
              <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{row.feedback || "—"}</p>
            </div>

            <details>
              <summary style={{ cursor: "pointer" }}>View technical details</summary>
              <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto", fontSize: 12 }}>
                {JSON.stringify({
                  id: row.id,
                  submissionPath: row.submissionPath,
                  parts: row.parts,
                  detectedParts: row.detectedParts,
                  scoreSaveReceipt: row.scoreSaveReceipt,
                }, null, 2)}
              </pre>
            </details>
          </article>
        ))}
      </section>
    </div>
  );
}
