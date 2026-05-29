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

      const sheetSaved = aiResult.scoreSaveReceipt?.sheet?.success;
      const firestoreSaved = aiResult.scoreSaveReceipt?.firestore?.success;
      success(`AI marked and saved${sheetSaved ? " to Sheet" : ""}${firestoreSaved ? " + Firestore" : ""}.`);
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
          <p style={{ margin: 0, opacity: 0.75 }}>Simple flow: pick work → mark with AI → result saves to Sheet and Firestore.</p>
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
            <h3 style={{ margin: 0 }}>3. Mark and save</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={handleMarkWithAI} disabled={marking || loading} style={{ fontWeight: 700 }}>
                {marking ? "Marking and saving..." : "Mark with AI & Save"}
              </button>
              <button type="button" onClick={handleManualSave} disabled={savingManual || marking}>Manual Save</button>
              <button type="button" onClick={handleHideDone} disabled={hiding || marking}>Remove from Queue</button>
            </div>

            {result ? (
              <div style={{ border: "1px solid #bfdbfe", borderRadius: 8, padding: 10, background: "#eff6ff", display: "grid", gap: 6 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13 }}>
                  <span>Score: <b>{result.finalScore}</b></span>
                  <span>Confidence: <b>{result.confidence}</b></span>
                  <span>Status: <b>{statusLabel(result.status)}</b></span>
                  <span>Sheet: <b>{result.scoreSaveReceipt?.sheet?.success ? "Saved" : "Check"}</b></span>
                  <span>Firestore: <b>{result.scoreSaveReceipt?.firestore?.success ? "Saved" : "Check"}</b></span>
                </div>
              </div>
            ) : null}

            <label style={{ display: "grid", gap: 4 }}>
              Score
              <input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              40-word feedback
              <textarea rows={6} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="AI feedback will appear here." />
            </label>
          </section>

          <details style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>Advanced status explanation</summary>
            <p style={{ fontSize: 13, opacity: 0.8 }}>
              New means the work is waiting. AI marked means AI has generated and saved a score. Check means tutor should review before using it. Done means it has already been handled.
            </p>
          </details>
        </>
      ) : null}
    </div>
  );
}
