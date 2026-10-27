import fs from "node:fs";

const target = new URL("../src/utils/liveClassReschedulePlan.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const lessonOrderImport = '} from "./liveClassLessonOrder.js";';
const schedulingImport = 'import { normalizeScheduleRules } from "./liveClassScheduling.js";';

if (!source.includes(schedulingImport)) {
  if (!source.includes(lessonOrderImport)) {
    throw new Error("liveClassReschedulePlan import anchor changed; update patchLiveClassNormalizedScheduleRules.mjs");
  }
  source = source.replace(lessonOrderImport, `${lessonOrderImport}\n${schedulingImport}`);
}

const before = "  const hasSavedWeeklyTimetable = Array.isArray(klass.scheduleRules) && klass.scheduleRules.length > 0;";
const after = "  const hasSavedWeeklyTimetable = normalizeScheduleRules(klass.scheduleRules || []).length > 0;";

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error("saved timetable fallback anchor changed; update patchLiveClassNormalizedScheduleRules.mjs");
  }
  source = source.replace(before, after);
}

fs.writeFileSync(target, source);
console.log("Following-session reschedules now recognize every normalized saved timetable format.");
