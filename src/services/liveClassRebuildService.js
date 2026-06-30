import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { liveClassRebuildSettings } from "../utils/classEditorState.js";
import { getSchedulingSchoolClosureDates, setSchedulingSchoolClosureDates } from "../utils/liveClassScheduling.js";
import { prepareLiveClassSchedule, saveLiveClassScheduleMetadata } from "./liveClassSchedulePreparation.js";
import * as base from "./liveClassServiceBase.js";

export async function rebuildClassSessionsFromSchedule(classId, candidateRecord = null) {
  const snap = await getDoc(doc(db, "classes", String(classId)));
  if (!snap.exists()) throw new Error("Class not found");
  const savedClass = { id: snap.id, ...snap.data() };

  if (candidateRecord && liveClassRebuildSettings(candidateRecord) !== liveClassRebuildSettings(savedClass)) {
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
