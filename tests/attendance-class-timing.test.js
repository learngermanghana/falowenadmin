import test from "node:test";
import assert from "node:assert/strict";
import { classTimingSummary, weeklyTimetableLabels } from "../src/utils/attendanceClassTiming.js";

const klass = {
  timezone: "Africa/Accra",
  scheduleRules: [
    { day: "Mon", startTime: "18:00", durationMinutes: 120 },
    { day: "Wed", startTime: "18:00", durationMinutes: 120 },
  ],
};

test("class timing highlights today's next non-cancelled session", () => {
  const summary = classTimingSummary(klass, [
    { startsAt: "2026-09-28T15:00:00.000Z", endsAt: "2026-09-28T17:00:00.000Z", status: "cancelled" },
    { startsAt: "2026-09-28T18:00:00.000Z", endsAt: "2026-09-28T20:00:00.000Z", status: "scheduled" },
  ], new Date("2026-09-28T10:00:00.000Z"));

  assert.equal(summary.label, "Today · 18:00");
  assert.equal(summary.tone, "today");
});

test("class timing identifies a class in progress", () => {
  const summary = classTimingSummary(klass, [
    { startsAt: "2026-09-28T09:00:00.000Z", endsAt: "2026-09-28T11:00:00.000Z", status: "live" },
  ], new Date("2026-09-28T10:00:00.000Z"));

  assert.equal(summary.label, "In progress · 09:00");
  assert.equal(summary.tone, "live");
});

test("weekly timetable labels show each saved teaching day and time", () => {
  assert.deepEqual(weeklyTimetableLabels(klass), ["Mon · 18:00", "Wed · 18:00"]);
});
