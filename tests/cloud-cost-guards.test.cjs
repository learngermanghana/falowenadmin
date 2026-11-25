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
  assert.match(main, /module\.exports\.cleanupExpiredPendingStudents = onSchedule\(\{\s*cpu: "gcf_gen1"/);
  for (const source of [index, main, read("scripts/patchClassSessionReminderEmails.mjs")]) {
    assert.doesNotMatch(source, /exports\.send(Saturday)?ClassSessionReminderEmails\s*=/);
  }
  assert.match(eventDrivenPatch, /Retired attendance function/);
  assert.doesNotMatch(index, /exports\.(sendAttendanceConfirmationEmails|queueAttendanceConfirmationFrom\w+)\s*=/);
});

test("existing lightweight orientation workers use fractional CPU without modifying API or marking defaults", async () => {
  const patch = read("scripts/patchAutomaticOrientationSync.mjs");
  const snippet = read("scripts/snippets/operationalSheetAutoSyncJobs.js.txt");
  const names = ["autoSyncPaidStudentOrientation","autoSyncApprovedStudentOrientation","autoSyncNewStudentToOrientationSheet","autoRemoveIneligibleStudentFromOrientationSheet","autoRemoveDeletedStudentFromOrientationSheet","syncPendingOperationalSheets"];
  for (const [i,name] of names.entries()) {
    const source = i < 2 ? patch : snippet;
    const start = source.indexOf("exports." + name + " = ");
    assert.ok(start >= 0, name);
    const end = source.indexOf("secrets:", start);
    const options = source.slice(start,end);
    assert.match(options, /cpu: "gcf_gen1"/, name);
    assert.match(options, /memory: "256MiB"/, name);
    assert.match(options, /concurrency: 1/, name);
    assert.match(options, /minInstances: 0/, name);
  }
  const { selectFirebaseDeployTargets } = await import("../scripts/selectFirebaseDeployTargets.mjs");
  const plan = selectFirebaseDeployTargets({changedPaths:["scripts/patchAutomaticOrientationSync.mjs","scripts/snippets/operationalSheetAutoSyncJobs.js.txt","tests/cloud-cost-guards.test.cjs"],predeployPaths:["scripts/patchAutomaticOrientationSync.mjs"]});
  assert.equal(plan.mode,"targeted");
  assert.deepEqual(plan.targets,[...names].sort());
});
