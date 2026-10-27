import test from "node:test";
import assert from "node:assert/strict";
import {
  buildManualDateOverridePatch,
  classScheduleBoundsFromSessions,
} from "../src/utils/attendanceSessionOverride.js";

const scheduleRules = [
  { day: "thu", startTime: "18:00", durationMinutes: 60 },
  { day: "fri", startTime: "18:00", durationMinutes: 60 },
  { day: "sat", startTime: "08:00", durationMinutes: 60 },
];

test("attendance date override preserves the class start time and duration without weekday rules", () => {
  const patch = buildManualDateOverridePatch({
    session: {
      startsAt: "2026-07-03T18:00:00.000Z",
      endsAt: "2026-07-03T20:00:00.000Z",
    },
    dateDraft: "2026-07-09",
    timezone: "Africa/Accra",
    actorId: "teacher-1",
  });

  assert.equal(patch.startsAt, "2026-07-09T18:00:00.000Z");
  assert.equal(patch.endsAt, "2026-07-09T20:00:00.000Z");
  assert.equal(patch.status, "rescheduled");
  assert.equal(patch.manualDateOverride, true);
  assert.equal(patch.manualDateOverrideDate, "2026-07-09");
  assert.equal(patch.manualDateOverrideBy, "teacher-1");
  assert.equal(patch.previousStartsAt, "2026-07-03T18:00:00.000Z");
  assert.equal(patch.manualDateOverrideStartTimeSource, "previous-session-time");
});

test("attendance date override applies Saturday 08:00 from the class timetable", () => {
  const patch = buildManualDateOverridePatch({
    session: {
      startsAt: "2026-07-17T18:00:00.000Z",
      endsAt: "2026-07-17T19:00:00.000Z",
      classScheduleRules: scheduleRules,
    },
    dateDraft: "2026-07-18",
    timezone: "Africa/Accra",
  });

  assert.equal(patch.startsAt, "2026-07-18T08:00:00.000Z");
  assert.equal(patch.endsAt, "2026-07-18T09:00:00.000Z");
  assert.equal(patch.manualDateOverrideStartTimeSource, "class-weekday-rule");
});

test("class schedule bounds use the updated official session dates", () => {
  const bounds = classScheduleBoundsFromSessions([
    { id: "cancelled-old", status: "cancelled", startsAt: "2026-06-01T18:00:00.000Z" },
    { id: "day-1", status: "scheduled", startsAt: "2026-06-19T18:00:00.000Z" },
    { id: "day-10", status: "rescheduled", startsAt: "2026-07-09T18:00:00.000Z" },
    { id: "day-24", status: "scheduled", startsAt: "2026-07-18T08:00:00.000Z" },
  ], "Africa/Accra");

  assert.equal(bounds.firstSession.id, "day-1");
  assert.equal(bounds.latestSession.id, "day-24");
  assert.equal(bounds.sessionDerivedStartDate, "2026-06-19");
  assert.equal(bounds.sessionDerivedEndDate, "2026-07-18");
});

test("class schedule bounds move the end date when an overridden session becomes the latest lesson", () => {
  const bounds = classScheduleBoundsFromSessions([
    { id: "day-1", status: "scheduled", startsAt: "2026-06-19T18:00:00.000Z" },
    { id: "day-24", status: "scheduled", startsAt: "2026-07-18T08:00:00.000Z" },
    { id: "day-10", status: "rescheduled", startsAt: "2026-07-30T18:00:00.000Z" },
  ], "Africa/Accra");

  assert.equal(bounds.latestSession.id, "day-10");
  assert.equal(bounds.sessionDerivedEndDate, "2026-07-30");
});
