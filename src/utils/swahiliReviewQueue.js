export const submissionDocId = day => [26, 28].includes(day) ? `b1-day-${day}` : `day-${day}`;
export const submissionLessonId = day => "swahili-" + submissionDocId(day);

// Firestore user-owned lesson documents may contain learner-controlled fields.
// The canonical path determines ownership; never derive review recipient IDs
// from a submitted studentId, userId or display name.
export function canonicalSwahiliSubmission(entry, day = 1) {
  if (!Number.isInteger(day) || (!(day >= 1 && day <= 20) && ![26, 28].includes(day))) return null;
  const path = String(entry?.ref?.path || "");
  const parts = path.split("/");
  if (parts.length !== 4 || parts[0] !== "users" || !parts[1] || parts[2] !== "swahiliLessons" || parts[3] !== submissionDocId(day)) return null;
  const ownerId = parts[1];
  const data = entry.data() || {};
  if (data.studentId && data.studentId !== ownerId) return null;
  if (data.userId && data.userId !== ownerId) return null;
  if (data.program !== "swahili" || data.lessonId !== submissionLessonId(day) || data.status !== "submitted") return null;
  return { ...data, studentId: ownerId, userId: ownerId, path };
}

export function swahiliReviewDocId(studentId, day) {
  return day === 1 ? studentId : `${studentId}_${submissionDocId(day)}`;
}

export function getSwahiliReviewStatus(submission, review) {
  if (!review || review.studentId !== submission.studentId || review.lessonId !== submission.lessonId) {
    return "awaiting_review";
  }
  // A review applies only to the exact submitted workbook version. A learner
  // who submits an updated Day 1/6 workbook must return to the To mark queue.
  const submittedVersion = submission.submittedAt?.seconds != null
    ? `${submission.submittedAt.seconds}:${submission.submittedAt.nanoseconds || 0}`
    : "";
  if (review.submissionVersion && submittedVersion && review.submissionVersion !== submittedVersion) {
    return "awaiting_review";
  }
  const submittedAt = submission.submittedAt?.toMillis?.();
  const reviewedAt = review.reviewedAt?.toMillis?.();
  if (submittedAt && (!reviewedAt || reviewedAt < submittedAt)) return "awaiting_review";
  return review.status === "reviewed" || review.status === "needs_revision" ? review.status : "awaiting_review";
}


// As in the German Marking queue, display only actionable, unreviewed work.
// Finished scores remain in Results; do not duplicate an archive in Marking.
// "Needs revision" is a completed tutor decision until the learner resubmits.
export const isSwahiliMarkedStatus = (status) =>
  status === "reviewed" || status === "needs_revision";

export function filterSwahiliMarkingRows(rows = [], statusesByPath = {}) {
  return rows.filter((row) => !isSwahiliMarkedStatus(statusesByPath[row.path]));
}
