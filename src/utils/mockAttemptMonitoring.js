export const MOCK_SECTIONS = ["lesen", "hoeren", "schreiben", "sprechen"];

export function toAttemptMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (Number.isFinite(value?.seconds)) return Number(value.seconds) * 1000;
  if (typeof value === "number") return value;
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : 0;
}

export function remainingSeconds(deadline, now = Date.now()) {
  const millis = toAttemptMillis(deadline);
  return millis ? Math.max(0, Math.ceil((millis - now) / 1000)) : null;
}

export function clockLabel(seconds) {
  if (seconds === null || !Number.isFinite(seconds)) return "Not recorded";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function mockSectionProgress(attempt = {}) {
  const completed = Array.isArray(attempt.completedSections)
    ? MOCK_SECTIONS.filter(section => attempt.completedSections.includes(section))
    : [];
  return { completed, count: completed.length, total: 4 };
}

export function mockActivityLabel(attempt = {}, now = Date.now()) {
  if (attempt.status === "completed") return "Completed";
  const update = toAttemptMillis(attempt.updatedAt || attempt.startedAt);
  if (!update) return "In progress · sync unknown";
  return now - update > 10 * 60 * 1000 ? "In progress · no recent update" : "In progress · recently updated";
}

export function filterMockAttempts(attempts = [], query = "", status = "all") {
  const needle = query.trim().toLowerCase();
  return attempts.filter(attempt =>
    (status === "all" || attempt.status === status) &&
    [attempt.studentName, attempt.studentEmail, attempt.uid, attempt.mockId, attempt.level, attempt.section]
      .some(value => String(value || "").toLowerCase().includes(needle))
  );
}

const FINISHED_TIMED_STATUSES = new Set(["submitted", "completed", "complete", "finished"]);

export function timedAttemptStatus(attempt = {}) {
  // Only a submitted attempt is completed. A lock that expired without a
  // submission is still unfinished; don't call it a completed student test.
  return FINISHED_TIMED_STATUSES.has(String(attempt.status || "").trim().toLowerCase())
    ? "completed" : "in_progress";
}

export function timedAttemptStatusLabel(attempt = {}, now = Date.now()) {
  if (timedAttemptStatus(attempt) === "completed") return "Completed";
  const start = toAttemptMillis(attempt.startedAt) || toAttemptMillis(attempt.clientStartedAt);
  const duration = Number(attempt.durationSeconds) || 0;
  const deadline = start && duration > 0 ? start + duration * 1000 : 0;
  if (String(attempt.status || "").toLowerCase() === "expired" || (deadline && deadline <= now)) {
    return "Time expired · not submitted";
  }
  return "In progress";
}

export function filterTimedAttempts(attempts = [], query = "", status = "all") {
  const needle = query.trim().toLowerCase();
  return attempts.filter(attempt =>
    (status === "all" || timedAttemptStatus(attempt) === status) &&
    [attempt.studentName, attempt.fullName, attempt.name, attempt.studentEmail, attempt.studentCode,
      attempt.studentId, attempt.assignmentKey, attempt.level, attempt.status]
      .some(value => String(value || "").toLowerCase().includes(needle))
  );
}
