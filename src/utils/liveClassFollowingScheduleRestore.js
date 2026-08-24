import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import {
  buildOfficialLessonSchedulePlan,
  countSessionTimeCollisions,
  resolveOfficialSessionNumber,
} from "./liveClassLessonOrder.js";
import { normalizeScheduleRules, zonedLocalToUtcIso } from "./liveClassScheduling.js";

const WEEKDAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

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
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(dateIso, amount = 1) {
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function levelIdForClass(klass = {}) {
  return normalize(klass.levelId || klass.level || klass.name)
    .match(/\b(A1|A2|B1|B2|C1|C2)\b/i)?.[1]?.toUpperCase() || "";
}

function statusOf(session = {}) {
  return normalize(session.status || "scheduled").toLowerCase();
}

function localParts(value, timezone = "Africa/Accra") {
  const date = toDate(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: normalize(timezone) || "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    dateIso: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

function buildFollowingSlotsFromAnchor({
  anchorStartsAt,
  rules,
  timezone,
  excludedDates = [],
  count = 0,
}) {
  const anchor = toDate(anchorStartsAt);
  const anchorParts = localParts(anchor, timezone);
  if (!anchor || !anchorParts) throw new Error("The selected anchor session has an invalid date.");

  const excluded = new Set((excludedDates || []).map(normalize).filter(Boolean));
  const slots = [];
  let cursorDate = anchorParts.dateIso;
  const anchorMs = anchor.getTime();

  for (let guard = 0; slots.length < count && guard < 1095; guard += 1) {
    if (!excluded.has(cursorDate)) {
      const weekday = new Date(`${cursorDate}T00:00:00.000Z`).getUTCDay();
      const matchingRules = rules
        .filter((rule) => WEEKDAY_INDEX[rule.day] === weekday)
        .sort((left, right) => normalize(left.startTime).localeCompare(normalize(right.startTime)));

      for (const rule of matchingRules) {
        if (slots.length >= count) break;
        const startsAt = zonedLocalToUtcIso(cursorDate, rule.startTime, timezone);
        if (new Date(startsAt).getTime() <= anchorMs) continue;
        const durationMinutes = Number(rule.durationMinutes || 120);
        const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60000).toISOString();
        slots.push({ startsAt, endsAt, durationMinutes });
      }
    }
    cursorDate = addDays(cursorDate, 1);
  }

  if (slots.length !== count) {
    throw new Error(`Could only rebuild ${slots.length} of ${count} sessions after the selected anchor.`);
  }
  return slots;
}

export function buildFollowingScheduleRestorePlan({
  classId,
  klass = {},
  sessions = [],
  anchorSessionId = "",
  excludedDates = [],
} = {}) {
  const resolvedClassId = normalize(classId || klass.id);
  if (!resolvedClassId) throw new Error("Class ID is required.");

  const levelId = levelIdForClass(klass);
  const groups = getCourseSessionGroups(levelId);
  if (!groups.length) throw new Error("This class level has no official lesson order.");

  const anchorSession = sessions.find((session) => normalize(session.id) === normalize(anchorSessionId));
  if (!anchorSession) throw new Error("Select the last live or correct session that should remain unchanged.");
  if (["cancelled", "superseded"].includes(statusOf(anchorSession)) || anchorSession.superseded === true) {
    throw new Error("A cancelled or superseded session cannot be used as the timetable anchor.");
  }

  const anchorLessonNumber = resolveOfficialSessionNumber(anchorSession, groups, levelId);
  if (!anchorLessonNumber) throw new Error("The selected session cannot be matched to the official curriculum order.");

  const anchorStartsAt = toDate(anchorSession.startsAt);
  if (!anchorStartsAt) throw new Error("The selected anchor session has an invalid date.");
  const timezone = normalize(klass.timezone) || "Africa/Accra";
  const rules = normalizeScheduleRules(klass.scheduleRules || []);
  if (!rules.length) throw new Error("The class timetable has no weekly teaching days.");

  const anchoredClass = {
    ...klass,
    scheduleAnchorSessionNumber: anchorLessonNumber,
    scheduleAnchorDay: levelId === "A1" ? anchorLessonNumber - 1 : null,
    scheduleAnchorStartsAt: anchorStartsAt.toISOString(),
    scheduleAnchorSource: "admin-selected-following-restore",
    scheduleAnchorMode: "rebuild-from-selected-session",
  };

  // Use the normal planner only for curriculum/session identity. The dates after
  // the selected anchor are rebuilt independently from that actual session, so
  // the anchor does not need to match the class's original start-date-derived slot.
  const officialPlan = buildOfficialLessonSchedulePlan({
    classId: resolvedClassId,
    klass,
    sessions,
    excludedDates,
  });
  const baseFollowingItems = officialPlan.items.filter((item) => item.lessonNumber > anchorLessonNumber);
  const followingSlots = buildFollowingSlotsFromAnchor({
    anchorStartsAt,
    rules,
    timezone,
    excludedDates,
    count: baseFollowingItems.length,
  });
  const followingItems = baseFollowingItems.map((item, index) => {
    const slot = followingSlots[index];
    const currentStartsAt = toDate(item.session?.startsAt)?.toISOString() || "";
    const currentEndsAt = toDate(item.session?.endsAt)?.toISOString() || "";
    return {
      ...item,
      targetStartsAt: slot.startsAt,
      targetEndsAt: slot.endsAt,
      durationMinutes: slot.durationMinutes,
      changed: currentStartsAt !== slot.startsAt || currentEndsAt !== slot.endsAt,
    };
  });
  const followingByLesson = new Map(followingItems.map((item) => [item.lessonNumber, item]));
  const rebuiltItems = officialPlan.items.map((item) => followingByLesson.get(item.lessonNumber) || item);
  const finalTarget = rebuiltItems.at(-1)?.targetStartsAt || anchorStartsAt.toISOString();
  const endDate = localParts(finalTarget, timezone)?.dateIso || officialPlan.endDate;

  const skippedCancelled = followingItems.filter((item) => item.session && statusOf(item.session) === "cancelled");
  const restorableItems = followingItems.filter((item) => {
    const status = statusOf(item.session || {});
    if (["cancelled", "superseded"].includes(status) || item.session?.superseded === true) return false;

    // Completion/live flags after the chosen anchor are deliberately ignored.
    // The selected anchor is the administrator's declaration of real progress.
    return item.changed || (item.session && ["completed", "live"].includes(status));
  });

  const patchesById = new Map(
    restorableItems
      .filter((item) => item.session?.id)
      .map((item) => [normalize(item.session.id), {
        startsAt: item.targetStartsAt,
        endsAt: item.targetEndsAt,
      }]),
  );
  const proposedSessions = sessions.map((session) => {
    const patch = patchesById.get(normalize(session.id));
    return patch ? { ...session, ...patch } : session;
  });
  restorableItems.filter((item) => !item.session).forEach((item) => {
    proposedSessions.push({
      id: `preview_${item.lessonNumber}`,
      classId: resolvedClassId,
      status: "scheduled",
      startsAt: item.targetStartsAt,
      endsAt: item.targetEndsAt,
      curriculumIndex: item.lessonNumber,
    });
  });

  // Earlier sessions are historical and never block a rebuild from the selected
  // anchor. Only collisions at the anchor or later are relevant.
  const anchorAndFollowingSessions = proposedSessions.filter((session) => {
    const lessonNumber = resolveOfficialSessionNumber(session, groups, levelId);
    if (lessonNumber) return lessonNumber >= anchorLessonNumber;
    const startsAt = toDate(session.startsAt);
    return Boolean(startsAt && startsAt.getTime() >= anchorStartsAt.getTime());
  });
  const collisions = countSessionTimeCollisions(anchorAndFollowingSessions);
  if (collisions > 0) {
    throw new Error("A session at or after the selected anchor would still overlap another active session. Choose the last correct session and Falowen will rebuild only the lessons after it.");
  }

  return {
    ...officialPlan,
    items: rebuiltItems,
    endDate,
    changedLessons: rebuiltItems.filter((item) => item.changed).length,
    scheduleAnchor: {
      sessionNumber: anchorLessonNumber,
      day: levelId === "A1" ? anchorLessonNumber - 1 : null,
      startsAt: anchorStartsAt.toISOString(),
      source: "admin-selected-following-restore",
    },
    anchoredClass,
    anchorSession,
    anchorLessonNumber,
    anchorStartsAt: anchorStartsAt.toISOString(),
    followingItems,
    restorableItems,
    skippedCancelled,
    movedCount: restorableItems.filter((item) => item.session).length,
    createdCount: restorableItems.filter((item) => !item.session).length,
  };
}
