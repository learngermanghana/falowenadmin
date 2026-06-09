import { useEffect, useMemo, useState } from "react";
import {
  hideSubmissionFromQueue,
  loadAnswerKey,
  loadSubmissions,
  markSubmissionWithAI,
  saveMarkingResult,
  saveScoreRow,
} from "../services/markingService.js";
import { useToast } from "../context/ToastContext.jsx";

function normalize(value) {
  return String(value || "").trim();
}

function inferAssignmentId(...values) {
  for (const value of values) {
    const match = String(value || "").match(/([A-Z]\d+-[\d._]+)/i);
    if (match?.[1]) return match[1].toUpperCase().replace(/_/g, ".");
  }
  return "";
}

function statusLabel(value) {
  const status = normalize(value || "pending").toLowerCase();
  if (status === "marked") return "AI marked";
  if (status === "sent") return "Done";
  if (status === "needs_review") return "Check";
  if (status === "failed") return "Failed";
  return "New";
}

function displayDate(value) {
  if (!value) return "Unknown time";
  try {
    return value.toLocaleString?.() || new Date(value).toLocaleString();
  } catch {
    return "Unknown time";
  }
}

function asPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return `${Math.round(numeric)}%`;
}

function getMaxWritingScore(result = {}) {
  const candidates = [
    result.maxWritingScore,
    result.writingMaxScore,
    result.maxWritingPoints,
    result.writingMaxPoints,
    result.ai?.maxWritingScore,
    result.ai?.writingMaxScore,
    ...(Array.isArray(result.parts)
      ? result.parts
        .filter((part) => String(part?.partType || "").toLowerCase() === "writing")
        .flatMap((part) => [part.maxScore, part.maxPoints, part.total, part.totalPoints])
      : []),
  ];

  const explicitMax = candidates.find((value) => Number.isFinite(Number(value)) && Number(value) > 0);
  if (explicitMax) return Number(explicitMax);

  const writingScore = Number(result.writingScore);
  if (Number.isFinite(writingScore) && writingScore > 0 && writingScore <= 50) return 50;
  return 100;
}

function writingScoreToPercent(writingScore, maxWritingScore = 100) {
  const numericScore = Number(writingScore);
  const numericMax = Number(maxWritingScore);
  if (!Number.isFinite(numericScore)) return null;
  if (!Number.isFinite(numericMax) || numericMax <= 0) return Math.round(numericScore);
  return Math.max(0, Math.min(100, Math.round((numericScore / numericMax) * 100)));
}

function formatWritingScore(result = {}) {
  if (result.writingScore === null || result.writingScore === undefined) return "—";
  const maxWritingScore = getMaxWritingScore(result);
  const percent = writingScoreToPercent(result.writingScore, maxWritingScore);
  if (maxWritingScore && maxWritingScore !== 100) return `${result.writingScore}/${maxWritingScore} → ${percent}%`;
  return `${percent}%`;
}

function buildScoreBreakdown(result = {}) {
  const rows = [];
  if (Number(result.objectiveTotal || 0) > 0) {
    rows.push({
      label: "Objective / MCQ",
      value: `${result.objectiveCorrect || 0}/${result.objectiveTotal || 0}`,
      detail: asPercent(result.objectiveScore),
    });
  }

  if (result.writingScore !== null && result.writingScore !== undefined) {
    rows.push({
      label: "Writing",
      value: formatWritingScore(result),
      detail: "Task, grammar, vocabulary, structure, tone",
    });
  }

  if (Array.isArray(result.scoreBreakdown)) {
    result.scoreBreakdown.forEach((item) => {
      if (!item?.label) return;
      rows.push({
        label: item.label,
        value: item.score ?? item.value ?? "—",
        detail: item.reason || item.detail || "",
      });
    });
  }

  if (!rows.length) {
    rows.push({ label: "Overall", value: result.finalScore ?? result.score ?? "—", detail: "AI score before tutor review" });
  }

  return rows;
}

function buildMarkingReason(result = {}) {
  if (result.markingReason) return result.markingReason;
  if (result.improvementSummary) return result.improvementSummary;

  const pieces = [];
  if (Number(result.objectiveTotal || 0) > 0) {
    pieces.push(`Objective answers: ${result.objectiveCorrect || 0}/${result.objectiveTotal || 0} correct.`);
  }
  if (result.writingScore !== null && result.writingScore !== undefined) {
    pieces.push(`Writing score: ${formatWritingScore(result)}.`);
  }
  pieces.push(`Final score: ${result.finalScore ?? result.score ?? "—"}/100.`);
  return pieces.join(" ");
}

function detectedPartsSummary(result = {}) {
  const parts = result.detectedParts || result.parts || [];
  if (!Array.isArray(parts) || !parts.length) return "None";
  return parts
    .map((part) => part.summary || `${part.partId || "part"}: ${part.answerCount ?? part.total ?? "—"} ${part.partType || "answers"} found${part.correct !== undefined ? `, ${part.correct} correct, ${part.wrong ?? 0} wrong` : ""}`)
    .join(", ");
}

