import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { applyGroupedCurriculumToClass } from "./groupedCurriculumService.js";
import { prepareLiveClassSchedule, saveLiveClassScheduleMetadata } from "./liveClassSchedulePreparation.js";
import * as base from "./liveClassServiceBase.js";

async function loadSavedClass(classId) {
  const snap = await getDoc(doc(db, "classes", String(classId)));
  if (!snap.exists()) throw new Error("Class not found");
  return { id: snap.id, ...snap.data() };
}

export async function createClassCohort(payload) {
  const schedule = await prepareLiveClassSchedule(payload);
  const record = await base.createClassCohort(schedule.payload);
  const grouped = await applyGroupedCurriculumToClass(record.id);
  await saveLiveClassScheduleMetadata(record.id, schedule);
  return {
    ...record,
    generatedSessionCount: grouped.total,
    curriculumMappedSessionCount: grouped.mapped,
    curriculumAttendanceDayCount: grouped.attendanceDays,
    curriculumTaskCount: grouped.availableCurriculumItems,
    endDate: schedule.payload.endDate,
    historical: schedule.payload.historicalMode === true,
    holidayDatesExcluded: schedule.relevantClosures,
    holidayCalendarApplied: true,
  };
}

export async function generateClassSessions(classId, classRecord = null) {
  const klass = classRecord || await loadSavedClass(classId);
  const schedule = await prepareLiveClassSchedule(klass);
  const result = await base.generateClassSessions(classId, schedule.payload);
  const grouped = await applyGroupedCurriculumToClass(classId);
  await updateDoc(doc(db, "classes", String(classId)), { endDate: schedule.payload.endDate });
  await saveLiveClassScheduleMetadata(classId, schedule);
  return {
    ...result,
    ...grouped,
    endDate: schedule.payload.endDate,
    historical: schedule.payload.historicalMode === true,
    holidayDatesExcluded: schedule.relevantClosures,
  };
}

export async function syncClassCurriculum(classId, options = {}) {
  return applyGroupedCurriculumToClass(classId, {
    removeExtraFuture: options.removeExtraFuture !== false,
  });
}
