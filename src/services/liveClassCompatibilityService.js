import * as base from "./liveClassCompatibilityServiceBase.js";
import { syncClassEndDateFromSessions } from "./liveClassService.js";

export * from "./liveClassCompatibilityServiceBase.js";

export async function getCompatibleClassDashboard(classId) {
  await syncClassEndDateFromSessions(classId).catch(() => {});
  return base.getCompatibleClassDashboard(classId);
}
