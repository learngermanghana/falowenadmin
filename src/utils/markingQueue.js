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

export function requiresDuplicateTutorVerification(row = {}) {
  const raw = row.raw || {};
  return Boolean(
    row.duplicateScoreBlocked ||
    row.tutorVerificationRequired ||
    raw.duplicateScoreBlocked ||
    raw.tutorVerificationRequired,
  );
}

// Only actual tutor-marked assignments belong in the incoming marking queue.
// Older A1 self-practice posts often lack an assignment ID altogether.
export function isNonMarkablePracticeSubmission(row = {}) {
  const raw = row.raw || {};
  const explicitTutorMarking = [raw.requiresTutorMarking, raw.tutorMarked, raw.teacherMarked].some((v) => v === true)
    || /tutor[-_ ]?marked|teacher[-_ ]?marked/i.test(String(raw.assessmentType || raw.markingType || ""));
  if (explicitTutorMarking) return false;
  const indicators = [
    raw.activityType, raw.assignmentType, raw.submissionType, raw.assessmentType,
    raw.markingType, raw.mode, raw.source, raw.origin, raw.workbookType,
    raw.pageUrl, raw.workbookUrl, raw.lessonUrl, raw.sourcePath, row.path,
  ].map(normalize).join(" ");
  if (/self[-_ ]?practic|self[-_ ]?learning|practice[-_ ]?only|ungraded|a1-day-6-family-and-hobbies-workbook/.test(indicators)) return true;
  if (raw.requiresTutorMarking === false || raw.tutorMarked === false || raw.teacherMarked === false) return true;
  const level = normalize(row.level || raw.level);
  const assignmentId = normalize(row.assignmentId || row.assignmentKey || raw.assignmentId || raw.assignment_id || "");
  const submissionPath = normalize(row.path);
  // A1 general discussion/practice posts with "Unknown assignment" are not
  // independently identified teacher assignments; keep real A1 assignment IDs.
  if (level === "a1" && !/^a1[-.][\w.-]+$/.test(assignmentId) && /\/posts\//.test(submissionPath)) return true;
  if (level === "a1" && /^a1-2\.3(?:-practice)?$/.test(assignmentId)) return true;
  return false;
}

export function shouldIncludeInIncomingQueue(row = {}, lastScore = null, queueStartDate = "") {
  const raw = row.raw || {};
  if (isNonMarkablePracticeSubmission(row)) return false;
  const submissionTime = getSubmissionTimestamp(row);
  const queueStartTime = timestampMillis(queueStartDate);
  if (queueStartTime && (!submissionTime || submissionTime < queueStartTime)) return false;
  if (raw.hiddenFromMarkingQueue || raw.hiddenAt) return false;

  // Duplicate-score blocks are an explicit tutor-verification state. Preserve
  // them before comparing the canonical score timestamp, which may belong to
  // the earlier score that caused the block.
  if (requiresDuplicateTutorVerification(row)) return true;

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
