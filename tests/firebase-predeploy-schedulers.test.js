import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(root, "firebase.json"), "utf8"));

function falowenAdminPredeploy() {
  const functionsConfig = Array.isArray(firebaseConfig.functions)
    ? firebaseConfig.functions.find((entry) => entry?.codebase === "falowenadmin")
    : firebaseConfig.functions;
  return Array.isArray(functionsConfig?.predeploy) ? functionsConfig.predeploy : [];
}

test("Firebase predeploy regenerates all scheduled Falowen Admin handlers after workflow reset", () => {
  const predeploy = falowenAdminPredeploy();
  const requiredSchedulerPatches = [
    "node scripts/patchAttendanceConfirmationEmails.mjs",
    "node scripts/patchClassSessionReminderEmails.mjs",
    "node scripts/patchLeadClassStartReminderEmails.mjs",
    "node scripts/patchAutoCompleteClassSessions.mjs",
    "node scripts/patchCourseReviewRequestEmails.mjs",
  ];

  for (const command of requiredSchedulerPatches) {
    assert.ok(predeploy.includes(command), `Missing Firebase predeploy scheduler patch: ${command}`);
  }
});
