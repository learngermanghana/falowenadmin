import test from "node:test";
import assert from "node:assert/strict";
import {
  generateSessionOccurrences,
  getSchedulingSchoolClosureDates,
  setSchedulingSchoolClosureDates,
} from "../src/utils/liveClassScheduling.js";

test("session rebuild excludes loaded Ghana school closure dates", () => {
  const previous = getSchedulingSchoolClosureDates();
  try {
    setSchedulingSchoolClosureDates(["2026-06-15"]);
    const sessions = generateSessionOccurrences({
      classId: "class-a1",
      levelId: "A1",
      startDate: "2026-06-12",
      endDate: "2026-06-24",
      timezone: "Africa/Accra",
      scheduleRules: [
        { day: "Mon", startTime: "11:00", durationMinutes: 120 },
        { day: "Tue", startTime: "11:00", durationMinutes: 120 },
        { day: "Wed", startTime: "14:00", durationMinutes: 120 },
      ],
    });
    assert.equal(sessions[0].id, "class-a1_2026-06-16_1100");
  } finally {
    setSchedulingSchoolClosureDates(previous);
  }
});
