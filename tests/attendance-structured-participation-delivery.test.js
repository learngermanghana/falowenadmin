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
  "scripts/patchAttendanceParticipationSessionWindow.mjs",
  "scripts/patchAttendanceStructuredParticipationEmail.mjs",
]) {
  execFileSync(process.execPath, [patch], { cwd: root, stdio: "pipe" });
}

delete require.cache[require.resolve("../functions/attendanceConfirmationEmails.js")];
const { _test } = require("../functions/attendanceConfirmationEmails.js");

const {
  MODE_WEEKLY,
  structuredAttendancePayload,
  rowForDelivery,
} = _test;

const klass = {
  id: "class-a2-munich",
  name: "A2 Munich Klasse",
  levelId: "A2",
};

const student = {
  uid: "uid-sarah",
  studentCode: "Sarah123",
  name: "Sarah Quansah",
  email: "sarah@example.com",
};

const records = [
  {
    session: { id: "session-1", startsAt: "2026-09-14T19:00:00.000Z" },
    status: "present",
  },
  {
    session: { id: "session-2", startsAt: "2026-09-15T19:00:00.000Z" },
    status: "present",
  },
  {
    session: { id: "session-3", startsAt: "2026-09-16T19:00:00.000Z" },
    status: "present",
  },
];

const participation = {
  noParticipation: false,
  trackedLessons: 3,
  participatedLessons: 3,
  responses: 33,
  correct: 30,
  needsReview: 3,
  skipped: 0,
  strongConcepts: ["Reklamationen"],
  reviewConcepts: ["Höfliche Bitten"],
  reviewRecommendation: "Review next: Höfliche Bitten",
  latestSessionId: "participation-session-3",
};

test("structured payload keeps attendance and participation together", () => {
  const payload = structuredAttendancePayload({
    records,
    participation,
    participationStreak: 0,
    mode: MODE_WEEKLY,
    periodKey: "2026-W38",
    timezone: "Africa/Accra",
  });

  assert.equal(payload.schemaVersion, 2);
  assert.equal(payload.kind, "attendance_participation_summary");
  assert.equal(payload.attendance.present, 3);
  assert.equal(payload.attendance.rate, 100);
  assert.equal(payload.attendance.lessons.length, 3);
  assert.equal(payload.participation.trackedLessons, 3);
  assert.equal(payload.participation.responses, 33);
  assert.equal(payload.participation.correct, 30);
  assert.equal(payload.participation.needsReview, 3);
  assert.match(payload.participation.detailsUrl, /tab=participation&sessionId=participation-session-3/);
  assert.match(payload.participation.text, /Responses: 33/);
});

test("combined weekly row bypasses the stripping attendance renderer and carries structured JSON", () => {
  const payload = structuredAttendancePayload({
    records,
    participation,
    mode: MODE_WEEKLY,
    periodKey: "2026-W38",
    timezone: "Africa/Accra",
  });
  const row = rowForDelivery({
    klass,
    student,
    mode: MODE_WEEKLY,
    message: "Hello Sarah Quansah, here is your attendance summary. Present: 3; Late: 0; Excused: 0; Absent: 0. Attendance rate: 100%. Lessons: Mon: Present; Tue: Present; Wed: Present. Class participation this week: participation was tracked in 3 lessons. Responses: 33; Correct: 30; Needs review: 3; Skipped: 0. How attendance works: check in on time.",
    date: "2026-09-16",
    periodKey: "2026-W38",
    deliveryPayload: payload,
  });

  assert.equal(row.email_type, "general");
  assert.equal(row.render_mode, "attendance_with_participation");
  assert.equal(row.subject, "Weekly Attendance & Participation Summary — 2026-W38");
  assert.equal(row.topic, row.subject);
  assert.equal(row.link_label, "View class participation");
  assert.match(row.announcement, /Class participation this week:/);
  assert.match(row.announcement, /Responses: 33/);
  assert.equal(JSON.parse(row.attendance_json).participation.correct, 30);
  assert.equal(JSON.parse(row.participation_json).responses, 33);
  assert.match(row.participation_text, /Needs review: 3/);
});

test("attendance-only rows keep the dedicated attendance renderer", () => {
  const payload = structuredAttendancePayload({
    records,
    participation: null,
    mode: MODE_WEEKLY,
    periodKey: "2026-W38",
    timezone: "Africa/Accra",
  });
  const row = rowForDelivery({
    klass,
    student,
    mode: MODE_WEEKLY,
    message: "Hello Sarah, attendance only.",
    date: "2026-09-16",
    periodKey: "2026-W38",
    deliveryPayload: payload,
  });

  assert.equal(row.email_type, "attendance");
  assert.equal(row.render_mode, "attendance");
  assert.equal(row.subject, "Weekly Attendance Summary — 2026-W38");
  assert.equal(row.link, "");
});

test("Firebase predeploy applies structured participation after session-window matching", () => {
  const firebaseConfig = JSON.parse(fs.readFileSync(new URL("../firebase.json", import.meta.url), "utf8"));
  const functionsConfig = firebaseConfig.functions.find((entry) => entry.codebase === "falowenadmin");
  const predeploy = functionsConfig.predeploy.join("\n");
  assert.match(
    predeploy,
    /patchAttendanceParticipationSessionWindow\.mjs[\s\S]*patchAttendanceStructuredParticipationEmail\.mjs/,
  );
});
