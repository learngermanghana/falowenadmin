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
  const timezone = normalize(klass.timezone) || "Africa/Accra";
  const rules = normalizeScheduleRules(klass.scheduleRules || []);
  if (!rules.length) throw new Error("The class timetable has no weekly teaching days.");

  // The administrator-selected last live/correct session is authoritative, even when it
  // was held outside the normal weekly slot. Everything after it is rebuilt from that
  // actual point in curriculum order using the saved weekly timetable.
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
  const skippedCancelled = followingItems.filter((item) => item.session && statusOf(item.session) === "cancelled");
  const restorableItems = followingItems.filter((item) => {
    const status = statusOf(item.session || {});
    if (status === "cancelled") return false;

    // A stale completed/live flag after the chosen anchor must never block a rebuild.
    // Include those records even when their date already matches so the restore service
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
