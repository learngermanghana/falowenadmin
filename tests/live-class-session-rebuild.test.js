import test from "node:test";
import assert from "node:assert/strict";
import { generateSessionOccurrences } from "../src/utils/liveClassScheduling.js";
import { buildRebuildClassSessionsPlan } from "../src/utils/liveClassSessionRebuildPlan.js";

const klass = {
  id: "class-a1",
  name: "A1 Test Class",
  levelId: "A1",
  startDate: "2026-06-12",
  endDate: "2026-06-24",
  timezone: "Africa/Accra",
  scheduleRules: [
    { day: "Mon", startTime: "18:00", durationMinutes: 120 },
    { day: "Tue", startTime: "18:00", durationMinutes: 120 },
    { day: "Wed", startTime: "18:00", durationMinutes: 120 },
  ],
};

function desiredOccurrences() {
  return generateSessionOccurrences({ classId: klass.id, ...klass });
}

test("rebuild occurrences start on first timetable day after 2026-06-12", () => {
  const occurrences = desiredOccurrences();
  assert.equal(occurrences[0].id, "class-a1_2026-06-15_1800");
  assert.equal(occurrences[0].startsAt, "2026-06-15T18:00:00.000Z");
});

test("rebuild plan removes stale scheduled sessions beginning 2026-06-29", () => {
  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences: desiredOccurrences(),
    sessions: [
      { id: "class-a1_2026-06-29_1800", classId: klass.id, startsAt: "2026-06-29T18:00:00.000Z", status: "scheduled" },
      { id: "class-a1_2026-06-30_1800", classId: klass.id, startsAt: "2026-06-30T18:00:00.000Z", status: "scheduled" },
      { id: "class-a1_2026-07-01_1800", classId: klass.id, startsAt: "2026-07-01T18:00:00.000Z", status: "scheduled" },
    ],
  });
  assert.deepEqual(plan.deletions.map((session) => session.id), [
    "class-a1_2026-06-29_1800",
    "class-a1_2026-06-30_1800",
    "class-a1_2026-07-01_1800",
  ]);
});

test("rebuild plan preserves completed stale sessions", () => {
  const completed = { id: "class-a1_2026-06-29_1800", classId: klass.id, startsAt: "2026-06-29T18:00:00.000Z", status: "completed" };
  const plan = buildRebuildClassSessionsPlan({ klass, occurrences: desiredOccurrences(), sessions: [completed] });
  assert.deepEqual(plan.deletions, []);
  assert.deepEqual(plan.preserved, [completed]);
});

test("rebuild plan preserves legacy rescheduled sessions even when status is scheduled", () => {
  const rescheduled = {
    id: "class-a1_2026-06-29_1800",
    classId: klass.id,
    startsAt: "2026-07-03T11:00:00.000Z",
    previousStartsAt: "2026-06-29T18:00:00.000Z",
    rescheduledAt: "2026-07-01T10:00:00.000Z",
    status: "scheduled",
  };
  const plan = buildRebuildClassSessionsPlan({ klass, occurrences: desiredOccurrences(), sessions: [rescheduled] });
  assert.deepEqual(plan.deletions, []);
  assert.deepEqual(plan.preserved, [rescheduled]);
});

test("rebuild plan preserves stale sessions that have attendance records", () => {
  const stale = { id: "class-a1_2026-06-29_1800", classId: klass.id, startsAt: "2026-06-29T18:00:00.000Z", status: "scheduled" };
  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences: desiredOccurrences(),
    sessions: [stale],
    attendanceBySessionId: new Map([[stale.id, { students: { student1: { present: true } } }]]),
  });
  assert.deepEqual(plan.deletions, []);
  assert.deepEqual(plan.preserved, [stale]);
});

test("dashboard compatibility derives end date without modifying saved class endDate", async () => {
  const savedEndDate = "2026-12-31";
  const sessionDerivedEndDate = "2026-07-01";
  const dashboardClass = { id: klass.id, endDate: savedEndDate, sessionDerivedEndDate };
  assert.equal(dashboardClass.endDate, savedEndDate);
  assert.equal(dashboardClass.sessionDerivedEndDate, sessionDerivedEndDate);
});

test("repeated rebuild plans upsert existing desired sessions without duplicates", () => {
  const occurrences = desiredOccurrences();
  const sessions = occurrences.map((occurrence) => ({ ...occurrence, classId: klass.id }));
  const plan = buildRebuildClassSessionsPlan({ klass, occurrences, sessions });
  assert.equal(plan.deletions.length, 0);
  assert.equal(plan.upserts.length, occurrences.length);
  assert.equal(new Set(plan.upserts.map((item) => item.occurrence.id)).size, occurrences.length);
  assert.ok(plan.upserts.every((item) => item.existing));
});
