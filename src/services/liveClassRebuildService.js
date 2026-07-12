import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import {
  generateSessionOccurrences,
  getSchedulingSchoolClosureDates,
  setSchedulingSchoolClosureDates,
} from "../utils/liveClassScheduling.js";
import { prepareLiveClassSchedule, saveLiveClassScheduleMetadata } from "./liveClassSchedulePreparation.js";
import { cleanupLegacyClassSessions } from "./liveClassSessionCleanupService.js";
import { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";
import * as base from "./liveClassServiceBase.js";

export async function rebuildClassSessionsFromSchedule(classId) {
  const snap = await getDoc(doc(db, "classes", String(classId)));
  if (!snap.exists()) throw new Error("Class not found");
  const savedClass = { id: snap.id, ...snap.data() };

  const previousClosures = getSchedulingSchoolClosureDates();
  try {
    const schedule = await prepareLiveClassSchedule(savedClass);
    const occurrences = generateSessionOccurrences({ classId, ...schedule.payload });
    const result = await base.rebuildClassSessionsFromSchedule(classId, schedule.payload);
    const cleanup = await cleanupLegacyClassSessions({
      classId,
      klass: schedule.payload,
      desiredSessionIds: new Set(occurrences.map((occurrence) => occurrence.id)),
    });
    await saveLiveClassScheduleMetadata(classId, schedule);
    const endDateSync = await syncClassEndDateFromSessions(classId);
    return {
      ...result,
      legacyRemoved: cleanup.removed,
      legacyCanonicalized: cleanup.canonicalized,
      endDate: endDateSync.endDate || result.endDate || schedule.payload.endDate,
      sessionDerivedEndDate: endDateSync.sessionDerivedEndDate || endDateSync.endDate || result.sessionDerivedEndDate || result.endDate || "",
      historical: schedule.payload.historicalMode === true,
      holidayDatesExcluded: schedule.relevantClosures,
    };
  } finally {
    setSchedulingSchoolClosureDates(previousClosures);
  }
}
