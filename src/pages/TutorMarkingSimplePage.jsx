import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  deleteTutorReview,
  loadPendingTutorReviews,
  saveTutorReviewResponse,
} from "../services/tutorReviewService.js";

const AUTOSAVE_KEY = "tutorMarkingSimpleDrafts.v1";
const MISTAKE_TYPES = [
  "Word order",
  "Verb conjugation",
  "Article / gender",
  "Spelling",
  "Formal / informal",
  "Missing task point",
  "Other",
];

function createMistakeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pm_${crypto.randomUUID()}`;
  }
  return `pm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function extractText(review, keys) {
  for (const key of keys) {
    const value = review?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatTimestamp(value) {
  const millis = toMillis(value);
  return millis ? new Date(millis).toLocaleString() : "—";
}

function normalizeMistakes(items = []) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: String(item?.id || "").trim() || createMistakeId(),
    source: "studentDraft",
    phrase: String(item?.phrase || ""),
    startOffset: Number.isFinite(Number(item?.startOffset)) ? Number(item.startOffset) : 0,
    endOffset: Number.isFinite(Number(item?.endOffset)) ? Number(item.endOffset) : 0,
    mistakeType: MISTAKE_TYPES.includes(item?.mistakeType) ? item.mistakeType : "Other",
    correction: String(item?.correction || ""),
    explanation: String(item?.explanation || ""),
    severity: "important",
    createdAt: item?.createdAt || new Date().toISOString(),
  }));
}

function loadAutosavedFeedback() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function approveSuggestion(review) {
  const studentName = review?.studentName || "there";
  return `Good work, ${studentName}. Your submission is approved. Keep checking small grammar details and sentence structure before your next submission.`;
}

function returnSuggestion(review, correctionCount) {
  const studentName = review?.studentName || "there";
  const correctionText = correctionCount
    ? `I marked ${correctionCount} specific correction${correctionCount === 1 ? "" : "s"} below.`
    : "Please review your grammar, sentence structure, and all required task points.";
  return `Hello ${studentName}, please correct this submission and send it again. ${correctionText}`;
}

function cardStyle(extra = {}) {
  return {
    border: "1px solid #dbe2ea",
    borderRadius: 12,
    background: "#fff",
    padding: 14,
    ...extra,
  };
}

