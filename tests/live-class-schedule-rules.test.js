import test from "node:test";
import assert from "node:assert/strict";
import {
  duplicateScheduleWeekdays,
  nextUnusedScheduleDay,
  scheduleRulesForEditor,
  singleSessionPerWeekdayRules,
} from "../src/utils/liveClassScheduleRules.js";

test("duplicate weekday rules consolidate to the first saved time", () => {
  const rules = singleSessionPerWeekdayRules([
    { day: "Fri", startTime: "16:00", durationMinutes: 120 },
    { day: "Friday", startTime: "18:00", durationMinutes: 90 },
    { day: "Sat", startTime: "08:00", durationMinutes: 120 },
  ]);

  assert.deepEqual(rules, [
    { day: "fri", startTime: "16:00", durationMinutes: 120 },
    { day: "sat", startTime: "08:00", durationMinutes: 120 },
  ]);
});

test("editor helpers report duplicates and offer an unused weekday", () => {
  const source = [
    { day: "Thu", startTime: "18:00", durationMinutes: 120 },
    { day: "Thu", startTime: "20:00", durationMinutes: 120 },
    { day: "Fri", startTime: "18:00", durationMinutes: 120 },
  ];

  assert.deepEqual(duplicateScheduleWeekdays(source), ["Thu"]);
  assert.deepEqual(scheduleRulesForEditor(source).map((rule) => rule.day), ["Thu", "Fri"]);
  assert.equal(nextUnusedScheduleDay(source), "mon");
});
