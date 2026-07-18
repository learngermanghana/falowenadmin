import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { buildFollowingScheduleRestorePlan } from "../utils/liveClassFollowingScheduleRestore.js";
import { loadRawRepairSessions } from "./liveClassLessonDateRepairService.js";
import { loadSchoolClosureDates } from "./schoolClosureService.js";

function normalize(value) {
  return String(value || "").trim();
}

function localDateTimeParts(value, timezone = "Africa/Accra") {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
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
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}${values.minute}`,
  };
}

function generatedSessionId(classId, startsAt, timezone) {
  const parts = localDateTimeParts(startsAt, timezone);
  return parts ? `${classId}_${parts.date}_${parts.time}` : `${classId}_session_${Date.now()}`;
}

function restoredSessionPatch({ classId, className, item, adminId, levelId, expectedLessons }) {
  const existing = item.session || {};
  const assignmentIds = item.group.assignmentIds || [];
  const changed = item.changed === true;
  return {
    classId,
    classRecordId: classId,
    className,
    startsAt: item.targetStartsAt,
    endsAt: item.targetEndsAt,
    status: "scheduled",
    superseded: false,
    supersededBySessionId: "",
    topic: item.group.topic,
    assignmentIds,
    chapterIds: assignmentIds,
    curriculumIds: assignmentIds,
    assignment_id: assignmentIds[0] || "",
    curriculumIndex: item.lessonNumber,
    curriculumDay: item.group.day,
    curriculumTaskCount: assignmentIds.length,
    curriculumSource: "courseDictionary-day-groups",
    curriculumVersion: 2,
    remindersSuppressed: false,
    cancellationReason: "",
    manualDateOverride: false,
    manualDateOverrideSource: "official-schedule-repair",
    manualDateOverrideReason: "Following sessions restored to the saved weekly timetable pattern.",
    sequence: Number(existing.sequence || 0) + (changed ? 1 : 0),
    ...(changed ? {
      previousStartsAt: existing.startsAt || "",
      previousEndsAt: existing.endsAt || "",
      rescheduledBy: adminId,
      rescheduledAt: serverTimestamp(),
      rescheduleReason: `${levelId} official timetable repair restored following sessions to the saved weekday pattern (${expectedLessons} sessions).`,
    } : {}),
    updatedAt: serverTimestamp(),
  };
}

function restoredAttendancePatch({ classId, className, sessionId, item, sessionPatch }) {
  return {
    classId,
    className,
    classSessionId: sessionId,
    title: item.group.topic,
    topic: item.group.topic,
    date: item.targetStartsAt.slice(0, 10),
    startsAt: item.targetStartsAt,
    endsAt: item.targetEndsAt,
    sessionStatus: "scheduled",
    superseded: false,
    supersededBySessionId: "",
    cancellationReason: "",
    remindersSuppressed: false,
    assignmentIds: sessionPatch.assignmentIds,
    chapterIds: sessionPatch.assignmentIds,
    curriculumIds: sessionPatch.assignmentIds,
    assignment_id: sessionPatch.assignment_id,
    curriculumIndex: item.lessonNumber,
    curriculumDay: item.group.day,
    curriculumTaskCount: sessionPatch.assignmentIds.length,
    curriculumSource: "courseDictionary-day-groups",
    curriculumVersion: 2,
    updatedAt: serverTimestamp(),
  };
}

export async function restoreFollowingSessionsToWeeklyPattern({
  classId,
  klass = {},
  sessions = [],
  anchorSessionId = "",
  adminId = "admin",
} = {}) {
  const resolvedClassId = normalize(classId || klass.id);
  if (!resolvedClassId) throw new Error("Class ID is required.");

  const loadedClosures = await loadSchoolClosureDates({
    countryCode: "GH",
    startDate: klass.startDate,
    endDate: klass.endDate,
  }).catch(() => []);
  const excludedDates = [...new Set([
    ...(Array.isArray(klass.holidayDatesExcluded) ? klass.holidayDatesExcluded : []),
    ...loadedClosures,
  ].map(normalize).filter(Boolean))];

  const repairSessions = await loadRawRepairSessions(resolvedClassId, klass, sessions);
  const plan = buildFollowingScheduleRestorePlan({
    classId: resolvedClassId,
    klass,
    sessions: repairSessions,
    anchorSessionId,
    excludedDates,
  });
  if (!plan.restorableItems.length) {
    return {
      classId: resolvedClassId,
      levelId: plan.levelId,
      moved: 0,
      created: 0,
      skippedCancelled: plan.skippedCancelled.length,
      endDate: plan.endDate,
      anchorLessonNumber: plan.anchorLessonNumber,
      anchorStartsAt: plan.anchorStartsAt,
    };
  }

  const className = normalize(klass.name || klass.className);
  const existingIds = new Set(repairSessions.map((session) => normalize(session.id)).filter(Boolean));
  const assignedIds = new Set();
  const batch = writeBatch(db);
  let moved = 0;
  let created = 0;

  plan.restorableItems.forEach((item) => {
    let sessionId = normalize(item.session?.id);
    if (!sessionId) {
      const preferredId = generatedSessionId(resolvedClassId, item.targetStartsAt, plan.timezone);
      sessionId = !existingIds.has(preferredId) && !assignedIds.has(preferredId)
        ? preferredId
        : `${resolvedClassId}_session_${String(item.lessonNumber).padStart(2, "0")}`;
      created += 1;
    } else {
      moved += 1;
    }
    assignedIds.add(sessionId);

    const sessionPatch = restoredSessionPatch({
      classId: resolvedClassId,
      className,
      item,
      adminId,
      levelId: plan.levelId,
      expectedLessons: plan.expectedLessons,
    });
    batch.set(doc(db, "classSessions", sessionId), {
      id: sessionId,
      ...sessionPatch,
      ...(item.session ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true });
    batch.set(doc(db, "attendance", resolvedClassId, "sessions", sessionId), {
      ...restoredAttendancePatch({ classId: resolvedClassId, className, sessionId, item, sessionPatch }),
      ...(item.session ? {} : { createdAt: serverTimestamp(), students: {} }),
    }, { merge: true });
  });

  const planStartDate = normalize(plan.startDate || klass.startDate);
  const relevantClosures = excludedDates.filter((date) => date >= planStartDate && date <= plan.endDate);
  const scheduleVersion = Date.now();
  batch.set(doc(db, "classes", resolvedClassId), {
    scheduleAnchorSessionNumber: plan.anchorLessonNumber,
    scheduleAnchorDay: plan.levelId === "A1" ? plan.anchorLessonNumber - 1 : null,
    scheduleAnchorStartsAt: plan.anchorStartsAt,
    scheduleAnchorSource: "admin-selected-following-restore",
    scheduleAnchorUpdatedAt: serverTimestamp(),
    scheduleAnchorUpdatedBy: adminId,
    endDate: plan.endDate,
    configuredEndDate: plan.endDate,
    holidayAdjustedEndDate: plan.endDate,
    sessionDerivedEndDate: plan.endDate,
    holidayDatesExcluded: relevantClosures,
    generationStatus: "complete",
    generationError: "",
    sessionRepairStatus: "complete",
    sessionRepairAt: serverTimestamp(),
    lastSessionChangeType: "restore-following-weekly-pattern",
    lastSessionChangeMode: "anchor-following",
    lastSessionChangeAffectedCount: plan.restorableItems.length,
    lastChangedSessionId: normalize(plan.anchorSession.id),
    lastSessionChangeBy: adminId,
    lastSessionChangeAt: serverTimestamp(),
    sessionScheduleVersion: scheduleVersion,
    sessionScheduleUpdatedAt: serverTimestamp(),
    reminderScheduleVersion: scheduleVersion,
    reminderScheduleUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(db, "calendarFeeds", resolvedClassId), {
    classId: resolvedClassId,
    sessionScheduleVersion: scheduleVersion,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(collection(db, "auditLogs")), {
    type: "live-class-following-schedule-restored",
    entityType: "classTimetable",
    classId: resolvedClassId,
    anchorSessionId: normalize(plan.anchorSession.id),
    anchorLessonNumber: plan.anchorLessonNumber,
    anchorStartsAt: plan.anchorStartsAt,
    affectedSessionIds: plan.restorableItems.map((item) => normalize(item.session?.id)).filter(Boolean),
    affectedSessionCount: plan.restorableItems.length,
    movedCount: moved,
    createdCount: created,
    skippedCancelledCount: plan.skippedCancelled.length,
    endDate: plan.endDate,
    adminId,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return {
    classId: resolvedClassId,
    levelId: plan.levelId,
    moved,
    created,
    skippedCancelled: plan.skippedCancelled.length,
    endDate: plan.endDate,
    anchorLessonNumber: plan.anchorLessonNumber,
    anchorStartsAt: plan.anchorStartsAt,
  };
}
