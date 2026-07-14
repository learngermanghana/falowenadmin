export * from "./liveClassServiceBase.js";

export {
  createClassCohort,
  generateClassSessions,
  syncClassCurriculum,
} from "./liveClassCohortWriteService.js";
export { rebuildClassSessionsFromSchedule } from "./liveClassRebuildService.js";
export { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";
export {
  cancelSession,
  rescheduleSession,
} from "./liveClassSessionDirectService.js";
export {
  inspectLegacyRescheduleCollision,
  recoverLegacyRescheduleCollision,
} from "./liveClassRescheduleRecoveryService.js";

// Curriculum/session contract fields: topic, assignmentIds, chapterIds, curriculumIds, attendanceSessionRef.
