import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { calculateClassEndDate, setSchedulingSchoolClosureDates } from "../utils/liveClassScheduling.js";
import { loadSchoolClosureDates } from "./schoolClosureService.js";
import * as base from "./classCohortUpdateServiceBase.js";

export * from "./classCohortUpdateServiceBase.js";

function laterDate(left, right) {
  const a = String(left || "").trim();
  const b = String(right || "").trim();
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

export async function updateClassCohort(classId, payload) {
  const closureDates = await loadSchoolClosureDates({
    countryCode: "GH",
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
  setSchedulingSchoolClosureDates(closureDates);
  const calculatedEndDate = calculateClassEndDate({
    ...payload,
    excludedDates: closureDates,
  });
  const endDate = laterDate(payload.endDate, calculatedEndDate);
  const result = await base.updateClassCohort(classId, { ...payload, endDate });
  const relevantClosures = closureDates.filter((date) => date >= payload.startDate && date <= endDate);
  await updateDoc(doc(db, "classes", String(classId)), {
    endDate,
    holidayCalendarCountryCode: "GH",
    holidayCalendarApplied: true,
    holidayCalendarAppliedAt: serverTimestamp(),
    holidayDatesExcluded: relevantClosures,
    holidayAdjustedEndDate: calculatedEndDate || endDate,
  });
  return { ...result, endDate, holidayDatesExcluded: relevantClosures };
}
