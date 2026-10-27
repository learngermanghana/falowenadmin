import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetPath = path.join(root, "functions", "attendanceConfirmationEmails.js");
const recapPatch = path.join(root, "scripts", "patchAttendanceParticipationRecapGoals.mjs");
let source = fs.readFileSync(targetPath, "utf8");

if (!source.includes("// ATTENDANCE PARTICIPATION RECAP + STREAK GOALS")) {
  await import(pathToFileURL(recapPatch).href);
  source = fs.readFileSync(targetPath, "utf8");
}

const oldBlock = `function buildParticipationText(participation, mode, { attendanceRecords = [], streak = 0 } = {}) {
  const attendance = attendanceCountsForParticipation(attendanceRecords);
  const weekly = mode === MODE_WEEKLY;
  if (!attendance.attended) {
    return participationGoalText({ participation, attendanceRecords, streak });
  }
  if (!participation) return "";`;

const newBlock = `function buildParticipationText(participation, mode, { attendanceRecords = [], streak = 0 } = {}) {
  if (!participation) return "";
  const attendance = attendanceCountsForParticipation(attendanceRecords);
  const weekly = mode === MODE_WEEKLY;
  if (!attendance.attended) {
    return participationGoalText({ participation, attendanceRecords, streak });
  }`;

if (!source.includes(newBlock)) {
  if (!source.includes(oldBlock)) throw new Error("Could not install participation lookup fail-safe ordering.");
  source = source.replace(oldBlock, newBlock);
}

fs.writeFileSync(targetPath, source, "utf8");
console.log("Participation recap remains silent when participation data could not be loaded.");
