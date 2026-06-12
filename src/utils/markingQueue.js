const OPEN_SUBMISSION_STATUSES = new Set(["new", "submitted", "pending", "pending_review", "resubmitted"]);
const TERMINAL_SUBMISSION_STATUSES = new Set(["marked", "sent", "done", "completed", "complete", "approved", "hidden", "archived", "saved"]);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getSubmissionTimestamp(row = {}) {
  const raw = row.raw || {};
  return timestampMillis(
    row.resubmittedAt || raw.resubmittedAt || row.submittedAt || raw.submittedAt || row.createdAt || raw.createdAt || raw.timestamp || raw.date,
  );
}

export function isResubmission(row = {}) {
  const raw = row.raw || {};
  const status = normalize(raw.workflowStatus || raw.status || row.status);
  return Boolean(row.isResubmission || raw.isResubmission || status === "resubmitted" || Number(row.attempt || raw.attempt || raw.attemptNumber) > 1);
}

export function shouldIncludeInIncomingQueue(row = {}, lastScore = null, queueStartDate = "") {
  const raw = row.raw || {};
  const submissionTime = getSubmissionTimestamp(row);
  const queueStartTime = timestampMillis(queueStartDate);
  if (queueStartTime && (!submissionTime || submissionTime < queueStartTime)) return false;
  if (raw.hiddenFromMarkingQueue || raw.hiddenAt) return false;

  const scoreTime = timestampMillis(lastScore?.markedAt || lastScore?.scoredAt || lastScore?.updatedAt || lastScore?.createdAt || lastScore?.date);
  if (lastScore && scoreTime && (!submissionTime || submissionTime <= scoreTime)) return false;

  // A newer attempt must remain visible even when an overwritten submission document
  // still carries the previous attempt's score, feedback, or terminal marking status.
  if (lastScore && scoreTime && submissionTime > scoreTime) return true;

  const markingStatus = normalize(row.markingStatus || raw.markingStatus);
  const workflowStatus = normalize(raw.workflowStatus || raw.status || row.status);
  if (OPEN_SUBMISSION_STATUSES.has(markingStatus) || OPEN_SUBMISSION_STATUSES.has(workflowStatus) || isResubmission(row)) return true;
  if (TERMINAL_SUBMISSION_STATUSES.has(markingStatus) || TERMINAL_SUBMISSION_STATUSES.has(workflowStatus)) return false;
  if (row.feedbackSentToStudent || raw.feedbackSentToStudent) return false;
  if (row.finalScore !== null && row.finalScore !== undefined) return false;
  if (raw.aiFeedback || raw.tutorFeedback || raw.feedback) return false;
  return true;
}
