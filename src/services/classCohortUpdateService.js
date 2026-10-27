import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { calculateClassEndDate, setSchedulingSchoolClosureDates } from "../utils/liveClassScheduling.js";
import {
  duplicateScheduleWeekdays,
  singleSessionPerWeekdayRules,
} from "../utils/liveClassScheduleRules.js";
import { loadSchoolClosureDates } from "./schoolClosureService.js";
import { applyGroupedCurriculumToClass } from "./groupedCurriculumService.js";
import { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";
import * as base from "./classCohortUpdateServiceBase.js";
import { rebuildClassSessionsFromSchedule } from "./liveClassServiceBase.js";
import { syncClassSchedule } from "./classScheduleSyncService.js";
import { classRecordToScheduleSheetPayload } from "../utils/classScheduleSheetPayload.js";

export * from "./classCohortUpdateServiceBase.js";

function laterDate(left, right) {
  const a = String(left || "").trim();
  const b = String(right || "").trim();
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

function exactOrCalculatedEndDate(payload, calculatedEndDate) {
  if (payload.historicalMode === true) {
    return String(payload.endDate || calculatedEndDate || "").trim();
  }
  return laterDate(payload.endDate, calculatedEndDate);
}

function generationResult(classId, generation = {}) {
  return {
    classId,
    removed: generation.removed || 0,
    created: generation.created || 0,
    refreshed: generation.refreshed || generation.enriched || 0,
    mapped: generation.mapped || 0,
    preserved: generation.preserved ?? Math.max(0, generation.total - (generation.created || 0)),
    total: generation.total,
  };
}

async function updateHistoricalClass(classId, payload) {
  const classRef = doc(db, "classes", String(classId));
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error("Class not found");

  const current = { id: classSnap.id, ...classSnap.data() };
  const next = {
    ...current,
    id: classId,
    name: String(payload.name || current.name || "").trim(),
    city: String(payload.city ?? current.city ?? "").trim(),
    levelId: String(payload.levelId || current.levelId || "").trim().toUpperCase(),
    startDate: String(payload.startDate || current.startDate || "").trim(),
    endDate: String(payload.endDate || current.endDate || "").trim(),
    timezone: String(payload.timezone || current.timezone || "Africa/Accra").trim(),
    status: String(payload.status || current.status || "graduated").toLowerCase(),
    tuitionGhs: Number(payload.tuitionGhs ?? current.tuitionGhs ?? 3000),
    publicVisible: payload.publicVisible ?? current.publicVisible ?? true,
    registrationOpen: payload.registrationOpen ?? current.registrationOpen ?? false,
    tutorId: String(payload.tutorId ?? current.tutorId ?? "").trim(),
    zoomProfileId: String(payload.zoomProfileId ?? current.zoomProfileId ?? "").trim(),
    scheduleRules: singleSessionPerWeekdayRules(Array.isArray(payload.scheduleRules) ? payload.scheduleRules : current.scheduleRules || []),
    historical: true,
  };

  await updateDoc(classRef, {
    name: next.name,
    city: next.city,
    levelId: next.levelId,
    startDate: next.startDate,
    endDate: next.endDate,
    timezone: next.timezone,
    status: next.status,
    tuitionGhs: next.tuitionGhs,
    publicVisible: next.publicVisible,
    registrationOpen: next.registrationOpen,
    tutorId: next.tutorId,
    zoomProfileId: next.zoomProfileId,
    scheduleRules: next.scheduleRules,
    historical: true,
    generationStatus: "pending",
    generationError: "",
    updatedAt: serverTimestamp(),
  });

  const generation = await rebuildClassSessionsFromSchedule(classId, next);
  const grouped = await applyGroupedCurriculumToClass(classId);

  await updateDoc(classRef, {
    generationStatus: "complete",
    generationError: "",
    generatedSessionCount: generation.total,
    curriculumMappedSessionCount: grouped.mapped,
    updatedAt: serverTimestamp(),
  });

  return { ...generationResult(classId, generation), mapped: grouped.mapped || generation.mapped || 0 };
}

async function repairDuplicateTimetableClass(classId, current, payload) {
  const classRef = doc(db, "classes", String(classId));
  const next = {
    ...current,
    ...payload,
    id: classId,
    name: String(payload.name || current.name || "").trim(),
    city: String(payload.city ?? current.city ?? "").trim(),
    levelId: String(payload.levelId || current.levelId || "").trim().toUpperCase(),
    startDate: String(payload.startDate || current.startDate || "").trim(),
    endDate: String(payload.endDate || current.endDate || "").trim(),
    timezone: String(payload.timezone || current.timezone || "Africa/Accra").trim(),
    status: String(payload.status || current.status || "active").toLowerCase(),
    scheduleRules: singleSessionPerWeekdayRules(payload.scheduleRules || current.scheduleRules || []),
    historical: false,
  };

  await updateDoc(classRef, {
    name: next.name,
    city: next.city,
    levelId: next.levelId,
    startDate: next.startDate,
    endDate: next.endDate,
    timezone: next.timezone,
    status: next.status,
    tuitionGhs: Number(next.tuitionGhs || 3000),
    publicVisible: next.publicVisible !== false,
    registrationOpen: next.registrationOpen !== false,
    tutorId: String(next.tutorId || "").trim(),
    zoomProfileId: String(next.zoomProfileId || "").trim(),
    scheduleRules: next.scheduleRules,
    historical: false,
    generationStatus: "pending",
    generationError: "",
    duplicateTimetableRepairAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const generation = await rebuildClassSessionsFromSchedule(classId, next);
  await updateDoc(classRef, {
    generationStatus: "complete",
    generationError: "",
    generatedSessionCount: generation.total,
    curriculumMappedSessionCount: generation.mapped || 0,
    updatedAt: serverTimestamp(),
  });
  return generationResult(classId, generation);
}

export async function updateClassCohort(classId, payload) {
  const classRef = doc(db, "classes", String(classId));
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error("Class not found");
  const current = { id: classSnap.id, ...classSnap.data() };
  const sourceRules = Array.isArray(payload.scheduleRules) ? payload.scheduleRules : current.scheduleRules || [];
  const scheduleRules = singleSessionPerWeekdayRules(sourceRules);
  const normalizedPayload = { ...current, ...payload, id: classId, scheduleRules };
  const closureDates = await loadSchoolClosureDates({
    countryCode: "GH",
    startDate: normalizedPayload.startDate,
    endDate: normalizedPayload.endDate,
  });
  setSchedulingSchoolClosureDates(closureDates);
  const calculatedEndDate = calculateClassEndDate({
    ...normalizedPayload,
    excludedDates: closureDates,
  });
  const endDate = exactOrCalculatedEndDate(normalizedPayload, calculatedEndDate);
  const preparedPayload = { ...normalizedPayload, endDate };
  const repairingDuplicateTimetable = duplicateScheduleWeekdays(current.scheduleRules || []).length > 0;
  const baseResult = normalizedPayload.historicalMode === true
    ? await updateHistoricalClass(classId, preparedPayload)
    : repairingDuplicateTimetable
      ? await repairDuplicateTimetableClass(classId, current, preparedPayload)
      : await base.updateClassCohort(classId, preparedPayload);
  const groupedResult = normalizedPayload.historicalMode === true
    ? {}
    : await applyGroupedCurriculumToClass(classId);
  const relevantClosures = closureDates.filter((date) => date >= normalizedPayload.startDate && date <= endDate);
  await updateDoc(classRef, {
    endDate,
    scheduleRules,
    configuredEndDate: String(normalizedPayload.endDate || endDate || "").trim(),
    historical: normalizedPayload.historicalMode === true,
    holidayCalendarCountryCode: "GH",
    holidayCalendarApplied: true,
    holidayCalendarAppliedAt: serverTimestamp(),
    holidayDatesExcluded: relevantClosures,
    holidayAdjustedEndDate: calculatedEndDate || endDate,
  });

  const sessionEndDate = await syncClassEndDateFromSessions(classId).catch(() => null);
  const sheetPayload = classRecordToScheduleSheetPayload({
    ...normalizedPayload,
    id: classId,
    name: normalizedPayload.name,
    endDate: sessionEndDate?.endDate || endDate,
  });
  const classScheduleSheetSync = sheetPayload.className && sheetPayload.startDate && sheetPayload.endDate && sheetPayload.time && sheetPayload.meetingDays.length
    ? await syncClassSchedule(sheetPayload)
      .then((result) => ({ status: "synced", result }))
      .catch((error) => ({ status: "failed", error: error?.message || "Class schedule sheet sync failed" }))
    : { status: "skipped", error: "Missing required class schedule sheet data" };

  return {
    ...baseResult,
    ...groupedResult,
    endDate,
    requestedEndDate: endDate,
    configuredEndDate: String(normalizedPayload.endDate || endDate || "").trim(),
    sessionDerivedEndDate: sessionEndDate?.sessionDerivedEndDate || "",
    holidayDatesExcluded: relevantClosures,
    classScheduleSheetSync,
  };
}
