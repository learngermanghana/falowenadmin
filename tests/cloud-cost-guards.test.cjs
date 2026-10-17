"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");

test("ineligible submissions never create marking jobs and attendance remains independent", () => {
  const index = read("functions/index.js");
  const start = index.indexOf("async function createAutomaticMarkingJob(");
  const end = index.indexOf("const registrationLifecycleTriggers =", start);
  assert.ok(start >= 0 && end > start);
  const createJob = index.slice(start, end);
  const guardStart = createJob.indexOf("if (eligible(submission, payload.level, payload.assignmentKey)) {");
  const jobCreate = createJob.indexOf("tx.create(jobRef,");
  const closeGuard = createJob.indexOf("\n  }\n", jobCreate);
  const attendance = createJob.indexOf("await applyAssignmentAttendance(event, submission)");
  assert.ok(guardStart >= 0 && guardStart < jobCreate);
  assert.ok(jobCreate < closeGuard && closeGuard < attendance);
  assert.match(createJob, /automatic: true/);
});

test("background schedules use fractional CPU and exam marking keeps its own resource settings", () => {
  const index = read("functions/index.js");
  const main = read("functions/main.js");
  const eventDrivenPatch = read("scripts/patchAttendanceConfirmationEventDriven.mjs");
  assert.match(index, /syncAutomaticCourseScore = onDocumentCreated\([\s\S]*?cpu: "gcf_gen1"/);
  assert.match(index, /markCourseSubmissionAutomatically = onDocumentCreated\(\{[\s\S]*?memory: "512MiB"/);
  for (const worker of ["cleanupExpiredPendingStudents", "sendClassSessionReminderEmails", "sendSaturdayClassSessionReminderEmails"]) {
    assert.match(main, new RegExp("module\\.exports\\." + worker + " = onSchedule\\(\\{\\s*cpu: \"gcf_gen1\""));
  }
  assert.match(eventDrivenPatch, /cpu: "gcf_gen1"/);
});
