import { readFileSync } from "node:fs";

const path = "functions/index.js";
const source = readFileSync(path, "utf8");
const requiredMarkers = [
  "async function buildHolidayNoticeTargets({ date, noticeConfig })",
  "async function previewHolidayNoticeForDoc({ holiday, date, countryCode, noticeConfig })",
  "async function sendHolidayNoticeForDoc({",
];

for (const marker of requiredMarkers) {
  if (!source.includes(marker)) {
    throw new Error(`Holiday class schedule awareness must be source-owned; missing marker: ${marker}`);
  }
}

if (source.includes("sendHolidayNoticeWithClassSchedule")) {
  throw new Error("Legacy deployment-only holiday notice wrapper is still present.");
}

console.log("Holiday class schedule awareness is source-owned for both preview and send.");
