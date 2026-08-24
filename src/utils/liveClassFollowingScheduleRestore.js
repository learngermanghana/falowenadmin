import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import {
  buildOfficialLessonSchedulePlan,
  countSessionTimeCollisions,
  resolveOfficialSessionNumber,
} from "./liveClassLessonOrder.js";
import { normalizeScheduleRules } from "./liveClassScheduling.js";

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
  const rules = normalizeScheduleRules(klass.scheduleRules || []);
  if (!rules.length) throw new Error("The class timetable has no weekly teaching days.");

  // The administrator-selected session is authoritative for this rebuild. It can
  // be a manually moved/live/completed session and does not have to match the
  // class's original start-date-derived slot. Everything after it is rebuilt.
  const anchoredClass = {
    ...klass,
    scheduleAnchorSessionNumber: anchorLessonNumber,
    scheduleAnchorDay: levelId === "A1" ? anchorLessonNumber - 1 : null,
    scheduleAnchorStartsAt: anchorStartsAt.toISOString(),
    scheduleAnchorSource: "admin-selected-following-restore",
    scheduleAnchorMode: "rebuild-from-selected-session",
  };
  const officialPlan = buildOfficialLessonSchedulePlan({
    classId: resolvedClassId,
    klass: anchoredClass,
    sessions,
    excludedDates,
  });

  const followingItems = officialPlan.items.filter((item) => item.lessonNumber > anchorLessonNumber);
  const skippedCancelled = followingItems.filter((item) => item.session && statusOf(item.session) === "cancelled");
  const restorableItems = followingItems.filter((item) => {
    const status = statusOf(item.session || {});
    if (["cancelled", "superseded"].includes(status) || item.session?.superseded === true) return false;

    // Completion/live flags after the chosen anchor are not locks. The selected
    // anchor is the administrator's declaration of real progress. Include later
    // completed/live records even when their time already matches so the writer
    // can normalize them back to scheduled future sessions.
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

  // Repair is intentionally anchored: earlier sessions are historical and must not block
  // rebuilding the timetable from the administrator-selected last-correct session onward.
  // We still reject collisions involving the anchor or any later lesson.
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
