import { useEffect, useMemo, useState } from "react";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteTutorReview, loadPendingTutorReviews, saveTutorReviewResponse } from "../services/tutorReviewService.js";

const AUTOSAVE_KEY = "tutorMarkingDrafts.v1";
const FEEDBACK_SNIPPETS = [
  {
    key: "word_order",
    label: "Word order",
    text: "Please check your German word order. In a normal sentence, use: subject + verb + time/details. Example: \"Ich lerne morgen Deutsch.\"",
  },
  {
    key: "formal_opening",
    label: "Formal opening",
    text: "Use a clear formal opening: \"Ich schreibe Ihnen, weil ich eine Anfrage stellen möchte.\"",
  },
  {
    key: "verb_at_end",
    label: "Verb at end",
    text: "With \"weil\", the conjugated verb goes to the end. Example: \"..., weil ich den Kurs buchen möchte.\"",
  },
  {
    key: "question_structure",
    label: "Question structure",
    text: "For questions, check the structure. W-question: \"Wann beginnt der Kurs?\" Yes/No question: \"Haben Sie morgen Zeit?\"",
  },
  {
    key: "closing",
    label: "Closing",
    text: "End your email politely. For formal emails, use: \"Mit freundlichen Grüßen\". For informal emails, use: \"Viele Grüße\".",
  },
  {
    key: "too_short",
    label: "Too short",
    text: "Your answer is too short. Please add all required points from the task and write complete sentences.",
  },
  {
    key: "good_improvement",
    label: "Good improvement",
    text: "Good improvement. Your structure is clearer now. Please keep checking small grammar details before submitting.",
  },
  {
    key: "ask_question",
    label: "Ask student question",
    text: "Please reply and explain which part was difficult for you, so I can guide you better.",
  },
];

const STATUS_OPTIONS = [
  { value: "approved", label: "Approve and close", tone: "success" },
  { value: "needs_improvement", label: "Return for correction", tone: "warning" },
];

const MISTAKE_TYPE_OPTIONS = [
  "Verb conjugation",
  "Word order",
  "Article / gender",
  "Spelling",
  "Formal / informal",
  "Missing task point",
  "Other",
];

const SEVERITY_OPTIONS = ["minor", "important", "serious"];

function createPhraseMistakeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pm_${crypto.randomUUID()}`;
  }
  return `pm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeUiPhraseMistakes(phraseMistakes = []) {
  if (!Array.isArray(phraseMistakes)) return [];
  return phraseMistakes.map((mistake) => ({
    id: String(mistake?.id || "").trim() || createPhraseMistakeId(),
    source: "studentDraft",
    phrase: String(mistake?.phrase || ""),
    startOffset: Number.isFinite(Number(mistake?.startOffset)) ? Math.max(0, Math.trunc(Number(mistake.startOffset))) : 0,
    endOffset: Number.isFinite(Number(mistake?.endOffset)) ? Math.max(0, Math.trunc(Number(mistake.endOffset))) : 0,
    mistakeType: MISTAKE_TYPE_OPTIONS.includes(mistake?.mistakeType) ? mistake.mistakeType : "Other",
    correction: String(mistake?.correction || ""),
    explanation: String(mistake?.explanation || ""),
    severity: SEVERITY_OPTIONS.includes(mistake?.severity) ? mistake.severity : "important",
    createdAt: typeof mistake?.createdAt === "string" && !Number.isNaN(Date.parse(mistake.createdAt))
      ? new Date(mistake.createdAt).toISOString()
      : (typeof mistake?.createdAt?.toDate === "function" ? mistake.createdAt.toDate().toISOString() : new Date().toISOString()),
  }));
}

