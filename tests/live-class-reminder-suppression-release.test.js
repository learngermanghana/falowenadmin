import test from "node:test";
import assert from "node:assert/strict";
import {
  hasScheduleHealthReminderSuppression,
  scheduleHealthReminderReleasePatch,
  shouldReleaseScheduleHealthReminderSuppression,
} from "../src/utils/liveClassReminderSuppression.js";

const future = "2099-08-12T19:00:00.000Z";

test("recognizes schedule-health reminder suppression", () => {
  assert.equal(hasScheduleHealthReminderSuppression({ reminderSuppressionSource: "schedule-health" }), true);
  assert.equal(hasScheduleHealthReminderSuppression({ scheduleHealthRemindersSuppressed: true }), true);
  assert.equal(hasScheduleHealthReminderSuppression({ scheduleRemindersSuppressed: true }), true);
  assert.equal(hasScheduleHealthReminderSuppression({ remindersSuppressed: true, reminderSuppressionSource: "manual" }), false);
});

test("releases only future active sessions suppressed by schedule health", () => {
  assert.equal(shouldReleaseScheduleHealthReminderSuppression({
    status: "scheduled",
    startsAt: future,
    remindersSuppressed: true,
    reminderSuppressionSource: "schedule-health",
  }, 0), true);

  assert.equal(shouldReleaseScheduleHealthReminderSuppression({
    status: "cancelled",
    startsAt: future,
    reminderSuppressionSource: "schedule-health",
  }, 0), false);

  assert.equal(shouldReleaseScheduleHealthReminderSuppression({
    status: "completed",
    startsAt: future,
    reminderSuppressionSource: "schedule-health",
  }, 0), false);

  assert.equal(shouldReleaseScheduleHealthReminderSuppression({
    status: "scheduled",
    startsAt: future,
    remindersSuppressed: true,
    reminderSuppressionSource: "manual",
  }, 0), false);
});

test("release patch clears only reminder suppression state", () => {
  const patch = scheduleHealthReminderReleasePatch(12345);
  assert.equal(patch.remindersSuppressed, false);
  assert.equal(patch.scheduleHealthRemindersSuppressed, false);
  assert.equal(patch.scheduleRemindersSuppressed, false);
  assert.equal(patch.reminderSuppressionSource, "");
  assert.equal(patch.reminderScheduleVersion, 12345);
});
