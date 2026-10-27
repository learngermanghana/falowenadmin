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

const berlin = {
  id: "berlin", name: "A1 Berlin Klasse", timezone: "Africa/Accra",
  startDate: "2026-09-02", endDate: "2026-11-03",
  scheduleRules: ["mon", "tue", "wed"].map((day) => ({ day, startTime: "11:00", durationMinutes: 120 })),
};
const morning = new Date("2026-10-07T09:00:00Z");

test("an incomplete Berlin session list falls back to its saved timetable", () => {
  const summary = classTimingSummary(berlin, [{ startsAt: "2026-09-02T11:00:00Z", endsAt: "2026-09-02T13:00:00Z", status: "completed" }], morning);
  assert.equal(summary.label, "Today · 11:00");
  assert.equal(summary.source, "timetable");
  assert.equal(summary.sortTime, Date.parse("2026-10-07T11:00:00Z"));
});

test("saved cancellations, completion, and reschedules are not recreated by the timetable", () => {
  for (const status of ["cancelled", "completed"]) {
    const summary = classTimingSummary(berlin, [{ startsAt: "2026-10-07T11:00:00Z", endsAt: "2026-10-07T13:00:00Z", status }], morning);
    assert.equal(summary.label, "Mon · 11:00");
  }
  const moved = classTimingSummary(berlin, [{ startsAt: "2026-10-08T14:00:00Z", endsAt: "2026-10-08T16:00:00Z", previousStartsAt: "2026-10-07T11:00:00Z", status: "rescheduled" }], morning);
  assert.equal(moved.label, "Tomorrow · 14:00");
  assert.equal(moved.source, "session");
});

test("timetable estimates respect course dates, holidays and class timezone", () => {
  assert.equal(classTimingSummary({ ...berlin, endDate: "2026-10-06" }, [], morning).label, "No upcoming class");
  assert.equal(classTimingSummary({ ...berlin, startDate: "2026-10-12" }, [], morning).label, "Mon · 11:00");
  assert.equal(classTimingSummary({ ...berlin, holidayDatesExcluded: ["2026-10-07"] }, [], morning).label, "Mon · 11:00");
  const local = classTimingSummary({ ...berlin, timezone: "Africa/Lagos" }, [], morning);
  assert.equal(local.label, "Today · 11:00");
  assert.equal(local.sortTime, Date.parse("2026-10-07T10:00:00Z"));
});

test("passed timetable sessions advance automatically while ongoing ones remain first", () => {
  assert.equal(classTimingSummary(berlin, [], new Date("2026-10-07T12:00:00Z")).tone, "live");
  assert.equal(classTimingSummary(berlin, [], new Date("2026-10-07T13:00:00Z")).label, "Mon · 11:00");
});

test("classes are ordered by upcoming time without hiding unavailable schedules as empty ones", async () => {
  const { orderAttendanceClasses } = await import("../src/utils/attendanceClassTiming.js");
  const dortmund = { id: "dortmund", name: "A1 Dortmund Klasse" };
  const missing = { id: "missing", name: "Missing schedule" };
  const ordered = orderAttendanceClasses([dortmund, missing, berlin], {
    berlin: [], missing: null,
    dortmund: [{ startsAt: "2026-10-07T18:00:00Z", endsAt: "2026-10-07T20:00:00Z" }],
  }, morning);
  assert.deepEqual(ordered.map(({ klass }) => klass.id), ["berlin", "dortmund", "missing"]);
  assert.equal(ordered[2].timing, null);
});
