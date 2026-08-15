import test from "node:test";
import assert from "node:assert/strict";
import { buildRebuildClassSessionsPlan } from "../src/utils/liveClassSessionRebuildPlan.js";

const klass = {
  id: "b1-test",
  name: "B1 Test Class",
  levelId: "B1",
  startDate: "2026-08-01",
  endDate: "2026-11-30",
};

const occurrence = {
  id: "b1-test_2026-08-06_1900",
  classId: "b1-test",
  startsAt: "2026-08-06T19:00:00.000Z",
  endsAt: "2026-08-06T20:30:00.000Z",
  status: "scheduled",
};

function curriculumPatch(levelId, index, session, { force }) {
  if (!force) return null;
  return {
    assignmentIds: ["B1-1.1"],
    chapterIds: ["B1-1.1"],
    curriculumIds: ["B1-1.1"],
    assignment_id: "B1-1.1",
    topic: "Day 1: Traumwelten",
    curriculumIndex: index + 1,
    curriculumDay: 1,
  };
}

test("auto-completed desired sessions can repair curriculum without changing completion or time", () => {
  const completed = {
    ...occurrence,
    status: "completed",
    completionSource: "automatic",
    completedBy: "system:auto-session-completion",
    topic: "Day 0: Einführung und Orientierung",
    assignmentIds: ["B1-ORIENTATION"],
  };

  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences: [occurrence],
    sessions: [completed],
    attendanceBySessionId: new Map(),
    buildCurriculumPatch: curriculumPatch,
  });

  const upsert = plan.upserts[0];
  assert.equal(upsert.patch.topic, "Day 1: Traumwelten");
  assert.deepEqual(upsert.patch.assignmentIds, ["B1-1.1"]);
  assert.equal(upsert.patch.startsAt, undefined);
  assert.equal(upsert.patch.endsAt, undefined);
  assert.equal(upsert.patch.status, undefined);
  assert.equal(upsert.existing.status, "completed");
  assert.equal(upsert.existing.startsAt, occurrence.startsAt);
});

test("attendance-bearing completed sessions remain curriculum-locked", () => {
  const completed = {
    ...occurrence,
    status: "completed",
    completionSource: "automatic",
    completedBy: "system:auto-session-completion",
    topic: "Manually verified historical lesson",
  };

  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences: [occurrence],
    sessions: [completed],
    attendanceBySessionId: new Map([[completed.id, { students: { s1: { present: true } } }]]),
    buildCurriculumPatch: curriculumPatch,
  });

  assert.equal(plan.upserts[0].patch.topic, undefined);
  assert.equal(plan.upserts[0].existing.topic, "Manually verified historical lesson");
});
