function normalizeStatus(value) {
  return String(value || "scheduled").trim().toLowerCase();
}

function datePart(value) {
  if (!value) return "";
  if (typeof value?.toDate === "function") return value.toDate().toISOString().slice(0, 10);
  if (typeof value?.toMillis === "function") return new Date(value.toMillis()).toISOString().slice(0, 10);
  if (typeof value === "object" && Number.isFinite(value.seconds)) return new Date(Number(value.seconds) * 1000).toISOString().slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value || "").slice(0, 10) : parsed.toISOString().slice(0, 10);
}

function hasMarkedStudent(students = {}) {
  if (!students || typeof students !== "object") return false;
  return Object.values(students).some((entry) => {
    if (entry === true) return true;
    if (!entry || typeof entry !== "object") return false;
    return entry.present === true
      || Boolean(entry.checkedInAt || entry.checkinAt || entry.markedAt)
      || ["present", "late", "absent", "excused"].includes(String(entry.status || "").toLowerCase());
  });
}

function hasMarkedRecord(records = []) {
  return Array.isArray(records) && records.some((record) => {
    if (!record || typeof record !== "object") return Boolean(record);
    return Boolean(record.present)
      || Boolean(record.checkedInAt || record.checkinAt || record.markedAt)
      || ["present", "late", "absent", "excused"].includes(String(record.status || "").toLowerCase());
  });
}

export function sessionHasAttendanceData(record = null) {
  if (!record) return false;
  if (record.markedBy || record.savedBy || record.attendanceSavedAt || record.submittedAt) return true;
  if (hasMarkedStudent(record.students)) return true;
  if (hasMarkedRecord(record.records) || hasMarkedRecord(record.attendanceRecords) || hasMarkedRecord(record.checkins)) return true;
  const arrays = [record.studentIds, record.presentStudentIds, record.absentStudentIds, record.lateStudentIds, record.attendees];
  return arrays.some((value) => Array.isArray(value) && value.length > 0);
}

export function isProtectedRebuildSession(session = {}) {
  const status = normalizeStatus(session.status);
  if (["completed", "live", "cancelled", "rescheduled"].includes(status)) return true;

  return Boolean(
    session.manualDateOverride
    || session.manualDateOverrideAt
    || session.manualDateOverrideBy
    || session.rescheduledAt
    || session.rescheduledBy
    || session.previousStartsAt
    || session.previousEndsAt
    || session.rescheduleReason
  );
}

function isLockedRebuildSession(session = {}) {
  const status = normalizeStatus(session.status);
  return ["completed", "live", "cancelled"].includes(status);
}

function sessionTime(session = {}) {
  if (typeof session.startsAt?.toDate === "function") return session.startsAt.toDate().getTime();
  const parsed = new Date(session.startsAt || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sessionCurriculumIndex(session = {}) {
  if (session.curriculumIndex !== undefined && session.curriculumIndex !== null && session.curriculumIndex !== "") {
    const direct = Number(session.curriculumIndex);
    if (Number.isFinite(direct) && direct > 0) return direct;
  }
  if (session.curriculumDay !== undefined && session.curriculumDay !== null && session.curriculumDay !== "") {
    const day = Number(session.curriculumDay);
    if (Number.isFinite(day) && day >= 0) return day + 1;
  }
  return 0;
}

function sessionIsBeforeClassStart(session = {}, klass = {}) {
  const startDate = String(klass.startDate || "").trim();
  if (!startDate || normalizeStatus(session.status) !== "scheduled") return false;
  if (isProtectedRebuildSession(session)) return false;
  const sessionDate = datePart(session.startsAt);
  return Boolean(sessionDate && sessionDate < startDate);
}

function chooseExistingSession({ occurrence, index, sessions, existingById, usedIds, klass }) {
  const exact = existingById.get(occurrence.id);
  if (exact && !usedIds.has(exact.id) && !sessionIsBeforeClassStart(exact, klass)) return exact;

  const wantedIndex = index + 1;
  const byCurriculum = sessions.find((session) => sessionCurriculumIndex(session) === wantedIndex && !usedIds.has(session.id) && !sessionIsBeforeClassStart(session, klass));
  if (byCurriculum) return byCurriculum;

  return null;
}

export function buildRebuildClassSessionsPlan({ klass = {}, occurrences = [], sessions = [], attendanceBySessionId = new Map(), buildCurriculumPatch = null } = {}) {
  const existingById = new Map(sessions.map((session) => [session.id, session]));
  const sortedSessions = [...sessions].sort((left, right) => {
    const leftIndex = sessionCurriculumIndex(left);
    const rightIndex = sessionCurriculumIndex(right);
    if (leftIndex && rightIndex && leftIndex !== rightIndex) return leftIndex - rightIndex;
    if (leftIndex && !rightIndex) return -1;
    if (!leftIndex && rightIndex) return 1;
    return sessionTime(left) - sessionTime(right);
  });
  const usedIds = new Set();
  const desiredIds = new Set();
  const deletions = [];
  const preserved = [];
  const upserts = [];

  occurrences.forEach((occurrence, index) => {
    const existing = chooseExistingSession({ occurrence, index, sessions: sortedSessions, existingById, usedIds, klass });
    if (existing) usedIds.add(existing.id);

    const targetOccurrence = existing ? { ...occurrence, id: existing.id } : occurrence;
    desiredIds.add(targetOccurrence.id);

    const curriculumPatch = typeof buildCurriculumPatch === "function" ? buildCurriculumPatch(klass.levelId, index, existing || {}, { force: !existing }) : null;
    const lockedExisting = existing && (isLockedRebuildSession(existing) || isProtectedRebuildSession(existing));
    const basePatch = lockedExisting
      ? { classId: targetOccurrence.classId, classRecordId: klass.id || targetOccurrence.classId, className: klass.name || "" }
      : { ...targetOccurrence, classId: targetOccurrence.classId, classRecordId: klass.id || targetOccurrence.classId, className: klass.name || "" };

    upserts.push({ occurrence: targetOccurrence, existing, patch: { ...basePatch, ...(curriculumPatch || {}) }, curriculumMapped: Boolean(curriculumPatch) });
  });

  sessions.forEach((session) => {
    if (usedIds.has(session.id) || desiredIds.has(session.id)) return;
    const attendance = attendanceBySessionId.get(session.id);
    if (!isProtectedRebuildSession(session) && !sessionHasAttendanceData(session) && !sessionHasAttendanceData(attendance)) {
      deletions.push(session);
    } else {
      preserved.push(session);
    }
  });

  return { desiredIds, deletions, preserved, upserts };
}

export function buildFinalRebuildSessionList(plan = {}) {
  const upserted = Array.isArray(plan.upserts)
    ? plan.upserts.map(({ existing, patch }) => ({ ...(existing || {}), ...(patch || {}) }))
    : [];
  const preserved = Array.isArray(plan.preserved) ? plan.preserved : [];
  return [...upserted, ...preserved];
}
