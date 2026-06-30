import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { calculateClassEndDate, setSchedulingSchoolClosureDates } from "../utils/liveClassScheduling.js";
import { loadSchoolClosureDates } from "./schoolClosureService.js";

const laterDate = (left, right) => {
  const a = String(left || "").trim();
  const b = String(right || "").trim();
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
};

const isHistorical = (payload = {}) => {
  const end = String(payload.endDate || "").trim();
  return payload.historicalMode === true
    || payload.historical === true
    || (/^\d{4}-\d{2}-\d{2}$/.test(end) && end < new Date().toISOString().slice(0, 10));
};

export async function prepareLiveClassSchedule(payload = {}) {
  const closureDates = await loadSchoolClosureDates({
    countryCode: "GH",
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
  setSchedulingSchoolClosureDates(closureDates);
  const calculatedEndDate = calculateClassEndDate({ ...payload, excludedDates: closureDates });
  const historicalMode = isHistorical(payload);
  const endDate = historicalMode
    ? String(payload.endDate || calculatedEndDate || "").trim()
    : laterDate(payload.endDate, calculatedEndDate);
  return {
    payload: { ...payload, endDate, historicalMode },
    calculatedEndDate,
    relevantClosures: closureDates.filter((date) => date >= String(payload.startDate || "") && date <= endDate),
  };
}

export async function saveLiveClassScheduleMetadata(classId, schedule) {
  await updateDoc(doc(db, "classes", String(classId)), {
    historical: schedule.payload.historicalMode === true,
    holidayCalendarCountryCode: "GH",
    holidayCalendarApplied: true,
    holidayCalendarAppliedAt: serverTimestamp(),
    holidayDatesExcluded: schedule.relevantClosures,
    holidayAdjustedEndDate: schedule.calculatedEndDate || schedule.payload.endDate || "",
  });
}
