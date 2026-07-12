import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { calculateClassEndDate, setSchedulingSchoolClosureDates } from "../utils/liveClassScheduling.js";
import { singleSessionPerWeekdayRules } from "../utils/liveClassScheduleRules.js";
import { isHistoricalSchedulePayload } from "../utils/liveClassScheduleMode.js";
import { loadSchoolClosureDates } from "./schoolClosureService.js";

const laterDate = (left, right) => {
  const a = String(left || "").trim();
  const b = String(right || "").trim();
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
};

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
    : laterDate(normalizedPayload.endDate, calculatedEndDate);
  return {
    payload: { ...normalizedPayload, endDate, historicalMode },
    calculatedEndDate,
    relevantClosures: closureDates.filter((date) => date >= String(normalizedPayload.startDate || "") && date <= endDate),
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
  });
}
