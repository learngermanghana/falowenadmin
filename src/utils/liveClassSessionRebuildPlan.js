export function sessionHasAttendanceData(record = null) {
  if (!record) return false;
  const containers = [record.students, record.attendance, record.attendanceRecords, record.records, record.checkins];
  if (containers.some((value) => value && typeof value === "object" && Object.keys(value).length > 0)) return true;
  const arrays = [record.studentIds, record.presentStudentIds, record.absentStudentIds, record.lateStudentIds, record.attendees];
  return arrays.some((value) => Array.isArray(value) && value.length > 0);
}

export function isProtectedRebuildSession(session = {}) {
  const status = String(session.status || "scheduled").toLowerCase();
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

export function buildRebuildClassSessionsPlan({ klass = {}, occurrences = [], sessions = [], attendanceBySessionId = new Map(), buildCurriculumPatch = null } = {}) {
  const desiredIds = new Set(occurrences.map((occurrence) => occurrence.id));
  const existingById = new Map(sessions.map((session) => [session.id, session]));
  const deletions = [];
  const preserved = [];
  const upserts = [];

  sessions.forEach((session) => {
    if (desiredIds.has(session.id)) return;
    const attendance = attendanceBySessionId.get(session.id);
    if (!isProtectedRebuildSession(session) && !sessionHasAttendanceData(session) && !sessionHasAttendanceData(attendance)) {
      deletions.push(session);
    } else {
      preserved.push(session);
    }
  });

  occurrences.forEach((occurrence, index) => {
    const existing = existingById.get(occurrence.id);
    const curriculumPatch = typeof buildCurriculumPatch === "function" ? buildCurriculumPatch(klass.levelId, index, existing || {}, { force: !existing }) : null;
    const protectedExisting = existing && isProtectedRebuildSession(existing);
    const basePatch = protectedExisting
      ? { classId: occurrence.classId, classRecordId: klass.id || occurrence.classId, className: klass.name || "" }
      : { ...occurrence, classId: occurrence.classId, classRecordId: klass.id || occurrence.classId, className: klass.name || "" };
    upserts.push({ occurrence, existing, patch: { ...basePatch, ...(curriculumPatch || {}) }, curriculumMapped: Boolean(curriculumPatch) });
  });

  return { desiredIds, deletions, preserved, upserts };
}
