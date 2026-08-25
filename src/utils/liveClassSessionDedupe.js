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

function sessionCurriculumIdentity(session = {}) {
  const ids = assignmentIdsForSession(session).sort();
  if (ids.length) return `assign:${ids.join("|")}`;

  const day = Number(session.curriculumDay);
  if (Number.isFinite(day) && day >= 0) return `day:${day}`;

  const index = Number(session.curriculumIndex);
  if (Number.isFinite(index) && index > 0) return `index:${index}`;

  return "";
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

function isOfficialScheduleRepair(session = {}) {
  const reason = normalize(session.rescheduleReason || session.manualDateOverrideReason).toLowerCase();
  const source = normalize(session.scheduleRepairSource || session.manualDateOverrideSource).toLowerCase();
  return source === "official-schedule-repair"
    || /official.*timetable.*repair|timetable repaired atomically/.test(reason);
}

export function hasManualScheduleChange(session = {}) {
  if (isOfficialScheduleRepair(session)) return false;
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

export function dedupeCompatibleSessionRecords(sessions = [], { classId = "" } = {}) {
  const byMoment = new Map();
  sessions.forEach((session) => {
    const time = sessionTime(session);
    const key = time ? `time:${time}` : `id:${session.id}`;
    if (!byMoment.has(key)) byMoment.set(key, []);
    byMoment.get(key).push(session);
  });

  const visible = [];
  byMoment.forEach((group, key) => {
    if (!key.startsWith("time:") || group.length === 1) {
      visible.push(...group);
      return;
    }

    const byCurriculum = new Map();
    const unknown = [];
    group.forEach((session) => {
      const identity = sessionCurriculumIdentity(session);
      if (!identity) {
        unknown.push(session);
        return;
      }
      if (!byCurriculum.has(identity)) byCurriculum.set(identity, []);
      byCurriculum.get(identity).push(session);
    });

    if (byCurriculum.size === 0) {
      const preferred = preferredSessionForDate(group, classId);
      if (preferred) visible.push(preferred);
      return;
    }

    byCurriculum.forEach((records) => {
      const preferred = preferredSessionForDate(records, classId);
      if (preferred) visible.push(preferred);
    });

    void unknown;
  });

  return visible.sort((left, right) => sessionTime(left) - sessionTime(right));
}

export function dedupeCompatibleSessions(sessions = [], { classId = "", timezone = "Africa/Accra" } = {}) {
  return suppressGeneratedDateDuplicates(
    dedupeCompatibleSessionRecords(sessions, { classId }),
    timezone,
    classId,
  );
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

function courseGroupKey(group = null) {
  if (!group) return "";
  if (normalize(group.key)) return normalize(group.key);
  const day = Number(group.day);
  if (Number.isFinite(day)) return `day:${day}`;
  const ids = Array.isArray(group.assignmentIds) ? group.assignmentIds : [];
  return ids.map((value) => normalize(value).toUpperCase()).filter(Boolean).join("|");
}

function isChronologicalDayCurriculum(groups = []) {
  return groups.length > 0 && groups.every((group) => /^day:\d+$/.test(courseGroupKey(group)));
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

function enrichCompleteSessionSet(ordered = [], groups = []) {
  if (isChronologicalDayCurriculum(groups)) {
    return ordered.map((session, index) => applyCurriculumGroup(session, groups[index] || null, index));
  }

  const protectedGroups = new Map();
  const claimedGroupKeys = new Set();

  ordered.forEach((session) => {
    if (isPlainGeneratedScheduledSession(session)) return;
    const group = resolveSessionCourseGroup(session, groups, -1);
    const key = courseGroupKey(group);
    if (!group || !key || claimedGroupKeys.has(key)) return;
    protectedGroups.set(session.id, group);
    claimedGroupKeys.add(key);
  });

  const remainingGroups = groups.filter((group) => !claimedGroupKeys.has(courseGroupKey(group)));
  let remainingIndex = 0;

  return ordered.map((session, index) => {
    const protectedGroup = protectedGroups.get(session.id);
    if (protectedGroup) return applyCurriculumGroup(session, protectedGroup, index);
    const group = remainingGroups[remainingIndex] || null;
    remainingIndex += 1;
    return applyCurriculumGroup(session, group, index);
  });
}

export function enrichSessionsWithStableCurriculum(_ = {}, sessions = [], groups = []) {
  const ordered = [...sessions].sort((left, right) => sessionTime(left) - sessionTime(right));

  // A complete A1 day set follows chronological timetable order. If extra records
  // exist, however, they may be generated aliases for an explicitly rescheduled
  // day. Let the overfull path preserve that manual identity first, then suppress
  // the generated alias instead of dropping a real later day.
  if (isChronologicalDayCurriculum(groups) && ordered.length <= groups.length) {
    return ordered.slice(0, groups.length)
      .map((session, index) => applyCurriculumGroup(session, groups[index] || null, index));
  }

  if (ordered.length <= groups.length) {
    return enrichCompleteSessionSet(ordered, groups);
  }

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
