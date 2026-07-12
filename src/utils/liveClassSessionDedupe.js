import { sessionDateInTimezone, toSessionDate } from "./liveClassScheduling.js";

function normalize(value) {
  return String(value || "").trim();
}

function sessionTime(session = {}) {
  return toSessionDate(session.startsAt)?.getTime() || 0;
}

export function assignmentIdsForSession(session = {}) {
  const arrays = [session.assignmentIds, session.chapterIds, session.curriculumIds];
  const source = arrays.find((value) => Array.isArray(value) && value.length)
    || (session.assignment_id ? [session.assignment_id] : []);
  return [...new Set(source.map((value) => normalize(value).toUpperCase()).filter(Boolean))];
}

function sameAssignmentSet(left = [], right = []) {
  const leftSet = new Set(left.map((value) => normalize(value).toUpperCase()).filter(Boolean));
  const rightSet = new Set(right.map((value) => normalize(value).toUpperCase()).filter(Boolean));
  if (!leftSet.size || !rightSet.size || leftSet.size !== rightSet.size) return false;
  return [...leftSet].every((value) => rightSet.has(value));
}

function sessionPreference(session = {}, classId = "") {
  let score = 0;
  if (normalize(session.classId) === normalize(classId)) score += 8;
  if (normalize(session.classRecordId) === normalize(classId)) score += 4;
  if (assignmentIdsForSession(session).length) score += 2;
  if (normalize(session.topic)) score += 1;
  if (hasManualScheduleChange(session)) score += 16;
  return score;
}

export function hasManualScheduleChange(session = {}) {
  const status = normalize(session.status).toLowerCase();
  return status === "rescheduled"
    || session.manualDateOverride === true
    || Boolean(session.previousStartsAt || session.previousEndsAt || session.rescheduledAt || session.rescheduledBy);
}

function isPlainGeneratedScheduledSession(session = {}) {
  const status = normalize(session.status || "scheduled").toLowerCase();
  return status === "scheduled" && !hasManualScheduleChange(session);
}

function preferredSessionForDate(group = [], classId = "") {
  return [...group].sort((left, right) => {
    const preference = sessionPreference(right, classId) - sessionPreference(left, classId);
    if (preference) return preference;
    return sessionTime(left) - sessionTime(right) || normalize(left.id).localeCompare(normalize(right.id));
  })[0] || null;
}

export function suppressGeneratedDateDuplicates(sessions = [], timezone = "Africa/Accra", classId = "") {
  const byDate = new Map();
  sessions.forEach((session) => {
    const date = sessionDateInTimezone(session.startsAt, timezone || "Africa/Accra") || `id:${session.id}`;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(session);
  });

  return [...byDate.values()]
    .map((group) => preferredSessionForDate(group, classId))
    .filter(Boolean)
    .sort((left, right) => sessionTime(left) - sessionTime(right));
}

export function dedupeCompatibleSessions(sessions = [], { classId = "", timezone = "Africa/Accra" } = {}) {
  const byMoment = new Map();
  sessions.forEach((session) => {
    const time = sessionTime(session);
    const key = time ? `time:${time}` : `id:${session.id}`;
    const existing = byMoment.get(key);
    if (!existing || sessionPreference(session, classId) > sessionPreference(existing, classId)) {
      byMoment.set(key, session);
    }
  });

  return suppressGeneratedDateDuplicates([...byMoment.values()], timezone, classId);
}

export function resolveSessionCourseGroup(session = {}, groups = [], fallbackIndex = 0) {
  const canUseStoredMapping = hasManualScheduleChange(session);
  const ids = canUseStoredMapping ? assignmentIdsForSession(session) : [];
  if (ids.length) {
    const exactMatch = groups.find((group) => sameAssignmentSet(ids, group.assignmentIds || []));
    if (exactMatch) return exactMatch;

    const overlappingMatch = groups.find((group) => (group.assignmentIds || [])
      .some((assignmentId) => ids.includes(normalize(assignmentId).toUpperCase())));
    if (overlappingMatch) return overlappingMatch;
  }

  if (canUseStoredMapping) {
    const storedIndex = Number(session.curriculumIndex || 0);
    if (Number.isFinite(storedIndex) && storedIndex > 0 && groups[storedIndex - 1]) {
      return groups[storedIndex - 1];
    }
  }

  return groups[fallbackIndex] || null;
}

function sessionCurriculumDayKey(session = {}) {
  const direct = Number(session.curriculumDay);
  if (Number.isFinite(direct) && direct >= 0) return `day:${direct}`;
  const index = Number(session.curriculumIndex);
  if (Number.isFinite(index) && index > 0) return `index:${index}`;
  return assignmentIdsForSession(session).join("|");
}

function applyCurriculumGroup(session, group, index) {
  if (!group) return session;
  return {
    ...session,
    assignmentIds: group.assignmentIds,
    chapterIds: group.assignmentIds,
    curriculumIds: group.assignmentIds,
    assignment_id: group.assignmentIds[0] || "",
    topic: group.topic,
    curriculumIndex: group.index || index + 1,
    curriculumDay: group.day,
    curriculumTaskCount: group.assignmentIds.length,
    curriculumSource: "courseDictionary-day-groups",
    curriculumVersion: 2,
  };
}

export function suppressNormalCurriculumDuplicates(sessions = []) {
  const protectedDays = new Set(
    sessions
      .filter((session) => !isPlainGeneratedScheduledSession(session))
      .map(sessionCurriculumDayKey)
      .filter(Boolean),
  );
  const seenNormalDays = new Set();
  return sessions.filter((session) => {
    if (!isPlainGeneratedScheduledSession(session)) return true;
    const key = sessionCurriculumDayKey(session);
    if (!key) return true;
    if (protectedDays.has(key)) return false;
    if (seenNormalDays.has(key)) return false;
    seenNormalDays.add(key);
    return true;
  });
}

export function enrichSessionsWithStableCurriculum(_ = {}, sessions = [], groups = []) {
  const ordered = [...sessions].sort((left, right) => sessionTime(left) - sessionTime(right));
  let normalIndex = 0;

  const enriched = ordered.map((session) => {
    if (!isPlainGeneratedScheduledSession(session)) {
      const group = resolveSessionCourseGroup(session, groups, normalIndex);
      return applyCurriculumGroup(session, group, normalIndex);
    }

    const index = normalIndex;
    normalIndex += 1;
    return applyCurriculumGroup(session, groups[index] || null, index);
  });

  const visible = suppressNormalCurriculumDuplicates(enriched);
  let normalCount = 0;
  return visible.filter((session) => {
    if (!isPlainGeneratedScheduledSession(session)) return true;
    normalCount += 1;
    return normalCount <= groups.length;
  });
}
