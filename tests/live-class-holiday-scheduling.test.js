import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateClassEndDate,
  generateSessionOccurrences,
  setSchedulingSchoolClosureDates,
} from "../src/utils/liveClassScheduling.js";

test("school-closed dates do not generate live class sessions", () => {
  setSchedulingSchoolClosureDates(["2026-07-01"]);
  const sessions = generateSessionOccurrences({
    classId: "a1-holiday-test",
    totalSessions: 2,
    startDate: "2026-07-01",
    endDate: "2026-07-15",
    timezone: "Africa/Accra",
    scheduleRules: [{ day: "Wed", startTime: "18:00", durationMinutes: 60 }],
  });

  assert.deepEqual(
    sessions.map((session) => session.startsAt.slice(0, 10)),
    ["2026-07-08", "2026-07-15"],
  );
});

test("automatic class end date moves forward when a teaching day is closed", () => {
  const normalEnd = calculateClassEndDate({
    levelId: "A1",
    startDate: "2026-06-20",
    scheduleRules: [{ day: "Sat", startTime: "09:00", durationMinutes: 120 }],
    excludedDates: [],
  });
  const holidayAdjustedEnd = calculateClassEndDate({
    levelId: "A1",
    startDate: "2026-06-20",
    scheduleRules: [{ day: "Sat", startTime: "09:00", durationMinutes: 120 }],
    excludedDates: ["2026-06-20"],
  });

  assert.equal(normalEnd, "2026-12-19");
  assert.equal(holidayAdjustedEnd, "2026-12-26");
});
