import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { calculateClassEndDate, setSchedulingSchoolClosureDates } from "../utils/liveClassScheduling.js";
import { loadSchoolClosureDates } from "./schoolClosureService.js";
import * as base from "./liveClassServiceBase.js";

export * from "./liveClassServiceBase.js";

function laterDate(left, right) {
  const a = String(left || "").trim();
  const b = String(right || "").trim();
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

function closuresWithinRange(dates, startDate, endDate) {
  return dates.filter((date) => date >= startDate && date <= endDate);
}

async function prepareHolidayAwareSchedule(payload = {}) {
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
  return {
    payload: { ...payload, endDate },
    closureDates,
    calculatedEndDate,
    relevantClosures: closuresWithinRange(closureDates, String(payload.startDate || ""), endDate),
  };
}

async function saveHolidayMetadata(classId, schedule) {
  if (!classId) return;
  await updateDoc(doc(db, "classes", String(classId)), {
    holidayCalendarCountryCode: "GH",
    holidayCalendarApplied: true,
    holidayCalendarAppliedAt: serverTimestamp(),
    holidayDatesExcluded: schedule.relevantClosures,
    holidayAdjustedEndDate: schedule.calculatedEndDate || schedule.payload.endDate || "",
  });
}

export async function createClassCohort(payload) {
  const schedule = await prepareHolidayAwareSchedule(payload);
  const record = await base.createClassCohort(schedule.payload);
  await saveHolidayMetadata(record.id, schedule);
  return {
    ...record,
    endDate: schedule.payload.endDate,
    holidayDatesExcluded: schedule.relevantClosures,
    holidayCalendarApplied: true,
  };
}

export async function generateClassSessions(classId, classRecord = null) {
  let klass = classRecord;
  if (!klass) {
    const snap = await getDoc(doc(db, "classes", String(classId)));
    if (!snap.exists()) throw new Error("Class not found");
    klass = { id: snap.id, ...snap.data() };
  }
  const schedule = await prepareHolidayAwareSchedule(klass);
  const result = await base.generateClassSessions(classId, schedule.payload);
  await updateDoc(doc(db, "classes", String(classId)), {
    endDate: schedule.payload.endDate,
    holidayCalendarCountryCode: "GH",
    holidayCalendarApplied: true,
    holidayCalendarAppliedAt: serverTimestamp(),
    holidayDatesExcluded: schedule.relevantClosures,
    holidayAdjustedEndDate: schedule.calculatedEndDate || schedule.payload.endDate || "",
  });
  return { ...result, endDate: schedule.payload.endDate, holidayDatesExcluded: schedule.relevantClosures };
}
