import { canonicalAssignmentId, normalizeStudentCode } from "./studentResultUpsert.js";

export function matchingResultSubmissions(result, submissions, studentCode) {
  const code = normalizeStudentCode(studentCode);
  const assignment = canonicalAssignmentId(result);
  const path = String(result.submissionPath || "");
  const id = String(result.submissionId || "");
  return submissions.filter((submission) => {
    if (normalizeStudentCode(submission.studentCode) !== code) return false;
    return (path && submission.path === path) || (id && submission.id === id)
      || (assignment && canonicalAssignmentId(submission) === assignment);
  }).map((submission) => ({
    ...submission,
    linkedToResult: Boolean((path && submission.path === path) || (id && submission.id === id)),
  })).sort((a, b) => Number(b.linkedToResult) - Number(a.linkedToResult)
    || (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
}

export function submittedWorkText(submission) {
  const raw = submission.raw || {};
  const value = raw.text ?? raw.answer ?? raw.answers ?? raw.content ?? raw.message
    ?? raw.submissionText ?? raw.writing ?? raw.work ?? submission.text ?? "";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

export function submittedWorkFiles(submission) {
  const raw = submission.raw || {};
  const candidates = [raw.attachments, raw.files, raw.fileUrls, raw.fileUrl, raw.audioUrl, raw.imageUrl, raw.pdfUrl].flatMap((value) => Array.isArray(value) ? value : value ? [value] : []);
  const files = new Map();
  for (const candidate of candidates) {
    const url = typeof candidate === "string" ? candidate : candidate?.url || candidate?.downloadURL;
    if (!/^https?:\/\//i.test(url || "")) continue;
    if (files.has(url)) continue;
    files.set(url, { url, name: candidate?.name || candidate?.fileName || `Submitted file ${files.size + 1}` });
  }
  return [...files.values()];
}
