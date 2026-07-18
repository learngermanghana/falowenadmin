import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import { classScheduleBoundsFromSessions } from "../utils/attendanceSessionOverride.js";
import { compareSessionsByLesson } from "../utils/liveClassLessonOrder.js";
import { getEffectiveClassEndDate } from "../utils/liveClassScheduling.js";
import { rebuildClassSessionsFromSchedule, listClassSessions, syncClassCurriculum, syncClassEndDateFromSessions } from "./liveClassService.js";
import * as base from "./liveClassCompatibilityServiceBase.js";

export * from "./liveClassCompatibilityServiceBase.js";

function normalize(value) {
  return String(value || "").trim();
}

function classLevel(klass = {}) {
  const candidates = [klass.name, klass.className, klass.levelId, klass.level, klass.slug];
  for (const candidate of candidates) {
    const match = normalize(candidate).match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
    if (match) return match[1].toUpperCase();
  }
  return "";
}

function canRepairSchedule(klass = {}) {
  const status = normalize(klass.status).toLowerCase();
  if (klass.historical === true || ["graduated", "archived", "deleted"].includes(status)) return false;
  return Array.isArray(klass.scheduleRules) && klass.scheduleRules.length > 0;
}

async function repairMissingSessions(classId, dashboard) {
  const levelId = classLevel(dashboard?.klass || {});
  const expected = getCourseSessionGroups(levelId).length;
  const current = dashboard?.sessions?.length || 0;

  if (!expected || current >= expected || !canRepairSchedule(dashboard?.klass || {})) {
    return { repaired: false, expected, before: current, after: current };
  }

  const generation = await rebuildClassSessionsFromSchedule(classId);
  if (generation.sessionDerivedEndDate || generation.endDate) {
    await updateDoc(doc(db, "classes", String(classId)), {
      ...(generation.sessionDerivedEndDate ? { sessionDerivedEndDate: generation.sessionDerivedEndDate } : {}),
      generatedSessionCount: generation.total,
      sessionRepairStatus: "complete",
      sessionRepairAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return {
    repaired: true,
    expected,
    before: current,
    after: generation.total,
    generation,
  };
}

function prepareDashboard(dashboard, repair = null) {
  const chronologicalSessions = (dashboard.sessions || [])
    .filter((session) => !Number.isNaN(new Date(session.startsAt || 0).getTime()))
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
  const classScheduleRules = Array.isArray(dashboard.klass?.scheduleRules)
    ? dashboard.klass.scheduleRules
    : [];
  const sessions = [...chronologicalSessions]
    .sort(compareSessionsByLesson)
    .map((session) => ({ ...session, classScheduleRules }));
  const bounds = classScheduleBoundsFromSessions(chronologicalSessions, dashboard.klass?.timezone);
  const sessionDerivedStartDate = bounds.sessionDerivedStartDate || String(dashboard.klass?.sessionDerivedStartDate || "");
  const sessionDerivedEndDate = bounds.sessionDerivedEndDate || String(dashboard.klass?.sessionDerivedEndDate || "");
  const effectiveEndDate = getEffectiveClassEndDate({ ...dashboard.klass, sessionDerivedEndDate }, chronologicalSessions);

  return {
    ...dashboard,
    sessions,
    klass: { ...dashboard.klass, sessionDerivedStartDate, sessionDerivedEndDate, effectiveEndDate },
    sessionRepair: repair,
  };
}

async function syncClassScheduleBoundsFromSessions(classId, { changedSessionId = "", actorId = "" } = {}) {
  const classRef = doc(db, "classes", String(classId));
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error("Class not found");

  const klass = { id: classSnap.id, ...classSnap.data() };
  const sessions = await listClassSessions(classId);
  const bounds = classScheduleBoundsFromSessions(sessions, klass.timezone || "Africa/Accra");
  const patch = {
    ...(bounds.sessionDerivedStartDate ? { sessionDerivedStartDate: bounds.sessionDerivedStartDate } : {}),
    ...(bounds.sessionDerivedEndDate ? { sessionDerivedEndDate: bounds.sessionDerivedEndDate } : {}),
    ...(changedSessionId ? { lastManualDateOverrideSessionId: String(changedSessionId) } : {}),
    ...(actorId ? { lastManualDateOverrideBy: String(actorId) } : {}),
    sessionScheduleVersion: Date.now(),
    sessionScheduleUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(classRef, patch);
  await setDoc(doc(db, "calendarFeeds", String(classId)), {
    classId: String(classId),
    updatedAt: serverTimestamp(),
  }, { merge: true }).catch(() => {});
  return { ...bounds, patch };
}

export async function getCompatibleClassDashboard(classId) {
  let dashboard = await base.getCompatibleClassDashboard(classId);
  let repair = null;

  try {
    repair = await repairMissingSessions(classId, dashboard);
    if (repair.repaired) dashboard = await base.getCompatibleClassDashboard(classId);
  } catch (error) {
    repair = {
      repaired: false,
      expected: getCourseSessionGroups(classLevel(dashboard?.klass || {})).length,
      before: dashboard?.sessions?.length || 0,
      after: dashboard?.sessions?.length || 0,
      error: error?.message || "Missing sessions could not be repaired",
    };
  }

  return prepareDashboard(dashboard, repair);
}

export async function updateCompatibleSession(classId, sessionId, patch = {}) {
  const hasTimeChange = Boolean(patch.startsAt || patch.endsAt || patch.manualDateOverride);
  const nextPatch = hasTimeChange && !patch.status ? { ...patch, status: "rescheduled" } : patch;
  const session = await base.updateCompatibleSession(classId, sessionId, nextPatch);

  if (hasTimeChange) {
    await syncClassEndDateFromSessions(session.classId || classId).catch(() => {});
    await syncClassScheduleBoundsFromSessions(session.classId || classId, {
      changedSessionId: sessionId,
      actorId: patch.manualDateOverrideBy || patch.rescheduledBy || "",
    }).catch(() => {});
  }

  return session;
}

export async function overrideCompatibleSessionDate(classId, sessionId, patch = {}) {
  const session = await base.updateCompatibleSession(classId, sessionId, {
    ...patch,
    status: patch.status || "rescheduled",
  });
  const schedule = await syncClassScheduleBoundsFromSessions(session.classId || classId, {
    changedSessionId: sessionId,
    actorId: patch.manualDateOverrideBy || "",
  });
  return { session, schedule };
}

export async function syncCompatibleClassCurriculum(classId, options = {}) {
  const dashboard = await base.getCompatibleClassDashboard(classId);
  const repair = await repairMissingSessions(classId, dashboard);
  const curriculum = await syncClassCurriculum(classId, {
    force: options.force === true,
    removeExtraFuture: options.removeExtraFuture !== false,
  });

  return {
    ...curriculum,
    sessionRepair: repair,
    generated: repair.after,
    expectedSessions: repair.expected,
  };
}
