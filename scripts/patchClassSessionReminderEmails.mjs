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

let workerSource = fs.readFileSync(workerPath, "utf8");
const zoomConfigAnchor = "const DEFAULT_GRACE_MIN = 7;";
const zoomConfigBlock = [
  "const DEFAULT_CLASS_REMINDER_ZOOM = Object.freeze({",
  '  joinUrl: "https://us06web.zoom.us/j/6886900916?pwd=bEdtR3RLQ2dGTytvYzNrMUV3eFJwUT09",',
  '  chatUrl: "https://us06web.zoom.us/launch/jc/6886900916",',
  '  meetingId: "688 690 0916",',
  '  passcode: "german",',
  '  sip: "6886900916@zoomcrc.com",',
  "});",
].join("\n");

if (!workerSource.includes("const DEFAULT_CLASS_REMINDER_ZOOM")) {
  if (!workerSource.includes(zoomConfigAnchor)) {
    throw new Error("Could not find the class reminder Zoom configuration anchor.");
  }
  workerSource = workerSource.replace(zoomConfigAnchor, `${zoomConfigAnchor}\n${zoomConfigBlock}`);
}

if (!workerSource.includes("chatUrl: DEFAULT_CLASS_REMINDER_ZOOM.chatUrl")) {
  const zoomDetailsPattern = /function zoomDetails\(klass = \{\}, profile = \{\}\) \{[\s\S]*?\n\}\n\nfunction buildReminderMessage/;
  const fixedZoomDetails = [
    "function zoomDetails() {",
    "  return {",
    "    url: DEFAULT_CLASS_REMINDER_ZOOM.joinUrl,",
    "    chatUrl: DEFAULT_CLASS_REMINDER_ZOOM.chatUrl,",
    "    meetingId: DEFAULT_CLASS_REMINDER_ZOOM.meetingId,",
    "    passcode: DEFAULT_CLASS_REMINDER_ZOOM.passcode,",
    "    sip: DEFAULT_CLASS_REMINDER_ZOOM.sip,",
    "  };",
    "}",
    "",
    "function buildReminderMessage",
  ].join("\n");
  if (!zoomDetailsPattern.test(workerSource)) {
    throw new Error("Could not find the class reminder Zoom details function.");
  }
  workerSource = workerSource.replace(zoomDetailsPattern, fixedZoomDetails);
}

if (!workerSource.includes('lines.push("", "Meeting chat link", zoom.chatUrl);')) {
  const joinBlockPattern = /  if \(zoom\.url \|\| zoom\.meetingId \|\| zoom\.passcode\) \{[\s\S]*?\n  \}\n  lines\.push/;
  const fixedJoinBlock = [
    "  if (zoom.url || zoom.chatUrl || zoom.meetingId || zoom.passcode || zoom.sip) {",
    '    lines.push("", "Join Zoom Meeting");',
    "    if (zoom.url) lines.push(zoom.url);",
    '    if (zoom.chatUrl) lines.push("", "Meeting chat link", zoom.chatUrl);',
    '    if (zoom.meetingId) lines.push("", `Meeting ID: ${zoom.meetingId}`);',
    '    if (zoom.passcode) lines.push(`Passcode: ${zoom.passcode}`);',
    '    if (zoom.sip) lines.push("", "Join by SIP", `• ${zoom.sip}`);',
    "  }",
    "  lines.push",
  ].join("\n");
  if (!joinBlockPattern.test(workerSource)) {
    throw new Error("Could not find the class reminder Zoom message block.");
  }
  workerSource = workerSource.replace(joinBlockPattern, fixedJoinBlock);
}

if (!workerSource.includes("link: text(DEFAULT_CLASS_REMINDER_ZOOM.joinUrl),")) {
  if (!workerSource.includes('    link: "",')) {
    throw new Error("Could not find the class reminder announcement link field.");
  }
  workerSource = workerSource.replace(
    '    link: "",',
    "    link: text(DEFAULT_CLASS_REMINDER_ZOOM.joinUrl),",
  );
}

fs.writeFileSync(workerPath, workerSource);

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
  [worker.includes("https://us06web.zoom.us/j/6886900916?pwd=bEdtR3RLQ2dGTytvYzNrMUV3eFJwUT09"), "Class reminder Zoom join link is missing."],
  [worker.includes("https://us06web.zoom.us/launch/jc/6886900916"), "Class reminder Zoom chat link is missing."],
  [worker.includes("6886900916@zoomcrc.com"), "Class reminder Zoom SIP address is missing."],
  [worker.includes("link: text(DEFAULT_CLASS_REMINDER_ZOOM.joinUrl),"), "Announcement row Zoom link is missing."],
];
for (const [passed, message] of checks) {
  if (!passed) throw new Error(message);
}

console.log("Session-topic class reminder scheduler and standard Zoom meeting verified.");
