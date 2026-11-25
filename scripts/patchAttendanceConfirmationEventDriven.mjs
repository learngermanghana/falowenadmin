// Legacy predeploy entry: verify retirement rather than recreating queue functions.
import fs from "node:fs";
const index = fs.readFileSync(new URL("../functions/index.js", import.meta.url), "utf8");
const worker = fs.readFileSync(new URL("../functions/attendanceConfirmationEmails.js", import.meta.url), "utf8");
const retired = ["sendAttendanceConfirmationEmails", "queueAttendanceConfirmationFromSession", "queueAttendanceConfirmationFromCheckin", "queueAttendanceConfirmationFromClassSession"];
for (const name of retired) {
  if (index.includes("exports." + name + " =")) throw new Error("Retired attendance function: " + name);
}
if (!worker.includes("async function sendDueAttendanceForClass") || !index.includes('app.post("/attendance-confirmation-emails/send-due"')) throw new Error("Manual attendance path missing.");
if (worker.includes("return onSchedule(")) throw new Error("Attendance scheduler must stay retired.");
console.log("Manual attendance delivery verified; queue triggers retired.");
