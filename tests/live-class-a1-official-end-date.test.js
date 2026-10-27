import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateClassEndDate,
  generateSessionOccurrences,
  getCourseDictionarySessionCount,
} from "../src/utils/liveClassScheduling.js";

const scheduleRules = [
  { day: "thu", startTime: "18:00", durationMinutes: 60 },
  { day: "fri", startTime: "18:00", durationMinutes: 60 },
  { day: "sat", startTime: "08:00", durationMinutes: 60 },
];

test("A1 official end-date calculation uses 25 grouped attendance sessions", () => {
  assert.equal(getCourseDictionarySessionCount("A1"), 25);

  const endDate = calculateClassEndDate({
    levelId: "A1",
    startDate: "2026-06-19",
    scheduleRules,
    excludedDates: [],
  });

  assert.equal(endDate, "2026-08-14");
});

test("A1 generation stops after the same 25 sessions used by end-date calculation", () => {
  const endDate = calculateClassEndDate({
    levelId: "A1",
    startDate: "2026-06-19",
    scheduleRules,
    excludedDates: [],
  });
  const sessions = generateSessionOccurrences({
    classId: "a1-new-class",
    levelId: "A1",
    startDate: "2026-06-19",
    endDate,
    timezone: "Africa/Accra",
    scheduleRules,
    excludedDates: [],
  });

  assert.equal(sessions.length, 25);
  assert.equal(sessions[0].startsAt, "2026-06-19T18:00:00.000Z");
  assert.equal(sessions.at(-1).startsAt, "2026-08-14T18:00:00.000Z");
});

test("an excluded A1 teaching day extends the official end date by one session slot", () => {
  const endDate = calculateClassEndDate({
    levelId: "A1",
    startDate: "2026-06-19",
    scheduleRules,
    excludedDates: ["2026-07-18"],
  });

  assert.equal(endDate, "2026-08-15");
});