function ResultAuditPanel({ result }) {
  if (!result) return null;
  const breakdownRows = buildScoreBreakdown(result);
  const rawReason = result.rawAiReason || result.ai?.rawReason || result.ai?.reason || "Stored in result object / ai audit when returned by model.";

  return (
    <div style={{ border: "1px solid #bfdbfe", borderRadius: 10, padding: 12, background: "#eff6ff", display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, fontSize: 13 }}>
        <span>Score: <b>{result.finalScore ?? result.score ?? "—"}/100</b></span>
        <span>Confidence: <b>{result.confidence ?? "—"}</b></span>
        <span>Status: <b>{statusLabel(result.status)}</b></span>
        <span>Sheet: <b>{result.scoreSaveReceipt?.sheet?.success ? "Saved" : "Draft only"}</b></span>
        <span>Firestore: <b>{result.scoreSaveReceipt?.firestore?.success ? "Saved" : "Audit saved"}</b></span>
      </div>

      <div style={{ border: "1px solid #dbeafe", borderRadius: 8, background: "#ffffff", overflow: "hidden" }}>
        <div style={{ padding: 8, fontWeight: 800, fontSize: 13, background: "#f8fafc" }}>Score breakdown</div>
        <div style={{ display: "grid" }}>
          {breakdownRows.map((row, index) => (
            <div key={`${row.label}-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(140px, 1fr) minmax(90px, auto) 2fr", gap: 8, padding: 8, borderTop: "1px solid #e5e7eb", fontSize: 13 }}>
              <strong>{row.label}</strong>
              <span>{row.value}</span>
              <span style={{ opacity: 0.78 }}>{row.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: "1px solid #dbeafe", borderRadius: 8, padding: 10, background: "#ffffff", fontSize: 13 }}>
        <strong>Why this score?</strong>
        <p style={{ margin: "5px 0 0", lineHeight: 1.5 }}>{buildMarkingReason(result)}</p>
      </div>

      <div style={{ fontSize: 13 }}>
        <b>Detected parts:</b> {detectedPartsSummary(result)}
      </div>

      {Array.isArray(result.wrongAnswers) && result.wrongAnswers.length ? (
        <div style={{ border: "1px solid #fecaca", borderRadius: 8, padding: 10, background: "#fff7ed", fontSize: 13 }}>
          <strong>Exact wrong objective answers</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {result.wrongAnswers.slice(0, 6).map((item, index) => (
              <li key={`${item.question || index}-${index}`}>
                {item.partId ? `${item.partId} ` : ""}{item.question || index + 1}: student {item.student || item.submitted || "blank"}; correct {item.expected || "—"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <details style={{ border: "1px solid #dbeafe", borderRadius: 8, padding: 10, background: "#ffffff" }}>
        <summary style={{ cursor: "pointer", fontWeight: 800 }}>Raw AI reason / admin audit</summary>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, margin: "8px 0 0", maxHeight: 220, overflow: "auto" }}>{rawReason}</pre>
      </details>
    </div>
  );
}

export default function MarkingQuickPage() {
  const { success, error } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await loadSubmissions();
      const visibleRows = rows.filter((row) => !row.raw?.hiddenFromMarkingQueue);
      setSubmissions(visibleRows);
      setSelectedPath((current) => current || visibleRows[0]?.path || "");
    } catch (err) {
      error(err?.message || "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const selectedSubmission = useMemo(() => {
    return submissions.find((row) => row.path === selectedPath) || submissions[0] || null;
  }, [selectedPath, submissions]);

  useEffect(() => {
    setResult(null);
    setScore(selectedSubmission?.finalScore !== null && selectedSubmission?.finalScore !== undefined ? String(selectedSubmission.finalScore) : "");
    setFeedback(selectedSubmission?.raw?.aiFeedback || "");
  }, [selectedSubmission?.path]);

  const assignmentKey = useMemo(() => {
    if (!selectedSubmission) return "";
    return inferAssignmentId(
      selectedSubmission.assignmentKey,
      selectedSubmission.assignmentId,
      selectedSubmission.raw?.assignment_id,
      selectedSubmission.raw?.assignmentId,
      selectedSubmission.assignment,
    );
  }, [selectedSubmission]);

  const handleMarkWithAI = async () => {
    if (!selectedSubmission?.text?.trim()) {
      error("This submission has no text to mark.");
      return;
    }

    setMarking(true);
    try {
      const referenceEntry = assignmentKey ? await loadAnswerKey(assignmentKey) : null;
      const aiResult = await markSubmissionWithAI({
        referenceEntry,
        submission: {
          ...selectedSubmission,
          assignmentKey: referenceEntry?.assignmentKey || selectedSubmission.assignmentKey || assignmentKey,
          assignmentId: assignmentKey || selectedSubmission.assignmentId,
        },
        submissionText: selectedSubmission.text,
      });

      await saveMarkingResult({
        submissionId: selectedSubmission.id,
        submissionPath: selectedSubmission.path,
        result: aiResult,
        status: aiResult.status,
        sentToStudent: false,
      });

      setResult(aiResult);
      setScore(String(aiResult.finalScore ?? aiResult.score ?? 0));
      setFeedback(aiResult.feedback || "");

      success(aiResult.status === "needs_review" ? "AI marked and saved for tutor review." : "AI marked and saved as draft. Review before final save.");
      await refresh();
    } catch (err) {
      error(err?.message || "AI marking failed.");
    } finally {
      setMarking(false);
    }
  };

  const handleManualSave = async () => {
    if (!selectedSubmission) {
      error("Select a submission first.");
      return;
    }
    if (!feedback.trim() || score === "") {
      error("Enter score and feedback before manual save.");
      return;
    }

    setSavingManual(true);
    try {
      const receipt = await saveScoreRow({
        studentCode: selectedSubmission.studentCode,
        name: selectedSubmission.studentName,
        assignment: selectedSubmission.assignment || assignmentKey || "Marked assignment",
        assignmentId: assignmentKey || selectedSubmission.assignmentId || selectedSubmission.assignmentKey,
        score: Number(score),
        comments: feedback.trim(),
        level: selectedSubmission.level,
        link: "",
        source: "manual_quick_marking",
      });

      if (selectedSubmission?.id || selectedSubmission?.path) {
        await saveMarkingResult({
          submissionId: selectedSubmission.id,
          submissionPath: selectedSubmission.path,
          result: {
            ...(result || {}),
            score: Number(score),
            finalScore: Number(score),
            feedback: feedback.trim(),
            manualOverride: Boolean(result),
            aiOriginalScore: result?.aiOriginalScore ?? result?.finalScore ?? result?.score ?? null,
            aiOriginalFeedback: result?.aiOriginalFeedback ?? result?.feedback ?? "",
          },
          status: "marked",
          sentToStudent: false,
        });
      }

      success(`Manual score saved${receipt.sheet.success ? " to Sheet" : ""}${receipt.firestore.success ? " + Firestore" : ""}.`);
    } catch (err) {
      error(err?.message || "Manual save failed.");
    } finally {
      setSavingManual(false);
    }
  };

  const handleHideDone = async () => {
    if (!selectedSubmission?.path) return;
    setHiding(true);
    try {
      await hideSubmissionFromQueue(selectedSubmission.path);
      success("Removed from marking queue.");
      setSelectedPath("");
      await refresh();
    } catch (err) {
      error(err?.message || "Failed to remove from queue.");
    } finally {
      setHiding(false);
    }
  };

  return (
    <div style={{ padding: 16, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Quick Marking</h2>
          <p style={{ margin: 0, opacity: 0.75 }}>Pick work → run AI → review score breakdown → final save. AI drafts are kept for tutor review first.</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
      </div>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>1. Pick student work</h3>
        <select value={selectedPath} onChange={(event) => setSelectedPath(event.target.value)} style={{ width: "100%" }}>
          {submissions.map((row) => (
            <option key={row.path} value={row.path}>
              {statusLabel(row.markingStatus)} · {row.studentName || row.studentCode || "Unknown student"} · {row.assignment || row.assignmentId || row.assignmentKey || "Unknown assignment"} · {displayDate(row.createdAt)}
            </option>
          ))}
        </select>
        {!submissions.length ? <p style={{ margin: 0 }}>No submissions in the queue.</p> : null}
      </section>

      {selectedSubmission ? (
        <>
          <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
            <h3 style={{ margin: 0 }}>2. Submission</h3>
            <div style={{ fontSize: 13, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span>Student: <b>{selectedSubmission.studentName || "Unknown"}</b></span>
              <span>Code: <b>{selectedSubmission.studentCode || "—"}</b></span>
              <span>Assignment: <b>{assignmentKey || selectedSubmission.assignment || "Unknown"}</b></span>
              <span>Status: <b>{statusLabel(selectedSubmission.markingStatus)}</b></span>
            </div>
            <textarea readOnly rows={8} value={selectedSubmission.text || "No submission text available."} />
          </section>

          <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>3. Mark, review and save</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={handleMarkWithAI} disabled={marking || loading} style={{ fontWeight: 700 }}>
                {marking ? "Marking..." : "Mark with AI"}
              </button>
              <button type="button" onClick={handleManualSave} disabled={savingManual || marking}>Save Final Score</button>
              <button type="button" onClick={handleHideDone} disabled={hiding || marking}>Remove from Queue</button>
            </div>

            <ResultAuditPanel result={result} />

            <label style={{ display: "grid", gap: 4 }}>
              Score
              <input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Student feedback
              <textarea rows={7} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="AI feedback will appear here. Tutor can edit before final save." />
            </label>
          </section>

          <details style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>Advanced status explanation</summary>
            <p style={{ fontSize: 13, opacity: 0.8 }}>
              New means the work is waiting. AI marked means AI generated a draft score. Check means tutor should review before saving. Done means it has already been handled. Save Final Score is the final action that writes the score row.
            </p>
          </details>
        </>
      ) : null}
    </div>
  );
}
