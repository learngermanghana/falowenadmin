import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import {
  normalizeScheduleRules,
  sessionDateInTimezone,
  zonedLocalToUtcIso,
} from "./liveClassScheduling.js";

function normalize(value) {
  return String(value || "").trim();
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(dateIso, amount = 1) {
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function sessionDurationMinutes(session = {}) {
  const startsAt = toDate(session.startsAt);
  const endsAt = toDate(session.endsAt);
  if (!startsAt || !endsAt) return 120;
  return Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));
}

function assignmentIdsForSession(session = {}) {
  const arrays = [session.assignmentIds, session.chapterIds, session.curriculumIds];
  const values = arrays.find((value) => Array.isArray(value) && value.length)
    || (session.assignment_id ? [session.assignment_id] : []);
  return [...new Set(values.map((value) => normalize(value).toUpperCase()).filter(Boolean))];
}

function sameAssignmentSet(left = [], right = []) {
  const leftSet = new Set(left.map((value) => normalize(value).toUpperCase()).filter(Boolean));
  const rightSet = new Set(right.map((value) => normalize(value).toUpperCase()).filter(Boolean));
  if (!leftSet.size || leftSet.size !== rightSet.size) return false;
  return [...leftSet].every((value) => rightSet.has(value));
}

function resolveLevelId(klass = {}) {
  return normalize(klass.levelId || klass.level || klass.name)
    .match(/\b(A1|A2|B1|B2|C1|C2)\b/i)?.[1]?.toUpperCase() || "";
}

function activeSession(session = {}) {
  const status = normalize(session.status || "scheduled").toLowerCase();
  return status !== "cancelled" && status !== "superseded" && session.superseded !== true;
}

function a1SessionNumber(session = {}, groups = []) {
  const directDay = Number(session.curriculumDay);
  if (Number.isFinite(directDay) && directDay >= 0) {
    const directIndex = groups.findIndex((group) => Number(group.day) === directDay);
    if (directIndex >= 0) return directIndex + 1;
  }

  const topic = normalize(session.topic || session.title);
  const dayMatch = topic.match(/\bDay\s+(\d+)\b/i);
  if (dayMatch) {
    const day = Number(dayMatch[1]);
    const topicIndex = groups.findIndex((group) => Number(group.day) === day);
    if (topicIndex >= 0) return topicIndex + 1;
    if (day >= 0 && day < groups.length) return day + 1;
  }

  return null;
}

export function countSessionTimeCollisions(sessions = []) {
  const byMoment = new Map();
  sessions.filter(activeSession).forEach((session) => {
    const startsAt = toDate(session.startsAt);
    if (!startsAt) return;
    const key = startsAt.toISOString();
    byMoment.set(key, (byMoment.get(key) || 0) + 1);
  });
  return [...byMoment.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
}

function buildOfficialSlots({ startDate, rules, timezone, excluded, expectedLessons }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalize(startDate))) {
    throw new Error("The class start date is missing or invalid.");
  }

  const weekdayIndex = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const slots = [];
  let cursorDate = normalize(startDate);

  for (let guard = 0; slots.length < expectedLessons && guard < 1095; guard += 1) {
    if (!excluded.has(cursorDate)) {
      const weekday = new Date(`${cursorDate}T00:00:00.000Z`).getUTCDay();
      const matchingRules = rules
        .filter((rule) => weekdayIndex[rule.day] === weekday)
        .sort((left, right) => left.startTime.localeCompare(right.startTime));

      matchingRules.forEach((rule) => {
        if (slots.length >= expectedLessons) return;
        const startsAt = zonedLocalToUtcIso(cursorDate, rule.startTime, timezone);
        const durationMinutes = Number(rule.durationMinutes || 120);
        const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60000).toISOString();
        slots.push({ startsAt, endsAt, durationMinutes });
      });
    }
    cursorDate = addDays(cursorDate, 1);
  }

  if (slots.length !== expectedLessons) {
    throw new Error(`Could only build ${slots.length} of ${expectedLessons} official class dates.`);
  }
  return slots;
}

