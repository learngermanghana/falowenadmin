import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const indexPath = path.join(repoRoot, "functions", "index.js");
const workerPath = path.join(repoRoot, "functions", "classSessionReminderEmails.js");

let source = fs.readFileSync(indexPath, "utf8");
const requireLine = 'const { createClassSessionReminderEmailJob } = require("./classSessionReminderEmails.js");';
const requireAnchor = 'const { defineSecret } = require("firebase-functions/params");';
const exportLine = 'exports.sendClassSessionReminderEmails = createClassSessionReminderEmailJob({ admin, db, onSchedule, runtimeConfig });';
const exportAnchor = "exports.api = onRequest({";

if (!source.includes(requireLine)) {
  if (!source.includes(requireAnchor)) {
    throw new Error("Could not find the Firebase params import for class reminder patching.");
  }
  source = source.replace(requireAnchor, `${requireAnchor}\n${requireLine}`);
}

if (!source.includes(exportLine)) {
  if (!source.includes(exportAnchor)) {
    throw new Error("Could not find the Firebase API export anchor for class reminder patching.");
  }
  source = source.replace(exportAnchor, `${exportLine}\n\n${exportAnchor}`);
}

fs.writeFileSync(indexPath, source);

const patchedIndex = fs.readFileSync(indexPath, "utf8");
const worker = fs.readFileSync(workerPath, "utf8");
const checks = [
  [patchedIndex.includes(requireLine), "Class reminder worker import is missing."],
  [patchedIndex.includes(exportLine), "Class reminder scheduled export is missing."],
  [worker.includes('schedule: "*/5 * * * *"'), "Five-minute class reminder schedule is missing."],
  [worker.includes("topicForSession"), "Session topic resolution is missing."],
  [worker.includes("remindersSuppressed"), "Cancelled-session reminder suppression is missing."],
  [worker.includes("holidayCalendar"), "Holiday closure lookup is missing."],
  [worker.includes("classReminderSends"), "Class reminder deduplication is missing."],
];
for (const [passed, message] of checks) {
  if (!passed) throw new Error(message);
}

console.log("Session-topic class reminder scheduler verified.");
