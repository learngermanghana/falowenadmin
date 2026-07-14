import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const targetPath = path.join(repoRoot, "functions", "index.js");

let source = fs.readFileSync(targetPath, "utf8");
const requireLine = 'const { createAttendanceConfirmationEmailJob } = require("./attendanceConfirmationEmails.js");';
const exportLine = "exports.sendAttendanceConfirmationEmails = createAttendanceConfirmationEmailJob({ admin, db, onSchedule, runtimeConfig });";

if (!source.includes(requireLine)) {
  const anchor = 'const { defineSecret } = require("firebase-functions/params");';
  if (!source.includes(anchor)) throw new Error("Attendance confirmation patch could not find the Firebase import anchor.");
  source = source.replace(anchor, `${anchor}\n${requireLine}`);
}

if (!source.includes(exportLine)) {
  const anchor = "exports.api = onRequest({";
  if (!source.includes(anchor)) throw new Error("Attendance confirmation patch could not find the API export anchor.");
  source = source.replace(anchor, `${exportLine}\n\n${anchor}`);
}

fs.writeFileSync(targetPath, source);
console.log("Attendance confirmation email scheduler patch verified.");
