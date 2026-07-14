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

function uniqueChronologicalSlots(sessions = []) {
  const byMoment = new Map();
  sessions
    .filter((session) => String(session.status || "scheduled").toLowerCase() !== "cancelled")
    .forEach((session) => {
      const startsAt = toDate(session.startsAt);
      if (!startsAt) return;
      const key = startsAt.toISOString();
      if (byMoment.has(key)) return;
      const minutes = sessionDurationMinutes(session);
      byMoment.set(key, {
        startsAt: startsAt.toISOString(),
        endsAt: new Date(startsAt.getTime() + minutes * 60000).toISOString(),
        durationMinutes: minutes,
      });
    });
  return [...byMoment.values()].sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

export function sessionLessonNumber(session = {}) {
  const topicMatch = normalize(session.topic || session.title).match(/\bLesson\s+(\d+)\b/i);
  if (topicMatch) return Number(topicMatch[1]);

  const ids = [
    ...(Array.isArray(session.assignmentIds) ? session.assignmentIds : []),
    ...(Array.isArray(session.chapterIds) ? session.chapterIds : []),
    ...(Array.isArray(session.curriculumIds) ? session.curriculumIds : []),
    session.assignment_id,
  ];

  for (const value of ids) {
    const match = normalize(value).match(/(?:^|[.-])(\d+)$/);
    if (match) return Number(match[1]);
  }

  const curriculumIndex = Number(session.curriculumIndex || 0);
  if (Number.isFinite(curriculumIndex) && curriculumIndex > 0) return curriculumIndex;

  return null;
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
    .filter((session) => String(session.status || "scheduled").toLowerCase() !== "cancelled")
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
  const levelId = normalize(klass.levelId || klass.level || klass.name).match(/\b(A1|A2|B1|B2|C1|C2)\b/i)?.[1]?.toUpperCase() || "";
  const groups = getCourseSessionGroups(levelId);
  const expectedLessons = groups.length;
  if (!classId) throw new Error("Class ID is required.");
  if (!expectedLessons) throw new Error("The class level does not have an official lesson count.");

  const timezone = normalize(klass.timezone) || "Africa/Accra";
  const rules = normalizeScheduleRules(klass.scheduleRules || []);
  if (!rules.length) throw new Error("The class timetable has no weekly teaching days.");

  const excluded = new Set((excludedDates || []).map((value) => normalize(value)).filter(Boolean));
  const slots = uniqueChronologicalSlots(sessions).slice(0, expectedLessons);
  if (!slots.length) throw new Error("No existing lesson dates were found.");

  let cursorDate = sessionDateInTimezone(slots.at(-1).startsAt, timezone);
  const weekdayIndex = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const existingMoments = new Set(slots.map((slot) => slot.startsAt));

  for (let guard = 0; slots.length < expectedLessons && guard < 730; guard += 1) {
    cursorDate = addDays(cursorDate, 1);
    if (excluded.has(cursorDate)) continue;
    const weekday = new Date(`${cursorDate}T00:00:00.000Z`).getUTCDay();
    const matchingRules = rules
      .filter((rule) => weekdayIndex[rule.day] === weekday)
      .sort((left, right) => left.startTime.localeCompare(right.startTime));

    matchingRules.forEach((rule) => {
      if (slots.length >= expectedLessons) return;
      const startsAt = zonedLocalToUtcIso(cursorDate, rule.startTime, timezone);
      if (existingMoments.has(startsAt)) return;
      const durationMinutes = Number(rule.durationMinutes || 120);
      const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60000).toISOString();
      slots.push({ startsAt, endsAt, durationMinutes });
      existingMoments.add(startsAt);
    });
  }

  if (slots.length !== expectedLessons) {
    throw new Error(`Could only build ${slots.length} of ${expectedLessons} official lesson dates.`);
  }

  const sessionsByLesson = new Map();
  sessions.forEach((session) => {
    const lessonNumber = sessionLessonNumber(session);
    if (!lessonNumber || sessionsByLesson.has(lessonNumber)) return;
    sessionsByLesson.set(lessonNumber, session);
  });

  const items = groups.map((group, index) => {
    const lessonNumber = index + 1;
    const session = sessionsByLesson.get(lessonNumber) || null;
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

  return {
    classId,
    levelId,
    timezone,
    expectedLessons,
    currentSessions: sessions.length,
    missingLessons: items.filter((item) => !item.session).length,
    changedLessons: items.filter((item) => item.changed).length,
    endDate: sessionDateInTimezone(slots.at(-1).startsAt, timezone),
    slots,
    items,
  };
}
