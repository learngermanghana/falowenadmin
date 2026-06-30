import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { getSchedulingSchoolClosureDates, setSchedulingSchoolClosureDates } from "../utils/liveClassScheduling.js";
import { prepareLiveClassSchedule, saveLiveClassScheduleMetadata } from "./liveClassSchedulePreparation.js";
import * as base from "./liveClassServiceBase.js";

function normalizedRules(rules = []) {
  return (Array.isArray(rules) ? rules : []).map((rule) => ({
    day: String(rule.day || rule.weekday || "").slice(0, 3).toLowerCase(),
    startTime: String(rule.startTime || rule.time || ""),
    durationMinutes: Number(rule.durationMinutes || 120),
  }));
}

function rebuildSettings(record = {}) {
  return JSON.stringify({
    name: String(record.name || ""),
    levelId: String(record.levelId || record.level || "").toUpperCase(),
    startDate: String(record.startDate || ""),
    endDate: String(record.endDate || ""),
    timezone: String(record.timezone || "Africa/Accra"),
    scheduleRules: normalizedRules(record.scheduleRules),
  });
}

export async function rebuildClassSessionsFromSchedule(classId, candidateRecord = null) {
  const snap = await getDoc(doc(db, "classes", String(classId)));
  if (!snap.exists()) throw new Error("Class not found");
  const savedClass = { id: snap.id, ...snap.data() };

  if (candidateRecord && rebuildSettings(candidateRecord) !== rebuildSettings(savedClass)) {
    throw new Error("Save the class changes before rebuilding sessions.");
  }

  const previousClosures = getSchedulingSchoolClosureDates();
  try {
    const schedule = await prepareLiveClassSchedule(savedClass);
    const result = await base.rebuildClassSessionsFromSchedule(classId, schedule.payload);
    await saveLiveClassScheduleMetadata(classId, schedule);
    return {
      ...result,
      endDate: schedule.payload.endDate,
      historical: schedule.payload.historicalMode === true,
      holidayDatesExcluded: schedule.relevantClosures,
    };
  } finally {
    setSchedulingSchoolClosureDates(previousClosures);
  }
}
