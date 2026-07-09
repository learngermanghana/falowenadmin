import { sessionDateInTimezone } from "./liveClassScheduling.js";

function normalize(value) {
  return String(value || "").trim();
}

function sessionTime(session = {}) {
  if (typeof session.startsAt?.toDate === "function") return session.startsAt.toDate().getTime();
  const parsed = new Date(session.startsAt || 0).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
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

export function suppressGeneratedDateDuplicates(sessions = [], timezone = "Africa/Accra") {
  const byDate = new Map();
  sessions.forEach((session) => {
    const date = sessionDateInTimezone(session.startsAt, timezone || "Africa/Accra") || `id:${session.id}`;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(session);
  });

  const filtered = [];
  byDate.forEach((group) => {
    const hasChangedSession = group.some(hasManualScheduleChange);
    if (!hasChangedSession) {
      filtered.push(...group);
      return;
    }

    filtered.push(...group.filter((session) => !isPlainGeneratedScheduledSession(session)));
  });

  return filtered.sort((left, right) => sessionTime(left) - sessionTime(right));
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

  return suppressGeneratedDateDuplicates([...byMoment.values()], timezone);
}

export function resolveSessionCourseGroup(session = {}, groups = [], fallbackIndex = 0) {
  const ids = assignmentIdsForSession(session);
  if (ids.length) {
    const exactMatch = groups.find((group) => sameAssignmentSet(ids, group.assignmentIds || []));
    if (exactMatch) return exactMatch;

    const overlappingMatch = groups.find((group) => (group.assignmentIds || [])
      .some((assignmentId) => ids.includes(normalize(assignmentId).toUpperCase())));
    if (overlappingMatch) return overlappingMatch;
  }

  const storedIndex = Number(session.curriculumIndex || 0);
  if (Number.isFinite(storedIndex) && storedIndex > 0 && groups[storedIndex - 1]) {
    return groups[storedIndex - 1];
  }

  return groups[fallbackIndex] || null;
}

export function enrichSessionsWithStableCurriculum(klass = {}, sessions = [], groups = []) {
  return sessions.slice(0, groups.length).map((session, index) => {
    const group = resolveSessionCourseGroup(session, groups, index);
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
  });
}
