import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import {
  buildOfficialLessonSchedulePlan,
  countSessionTimeCollisions,
  resolveOfficialSessionNumber,
} from "./liveClassLessonOrder.js";
import { normalizeScheduleRules } from "./liveClassScheduling.js";

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
  const dateIso = `${values.year}-${values.month}-${values.day}`;
  return {
    dateIso,
    time: `${values.hour}:${values.minute}`,
    weekday: new Date(`${dateIso}T00:00:00.000Z`).getUTCDay(),
  };
}

function assertAnchorMatchesSchedule(anchorSession, rules, timezone) {
  const parts = localParts(anchorSession.startsAt, timezone);
  if (!parts) throw new Error("The selected anchor session has an invalid date or time.");
  const matchingRule = rules.find((rule) => (
    WEEKDAY_INDEX[rule.day] === parts.weekday
    && normalize(rule.startTime).slice(0, 5) === parts.time
  ));
  if (!matchingRule) {
    const allowed = rules.map((rule) => `${String(rule.day || "").toUpperCase()} ${rule.startTime}`).join(" · ");
    throw new Error(`Choose a correct session that already matches the saved timetable (${allowed}).`);
  }
  return matchingRule;
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
  if (!anchorSession) throw new Error("Select the correct session that should remain unchanged.");
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
  assertAnchorMatchesSchedule(anchorSession, rules, timezone);

  const anchoredClass = {
    ...klass,
    scheduleAnchorSessionNumber: anchorLessonNumber,
    scheduleAnchorDay: levelId === "A1" ? anchorLessonNumber - 1 : null,
    scheduleAnchorStartsAt: anchorStartsAt.toISOString(),
    scheduleAnchorSource: "admin-selected-following-restore",
  };
  const officialPlan = buildOfficialLessonSchedulePlan({
    classId: resolvedClassId,
    klass: anchoredClass,
    sessions,
    excludedDates,
  });

  const followingItems = officialPlan.items.filter((item) => item.lessonNumber > anchorLessonNumber);
  const lockedItems = followingItems.filter((item) => item.session && ["completed", "live"].includes(statusOf(item.session)));
  if (lockedItems.length) {
    const first = lockedItems[0];
    throw new Error(`${first.group.topic} is ${statusOf(first.session)} and cannot be moved. Choose a later correct anchor.`);
  }

  const skippedCancelled = followingItems.filter((item) => item.session && statusOf(item.session) === "cancelled");
  const restorableItems = followingItems.filter((item) => (
    statusOf(item.session || {}) !== "cancelled"
    && item.changed
  ));

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
  const collisions = countSessionTimeCollisions(proposedSessions);
  if (collisions > 0) {
    throw new Error("The restored timetable would overlap another active session. Review cancelled or duplicate session records first.");
  }

  return {
    ...officialPlan,
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