export default function TutorMarkingSimplePage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [activeReviewId, setActiveReviewId] = useState("");
  const [feedbackById, setFeedbackById] = useState({});
  const [mistakesById, setMistakesById] = useState({});
  const [selectionById, setSelectionById] = useState({});
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => toMillis(b?.updatedAt) - toMillis(a?.updatedAt)),
    [reviews],
  );

  const activeIndex = sortedReviews.findIndex((review) => review.id === activeReviewId);
  const activeReview = activeIndex >= 0 ? sortedReviews[activeIndex] : sortedReviews[0] || null;

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await loadPendingTutorReviews();
        if (!active) return;
        const autosaved = loadAutosavedFeedback();
        setReviews(rows);
        setFeedbackById(Object.fromEntries(rows.map((row) => [row.id, String(autosaved[row.id] || "")])));
        setMistakesById(Object.fromEntries(rows.map((row) => [row.id, normalizeMistakes(row.phraseMistakes)])));
        setActiveReviewId(rows[0]?.id || "");
      } catch (loadError) {
        if (active) error(loadError?.message || "Failed to load tutor reviews.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(feedbackById));
      } catch {
        // Ignore browser storage failures.
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [feedbackById]);

  function setDraftSelection(reviewId, event) {
    const { selectionStart, selectionEnd, value } = event.target;
    setSelectionById((current) => ({
      ...current,
      [reviewId]: selectionStart === selectionEnd
        ? null
        : {
          phrase: value.slice(selectionStart, selectionEnd),
          startOffset: selectionStart,
          endOffset: selectionEnd,
        },
    }));
  }

  function addCorrection(reviewId) {
    const selection = selectionById[reviewId];
    if (!selection?.phrase?.trim()) {
      error("Highlight the exact words in the Student draft first.");
      return;
    }

    const currentItems = mistakesById[reviewId] || [];
    const duplicate = currentItems.some((item) => (
      item.startOffset === selection.startOffset
      && item.endOffset === selection.endOffset
      && item.phrase === selection.phrase
    ));
    if (duplicate) {
      error("That highlighted phrase is already in the correction list.");
      return;
    }

    setMistakesById((current) => ({
      ...current,
      [reviewId]: [
        ...(current[reviewId] || []),
        {
          id: createMistakeId(),
          source: "studentDraft",
          phrase: selection.phrase,
          startOffset: selection.startOffset,
          endOffset: selection.endOffset,
          mistakeType: "Other",
          correction: "",
          explanation: "",
          severity: "important",
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }

  function updateCorrection(reviewId, mistakeId, field, value) {
    setMistakesById((current) => ({
      ...current,
      [reviewId]: (current[reviewId] || []).map((item) => (
        item.id === mistakeId ? { ...item, [field]: value } : item
      )),
    }));
  }

  function removeCorrection(reviewId, mistakeId) {
    setMistakesById((current) => ({
      ...current,
      [reviewId]: (current[reviewId] || []).filter((item) => item.id !== mistakeId),
    }));
  }

  function moveAfterReview(reviewId) {
    const currentIndex = sortedReviews.findIndex((review) => review.id === reviewId);
    const next = sortedReviews[currentIndex + 1] || sortedReviews[currentIndex - 1] || null;
    setActiveReviewId(next?.id || "");
  }

  async function submit(review, reviewStatus) {
    const phraseMistakes = mistakesById[review.id] || [];
    const typedFeedback = String(feedbackById[review.id] || "").trim();
    const fallback = reviewStatus === "approved"
      ? approveSuggestion(review)
      : returnSuggestion(review, phraseMistakes.length);

    try {
      setSavingId(review.id);
      await saveTutorReviewResponse({
        reviewId: review.id,
        reviewStatus,
        tutorFeedback: typedFeedback || fallback,
        reviewedByUid: user?.uid,
        reviewedByName: user?.displayName || user?.email || "Tutor",
        phraseMistakes,
      });
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setFeedbackById((current) => {
        const next = { ...current };
        delete next[review.id];
        return next;
      });
      setMistakesById((current) => {
        const next = { ...current };
        delete next[review.id];
        return next;
      });
      moveAfterReview(review.id);
      success(reviewStatus === "approved" ? "Submission approved and student notified." : "Submission returned for correction.");
    } catch (saveError) {
      error(saveError?.message || "Failed to save tutor response.");
    } finally {
      setSavingId("");
    }
  }

  async function removeReview(review) {
    if (!window.confirm("Delete this queue item? This cannot be undone.")) return;
    try {
      setDeletingId(review.id);
      await deleteTutorReview(review.id);
      setReviews((current) => current.filter((item) => item.id !== review.id));
      moveAfterReview(review.id);
      success("Queue item deleted.");
    } catch (deleteError) {
      error(deleteError?.message || "Failed to delete queue item.");
    } finally {
      setDeletingId("");
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading tutor reviews…</div>;

  if (!activeReview) {
    return (
      <div style={{ padding: 16, display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Tutor Marking</h2>
        <div style={cardStyle()}>No submissions are waiting for review.</div>
      </div>
    );
  }

  const studentDraft = extractText(activeReview, ["studentDraft", "draft", "draftText", "originalDraft", "studentAnswer", "answer"]);
  const revisedDraft = extractText(activeReview, ["revisedDraft", "improvedDraft", "rewrittenDraft"]);
  const aiFeedback = extractText(activeReview, ["aiFeedback", "feedback", "aiReviewFeedback"]);
  const reflection = extractText(activeReview, ["reflection"]);
  const replies = Array.isArray(activeReview.studentReplies) ? activeReview.studentReplies : [];
  const history = Array.isArray(activeReview.reviewHistory) ? activeReview.reviewHistory : [];
  const corrections = mistakesById[activeReview.id] || [];
  const selectedText = selectionById[activeReview.id];
  const tutorFeedback = feedbackById[activeReview.id] || "";
  const approving = savingId === activeReview.id;

  return (
    <div style={{ padding: 16, display: "grid", gap: 14, maxWidth: 1180, margin: "0 auto" }}>
      <div>
        <h2 style={{ margin: 0 }}>Tutor Marking</h2>
        <p style={{ margin: "5px 0 0", color: "#52606d" }}>
          Read the work, add only necessary corrections, write one comment, then choose the final action.
        </p>
      </div>

      <section style={cardStyle({ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" })}>
        <div>
          <strong>{activeReview.studentName || activeReview.studentId || "Unknown student"}</strong>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            {activeReview.level || activeReview.className || "Class not set"} · Updated {formatTimestamp(activeReview.updatedAt)} · {activeIndex + 1}/{sortedReviews.length}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setActiveReviewId(sortedReviews[activeIndex - 1]?.id)} disabled={activeIndex <= 0}>Previous</button>
          <button type="button" onClick={() => setActiveReviewId(sortedReviews[activeIndex + 1]?.id)} disabled={activeIndex >= sortedReviews.length - 1}>Next</button>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 14 }}>
          <section style={cardStyle({ display: "grid", gap: 8 })}>
            <strong>Student draft</strong>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              To add a correction, highlight the exact words below and click <b>Add highlighted correction</b>.
            </p>
            <textarea
              readOnly
              rows={11}
              value={studentDraft || "No student draft found."}
              onSelect={(event) => setDraftSelection(activeReview.id, event)}
              onMouseUp={(event) => setDraftSelection(activeReview.id, event)}
              onKeyUp={(event) => setDraftSelection(activeReview.id, event)}
              aria-label="Student draft"
              style={{ width: "100%", lineHeight: 1.55 }}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={() => addCorrection(activeReview.id)} disabled={!studentDraft.trim()}>
                Add highlighted correction
              </button>
              <span style={{ fontSize: 13, color: selectedText?.phrase?.trim() ? "#1e3a8a" : "#64748b" }}>
                {selectedText?.phrase?.trim() ? `Selected: “${selectedText.phrase}”` : "Nothing highlighted yet"}
              </span>
            </div>
          </section>

          {revisedDraft ? (
            <details style={cardStyle()}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Revised draft</summary>
              <textarea readOnly rows={9} value={revisedDraft} style={{ width: "100%", marginTop: 10, lineHeight: 1.55 }} />
            </details>
          ) : null}

          <details style={cardStyle()}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>AI feedback and other details</summary>
            <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
              <div><strong>AI feedback</strong><div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{aiFeedback || "No AI feedback found."}</div></div>
              {reflection ? <div><strong>Reflection / question</strong><div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{reflection}</div></div> : null}
              <div><strong>Student replies ({replies.length})</strong></div>
              {replies.map((reply, index) => (
                <div key={`${activeReview.id}-reply-${index}`} style={{ borderLeft: "3px solid #cbd5e1", paddingLeft: 10 }}>
                  <small>{formatTimestamp(reply?.createdAt)}</small>
                  <div style={{ whiteSpace: "pre-wrap" }}>{reply?.message || "(empty reply)"}</div>
                </div>
              ))}
            </div>
          </details>
        </div>

        <aside style={{ display: "grid", gap: 14 }}>
          <section style={cardStyle({ display: "grid", gap: 10 })}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <div>
                <strong>Corrections ({corrections.length})</strong>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>Only add corrections the student needs to see.</div>
              </div>
            </div>

            {corrections.length === 0 ? (
              <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", color: "#64748b" }}>
                No phrase corrections added. You can still approve or return the work using the tutor comment.
              </div>
            ) : null}

            {corrections.map((mistake, index) => (
              <article key={mistake.id} style={{ border: "1px solid #f2c66d", background: "#fffbeb", borderRadius: 10, padding: 10, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
                  <strong>{index + 1}. “{mistake.phrase}”</strong>
                  <button type="button" onClick={() => removeCorrection(activeReview.id, mistake.id)} style={{ color: "#991b1b", background: "#fff" }}>Remove</button>
                </div>
                <label style={{ display: "grid", gap: 4 }}>
                  Type
                  <select value={mistake.mistakeType} onChange={(event) => updateCorrection(activeReview.id, mistake.id, "mistakeType", event.target.value)}>
                    {MISTAKE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  Correct version
                  <input value={mistake.correction} placeholder="Write the corrected phrase" onChange={(event) => updateCorrection(activeReview.id, mistake.id, "correction", event.target.value)} />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  Short explanation
                  <textarea rows={3} value={mistake.explanation} placeholder="Explain the rule briefly" onChange={(event) => updateCorrection(activeReview.id, mistake.id, "explanation", event.target.value)} />
                </label>
              </article>
            ))}
          </section>

          <section style={cardStyle({ display: "grid", gap: 9 })}>
            <strong>Tutor comment</strong>
            <textarea
              rows={8}
              value={tutorFeedback}
              onChange={(event) => setFeedbackById((current) => ({ ...current, [activeReview.id]: event.target.value }))}
              placeholder="Write the one message the student should receive. You may leave this empty and the system will use a short suitable message."
              aria-label="Tutor comment"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setFeedbackById((current) => ({ ...current, [activeReview.id]: approveSuggestion(activeReview) }))}>
                Use approval comment
              </button>
              <button type="button" onClick={() => setFeedbackById((current) => ({ ...current, [activeReview.id]: returnSuggestion(activeReview, corrections.length) }))}>
                Use correction comment
              </button>
            </div>
          </section>

          <section style={cardStyle({ display: "grid", gap: 9 })}>
            <button
              type="button"
              disabled={approving || deletingId === activeReview.id}
              onClick={() => submit(activeReview, "approved")}
              style={{ background: "#15803d", color: "#fff", fontWeight: 800, padding: 12 }}
            >
              {approving ? "Saving…" : "Approve & send"}
            </button>
            <button
              type="button"
              disabled={approving || deletingId === activeReview.id}
              onClick={() => submit(activeReview, "needs_improvement")}
              style={{ background: "#b45309", color: "#fff", fontWeight: 800, padding: 12 }}
            >
              {approving ? "Saving…" : "Return with feedback"}
            </button>
            <small style={{ color: "#64748b" }}>Your draft comment is saved automatically in this browser until you choose one of the two actions.</small>
          </section>

          <details style={cardStyle()}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>More actions and review history</summary>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <button type="button" onClick={() => removeReview(activeReview)} disabled={deletingId === activeReview.id || approving} style={{ color: "#991b1b", background: "#fff", border: "1px solid #fecaca" }}>
                {deletingId === activeReview.id ? "Deleting…" : "Delete queue item"}
              </button>
              {history.length === 0 ? <span style={{ color: "#64748b" }}>No previous review history.</span> : null}
              {history.map((item, index) => (
                <div key={`${activeReview.id}-history-${index}`} style={{ borderLeft: "3px solid #cbd5e1", paddingLeft: 10 }}>
                  <small>{formatTimestamp(item?.reviewedAt)} · {item?.reviewStatus || "Status unavailable"}</small>
                  {item?.tutorFeedback ? <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{item.tutorFeedback}</div> : null}
                </div>
              ))}
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}
