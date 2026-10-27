import { readFileSync, writeFileSync } from "node:fs";

const path = "functions/index.js";
let source = readFileSync(path, "utf8");

source = source.replace(
  'const { onDocumentCreated } = require("firebase-functions/v2/firestore");',
  'const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");',
);

source = source.replace(
  'if (klass.classScheduleSheetAutoSyncStatus === "sent" || klass.classScheduleSheetAutoSyncedAt) return { status: "already_sent" };',
  'if (!options.force && (klass.classScheduleSheetAutoSyncStatus === "sent" || klass.classScheduleSheetAutoSyncedAt)) return { status: "already_sent" };',
);

const updateSyncBlock = `
function classScheduleSyncRelevantChange(before = {}, after = {}) {
  const fields = [
    "name",
    "className",
    "classId",
    "levelId",
    "level",
    "status",
    "startDate",
    "endDate",
    "graduationDate",
    "endsAt",
    "time",
    "startTime",
    "classTime",
    "timezone",
    "scheduleRules",
  ];

  return fields.some((field) => JSON.stringify(before[field] ?? null) !== JSON.stringify(after[field] ?? null));
}

exports.autoSyncUpdatedLiveClassToScheduleSheet = onDocumentUpdated({
  document: "classes/{classId}",
  secrets: [classScheduleAppsScriptUrlSecret, classScheduleSyncSecret],
}, async (event) => {
  const before = event.data?.before?.data() || {};
  const afterSnap = event.data?.after;
  const after = afterSnap?.data() || {};
  if (!afterSnap) return;
  if (!classScheduleSyncRelevantChange(before, after)) {
    console.log("autoSyncUpdatedLiveClassToScheduleSheet skipped metadata-only update", event.params.classId);
    return;
  }

  const result = await syncClassToScheduleSheet(afterSnap, { force: true });
  console.log("autoSyncUpdatedLiveClassToScheduleSheet", event.params.classId, result);
});
`;

if (!source.includes("autoSyncUpdatedLiveClassToScheduleSheet")) {
  const marker = "exports.syncPendingOperationalSheets = onSchedule({";
  const index = source.indexOf(marker);
  if (index === -1) throw new Error(`Could not find marker: ${marker}`);
  source = `${source.slice(0, index)}${updateSyncBlock}\n${source.slice(index)}`;
}

writeFileSync(path, source);
console.log("Live class update to schedule sheet auto-sync is present in functions/index.js.");
