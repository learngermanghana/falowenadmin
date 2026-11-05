import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const functionsPath = path.join(root, "functions/index.js");
let content = fs.readFileSync(functionsPath, "utf8");

const firestoreTriggerPattern = /const \{ ([^}]+) \} = require\("firebase-functions\/v2\/firestore"\);/;
const firestoreMatch = content.match(firestoreTriggerPattern);
if (!firestoreMatch) {
  throw new Error("Automatic orientation sync patch could not find the Firestore trigger import.");
}
const firestoreTriggers = [...new Set(
  firestoreMatch[1].split(",").map((value) => value.trim()).filter(Boolean),
)];
for (const trigger of ["onDocumentCreated", "onDocumentUpdated", "onDocumentDeleted"]) {
  if (!firestoreTriggers.includes(trigger)) firestoreTriggers.push(trigger);
}
content = content.replace(
  firestoreTriggerPattern,
  'const { ' + firestoreTriggers.join(", ") + ' } = require("firebase-functions/v2/firestore");',
);

const legacyHelperRequire = 'const { createOrientationAutoSyncHandler } = require("./orientationAutoSync");\n';
const helperRequire = 'const { createOrientationAutoSyncHandler } = require("./orientationAutoSync");\n';
const helperAnchor = 'const { defineSecret } = require("firebase-functions/params");\n';
if (content.includes(legacyHelperRequire)) {
  content = content.replace(legacyHelperRequire, helperRequire);
} else if (!content.includes(helperRequire)) {
  if (!content.includes(helperAnchor)) {
    throw new Error("Automatic orientation sync patch could not find the Firebase params import.");
  }
  content = content.replace(helperAnchor, `${helperAnchor}${helperRequire}`);
}

const beginMarker = "// BEGIN AUTOMATIC PAID STUDENT ORIENTATION SYNC\n";
const endMarker = "// END AUTOMATIC PAID STUDENT ORIENTATION SYNC\n\n";
while (content.includes(beginMarker)) {
  const start = content.indexOf(beginMarker);
  const end = content.indexOf(endMarker, start);
  if (end < 0) throw new Error("Automatic orientation sync patch found an incomplete generated block.");
  content = `${content.slice(0, start)}${content.slice(end + endMarker.length)}`;
}

const block = `${beginMarker}const automaticPaidStudentOrientationHandler = createOrientationAutoSyncHandler({
  db,
  appsScriptUrl: () => String(
    orientationAppsScriptUrlSecret.value() || process.env.ORIENTATION_APPS_SCRIPT_URL || ""
  ).trim(),
  syncSecret: () => String(
    orientationSyncSecret.value() || process.env.ORIENTATION_SYNC_SECRET || ""
  ).trim(),
});

// Listening to payment/{reference} updates misses organisation group tuition:
// the parent payment has no studentId and each allocation is CREATED rather
// than updated. The canonical students/{studentId} write contains the verified
// amount, approved class and eligibility. Reuse the existing function name so
// no additional poller or billed function is introduced.
exports.autoSyncPaidStudentOrientation = onDocumentUpdated(
  {
    region: "europe-west1",
    document: "students/{studentId}",
    secrets: [orientationSyncSecret, orientationAppsScriptUrlSecret],
    timeoutSeconds: 60,
  },
  automaticPaidStudentOrientationHandler
);
${endMarker}`;

const triggerAnchors = [
  'exports.createFlatSubmissionMarkingJob = onDocumentCreated(',
  'exports.sendDueHolidayNotices = onSchedule({',
];
const triggerAnchor = triggerAnchors.find((candidate) => content.includes(candidate));
if (!triggerAnchor) {
  throw new Error("Automatic orientation sync patch could not find a stable function-export insertion point.");
}
content = content.replace(triggerAnchor, `${block}${triggerAnchor}`);

fs.writeFileSync(functionsPath, content, "utf8");
console.log("Automatic paid-payment orientation sync patch applied.");
