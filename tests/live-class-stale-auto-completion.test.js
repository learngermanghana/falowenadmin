import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRebuildClassSessionsPlan,
  isDisposableAutomaticCompletion,
} from "../src/utils/liveClassSessionRebuildPlan.js";

const klass = {
  id: "b1-test",
  name: "B1 Test Class",
  levelId: "B1",
  startDate: "2026-08-01",
  endDate: "2026-11-30",
  timezone: "Africa/Accra",
};

const staleAutomatic = {
  id: "legacy-orientation",
  classId: "B1 Test Class",
  startsAt: "2026-08-07T19:00:00.000Z",
  endsAt: "2026-08-07T20:30:00.000Z",
  status: "completed",
  topic: "Day 0: Einführung und Orientierung",
  completionSource: "automatic",
  completedBy: "system:auto-session-completion",
  autoCompletedAt: "2026-08-07T21:00:00.000Z",
};

test("stale system auto-completion without attendance is disposable", () => {
  assert.equal(isDisposableAutomaticCompletion(staleAutomatic, null), true);

  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences: [],
    sessions: [staleAutomatic],
  });

  assert.deepEqual(plan.deletions, [staleAutomatic]);
  assert.deepEqual(plan.preserved, []);
});

test("automatic completion with real attendance remains protected", () => {
  const attendance = { students: { student1: { present: true } } };
  assert.equal(isDisposableAutomaticCompletion(staleAutomatic, attendance), false);

  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences: [],
    sessions: [staleAutomatic],
    attendanceBySessionId: new Map([[staleAutomatic.id, attendance]]),
  });

  assert.deepEqual(plan.deletions, []);
  assert.deepEqual(plan.preserved, [staleAutomatic]);
});

test("manual completed session remains protected", () => {
  const manual = {
    ...staleAutomatic,
    id: "manual-completed",
    completionSource: "manual",
    completedBy: "admin-user",
    autoCompletedAt: null,
  };

  assert.equal(isDisposableAutomaticCompletion(manual, null), false);

  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences: [],
    sessions: [manual],
  });

  assert.deepEqual(plan.deletions, []);
  assert.deepEqual(plan.preserved, [manual]);
});

test("auto-completed session with reschedule history remains protected", () => {
  const moved = {
    ...staleAutomatic,
    id: "moved-auto-completed",
    previousStartsAt: "2026-08-06T19:00:00.000Z",
    rescheduledBy: "admin-user",
    rescheduledAt: "2026-08-06T12:00:00.000Z",
  };

  assert.equal(isDisposableAutomaticCompletion(moved, null), false);
});
