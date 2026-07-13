import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import {
  generateSessionOccurrences,
  getSchedulingSchoolClosureDates,
  setSchedulingSchoolClosureDates,
} from "../utils/liveClassScheduling.js";
import { canonicalRebuildClassPayload } from "../utils/liveClassRebuildIdentity.js";
import { prepareLiveClassSchedule, saveLiveClassScheduleMetadata } from "./liveClassSchedulePreparation.js";
import { cleanupLegacyClassSessions } from "./liveClassSessionCleanupService.js";
import { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";
import * as base from "./liveClassServiceBase.js";

export async function rebuildClassSessionsFromSchedule(classId) {
  const snap = await getDoc(doc(db, "classes", String(classId)));
  if (!snap.exists()) throw new Error("Class not found");
  const savedClass = canonicalRebuildClassPayload(snap.id, snap.data());

  const previousClosures = getSchedulingSchoolClosureDates();
  try {
    const schedule = await prepareLiveClassSchedule(savedClass);
    const canonicalSchedule = canonicalRebuildClassPayload(classId, schedule.payload);
    const occurrences = generateSessionOccurrences(canonicalSchedule);
    const result = await base.rebuildClassSessionsFromSchedule(classId, canonicalSchedule);
    const cleanup = await cleanupLegacyClassSessions({
      classId,
      klass: canonicalSchedule,
      desiredSessionIds: new Set(occurrences.map((occurrence) => occurrence.id)),
    });
    await saveLiveClassScheduleMetadata(classId, { ...schedule, payload: canonicalSchedule });
    const endDateSync = await syncClassEndDateFromSessions(classId);
    return {
      ...result,
      legacyRemoved: cleanup.removed,
      legacyCanonicalized: cleanup.canonicalized,
      endDate: endDateSync.endDate || result.endDate || canonicalSchedule.endDate,
      sessionDerivedEndDate: endDateSync.sessionDerivedEndDate || endDateSync.endDate || result.sessionDerivedEndDate || result.endDate || "",
      historical: canonicalSchedule.historicalMode === true,
      holidayDatesExcluded: schedule.relevantClosures,
    };
  } finally {
    setSchedulingSchoolClosureDates(previousClosures);
  }
}