function sessionRecordPreference(session = {}, classId = "") {
  let score = 0;
  if (session.repairPreferredRecord === true) score += 1000;
  if (normalize(session.classId) === normalize(classId)) score += 8;
  if (normalize(session.classRecordId) === normalize(classId)) score += 4;
  if (assignmentIdsForSession(session).length) score += 2;
  if (normalize(session.topic || session.title)) score += 1;
  if (session.manualDateOverride === true || session.rescheduledAt || session.previousStartsAt) score += 1;
  return score;
}

export function sessionLessonNumber(session = {}) {
  const topic = normalize(session.topic || session.title);

  const dayMatch = topic.match(/\bDay\s+(\d+)\b/i);
  if (dayMatch) return Number(dayMatch[1]) + 1;

  const directDay = Number(session.curriculumDay);
  if (Number.isFinite(directDay) && directDay >= 0) return directDay + 1;

  const topicMatch = topic.match(/\bLesson\s+(\d+)\b/i);
  if (topicMatch) return Number(topicMatch[1]);

  const curriculumIndex = Number(session.curriculumIndex || 0);
  if (Number.isFinite(curriculumIndex) && curriculumIndex > 0) return curriculumIndex;

  const ids = assignmentIdsForSession(session);
  for (const value of ids) {
    const match = normalize(value).match(/(?:^|[.-])(\d+)$/);
    if (match) return Number(match[1]);
  }

  return null;
}

export function resolveOfficialSessionNumber(session = {}, groups = [], levelId = "") {
  const normalizedLevel = normalize(levelId).toUpperCase();

  if (normalizedLevel === "A1") {
    const dayNumber = a1SessionNumber(session, groups);
    if (dayNumber) return dayNumber;
  }

  const ids = assignmentIdsForSession(session);
  if (ids.length) {
    const exactIndex = groups.findIndex((group) => sameAssignmentSet(ids, group.assignmentIds || []));
    if (exactIndex >= 0) return exactIndex + 1;

    const overlapping = groups
      .map((group, index) => ({ group, index }))
      .filter(({ group }) => (group.assignmentIds || [])
        .some((assignmentId) => ids.includes(normalize(assignmentId).toUpperCase())));
    if (overlapping.length === 1) return overlapping[0].index + 1;
  }

  const topic = normalize(session.topic || session.title);
  const lessonMatch = topic.match(/\bLesson\s+(\d+)\b/i);
  if (lessonMatch) {
    const value = Number(lessonMatch[1]);
    if (value >= 1 && value <= groups.length) return value;
  }

  const curriculumIndex = Number(session.curriculumIndex || 0);
  if (Number.isFinite(curriculumIndex) && curriculumIndex >= 1 && curriculumIndex <= groups.length) {
    return curriculumIndex;
  }

  const fallback = sessionLessonNumber(session);
  return fallback && fallback <= groups.length ? fallback : null;
}

