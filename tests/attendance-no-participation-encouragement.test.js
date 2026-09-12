import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

for (const patch of [
  "scripts/patchAttendanceParticipationSummaryEmail.mjs",
  "scripts/patchAttendanceParticipationCanonicalIdentity.mjs",
  "scripts/patchAttendanceNoParticipationEncouragement.mjs",
  "scripts/patchAttendanceParticipationRecapGoals.mjs",
  "scripts/patchAttendanceParticipationRecapFailSafe.mjs",
]) {
  execFileSync(process.execPath, [patch], { cwd: root, stdio: "pipe" });
}

delete require.cache[require.resolve("../functions/attendanceConfirmationEmails.js")];
const { _test } = require("../functions/attendanceConfirmationEmails.js");

const {
  MODE_EACH_CLASS,
  MODE_WEEKLY,
  buildEachClassMessage,
  buildWeeklyMessage,
  buildParticipationText,
  summarizeStudentParticipation,
} = _test;

const student = {
  id: "student-1",
  uid: "uid-1",
  studentCode: "Felix123",
  name: "Felix Asadu",
  email: "felix@example.com",
};

const klass = {
  id: "class-record-1",
  name: "A1 Berlin Klasse",
  levelId: "A1",
  timezone: "Africa/Accra",
};

const sessionOne = {
  id: "session-1",
  startsAt: "2026-09-08T17:00:00.000Z",
  endsAt: "2026-09-08T18:30:00.000Z",
  assignmentIds: ["A1-5.9"],
  topic: "Goethe A1 Sprechen Training",
};

const sessionTwo = {
  id: "session-2",
  startsAt: "2026-09-10T17:00:00.000Z",
  endsAt: "2026-09-10T18:30:00.000Z",
  assignmentIds: ["A1-12.3"],
  topic: "Einführung ins Briefeschreiben",
};

test("a present student with no participation gets an encouraging each-class message and goal", () => {
  const participation = summarizeStudentParticipation({
    participationRecords: [],
    student,
    sessions: [sessionOne],
    timezone: "Africa/Accra",
  });

  assert.equal(participation.noParticipation, true);
  assert.equal(participation.responses, 0);

  const message = buildEachClassMessage({
    student,
    klass,
    record: { session: sessionOne, status: "present", method: "qr" },
    participation,
  });

  assert.match(message, /no class participation was recorded for you in this lesson/i);
  assert.match(message, /Regular participation helps your tutor/i);
  assert.match(message, /Next class goal: answer at least one question or attempt one class activity/i);
  assert.match(message, /not a grade and it does not change your attendance status/i);
});

test("weekly email encourages a student only for lessons they attended", () => {
  const participation = summarizeStudentParticipation({
    participationRecords: [],
    student,
    sessions: [sessionOne, sessionTwo],
    timezone: "Africa/Accra",
  });

  const message = buildWeeklyMessage({
    student,
    klass,
    records: [
      { session: sessionOne, status: "present", method: "qr" },
      { session: sessionTwo, status: "present", method: "qr" },
    ],
    participation,
  });

  assert.match(message, /no class participation was recorded for you in the lessons you attended in this summary/i);
  assert.match(message, /Next class goal: answer at least one question or attempt one class activity/i);
});

test("a participation lookup failure still produces no participation claim or inferred goal", () => {
  assert.equal(buildParticipationText(null, MODE_EACH_CLASS), "");
  assert.equal(buildParticipationText(null, MODE_WEEKLY), "");

  const source = fs.readFileSync(new URL("../functions/attendanceConfirmationEmails.js", import.meta.url), "utf8");
  assert.match(source, /let participationLookupAvailable = true;/);
  assert.match(source, /participationLookupAvailable = false;/);
  assert.match(source, /const participation = participationLookupAvailable/);
  assert.match(source, /attendance_participation_lookup_failed[\s\S]*throw error;/);
});

test("Firebase predeploy applies encouragement, recap and fail-safe after identity hardening", () => {
  const firebaseConfig = JSON.parse(fs.readFileSync(new URL("../firebase.json", import.meta.url), "utf8"));
  const functionsConfig = firebaseConfig.functions.find((entry) => entry.codebase === "falowenadmin");
  const predeploy = functionsConfig.predeploy.join("\n");
  assert.match(predeploy, /patchAttendanceParticipationCanonicalIdentity\.mjs[\s\S]*patchAttendanceNoParticipationEncouragement\.mjs[\s\S]*patchAttendanceParticipationRecapGoals\.mjs[\s\S]*patchAttendanceParticipationRecapFailSafe\.mjs/);
});
