import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import { rebuildClassSessionsFromSchedule, syncClassCurriculum, syncClassEndDateFromSessions } from "./liveClassService.js";
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
  if (generation.endDate) {
    await updateDoc(doc(db, "classes", String(classId)), {
      endDate: generation.endDate,
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
  const sessions = (dashboard.sessions || [])
    .filter((session) => !Number.isNaN(new Date(session.startsAt || 0).getTime()))
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
  const latest = sessions[sessions.length - 1] || null;
  const endDate = String(latest?.startsAt || "").slice(0, 10) || String(dashboard.klass?.endDate || "");

  return {
    ...dashboard,
    sessions,
    klass: { ...dashboard.klass, sessionDerivedEndDate: endDate },
    sessionRepair: repair,
  };
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
  }

  return session;
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
