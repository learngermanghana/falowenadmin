import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

execFileSync(process.execPath, ["scripts/patchAttendanceParticipationSummaryEmail.mjs"], {
  cwd: root,
  stdio: "pipe",
});

delete require.cache[require.resolve("../functions/attendanceConfirmationEmails.js")];
const { _test } = require("../functions/attendanceConfirmationEmails.js");

const {
  MODE_EACH_CLASS,
  MODE_WEEKLY,
  buildEachClassMessage,
  buildWeeklyMessage,
  buildParticipationText,
  summarizeStudentParticipation,
  participationRecordMatchesSession,
  participationRecordMatchesStudent,
} = _test;

const student = {
  id: "student-1",
  uid: "uid-1",
  studentCode: "Felix123",
  name: "Felix Asadu",
  email: "felix@example.com",
  className: "A1 Berlin Klasse",
};

const klass = {
  id: "class-1",
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

const participationOne = {
  id: "record-1",
  sessionId: "participation-session-1",
  classId: "class-1",
  className: "A1 Berlin Klasse",
  assignmentId: "A1-5.9",
  sessionDate: "2026-09-08",
  studentUid: "uid-1",
  studentCode: "felix123",
  studentEmail: "felix@example.com",
  studentEmailNormalized: "felix@example.com",
  studentName: "Felix Asadu",
  turns: 2,
  correct: 1,
  needsReview: 1,
  skipped: 0,
  presenterAbsent: true,
};

const participationTwo = {
  ...participationOne,
  id: "record-2",
  sessionId: "participation-session-2",
  assignmentId: "A1-12.3",
  sessionDate: "2026-09-10",
  turns: 1,
  correct: 1,
  needsReview: 0,
  skipped: 1,
  presenterAbsent: false,
};

test("participation matching uses the student's own identity and lesson identity", () => {
  assert.equal(participationRecordMatchesStudent(participationOne, student), true);
  assert.equal(participationRecordMatchesStudent(participationOne, { ...student, uid: "other", studentCode: "other", email: "other@example.com", name: "Other Student" }), false);
  assert.equal(participationRecordMatchesSession(participationOne, sessionOne, "Africa/Accra"), true);
  assert.equal(participationRecordMatchesSession(participationOne, sessionTwo, "Africa/Accra"), false);
});

test("weekly participation summary aggregates only the student's matching lesson records", () => {
  const summary = summarizeStudentParticipation({
    participationRecords: [participationOne, participationTwo, { ...participationOne, id: "other", studentUid: "other", studentCode: "other", studentEmail: "other@example.com", studentEmailNormalized: "other@example.com", studentName: "Other Student" }],
    student,
    sessions: [sessionOne, sessionTwo],
    timezone: "Africa/Accra",
  });

  assert.deepEqual(summary, {
    trackedLessons: 2,
    participatedLessons: 2,
    responses: 3,
    correct: 2,
    needsReview: 1,
    skipped: 1,
  });
});

test("each-class attendance email includes participation without exposing presenter-only absence", () => {
  const participation = summarizeStudentParticipation({
    participationRecords: [participationOne],
    student,
    sessions: [sessionOne],
    timezone: "Africa/Accra",
  });
  const message = buildEachClassMessage({
    student,
    klass,
    record: { session: sessionOne, status: "present", method: "qr", checkedAt: new Date("2026-09-08T17:02:00.000Z") },
    participation,
  });

  assert.match(message, /confirmed as Present/);
  assert.match(message, /Class participation:/);
  assert.match(message, /Recorded responses: 2/);
  assert.match(message, /Correct: 1/);
  assert.match(message, /Needs review: 1/);
  assert.match(message, /not a grade and it does not change your attendance status/);
  assert.match(message, /falowen\.app\/campus\/account\?tab=participation/);
  assert.doesNotMatch(message, /presenter.?absent/i);
});

test("weekly attendance email includes one aggregated class participation section", () => {
  const participation = summarizeStudentParticipation({
    participationRecords: [participationOne, participationTwo],
    student,
    sessions: [sessionOne, sessionTwo],
    timezone: "Africa/Accra",
  });
  const message = buildWeeklyMessage({
    student,
    klass,
    records: [
      { session: sessionOne, status: "present", method: "qr" },
      { session: sessionTwo, status: "late", method: "manual" },
    ],
    participation,
  });

  assert.match(message, /Class participation this week: participation was tracked in 2 lessons/);
  assert.match(message, /Recorded responses: 3/);
  assert.match(message, /Correct: 2/);
  assert.match(message, /Needs review: 1/);
  assert.match(message, /Skipped: 1/);
});

test("attendance emails remain unchanged when no participation record exists", () => {
  const participationText = buildParticipationText(null, MODE_EACH_CLASS);
  assert.equal(participationText, "");

  const message = buildEachClassMessage({
    student,
    klass,
    record: { session: sessionOne, status: "absent", method: "none" },
  });
  assert.match(message, /confirmed as Absent/);
  assert.doesNotMatch(message, /Class participation:/);
});

test("Firebase predeploy always applies the attendance participation summary patch", () => {
  const firebaseConfig = JSON.parse(fs.readFileSync(new URL("../firebase.json", import.meta.url), "utf8"));
  const functionsConfig = firebaseConfig.functions.find((entry) => entry.codebase === "falowenadmin");
  const predeploy = functionsConfig.predeploy.join("\n");
  assert.match(predeploy, /patchAttendanceConfirmationEventDrivenV2\.mjs[\s\S]*patchAttendanceParticipationSummaryEmail\.mjs/);
});

test("the injected summary code never reads presenterAbsent", () => {
  const source = fs.readFileSync(new URL("../functions/attendanceConfirmationEmails.js", import.meta.url), "utf8");
  const block = source.split("// BEGIN ATTENDANCE PARTICIPATION SUMMARY")[1]?.split("// END ATTENDANCE PARTICIPATION SUMMARY")[0] || "";
  assert.ok(block);
  assert.doesNotMatch(block, /presenterAbsent/);
});
