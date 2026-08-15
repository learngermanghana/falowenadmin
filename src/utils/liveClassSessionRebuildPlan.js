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

function hasManualScheduleHistory(session = {}) {
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

function curriculumPosition(session = {}) {
  const index = Number(session.curriculumIndex || 0);
  return Number.isInteger(index) && index > 0 ? index - 1 : null;
}

function isOrientationSession(session = {}) {
  const ids = [session.assignment_id, ...(session.assignmentIds || []), ...(session.curriculumIds || [])]
    .map((value) => String(value || "").trim().toUpperCase());
  return curriculumPosition(session) === 0
    || ids.some((id) => id.endsWith("-ORIENTATION") || id.endsWith("-TUTORIAL"))
    || /(?:day\s*0|einführung|einfuehrung|orientierung|orientation)/i.test(String(session.topic || ""));
}

export function isAutomaticCompletion(session = {}) {
  return normalizeStatus(session.status) === "completed"
    && (
      String(session.completionSource || "").trim().toLowerCase() === "automatic"
      || String(session.completedBy || "").trim().toLowerCase() === "system:auto-session-completion"
      || Boolean(session.autoCompletedAt)
    );
}

export function isDisposableAutomaticCompletion(session = {}, attendance = null) {
  return isAutomaticCompletion(session)
    && !hasManualScheduleHistory(session)
    && !sessionHasAttendanceData(session)
    && !sessionHasAttendanceData(attendance);
}

export function isProtectedRebuildSession(session = {}) {
  const status = normalizeStatus(session.status);
  if (["completed", "live", "cancelled", "rescheduled"].includes(status)) return true;

  return hasManualScheduleHistory(session);
}

function isLockedRebuildSession(session = {}) {
  const status = normalizeStatus(session.status);
  return ["completed", "live", "cancelled"].includes(status);
}

function sessionIsBeforeClassStart(session = {}, klass = {}) {
  const startDate = String(klass.startDate || "").trim();
  if (!startDate || normalizeStatus(session.status) !== "scheduled") return false;
  if (isProtectedRebuildSession(session)) return false;
  const sessionDate = datePart(session.startsAt);
  return Boolean(sessionDate && sessionDate < startDate);
}

function chooseExistingSession({ occurrence, existingById, usedIds, klass }) {
  const exact = existingById.get(occurrence.id);
  if (exact && !usedIds.has(exact.id) && !sessionIsBeforeClassStart(exact, klass)) return exact;

  return undefined;
}

export function buildRebuildClassSessionsPlan({ klass = {}, occurrences = [], sessions = [], attendanceBySessionId = new Map(), buildCurriculumPatch = null } = {}) {
  const existingById = new Map(sessions.map((session) => [session.id, session]));
  const usedIds = new Set();
  const desiredIds = new Set();
  const deletions = [];
  const preserved = [];
  const upserts = [];

  // A protected session with an explicit curriculum position is historical
  // truth.  In particular, a manual Day 1 must anchor the next generated row
  // at Day 2; unrelated auto-completed records before it must not shift it.
  const legitimate = sessions.filter((session) => {
    const attendance = attendanceBySessionId.get(session.id);
    const onOrAfterClassStart = !klass.startDate || datePart(session.startsAt) >= String(klass.startDate);
    return curriculumPosition(session) !== null
      && onOrAfterClassStart
      && !isDisposableAutomaticCompletion(session, attendance)
      && (isProtectedRebuildSession(session) || sessionHasAttendanceData(session) || sessionHasAttendanceData(attendance));
  });
  const legitimateIds = new Set(legitimate.map((session) => session.id));
  const lastLegitimateTime = legitimate.reduce((latest, session) => {
    const time = new Date(session.startsAt || 0).getTime();
    return Number.isFinite(time) ? Math.max(latest, time) : latest;
  }, 0);
  let nextCurriculumPosition = legitimate.reduce((next, session) => Math.max(next, curriculumPosition(session) + 1), 0);
  let orientationId = legitimate.find(isOrientationSession)?.id || "";
  if (!orientationId) {
    orientationId = sessions
      .filter((session) => isOrientationSession(session) && isDisposableAutomaticCompletion(session, attendanceBySessionId.get(session.id)))
      .sort((left, right) => new Date(left.startsAt || 0) - new Date(right.startsAt || 0))[0]?.id || "";
  }

  occurrences.forEach((occurrence) => {
    const existing = chooseExistingSession({ occurrence, existingById, usedIds, klass });
    const attendance = existing ? attendanceBySessionId.get(existing.id) : null;
    const disposable = existing && isDisposableAutomaticCompletion(existing, attendance);
    const keepOrientation = disposable && existing.id === orientationId;
    const historicalGap = !existing && lastLegitimateTime && new Date(occurrence.startsAt || 0).getTime() <= lastLegitimateTime;

    // Do not recreate schedule slots that pre-date the latest real historical
    // lesson. Disposable automatic rows in those slots are stale generator
    // artefacts, except for the single canonical orientation.
    if ((disposable && !keepOrientation) || historicalGap) return;
    if (existing) usedIds.add(existing.id);

    const targetOccurrence = existing ? { ...occurrence, id: existing.id } : occurrence;
    desiredIds.add(targetOccurrence.id);

    const lockedExisting = existing && (isLockedRebuildSession(existing) || isProtectedRebuildSession(existing));
    const repairableAutomaticCompletion = existing && isDisposableAutomaticCompletion(existing, attendance);
    let curriculumIndex;
    if (legitimateIds.has(existing?.id)) curriculumIndex = curriculumPosition(existing);
    else if (keepOrientation) curriculumIndex = 0;
    else curriculumIndex = nextCurriculumPosition++;
    const curriculumPatch = typeof buildCurriculumPatch === "function"
      ? buildCurriculumPatch(klass.levelId, curriculumIndex, existing || {}, { force: !lockedExisting || repairableAutomaticCompletion })
      : null;
    // Keep completed/live/cancelled session timing and status immutable. A system
    // auto-completion with no real attendance or manual history may still have
    // stale curriculum metadata, so only its curriculum patch is forced above.
    const basePatch = lockedExisting
      ? { classId: targetOccurrence.classId, classRecordId: klass.id || targetOccurrence.classId, className: klass.name || "" }
      : { ...targetOccurrence, classId: targetOccurrence.classId, classRecordId: klass.id || targetOccurrence.classId, className: klass.name || "" };

    upserts.push({ occurrence: targetOccurrence, existing, patch: { ...basePatch, ...(curriculumPatch || {}) }, curriculumMapped: Boolean(curriculumPatch) });
  });

  sessions.forEach((session) => {
    if (usedIds.has(session.id) || desiredIds.has(session.id)) return;
    const attendance = attendanceBySessionId.get(session.id);
    const disposableAutomaticCompletion = isDisposableAutomaticCompletion(session, attendance);
    if (disposableAutomaticCompletion || (!isProtectedRebuildSession(session) && !sessionHasAttendanceData(session) && !sessionHasAttendanceData(attendance))) {
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