export function compareSessionsByLesson(left = {}, right = {}) {
  const leftLesson = sessionLessonNumber(left);
  const rightLesson = sessionLessonNumber(right);

  if (leftLesson !== null && rightLesson !== null && leftLesson !== rightLesson) {
    return leftLesson - rightLesson;
  }
  if (leftLesson !== null && rightLesson === null) return -1;
  if (leftLesson === null && rightLesson !== null) return 1;

  const leftDate = toDate(left.startsAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const rightDate = toDate(right.startsAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return leftDate - rightDate;
}

export function buildLessonDateRepairPlan(sessions = []) {
  const eligible = sessions
    .filter(activeSession)
    .map((session) => ({
      session,
      lessonNumber: sessionLessonNumber(session),
      startsAtDate: toDate(session.startsAt),
      endsAtDate: toDate(session.endsAt),
    }))
    .filter((item) => item.lessonNumber !== null && item.startsAtDate);

  const lessons = [...eligible].sort((left, right) => {
    if (left.lessonNumber !== right.lessonNumber) return left.lessonNumber - right.lessonNumber;
    return left.startsAtDate.getTime() - right.startsAtDate.getTime();
  });
  const slots = [...eligible].sort((left, right) => left.startsAtDate.getTime() - right.startsAtDate.getTime());

  return lessons.map((lesson, index) => {
    const slot = slots[index];
    const fallbackDuration = Math.max(
      1,
      Math.round(((lesson.endsAtDate?.getTime() || lesson.startsAtDate.getTime() + 7200000) - lesson.startsAtDate.getTime()) / 60000),
    );
    const slotDuration = Math.max(
      1,
      Math.round(((slot.endsAtDate?.getTime() || slot.startsAtDate.getTime() + fallbackDuration * 60000) - slot.startsAtDate.getTime()) / 60000),
    );
    const targetStartsAt = slot.startsAtDate.toISOString();
    const targetEndsAt = new Date(slot.startsAtDate.getTime() + slotDuration * 60000).toISOString();
    const currentStartsAt = lesson.startsAtDate.toISOString();
    const currentEndsAt = lesson.endsAtDate?.toISOString() || "";

    return {
      session: lesson.session,
      lessonNumber: lesson.lessonNumber,
      targetStartsAt,
      targetEndsAt,
      durationMinutes: slotDuration,
      changed: currentStartsAt !== targetStartsAt || currentEndsAt !== targetEndsAt,
    };
  });
}

export function buildOfficialLessonSchedulePlan({
  classId,
  klass = {},
  sessions = [],
  excludedDates = [],
} = {}) {
  const levelId = resolveLevelId(klass);
  const groups = getCourseSessionGroups(levelId);
  const expectedLessons = groups.length;
  if (!classId) throw new Error("Class ID is required.");
  if (!expectedLessons) throw new Error("The class level does not have an official session count.");

  const timezone = normalize(klass.timezone) || "Africa/Accra";
  const rules = normalizeScheduleRules(klass.scheduleRules || []);
  if (!rules.length) throw new Error("The class timetable has no weekly teaching days.");

  const excluded = new Set((excludedDates || []).map((value) => normalize(value)).filter(Boolean));
  const slots = buildOfficialSlots({
    startDate: klass.startDate,
    rules,
    timezone,
    excluded,
    expectedLessons,
  });

  const candidatesByNumber = new Map();
  sessions.filter(activeSession).forEach((session) => {
    const sessionNumber = resolveOfficialSessionNumber(session, groups, levelId);
    if (!sessionNumber) return;
    if (!candidatesByNumber.has(sessionNumber)) candidatesByNumber.set(sessionNumber, []);
    candidatesByNumber.get(sessionNumber).push(session);
  });

  const sessionsByNumber = new Map();
  const duplicateSessions = [];
  candidatesByNumber.forEach((candidates, sessionNumber) => {
    const ordered = [...candidates].sort((left, right) => {
      const score = sessionRecordPreference(right, classId) - sessionRecordPreference(left, classId);
      if (score) return score;
      return normalize(left.id).localeCompare(normalize(right.id));
    });
    const canonical = ordered[0] || null;
    if (!canonical) return;
    sessionsByNumber.set(sessionNumber, canonical);
    ordered.slice(1).forEach((session) => {
      const status = normalize(session.status || "scheduled").toLowerCase();
      if (["completed", "live"].includes(status)) return;
      duplicateSessions.push({
        lessonNumber: sessionNumber,
        session,
        canonicalSessionId: normalize(canonical.id),
      });
    });
  });

  const items = groups.map((group, index) => {
    const lessonNumber = index + 1;
    const session = sessionsByNumber.get(lessonNumber) || null;
    const slot = slots[index];
    const currentStartsAt = toDate(session?.startsAt)?.toISOString() || "";
    const currentEndsAt = toDate(session?.endsAt)?.toISOString() || "";
    return {
      lessonNumber,
      group,
      session,
      targetStartsAt: slot.startsAt,
      targetEndsAt: slot.endsAt,
      durationMinutes: slot.durationMinutes,
      changed: !session || currentStartsAt !== slot.startsAt || currentEndsAt !== slot.endsAt,
    };
  });

  const isA1 = levelId === "A1";
  return {
    classId,
    levelId,
    timezone,
    expectedLessons,
    currentSessions: sessions.filter(activeSession).length,
    missingLessons: items.filter((item) => !item.session).length,
    changedLessons: items.filter((item) => item.changed).length,
    collisionCount: countSessionTimeCollisions(sessions),
    duplicateCount: duplicateSessions.length,
    duplicateSessions,
    endDate: sessionDateInTimezone(slots.at(-1).startsAt, timezone),
    itemLabel: isA1 ? "Day" : "Lesson",
    countLabel: isA1 ? "attendance sessions" : "lessons",
    slots,
    items,
  };
}
