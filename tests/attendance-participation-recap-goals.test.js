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
  buildEachClassMessage,
  buildParticipationText,
  summarizeStudentParticipation,
  deriveParticipationEngagementState,
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
  timezone: "Africa/Accra",
};

const sessionOne = {
  id: "session-1",
  startsAt: "2026-09-08T17:00:00.000Z",
  endsAt: "2026-09-08T18:30:00.000Z",
  assignmentIds: ["A1-5.9"],
  topic: "Goethe A1 Sprechen Training",
};

const participationRecord = {
  id: "participation-1",
  sessionId: "A1 Berlin Klasse_2026-09-08_1700",
  classRecordId: "class-record-1",
  classId: "A1 Berlin Klasse",
  className: "A1 Berlin Klasse",
  assignmentId: "A1-5.9",
  sessionDate: "2026-09-08",
  studentUid: "uid-1",
  studentCode: "Felix123",
  studentEmail: "felix@example.com",
  studentName: "Felix Asadu",
  turns: 3,
  correct: 2,
  needsReview: 1,
  skipped: 0,
  questionResponses: [
    { result: "correct", conceptLabel: "Sich vorstellen" },
    { result: "correct", conceptLabel: "Fragen stellen" },
    { result: "needs_review", conceptLabel: "W-Fragen" },
  ],
};

test("absent students are not told that they failed to participate", () => {
  const message = buildEachClassMessage({
    student,
    klass,
    record: { session: sessionOne, status: "absent", method: "none" },
    participation: {
      noParticipation: true,
      trackedLessons: 0,
      responses: 0,
      correct: 0,
      needsReview: 0,
      skipped: 0,
    },
    participationStreak: 3,
  });

  assert.match(message, /confirmed as Absent/);
  assert.doesNotMatch(message, /no class participation was recorded for you/i);
  assert.match(message, /Next class goal: attend and check in on time/i);
});

test("present students with repeated non-participation receive a streak message and concrete goal", () => {
  const message = buildEachClassMessage({
    student,
    klass,
    record: { session: sessionOne, status: "present", method: "qr" },
    participation: {
      noParticipation: true,
      trackedLessons: 0,
      responses: 0,
      correct: 0,
      needsReview: 0,
      skipped: 0,
    },
    participationStreak: 3,
  });

  assert.match(message, /no class participation was recorded for you in this lesson/i);
  assert.match(message, /3 consecutive attended classes/i);
  assert.match(message, /break the no-participation streak/i);
});

test("post-class recap includes strong topics, review-next guidance and a session deep link", () => {
  const participation = summarizeStudentParticipation({
    participationRecords: [participationRecord],
    student,
    sessions: [sessionOne],
    timezone: "Africa/Accra",
  });

  assert.deepEqual(participation.strongConcepts, ["Sich vorstellen", "Fragen stellen"]);
  assert.deepEqual(participation.reviewConcepts, ["W-Fragen"]);
  assert.match(participation.reviewRecommendation, /Review next: W-Fragen/);

  const message = buildEachClassMessage({
    student,
    klass,
    record: { session: sessionOne, status: "present", method: "qr" },
    participation,
  });

  assert.match(message, /Responses: 3; Correct: 2; Needs review: 1/);
  assert.match(message, /Strong topics: Sich vorstellen · Fragen stellen/);
  assert.match(message, /Review next: W-Fragen/);
  assert.match(message, /Next class goal: contribute at least once, especially when W-Fragen comes up/);
  assert.match(message, /tab=participation&sessionId=A1%20Berlin%20Klasse_2026-09-08_1700/);
});

test("engagement streak increments only for attended classes and resets on absence or participation", () => {
  const first = deriveParticipationEngagementState({
    previousState: { consecutiveNoParticipation: 1, processedSessionKeys: [] },
    records: [{ session: sessionOne, status: "present" }],
    participationRecords: [],
    student,
    timezone: "Africa/Accra",
  });
  assert.equal(first.consecutiveNoParticipation, 2);

  const absentSession = { ...sessionOne, id: "session-2", startsAt: "2026-09-10T17:00:00.000Z", assignmentIds: ["A1-12.3"] };
  const second = deriveParticipationEngagementState({
    previousState: first,
    records: [{ session: absentSession, status: "absent" }],
    participationRecords: [],
    student,
    timezone: "Africa/Accra",
  });
  assert.equal(second.consecutiveNoParticipation, 0);

  const participated = deriveParticipationEngagementState({
    previousState: { consecutiveNoParticipation: 2, processedSessionKeys: [] },
    records: [{ session: sessionOne, status: "present" }],
    participationRecords: [participationRecord],
    student,
    timezone: "Africa/Accra",
  });
  assert.equal(participated.consecutiveNoParticipation, 0);
});

test("participation lookup failure does not create a false goal or non-participation claim", () => {
  assert.equal(buildParticipationText(null, MODE_EACH_CLASS, {
    attendanceRecords: [{ session: sessionOne, status: "present" }],
    streak: 3,
  }), "");
});

test("Firebase predeploy applies recap, goals and fail-safe after no-participation safeguards", () => {
  const firebaseConfig = JSON.parse(fs.readFileSync(new URL("../firebase.json", import.meta.url), "utf8"));
  const functionsConfig = firebaseConfig.functions.find((entry) => entry.codebase === "falowenadmin");
  const predeploy = functionsConfig.predeploy.join("\n");
  assert.match(predeploy, /patchAttendanceNoParticipationEncouragement\.mjs[\s\S]*patchAttendanceParticipationRecapGoals\.mjs[\s\S]*patchAttendanceParticipationRecapFailSafe\.mjs/);
});
