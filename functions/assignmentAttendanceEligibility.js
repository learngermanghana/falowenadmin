"use strict";

const SUBMISSION_EVIDENCE_FIELDS = [
  "submissionText",
  "answer",
  "answers",
  "workContent",
  "text",
  "content",
  "writing",
  "work",
  "response",
  "responses",
  "objectiveAnswers",
  "selectedAnswers",
  "answersByQuestion",
  "taskAnswers",
  "responseData",
  "correctedText",
  "files",
  "attachments",
  "uploads",
  "media",
  "audioUrl",
  "audioURL",
  "recordingUrl",
  "recordingURL",
  "fileUrl",
  "fileURL",
  "imageUrl",
  "imageURL",
  "videoUrl",
  "videoURL",
];

function hasMeaningfulValue(value, seen = new Set()) {
  if (typeof value === "string") return /[\p{L}\p{N}]/u.test(value);
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item, seen));
  return Object.values(value).some((item) => hasMeaningfulValue(item, seen));
}

function hasMeaningfulSubmissionWork(submission = {}) {
  return SUBMISSION_EVIDENCE_FIELDS.some((field) => hasMeaningfulValue(submission[field]));
}

function assignmentAttendanceEligibility(submission = {}) {
  const status = String(submission.status || submission.submissionStatus || "").trim().toLowerCase();
  if (["draft", "deleted", "rejected"].includes(status)) {
    return { eligible: false, reason: `submission_${status}` };
  }
  if (!hasMeaningfulSubmissionWork(submission)) {
    return { eligible: false, reason: "no_meaningful_work" };
  }
  return { eligible: true, reason: "eligible" };
}

module.exports = {
  SUBMISSION_EVIDENCE_FIELDS,
  hasMeaningfulValue,
  hasMeaningfulSubmissionWork,
  assignmentAttendanceEligibility,
};
