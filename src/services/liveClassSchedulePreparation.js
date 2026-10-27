import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import {
  calculateClassEndDate,
  generateSessionOccurrences,
  setSchedulingSchoolClosureDates,
} from "../utils/liveClassScheduling.js";
import { singleSessionPerWeekdayRules } from "../utils/liveClassScheduleRules.js";
import { isHistoricalSchedulePayload } from "../utils/liveClassScheduleMode.js";
import { assertTimetableIntegrity } from "../utils/liveClassTimetableIntegrity.js";
import { loadSchoolClosureDates } from "./schoolClosureService.js";

export async function prepareLiveClassSchedule(payload = {}) {
  const scheduleRules = singleSessionPerWeekdayRules(payload.scheduleRules || []);
  const normalizedPayload = { ...payload, scheduleRules };
  const closureDates = await loadSchoolClosureDates({
    countryCode: "GH",
    startDate: normalizedPayload.startDate,
    endDate: normalizedPayload.endDate,
  });
  setSchedulingSchoolClosureDates(closureDates);
  const calculatedEndDate = calculateClassEndDate({ ...normalizedPayload, excludedDates: closureDates });
  const historicalMode = isHistoricalSchedulePayload(normalizedPayload);
  const endDate = historicalMode
    ? String(normalizedPayload.endDate || calculatedEndDate || "").trim()
    : String(calculatedEndDate || "").trim();

  if (!historicalMode && !endDate) {
    const error = new Error("The official class timetable could not be generated from the selected start date and teaching days.");
    error.code = "live-class/timetable-integrity";
    throw error;
  }

  const preparedPayload = { ...normalizedPayload, endDate, historicalMode };
  const relevantClosures = closureDates.filter((date) =>
    date >= String(normalizedPayload.startDate || "") && date <= endDate,
  );

  let integrity = null;
  if (!historicalMode) {
    const previewClassId = String(
      normalizedPayload.id
        || normalizedPayload.classId
        || `schedule-preview-${String(normalizedPayload.levelId || "class").toLowerCase()}`,
    );
    const occurrences = generateSessionOccurrences({
      classId: previewClassId,
      ...preparedPayload,
      excludedDates: relevantClosures,
    });
    integrity = assertTimetableIntegrity({
      klass: preparedPayload,
      sessions: occurrences,
      requireCurriculum: false,
      enforceEndDate: true,
    });
  }

  return {
    payload: preparedPayload,
    calculatedEndDate,
    relevantClosures,
    integrity,
  };
}

export async function saveLiveClassScheduleMetadata(classId, schedule) {
  const preparedEndDate = String(schedule.payload?.endDate || "").trim();
  const scheduleRules = singleSessionPerWeekdayRules(schedule.payload?.scheduleRules || []);
  await updateDoc(doc(db, "classes", String(classId)), {
    ...(preparedEndDate ? { endDate: preparedEndDate } : {}),
    scheduleRules,
    historical: schedule.payload.historicalMode === true,
    holidayCalendarCountryCode: "GH",
    holidayCalendarApplied: true,
    holidayCalendarAppliedAt: serverTimestamp(),
    holidayDatesExcluded: schedule.relevantClosures,
    holidayAdjustedEndDate: schedule.calculatedEndDate || preparedEndDate || "",
    timetableIntegrityStatus: schedule.integrity?.healthy === true ? "healthy" : schedule.payload.historicalMode === true ? "historical" : "unknown",
    timetableIntegrityExpectedCount: Number(schedule.integrity?.expectedCount || 0),
    timetableIntegrityActualCount: Number(schedule.integrity?.actualCount || 0),
    timetableIntegrityIssueCount: Number(schedule.integrity?.issues?.length || 0),
    timetableIntegrityValidatedAt: serverTimestamp(),
  });
}
