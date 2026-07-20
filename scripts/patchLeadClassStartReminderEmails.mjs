import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const indexPath = path.join(repoRoot, "functions", "index.js");
const workerPath = path.join(repoRoot, "functions", "leadClassStartReminderEmails.js");

let source = fs.readFileSync(indexPath, "utf8");
const requireLine = 'const { createLeadClassStartReminderEmailJob } = require("./leadClassStartReminderEmails.js");';
const requireAnchor = 'const { defineSecret } = require("firebase-functions/params");';
const exportLine = 'exports.sendLeadClassStartReminderEmails = createLeadClassStartReminderEmailJob({ admin, db, onSchedule, runtimeConfig });';
const exportAnchor = "exports.api = onRequest({";

if (!source.includes(requireLine)) {
  if (!source.includes(requireAnchor)) {
    throw new Error("Could not find the Firebase params import for lead reminder patching.");
  }
  source = source.replace(requireAnchor, `${requireAnchor}\n${requireLine}`);
}

if (!source.includes(exportLine)) {
  if (!source.includes(exportAnchor)) {
    throw new Error("Could not find the Firebase API export anchor for lead reminder patching.");
  }
  source = source.replace(exportAnchor, `${exportLine}\n\n${exportAnchor}`);
}

fs.writeFileSync(indexPath, source);

const patchedIndex = fs.readFileSync(indexPath, "utf8");
const worker = fs.readFileSync(workerPath, "utf8");
const checks = [
  [patchedIndex.includes(requireLine), "Lead reminder worker import is missing."],
  [patchedIndex.includes(exportLine), "Lead reminder scheduled export is missing."],
  [worker.includes('schedule: "0 8 * * *"'), "Daily 8am lead reminder schedule is missing."],
  [worker.includes("communication.announcement_webhook_url"), "Communication webhook fallback is missing."],
  [worker.includes("leadClassStartReminderSends"), "Lead reminder deduplication collection is missing."],
  [worker.includes("lead_class_start_reminder"), "Lead reminder email type is missing."],
];
for (const [passed, message] of checks) {
  if (!passed) throw new Error(message);
}

console.log("Lead class-start reminder scheduler verified.");
