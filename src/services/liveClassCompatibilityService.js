import * as base from "./liveClassCompatibilityServiceBase.js";

export * from "./liveClassCompatibilityServiceBase.js";

export async function getCompatibleClassDashboard(classId) {
  const dashboard = await base.getCompatibleClassDashboard(classId);
  const sessions = (dashboard.sessions || [])
    .filter((session) => String(session.status || "scheduled").toLowerCase() !== "cancelled")
    .filter((session) => !Number.isNaN(new Date(session.startsAt || 0).getTime()))
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
  const latest = sessions[sessions.length - 1] || null;
  const endDate = String(latest?.startsAt || "").slice(0, 10) || String(dashboard.klass?.endDate || "");

  return {
    ...dashboard,
    klass: { ...dashboard.klass, sessionDerivedEndDate: endDate },
  };
}
