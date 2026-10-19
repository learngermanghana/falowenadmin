// Campus timed attempts live in submissionLocks, not the submissions collection.
// Match the deterministic lock ID built by SharedTimedAssignment on Falowen.
const normalizePart = value => String(value || "").trim().toLowerCase()
  .replace(/[^a-z0-9._-]/g, "_").slice(0, 140);
export const normalizeTimedAssignmentKey = value => String(value || "").trim().toUpperCase();
export function buildCampusTimedAttemptId(studentUid, assignmentKey) {
  const uid = normalizePart(studentUid);
  const assignment = normalizePart(assignmentKey);
  if (!uid || !/^(a1|a2|b1)-[a-z0-9._-]+$/.test(assignment)) return "";
  return `timed__${uid}__${assignment}`;
}
export function isMatchingCampusTimer(record, assignmentKey) {
  return Boolean(record && record.id?.startsWith("timed__")
    && normalizeTimedAssignmentKey(record.assignmentKey) === normalizeTimedAssignmentKey(assignmentKey)
    && record.studentId && (record.timerRecord === true || record.timerRecord == null));
}