function extractText(review, keys) {
  for (const key of keys) {
    const value = review?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function formatTimestamp(value) {
  if (!value) return "—";
  if (typeof value?.toDate === "function") return value.toDate().toLocaleString();
  if (value instanceof Date) return value.toLocaleString();
  return String(value);
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getNewReplies(review) {
  const lastTutorActionMillis = toMillis(review?.reviewedAt);
  const replies = Array.isArray(review?.studentReplies) ? review.studentReplies : [];
  return replies.filter((reply) => toMillis(reply?.createdAt) > lastTutorActionMillis);
}

function getWordCount(text) {
  const normalized = String(text || "").trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

function getReadingTimeText(text) {
  const words = getWordCount(text);
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${words} words · ~${mins} min read`;
}

function getActionableHint(feedback) {
  const normalized = String(feedback || "").trim();
  if (!normalized) return "Add at least one actionable suggestion for the student.";
  if (normalized.length < 50) return "Try adding specific next steps: what to change + where.";
  if (!/[.!?]/.test(normalized)) return "Use complete sentences so students can follow your guidance clearly.";
  return "Looks good — your feedback includes actionable guidance.";
}

function getReviewHistory(review) {
  if (Array.isArray(review?.reviewHistory) && review.reviewHistory.length) return review.reviewHistory;
  const fallback = [];
  if (review?.reviewedAt || review?.reviewStatus || review?.tutorFeedback) {
    fallback.push({
      reviewedAt: review.reviewedAt,
      reviewStatus: review.reviewStatus,
      tutorFeedback: review.tutorFeedback,
      reviewerName: review.reviewerName || "Tutor",
    });
  }
  return fallback;
}

function loadAutosavedDrafts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || "{}");
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // Ignore malformed local cache.
  }
  return {};
}

function getPriorityBadges(review) {
  const badges = [];
  const updatedMillis = toMillis(review?.updatedAt);
  const ageHours = updatedMillis ? Math.floor((Date.now() - updatedMillis) / (1000 * 60 * 60)) : 0;
  const unreadReplies = getNewReplies(review).length;
  const source = String(review?.source || "").trim();
  const status = String(review?.reviewStatus || review?.status || "").trim().toLowerCase();

  if (unreadReplies > 0) badges.push({ label: "New reply", tone: "warning" });
  if (ageHours >= 24) badges.push({ label: "Older than 24h", tone: "danger" });
  if (!review?.reviewedAt && !review?.tutorFeedback) badges.push({ label: "First review", tone: "info" });
  if (status.includes("improve") || status.includes("revision")) badges.push({ label: "Revision", tone: "warning" });
  if (source) badges.push({ label: source, tone: "neutral" });
  if (!badges.length) badges.push({ label: "Standard", tone: "neutral" });
  return badges;
}

function badgeStyle(tone) {
  const palettes = {
    warning: { background: "#fef3c7", borderColor: "#f59e0b", color: "#92400e" },
    danger: { background: "#fee2e2", borderColor: "#ef4444", color: "#991b1b" },
    info: { background: "#dbeafe", borderColor: "#93c5fd", color: "#1e3a8a" },
    success: { background: "#dcfce7", borderColor: "#86efac", color: "#166534" },
    neutral: { background: "#f8fafc", borderColor: "#cbd5e1", color: "#334155" },
  };
  return {
    ...(palettes[tone] || palettes.neutral),
    border: `1px solid ${(palettes[tone] || palettes.neutral).borderColor}`,
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 12,
    fontWeight: 700,
  };
}

function buttonToneStyle(tone, selected = false) {
  if (tone === "success") {
    return {
      border: selected ? "2px solid #15803d" : "1px solid #86efac",
      background: selected ? "#dcfce7" : "#f0fdf4",
      color: "#166534",
      fontWeight: selected ? 800 : 600,
    };
  }
  if (tone === "warning") {
    return {
      border: selected ? "2px solid #b45309" : "1px solid #fbbf24",
      background: selected ? "#fef3c7" : "#fffbeb",
      color: "#92400e",
      fontWeight: selected ? 800 : 600,
    };
  }
  return { border: "1px solid #94a3b8", background: "#f8fafc", color: "#0f172a" };
}

function buildSuggestedFeedback({ review, currentStatus, aiFeedback, revisedDraft, studentDraft, unreadReplyCount }) {
  const studentName = review?.studentName || "there";
  const aiHint = String(aiFeedback || "")
    .split(/[\n.]/)
    .map((line) => line.trim())
    .find((line) => line.length > 25);
  const draftWords = getWordCount(revisedDraft || studentDraft);

  if (unreadReplyCount > 0) {
    return `Hello ${studentName}, thank you for your follow-up. Please revise the exact part I mentioned and send it again. ${aiHint ? `Focus especially on this: ${aiHint}.` : "Focus on word order, sentence clarity, and completing all task points."}`;
  }

  if (currentStatus === "approved") {
    return `Good work, ${studentName}. Your answer is clear enough and approved. Keep checking word order, article endings, and formal email structure before your next submission.`;
  }

  if (draftWords < 35) {
    return `Hello ${studentName}, please expand your answer. It is too short for full marks. Add all task points, use complete sentences, and include a proper greeting and closing.`;
  }

  return `Hello ${studentName}, good effort. Please revise this work before approval. ${aiHint ? `Main correction: ${aiHint}.` : "Main correction: check word order, verb position, and whether all task points are answered."} After correcting it, submit again for review.`;
}

function getChecklist(feedback) {
  const text = String(feedback || "").trim();
  return [
    { label: "Mentions what to correct", done: /correct|revise|check|improve|change|verb|word order|grammar|structure/i.test(text) },
    { label: "Gives the student a next action", done: /submit|send|reply|revise|write|add|check/i.test(text) },
    { label: "Uses complete sentences", done: /[.!?]/.test(text) && text.length >= 50 },
  ];
}

export default function TutorMarkingPage() {
  const { success, error } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [recentlyResponded, setRecentlyResponded] = useState([]);
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [saveStateById, setSaveStateById] = useState({});
  const [statusById, setStatusById] = useState({});
  const [feedbackById, setFeedbackById] = useState({});
  const [quickSnippetById, setQuickSnippetById] = useState({});
  const [phraseMistakesById, setPhraseMistakesById] = useState({});
  const [selectedDraftTextById, setSelectedDraftTextById] = useState({});
  const [activeReviewId, setActiveReviewId] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");

  const sortedReviews = useMemo(() => {
    return [...pendingReviews].sort((a, b) => toMillis(b?.updatedAt) - toMillis(a?.updatedAt));
  }, [pendingReviews]);

  const filteredReviews = useMemo(() => {
    const now = Date.now();
    return sortedReviews.filter((review) => {
      const reviewSource = review?.source || "unknown";
      if (sourceFilter !== "all" && reviewSource !== sourceFilter) return false;
      const ageMillis = now - toMillis(review?.updatedAt);
      if (ageFilter === "older_24h" && ageMillis < 24 * 60 * 60 * 1000) return false;
      const replies = Array.isArray(review?.studentReplies) ? review.studentReplies : [];
      const hasNewReplies = getNewReplies(review).length > 0;
      if (followUpFilter === "has_followup" && replies.length === 0) return false;
      if (followUpFilter === "no_followup" && replies.length > 0) return false;
      if (followUpFilter === "unread_followup" && !hasNewReplies) return false;
      return true;
    });
  }, [sortedReviews, sourceFilter, ageFilter, followUpFilter]);

  const sourceOptions = useMemo(() => {
    const allSources = new Set(sortedReviews.map((r) => r?.source || "unknown"));
    return ["all", ...Array.from(allSources)];
  }, [sortedReviews]);

  const activeIndex = filteredReviews.findIndex((review) => review.id === activeReviewId);
  const activeReview = activeIndex >= 0 ? filteredReviews[activeIndex] : filteredReviews[0] || null;

  const queueStats = useMemo(() => {
    if (sortedReviews.length === 0) return { pending: 0, oldestHours: 0, unassigned: 0, assigned: 0 };
    const now = Date.now();
    const oldestMillis = Math.min(...sortedReviews.map((review) => toMillis(review?.updatedAt) || now));
    const oldestHours = Math.max(0, Math.floor((now - oldestMillis) / (1000 * 60 * 60)));
    const assigned = sortedReviews.filter((review) => !!review?.assignedTutorId || !!review?.assignedTutorName).length;
    return { pending: sortedReviews.length, oldestHours, assigned, unassigned: sortedReviews.length - assigned };
  }, [sortedReviews]);

  const waitingOnTutorCount = useMemo(
    () => sortedReviews.filter((review) => getNewReplies(review).length > 0).length,
    [sortedReviews],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rows = await loadPendingTutorReviews();
        const drafts = loadAutosavedDrafts();
        setPendingReviews(rows);
        setStatusById(Object.fromEntries(rows.map((row) => [row.id, "approved"])));
        const seededFeedback = {};
        rows.forEach((row) => {
          if (typeof drafts[row.id] === "string") seededFeedback[row.id] = drafts[row.id];
        });
        setFeedbackById(seededFeedback);
        setPhraseMistakesById(Object.fromEntries(rows.map((row) => [row.id, normalizeUiPhraseMistakes(row.phraseMistakes)])));
        if (rows[0]?.id) setActiveReviewId(rows[0].id);
      } catch (err) {
        error(err?.message || "Failed to load pending tutor reviews.");
      } finally {
        setLoading(false);
      }
    })();
  }, [error]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const hasUnsavedDraft = Object.values(feedbackById).some((value) => String(value || "").trim().length > 0)
        || Object.values(phraseMistakesById).some((items) => Array.isArray(items) && items.length > 0);
      if (!hasUnsavedDraft) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [feedbackById, phraseMistakesById]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(feedbackById));
      } catch {
        // Ignore localStorage quota issues.
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [feedbackById]);

  useEffect(() => {
    if (!activeReview && filteredReviews[0]?.id) setActiveReviewId(filteredReviews[0].id);
  }, [activeReview, filteredReviews]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!filteredReviews.length) return;
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
      if (event.key.toLowerCase() === "j" && activeIndex < filteredReviews.length - 1) {
        event.preventDefault();
        setActiveReviewId(filteredReviews[activeIndex + 1].id);
      }
      if (event.key.toLowerCase() === "k" && activeIndex > 0) {
        event.preventDefault();
        setActiveReviewId(filteredReviews[activeIndex - 1].id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filteredReviews]);

  const handleSubmit = async (reviewId, options = {}) => {
    const reviewStatus = options.statusOverride || statusById[reviewId] || "approved";
    let tutorFeedback = feedbackById[reviewId] || "";
    if (!tutorFeedback.trim() && options.fallbackFeedback) tutorFeedback = options.fallbackFeedback;

    try {
      setSavingId(reviewId);
      setSaveStateById((prev) => ({ ...prev, [reviewId]: "saving" }));
      await saveTutorReviewResponse({
        reviewId,
        reviewStatus,
        tutorFeedback,
        reviewedByUid: user?.uid,
        reviewedByName: user?.displayName || user?.email || "Tutor",
        phraseMistakes: phraseMistakesById[reviewId] || [],
      });
      setPendingReviews((prev) => prev.filter((review) => review.id !== reviewId));
      setRecentlyResponded((prev) => {
        const existing = prev.filter((item) => item.id !== reviewId);
        return [
          {
            id: reviewId,
            studentName: activeReview?.studentName || activeReview?.studentId || "Unknown",
            reviewStatus,
            respondedAt: new Date(),
          },
          ...existing,
        ].slice(0, 6);
      });
      setFeedbackById((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      setPhraseMistakesById((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      setQuickSnippetById((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      setSelectedDraftTextById((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      setSaveStateById((prev) => ({ ...prev, [reviewId]: "saved" }));
      success("Tutor response saved. Student will be notified if notifications are enabled.");

      if (options.moveNext) {
        const currentIndex = filteredReviews.findIndex((review) => review.id === reviewId);
        const nextReview = filteredReviews[currentIndex + 1] || filteredReviews[currentIndex - 1] || null;
        setActiveReviewId(nextReview?.id || "");
      }
    } catch (err) {
      setSaveStateById((prev) => ({ ...prev, [reviewId]: "failed" }));
      error(err?.message || "Failed to save tutor response.");
    } finally {
      setSavingId("");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm("Delete this queue item? This cannot be undone.");
    if (!confirmed) return;
    try {
      setDeletingId(reviewId);
      await deleteTutorReview(reviewId);
      setPendingReviews((prev) => prev.filter((review) => review.id !== reviewId));
      setFeedbackById((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      setPhraseMistakesById((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      setQuickSnippetById((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      setSelectedDraftTextById((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      success("Queue item deleted.");
      const currentIndex = filteredReviews.findIndex((review) => review.id === reviewId);
      const nextReview = filteredReviews[currentIndex + 1] || filteredReviews[currentIndex - 1] || null;
      setActiveReviewId(nextReview?.id || "");
    } catch (err) {
      error(err?.message || "Failed to delete queue item.");
    } finally {
      setDeletingId("");
    }
  };

  const handleStudentDraftSelection = (reviewId, event) => {
    const { selectionStart, selectionEnd, value } = event.target;
    if (selectionStart === selectionEnd) {
      setSelectedDraftTextById((prev) => ({ ...prev, [reviewId]: null }));
      return;
    }

    setSelectedDraftTextById((prev) => ({
      ...prev,
      [reviewId]: {
        phrase: value.slice(selectionStart, selectionEnd),
        startOffset: selectionStart,
        endOffset: selectionEnd,
      },
    }));
  };

  const handleAddPhraseMistake = (reviewId) => {
    const selectedDraftText = selectedDraftTextById[reviewId];
    if (!selectedDraftText?.phrase?.trim()) {
      error("Highlight text in the student draft first.");
      return;
    }

    const phraseMistake = {
      id: createPhraseMistakeId(),
      source: "studentDraft",
      phrase: selectedDraftText.phrase,
      startOffset: selectedDraftText.startOffset,
      endOffset: selectedDraftText.endOffset,
      mistakeType: "Verb conjugation",
      correction: "",
      explanation: "",
      severity: "important",
      createdAt: new Date().toISOString(),
    };

    setPhraseMistakesById((prev) => ({
      ...prev,
      [reviewId]: [...(prev[reviewId] || []), phraseMistake],
    }));
    setSaveStateById((prev) => ({ ...prev, [reviewId]: "" }));
  };

  const handleUpdatePhraseMistake = (reviewId, mistakeId, field, value) => {
    setPhraseMistakesById((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || []).map((mistake) => (
        mistake.id === mistakeId ? { ...mistake, [field]: value } : mistake
      )),
    }));
    setSaveStateById((prev) => ({ ...prev, [reviewId]: "" }));
  };

  const handleRemovePhraseMistake = (reviewId, mistakeId) => {
    setPhraseMistakesById((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || []).filter((mistake) => mistake.id !== mistakeId),
    }));
    setSaveStateById((prev) => ({ ...prev, [reviewId]: "" }));
  };

  const handleInsertSnippet = (reviewId, snippetText) => {
    setFeedbackById((prev) => {
      const current = prev[reviewId] || "";
      const spacer = current.trim() ? "\n\n" : "";
      return { ...prev, [reviewId]: `${current}${spacer}${snippetText}` };
    });
    setSaveStateById((prev) => ({ ...prev, [reviewId]: "" }));
  };

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <h2>Tutor Marking Queue</h2>
      <p style={{ marginTop: -8, opacity: 0.8 }}>
        Review student work, insert fast tutor feedback, and save. Desktop now uses a side-by-side marking workspace.
      </p>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "grid", gap: 10 }}>
        <b>Queue overview</b>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <span>Pending: <b>{queueStats.pending}</b></span>
          <span>Waiting on tutor: <b>{waitingOnTutorCount}</b></span>
          <span>Oldest item age: <b>{queueStats.oldestHours}h</b></span>
          <span>Assigned: <b>{queueStats.assigned}</b></span>
          <span>Unassigned: <b>{queueStats.unassigned}</b></span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <label>
            Source
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} style={{ marginLeft: 6 }}>
              {sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
          </label>
          <label>
            Age
            <select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)} style={{ marginLeft: 6 }}>
              <option value="all">all</option>
              <option value="older_24h">&gt;24h</option>
            </select>
          </label>
          <label>
            Follow-up
            <select value={followUpFilter} onChange={(event) => setFollowUpFilter(event.target.value)} style={{ marginLeft: 6 }}>
              <option value="all">all</option>
              <option value="has_followup">has student follow-up</option>
              <option value="no_followup">no student follow-up</option>
              <option value="unread_followup">new unread follow-up</option>
            </select>
          </label>
        </div>
      </section>

      {loading && <p>Loading pending tutor reviews...</p>}
      {!loading && filteredReviews.length === 0 && (
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <p style={{ margin: 0 }}>No actionable reviews found for the current filter set.</p>
        </section>
      )}

      {recentlyResponded.length > 0 && (
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "grid", gap: 6 }}>
          <b>Recently responded</b>
          {recentlyResponded.map((item) => (
            <div key={`responded-${item.id}`} style={{ fontSize: 13, opacity: 0.9 }}>
              {item.studentName} · {item.reviewStatus} · {formatTimestamp(item.respondedAt)} · student notification queued
            </div>
          ))}
        </section>
      )}

      {!loading && activeReview && (() => {
        const review = activeReview;
        const studentDraft = extractText(review, ["studentDraft", "draft", "draftText", "originalDraft", "studentAnswer", "answer"]);
        const aiFeedback = extractText(review, ["aiFeedback", "feedback", "aiReviewFeedback"]);
        const revisedDraft = extractText(review, ["revisedDraft", "improvedDraft", "rewrittenDraft"]);
        const reflection = extractText(review, ["reflection"]);
        const studentReplies = Array.isArray(review.studentReplies) ? [...review.studentReplies] : [];
        const unreadReplyCount = getNewReplies(review).length;
        const currentStatus = statusById[review.id] || "approved";
        const currentFeedback = feedbackById[review.id] || "";
        const canMovePrev = activeIndex > 0;
        const canMoveNext = activeIndex < filteredReviews.length - 1;
        const history = getReviewHistory(review);
        const suggestedFeedback = buildSuggestedFeedback({ review, currentStatus, aiFeedback, revisedDraft, studentDraft, unreadReplyCount });
        const checklist = getChecklist(currentFeedback);
        const priorityBadges = getPriorityBadges(review);
        const phraseMistakes = phraseMistakesById[review.id] || [];
        const selectedDraftText = selectedDraftTextById[review.id];

        studentReplies.sort((a, b) => toMillis(b?.createdAt) - toMillis(a?.createdAt));

        return (
          <section key={review.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 12 }}>
            <div style={{ position: "sticky", top: 8, background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 10, zIndex: 10, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>
                  <b>Student:</b> {review.studentName || review.studentId || "Unknown"} · <b>Updated:</b> {formatTimestamp(review.updatedAt)} · <b>Item:</b> {activeIndex + 1}/{filteredReviews.length}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setActiveReviewId(filteredReviews[activeIndex - 1]?.id)} disabled={!canMovePrev}>Previous (K)</button>
                  <button onClick={() => setActiveReviewId(filteredReviews[activeIndex + 1]?.id)} disabled={!canMoveNext}>Next (J)</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {priorityBadges.map((badge) => <span key={`${review.id}-${badge.label}`} style={badgeStyle(badge.tone)}>{badge.label}</span>)}
                <span style={badgeStyle("info")}>{review.level || review.className || "Level/class not set"}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1.15fr) minmax(320px, 0.85fr)", gap: 14, alignItems: "start" }}>
              <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                <label style={{ display: "grid", gap: 4 }}>
                  Student draft <span style={{ opacity: 0.7, fontSize: 12 }}>({getReadingTimeText(studentDraft)})</span>
                  <textarea
                    readOnly
                    rows={9}
                    value={studentDraft || "No student draft found."}
                    onSelect={(event) => handleStudentDraftSelection(review.id, event)}
                    onMouseUp={(event) => handleStudentDraftSelection(review.id, event)}
                    onKeyUp={(event) => handleStudentDraftSelection(review.id, event)}
                    aria-label="Student draft with selectable text"
                  />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  Revised draft <span style={{ opacity: 0.7, fontSize: 12 }}>({getReadingTimeText(revisedDraft)})</span>
                  <textarea readOnly rows={9} value={revisedDraft || "No revised draft found."} />
                </label>



                <section style={{ display: "grid", gap: 8, border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 8, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <b>Phrase-level mistakes</b>
                      <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.78 }}>
                        Highlight exact text in the Student draft textarea, then add a mistake explanation.
                      </p>
                    </div>
                    <button type="button" onClick={() => handleAddPhraseMistake(review.id)}>
                      Add mistake for selected phrase
                    </button>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    Selected: {selectedDraftText?.phrase?.trim()
                      ? <><b>“{selectedDraftText.phrase}”</b> ({selectedDraftText.startOffset}–{selectedDraftText.endOffset})</>
                      : "Highlight text in the student draft above."}
                  </div>
                  {phraseMistakes.length === 0 && (
                    <p style={{ margin: 0, fontSize: 13, opacity: 0.78 }}>No phrase mistakes added yet. General tutor feedback can still be saved without these.</p>
                  )}
                  {phraseMistakes.map((mistake, index) => (
                    <article key={mistake.id} style={{ display: "grid", gap: 8, border: "1px solid #fbbf24", background: "#fff", borderRadius: 8, padding: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
                        <div style={{ display: "grid", gap: 2 }}>
                          <b>Mistake {index + 1}: “{mistake.phrase}”</b>
                          <span style={{ fontSize: 12, opacity: 0.72 }}>studentDraft · offsets {mistake.startOffset}–{mistake.endOffset}</span>
                        </div>
                        <button type="button" onClick={() => handleRemovePhraseMistake(review.id, mistake.id)} style={{ color: "#991b1b" }}>
                          Remove
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                        <label style={{ display: "grid", gap: 4 }}>
                          Mistake type
                          <select value={mistake.mistakeType} onChange={(event) => handleUpdatePhraseMistake(review.id, mistake.id, "mistakeType", event.target.value)}>
                            {MISTAKE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label style={{ display: "grid", gap: 4 }}>
                          Severity
                          <select value={mistake.severity} onChange={(event) => handleUpdatePhraseMistake(review.id, mistake.id, "severity", event.target.value)}>
                            {SEVERITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                      </div>
                      <label style={{ display: "grid", gap: 4 }}>
                        Correction
                        <input
                          value={mistake.correction}
                          placeholder="Corrected version of the selected phrase"
                          onChange={(event) => handleUpdatePhraseMistake(review.id, mistake.id, "correction", event.target.value)}
                        />
                      </label>
                      <label style={{ display: "grid", gap: 4 }}>
                        Explanation
                        <textarea
                          rows={3}
                          value={mistake.explanation}
                          placeholder="Explain the rule or task issue clearly for the student"
                          onChange={(event) => handleUpdatePhraseMistake(review.id, mistake.id, "explanation", event.target.value)}
                        />
                      </label>
                    </article>
                  ))}
                </section>

                <details open>
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>AI feedback</summary>
                  <textarea readOnly rows={5} value={aiFeedback || "No AI feedback found."} style={{ width: "100%" }} />
                </details>

                <details>
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>Reflection / question</summary>
                  <textarea readOnly rows={4} value={reflection || "No reflection question found."} style={{ width: "100%" }} />
                </details>

                <div style={{ display: "grid", gap: 6 }}>
                  <b>Student follow-up replies ({studentReplies.length})</b>
                  {studentReplies.length === 0 && <p style={{ margin: 0, opacity: 0.75 }}>No student replies yet.</p>}
                  {studentReplies.map((reply, index) => {
                    const isUnread = toMillis(reply?.createdAt) > toMillis(review?.reviewedAt);
                    return (
                      <details key={`${review.id}-reply-${index}`} open={index <= 1 || isUnread}>
                        <summary style={{ cursor: "pointer" }}>
                          {(reply?.studentName || "Student")} ({reply?.studentCode || "—"}) · {formatTimestamp(reply?.createdAt)} {isUnread ? "· NEW" : ""}
                        </summary>
                        <article style={{ border: "1px solid #eee", borderRadius: 6, padding: 8, marginTop: 6, background: isUnread ? "#fffbeb" : "transparent" }}>
                          <div style={{ whiteSpace: "pre-wrap" }}>{reply?.message || "(empty message)"}</div>
                        </article>
                      </details>
                    );
                  })}
                </div>
              </div>

              <aside style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 12, position: "sticky", top: 110, background: "#fff", minWidth: 0 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <b>Tutor decision</b>
                  <div role="radiogroup" aria-label="Review status" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {STATUS_OPTIONS.map((option) => {
                      const selected = currentStatus === option.value;
                      return (
                        <button
                          key={option.value}
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setStatusById((prev) => ({ ...prev, [review.id]: option.value }))}
                          style={{ borderRadius: 999, padding: "7px 12px", ...buttonToneStyle(option.tone, selected) }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <section style={{ display: "grid", gap: 8, border: "2px solid #f59e0b", background: "#fffbeb", borderRadius: 10, padding: 10 }}>
                  <div style={{ display: "grid", gap: 3 }}>
                    <b>Phrase mistakes ({phraseMistakes.length})</b>
                    <span style={{ fontSize: 12, opacity: 0.78 }}>Select exact text in Student draft, then add the mistake.</span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    Selected: {selectedDraftText?.phrase?.trim()
                      ? <><b>“{selectedDraftText.phrase}”</b> ({selectedDraftText.startOffset}–{selectedDraftText.endOffset})</>
                      : "No phrase selected yet."}
                  </div>
                  <button type="button" onClick={() => handleAddPhraseMistake(review.id)} disabled={!studentDraft.trim()}>
                    Add mistake for selected phrase
                  </button>
                  {!studentDraft.trim() && (
                    <p style={{ margin: 0, fontSize: 12, color: "#92400e" }}>No student draft text is available to select for this item.</p>
                  )}
                  {phraseMistakes.length === 0 && studentDraft.trim() && (
                    <p style={{ margin: 0, fontSize: 12, opacity: 0.78 }}>No phrase mistakes added yet.</p>
                  )}
                  {phraseMistakes.map((mistake, index) => (
                    <article key={mistake.id} style={{ display: "grid", gap: 8, border: "1px solid #fbbf24", background: "#fff", borderRadius: 8, padding: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
                        <div style={{ display: "grid", gap: 2 }}>
                          <b>{index + 1}. “{mistake.phrase}”</b>
                          <span style={{ fontSize: 12, opacity: 0.72 }}>studentDraft · {mistake.startOffset}–{mistake.endOffset}</span>
                        </div>
                        <button type="button" onClick={() => handleRemovePhraseMistake(review.id, mistake.id)} style={{ color: "#991b1b", background: "#fff", border: "1px solid #fecaca" }}>
                          Remove
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: 8 }}>
                        <label style={{ display: "grid", gap: 4 }}>
                          Type
                          <select value={mistake.mistakeType} onChange={(event) => handleUpdatePhraseMistake(review.id, mistake.id, "mistakeType", event.target.value)}>
                            {MISTAKE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label style={{ display: "grid", gap: 4 }}>
                          Severity
                          <select value={mistake.severity} onChange={(event) => handleUpdatePhraseMistake(review.id, mistake.id, "severity", event.target.value)}>
                            {SEVERITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                      </div>
                      <label style={{ display: "grid", gap: 4 }}>
                        Correction
                        <input
                          value={mistake.correction}
                          placeholder="Corrected phrase"
                          onChange={(event) => handleUpdatePhraseMistake(review.id, mistake.id, "correction", event.target.value)}
                        />
                      </label>
                      <label style={{ display: "grid", gap: 4 }}>
                        Explanation
                        <textarea
                          rows={3}
                          value={mistake.explanation}
                          placeholder="Short rule or explanation"
                          onChange={(event) => handleUpdatePhraseMistake(review.id, mistake.id, "explanation", event.target.value)}
                        />
                      </label>
                    </article>
                  ))}
                </section>

                <div style={{ display: "grid", gap: 6, border: "1px solid #dbeafe", background: "#eff6ff", borderRadius: 8, padding: 10 }}>
                  <b>Suggested tutor feedback</b>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{suggestedFeedback}</div>
                  <button type="button" onClick={() => handleInsertSnippet(review.id, suggestedFeedback)}>
                    Use suggested comment
                  </button>
                </div>

                <label style={{ display: "grid", gap: 4 }}>
                  Tutor feedback
                  <textarea
                    rows={9}
                    placeholder="Add tutor comments for the student..."
                    aria-label="Tutor feedback"
                    value={currentFeedback}
                    onChange={(e) => {
                      setFeedbackById((prev) => ({ ...prev, [review.id]: e.target.value }));
                      setSaveStateById((prev) => ({ ...prev, [review.id]: "" }));
                    }}
                  />
                </label>

                <div style={{ display: "grid", gap: 6 }}>
                  <b>Quick comment</b>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
                    <select
                      value={quickSnippetById[review.id] || FEEDBACK_SNIPPETS[0]?.key || ""}
                      onChange={(event) => setQuickSnippetById((prev) => ({ ...prev, [review.id]: event.target.value }))}
                      aria-label="Quick comment snippet"
                    >
                      {FEEDBACK_SNIPPETS.map((snippet) => <option key={snippet.key} value={snippet.key}>{snippet.label}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const selectedSnippet = FEEDBACK_SNIPPETS.find((snippet) => snippet.key === (quickSnippetById[review.id] || FEEDBACK_SNIPPETS[0]?.key));
                        if (selectedSnippet) handleInsertSnippet(review.id, selectedSnippet.text);
                      }}
                    >
                      Insert
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>{getActionableHint(currentFeedback)}</p>
                </div>

                <div style={{ display: "grid", gap: 5, border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
                  <b>Feedback checklist</b>
                  {checklist.map((item) => (
                    <span key={item.label} style={{ fontSize: 12, color: item.done ? "#166534" : "#92400e" }}>
                      {item.done ? "✓" : "•"} {item.label}
                    </span>
                  ))}
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <button
                    onClick={() => handleSubmit(review.id, { moveNext: true, fallbackFeedback: suggestedFeedback })}
                    disabled={savingId === review.id || deletingId === review.id}
                    style={{ background: currentStatus === "approved" ? "#15803d" : "#b45309", color: "#fff", border: "1px solid transparent", fontWeight: 800 }}
                  >
                    {savingId === review.id ? "Saving..." : `Save: ${STATUS_OPTIONS.find((option) => option.value === currentStatus)?.label || "selected decision"}`}
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={savingId === review.id || deletingId === review.id}
                    style={{ background: "#fff", color: "#991b1b", border: "1px solid #fecaca" }}
                  >
                    {deletingId === review.id ? "Deleting..." : "Delete submission"}
                  </button>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>
                    {saveStateById[review.id] === "saving" && "Saving..."}
                    {saveStateById[review.id] === "saved" && "Saved · student notification queued"}
                    {saveStateById[review.id] === "failed" && "Save failed — retry"}
                    {!saveStateById[review.id] && "Autosave draft enabled · student will be notified after save"}
                  </span>
                </div>
              </aside>
            </div>

            <details style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Review history</summary>
              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                {history.length === 0 && <p style={{ margin: 0, opacity: 0.75 }}>No prior history available for this thread.</p>}
                {history.map((item, idx) => (
                  <div key={`${review.id}-hist-${idx}`} style={{ borderLeft: "2px solid #ddd", paddingLeft: 8 }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {formatTimestamp(item?.reviewedAt)} · {item?.reviewerName || "Tutor"} · {item?.reviewStatus || "status unavailable"}
                    </div>
                    {item?.tutorFeedback && <div style={{ marginTop: 3, whiteSpace: "pre-wrap" }}>{item.tutorFeedback}</div>}
                    {Array.isArray(item?.phraseMistakes) && item.phraseMistakes.length > 0 && (
                      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                        {item.phraseMistakes.map((mistake) => (
                          <li key={mistake.id || `${mistake.phrase}-${mistake.startOffset}`} style={{ fontSize: 12 }}>
                            <b>{mistake.mistakeType || "Phrase mistake"}:</b> “{mistake.phrase}” → {mistake.correction}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </section>
        );
      })()}
    </div>
  );
}
