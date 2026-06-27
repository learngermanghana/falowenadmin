import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { buildClassUrl, calculateClassEndDate, setSchedulingSchoolClosureDates } from "../utils/liveClassScheduling.js";
import { formatAccraDateTime } from "../utils/liveClassCancellationEmail.js";
import { saveAnnouncementRow } from "./communicationService.js";
import { loadSchoolClosureDates } from "./schoolClosureService.js";
import { applyGroupedCurriculumToClass } from "./groupedCurriculumService.js";
import * as base from "./liveClassServiceBase.js";

export * from "./liveClassServiceBase.js";

const laterDate = (left, right) => {
  const a = String(left || "").trim(); const b = String(right || "").trim();
  if (!a) return b; if (!b) return a; return a >= b ? a : b;
};
const isHistorical = (payload = {}) => {
  const end = String(payload.endDate || "").trim();
  return payload.historicalMode === true || payload.historical === true || (/^\d{4}-\d{2}-\d{2}$/.test(end) && end < new Date().toISOString().slice(0, 10));
};

async function prepare(payload = {}) {
  const closureDates = await loadSchoolClosureDates({ countryCode: "GH", startDate: payload.startDate, endDate: payload.endDate });
  setSchedulingSchoolClosureDates(closureDates);
  const calculatedEndDate = calculateClassEndDate({ ...payload, excludedDates: closureDates });
  const historicalMode = isHistorical(payload);
  const endDate = historicalMode ? String(payload.endDate || calculatedEndDate || "").trim() : laterDate(payload.endDate, calculatedEndDate);
  return {
    payload: { ...payload, endDate, historicalMode },
    calculatedEndDate,
    relevantClosures: closureDates.filter((date) => date >= String(payload.startDate || "") && date <= endDate),
  };
}

async function saveMetadata(classId, schedule) {
  await updateDoc(doc(db, "classes", String(classId)), {
    historical: schedule.payload.historicalMode === true,
    holidayCalendarCountryCode: "GH", holidayCalendarApplied: true,
    holidayCalendarAppliedAt: serverTimestamp(), holidayDatesExcluded: schedule.relevantClosures,
    holidayAdjustedEndDate: schedule.calculatedEndDate || schedule.payload.endDate || "",
  });
}

export async function createClassCohort(payload) {
  const schedule = await prepare(payload);
  const record = await base.createClassCohort(schedule.payload);
  const grouped = await applyGroupedCurriculumToClass(record.id);
  await saveMetadata(record.id, schedule);
  return { ...record, generatedSessionCount: grouped.total, curriculumMappedSessionCount: grouped.mapped, curriculumAttendanceDayCount: grouped.attendanceDays, curriculumTaskCount: grouped.availableCurriculumItems, endDate: schedule.payload.endDate, historical: schedule.payload.historicalMode === true, holidayDatesExcluded: schedule.relevantClosures, holidayCalendarApplied: true };
}

export async function generateClassSessions(classId, classRecord = null) {
  let klass = classRecord;
  if (!klass) {
    const snap = await getDoc(doc(db, "classes", String(classId)));
    if (!snap.exists()) throw new Error("Class not found");
    klass = { id: snap.id, ...snap.data() };
  }
  const schedule = await prepare(klass);
  const result = await base.generateClassSessions(classId, schedule.payload);
  const grouped = await applyGroupedCurriculumToClass(classId);
  await updateDoc(doc(db, "classes", String(classId)), { endDate: schedule.payload.endDate });
  await saveMetadata(classId, schedule);
  return { ...result, ...grouped, endDate: schedule.payload.endDate, historical: schedule.payload.historicalMode === true, holidayDatesExcluded: schedule.relevantClosures };
}

export async function rescheduleSession(sessionId, payload) {
  const sessionSnap = await getDoc(doc(db, "classSessions", String(sessionId)));
  if (!sessionSnap.exists()) throw new Error("Session not found");
  const session = { id: sessionSnap.id, ...sessionSnap.data() };
  const classSnap = await getDoc(doc(db, "classes", String(session.classId)));
  const klass = classSnap.exists() ? { id: classSnap.id, ...classSnap.data() } : { id: session.classId, name: session.className || "Falowen class" };

  await base.rescheduleSession(sessionId, payload);

  const className = String(klass.name || session.className || "Falowen class").trim();
  const classUrl = String(klass.classUrl || buildClassUrl(klass) || "").trim();
  const oldTime = formatAccraDateTime(session.startsAt);
  const newTime = formatAccraDateTime(payload.startsAt);
  const subject = `Class Rescheduled: ${className} – ${newTime}`;
  const announcement = [
    `Hello everyone, the ${className} live class has been rescheduled.`,
    `Previous time: ${oldTime}`,
    `New time: ${newTime}`,
    classUrl ? `Class page: ${classUrl}` : "",
    "Your Falowen schedule and calendar have been updated automatically.",
  ].filter(Boolean).join("\n\n");

  try {
    const receipt = await saveAnnouncementRow({
      announcement,
      className,
      date: String(payload.startsAt || "").slice(0, 10),
      link: classUrl,
      topic: subject,
    });
    return { sessionId, emailSubmitted: Boolean(receipt?.sheet?.success), emailMessage: receipt?.sheet?.message || "" };
  } catch (error) {
    return { sessionId, emailSubmitted: false, emailMessage: error?.message || "Communication sheet update failed" };
  }
}

export async function syncClassCurriculum(classId, options = {}) {
  return applyGroupedCurriculumToClass(classId, { removeExtraFuture: options.removeExtraFuture !== false });
}
