import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
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

async function querySessions(field, identifier) {
  const snap = await getDocs(
    query(collection(db, "classSessions"), where(field, "==", identifier)),
  );
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function loadRawRepairSessions(classId, klass = {}, fallbackSessions = []) {
  const found = new Map();
  fallbackSessions.forEach((session) => {
    const sessionId = normalize(session?.id);
    if (!sessionId) return;
    found.set(sessionId, {
      ...session,
      id: sessionId,
      repairPreferredRecord: true,
    });
  });

  const identifiers = [...new Set([
    classId,
    klass.id,
    klass.classId,
    klass.name,
    klass.className,
    klass.slug,
  ].map(normalize).filter(Boolean))];
  const lookups = identifiers.flatMap((identifier) =>
    ["classId", "classRecordId", "className"].map((field) => [field, identifier]),
  );
  const results = await Promise.allSettled(
    lookups.map(([field, identifier]) => querySessions(field, identifier)),
  );
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((session) => {
      const sessionId = normalize(session.id);
      const preferred = found.get(sessionId);
      if (preferred?.repairPreferredRecord === true) {
        found.set(sessionId, {
          ...session,
          ...preferred,
          id: sessionId,
          repairPreferredRecord: true,
        });
        return;
      }
      found.set(sessionId, session);
    });
  });

  return [...found.values()];
}

function officialSessionPatch({ classId, className, item, adminId, plan }) {
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
      rescheduleReason: `${plan.levelId} official ${plan.expectedLessons}-${plan.countLabel} timetable repaired atomically without duplicate times.`,
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
    superseded: false,
    supersededBySessionId: "",
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

  const repairSessions = await loadRawRepairSessions(resolvedClassId, klass, sessions);
  const plan = buildOfficialLessonSchedulePlan({
    classId: resolvedClassId,
    klass,
    sessions: repairSessions,
    excludedDates,
  });
  const className = normalize(klass.name || klass.className);
  const existingIds = new Set(repairSessions.map((session) => normalize(session.id)).filter(Boolean));
  const assignedIds = new Set();
  const batch = writeBatch(db);
  let created = 0;
  let moved = 0;
  let aliasesSuperseded = 0;

  plan.items.forEach((item) => {
    let sessionId = normalize(item.session?.id);
    if (!sessionId) {
      const preferredId = generatedSessionId(resolvedClassId, item.targetStartsAt, plan.timezone);
      sessionId = !existingIds.has(preferredId) && !assignedIds.has(preferredId)
        ? preferredId
        : `${resolvedClassId}_session_${String(item.lessonNumber).padStart(2, "0")}`;
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
      plan,
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

  plan.duplicateSessions.forEach(({ lessonNumber, session, canonicalSessionId }) => {
    const sessionId = normalize(session?.id);
    if (!sessionId || assignedIds.has(sessionId)) return;
    const status = normalize(session.status || "scheduled").toLowerCase();
    if (["completed", "live", "cancelled", "superseded"].includes(status)) return;

    const duplicatePatch = {
      status: "superseded",
      originalStatus: normalize(session.status || "scheduled"),
      superseded: true,
      supersededBySessionId: canonicalSessionId,
      supersededLessonNumber: lessonNumber,
      supersededReason: "Duplicate session alias removed by official timetable repair.",
      remindersSuppressed: true,
      supersededAt: serverTimestamp(),
      supersededBy: adminId,
      updatedAt: serverTimestamp(),
    };
    batch.set(doc(db, "classSessions", sessionId), duplicatePatch, { merge: true });
    batch.set(doc(db, "attendance", resolvedClassId, "sessions", sessionId), {
      classId: resolvedClassId,
      className,
      classSessionId: sessionId,
      sessionStatus: "superseded",
      superseded: true,
      supersededBySessionId: canonicalSessionId,
      remindersSuppressed: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    aliasesSuperseded += 1;
  });

  const planStartDate = normalize(plan.startDate || klass.startDate);
  const relevantClosures = excludedDates.filter((date) =>
    date >= planStartDate && date <= plan.endDate,
  );
  batch.set(doc(db, "classes", resolvedClassId), {
    ...(plan.scheduleAnchor ? {
      startDate: planStartDate,
      configuredStartDate: planStartDate,
      scheduleAnchorSessionNumber: plan.scheduleAnchor.sessionNumber,
      scheduleAnchorDay: plan.scheduleAnchor.day,
      scheduleAnchorStartsAt: plan.scheduleAnchor.startsAt,
      scheduleAnchorSource: plan.scheduleAnchor.source,
      scheduleAnchorUpdatedAt: serverTimestamp(),
      scheduleAnchorUpdatedBy: adminId,
    } : {}),
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
    duplicateSessionAliasesSuperseded: aliasesSuperseded,
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
    levelId: plan.levelId,
    startDate: planStartDate,
    endDate: plan.endDate,
    scheduleAnchor: plan.scheduleAnchor,
    expectedLessons: plan.expectedLessons,
    countLabel: plan.countLabel,
    created,
    moved,
    repaired: plan.changedLessons,
    collisionsResolved: plan.collisionCount,
    aliasesSuperseded,
  };
}
