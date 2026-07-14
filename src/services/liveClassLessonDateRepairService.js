import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase.js";
import { loadSchoolClosureDates } from "./schoolClosureService.js";
import { buildOfficialLessonSchedulePlan } from "../utils/liveClassLessonOrder.js";

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
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}${values.minute}`,
  };
}

function generatedSessionId(classId, startsAt, timezone) {
  const parts = localDateTimeParts(startsAt, timezone);
  return parts ? `${classId}_${parts.date}_${parts.time}` : `${classId}_lesson_${Date.now()}`;
}

function officialSessionPatch({ classId, className, item, adminId }) {
  const existing = item.session || {};
  const currentStatus = normalize(existing.status || "scheduled").toLowerCase();
  const lockedStatus = ["completed", "cancelled", "live"].includes(currentStatus);
  const status = lockedStatus ? currentStatus : "scheduled";
  const assignmentIds = item.group.assignmentIds || [];
  const changed = item.changed === true;

  return {
    classId,
    classRecordId: classId,
    className,
    startsAt: item.targetStartsAt,
    endsAt: item.targetEndsAt,
    status,
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
    remindersSuppressed: ["completed", "cancelled"].includes(status),
    sequence: Number(existing.sequence || 0) + (changed ? 1 : 0),
    ...(changed ? {
      previousStartsAt: existing.startsAt || "",
      previousEndsAt: existing.endsAt || "",
      manualDateOverride: true,
      manualDateOverrideBy: adminId,
      manualDateOverrideAt: serverTimestamp(),
      rescheduledBy: adminId,
      rescheduledAt: serverTimestamp(),
      rescheduleReason: "Official 28-lesson timetable repaired without rotating lesson topics.",
    } : {}),
    updatedAt: serverTimestamp(),
  };
}

function attendancePatch({ classId, className, sessionId, item, sessionPatch }) {
  return {
    classId,
    className,
    classSessionId: sessionId,
    title: item.group.topic,
    topic: item.group.topic,
    date: item.targetStartsAt.slice(0, 10),
    startsAt: item.targetStartsAt,
    endsAt: item.targetEndsAt,
    sessionStatus: sessionPatch.status,
    cancellationReason: sessionPatch.status === "cancelled"
      ? normalize(item.session?.cancellationReason)
      : "",
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

export async function repairClassToOfficialLessonSchedule({
  classId,
  klass = {},
  sessions = [],
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

  const plan = buildOfficialLessonSchedulePlan({
    classId: resolvedClassId,
    klass,
    sessions,
    excludedDates,
  });
  const className = normalize(klass.name || klass.className);
  const existingIds = new Set(sessions.map((session) => normalize(session.id)).filter(Boolean));
  const assignedIds = new Set();
  const batch = writeBatch(db);
  let created = 0;
  let moved = 0;

  plan.items.forEach((item) => {
    let sessionId = normalize(item.session?.id);
    if (!sessionId) {
      const preferredId = generatedSessionId(resolvedClassId, item.targetStartsAt, plan.timezone);
      sessionId = !existingIds.has(preferredId) && !assignedIds.has(preferredId)
        ? preferredId
        : `${resolvedClassId}_lesson_${String(item.lessonNumber).padStart(2, "0")}`;
      created += 1;
    } else if (item.changed) {
      moved += 1;
    }
    assignedIds.add(sessionId);

    const sessionPatch = officialSessionPatch({
      classId: resolvedClassId,
      className,
      item,
      adminId,
    });
    batch.set(doc(db, "classSessions", sessionId), {
      id: sessionId,
      ...sessionPatch,
      ...(item.session ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true });
    batch.set(
      doc(db, "attendance", resolvedClassId, "sessions", sessionId),
      {
        ...attendancePatch({ classId: resolvedClassId, className, sessionId, item, sessionPatch }),
        ...(item.session ? {} : { createdAt: serverTimestamp(), students: {} }),
      },
      { merge: true },
    );
  });

  const relevantClosures = excludedDates.filter((date) =>
    date >= normalize(klass.startDate) && date <= plan.endDate,
  );
  batch.set(doc(db, "classes", resolvedClassId), {
    endDate: plan.endDate,
    configuredEndDate: plan.endDate,
    holidayAdjustedEndDate: plan.endDate,
    sessionDerivedEndDate: plan.endDate,
    generatedSessionCount: plan.expectedLessons,
    curriculumMappedSessionCount: plan.expectedLessons,
    holidayDatesExcluded: relevantClosures,
    generationStatus: "complete",
    generationError: "",
    sessionRepairStatus: "complete",
    sessionRepairAt: serverTimestamp(),
    lastSessionChangeType: "official-schedule-repair",
    sessionScheduleVersion: Date.now(),
    sessionScheduleUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(db, "calendarFeeds", resolvedClassId), {
    classId: resolvedClassId,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  await batch.commit();

  return {
    classId: resolvedClassId,
    endDate: plan.endDate,
    expectedLessons: plan.expectedLessons,
    created,
    moved,
    repaired: plan.changedLessons,
  };
}
