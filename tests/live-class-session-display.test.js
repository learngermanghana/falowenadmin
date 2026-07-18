import test from "node:test";
import assert from "node:assert/strict";
import {
  scheduleSlotsLabel,
  sessionDateDisplay,
  sessionScheduleCheck,
  sessionTimeRange,
} from "../src/utils/liveClassSessionDisplay.js";

const scheduleRules = [
  { day: "thu", startTime: "18:00", durationMinutes: 60 },
  { day: "fri", startTime: "18:00", durationMinutes: 60 },
  { day: "sat", startTime: "08:00", durationMinutes: 60 },
];

test("session display exposes the full weekday, date and Ghana time", () => {
  const display = sessionDateDisplay("2026-07-24T18:00:00.000Z");
  assert.equal(display.weekday, "Friday");
  assert.equal(display.dateLabel, "24 Jul 2026");
  assert.equal(display.time, "18:00");
});

test("session time range remains compact for tablet cards", () => {
  const range = sessionTimeRange({
    startsAt: "2026-07-25T08:00:00.000Z",
    endsAt: "2026-07-25T09:00:00.000Z",
  });
  assert.equal(range.start.weekday, "Saturday");
  assert.equal(range.label, "08:00–09:00");
});

test("scheduled Thursday, Friday and Saturday slots are accepted", () => {
  const validSessions = [
    "2026-07-23T18:00:00.000Z",
    "2026-07-24T18:00:00.000Z",
    "2026-07-25T08:00:00.000Z",
  ];
  validSessions.forEach((startsAt) => {
    assert.equal(sessionScheduleCheck({ startsAt }, scheduleRules).valid, true);
  });
});

test("Sunday session is highlighted as outside the timetable", () => {
  const check = sessionScheduleCheck({ startsAt: "2026-07-26T08:00:00.000Z" }, scheduleRules);
  assert.equal(check.valid, false);
  assert.match(check.message, /Sunday is outside/i);
});

test("wrong time on a valid weekday is highlighted", () => {
  const check = sessionScheduleCheck({ startsAt: "2026-07-25T11:00:00.000Z" }, scheduleRules);
  assert.equal(check.valid, false);
  assert.match(check.message, /Saturday sessions should start at 08:00/i);
  assert.match(check.message, /starts at 11:00/i);
});

test("saved timetable slots have a compact admin label", () => {
  assert.equal(scheduleSlotsLabel(scheduleRules), "THU 18:00 · FRI 18:00 · SAT 08:00");
});
