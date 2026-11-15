import test from "node:test";
import assert from "node:assert/strict";
import { calculateClassEndDate, generateSessionOccurrences, SWAHILI_A1_PLANNED_SESSION_COUNT } from "../src/utils/liveClassScheduling.js";

const scheduleRules = [
  { day: "Mon", startTime: "18:00", durationMinutes: 120 },
  { day: "Thu", startTime: "18:00", durationMinutes: 120 },
];

test("Swahili A1 automatically ends after 20 Monday/Thursday meetings", () => {
  assert.equal(SWAHILI_A1_PLANNED_SESSION_COUNT, 20);
  const payload = { language: "Swahili", levelId: "A1", startDate: "2026-10-29", scheduleRules, excludedDates: [] };
  const endDate = calculateClassEndDate(payload);
  assert.equal(endDate, "2027-01-04");
  const sessions = generateSessionOccurrences({ ...payload, classId: "swahili-test", endDate });
  assert.equal(sessions.length, 20);
  assert.equal(sessions.at(-1).startsAt.slice(0, 10), endDate);
});

test("Swahili timetable skips excluded school closure dates", () => {
  const excludedDates = ["2026-12-24"];
  const payload = { language: "Swahili", levelId: "A1", startDate: "2026-10-29", scheduleRules, excludedDates };
  const endDate = calculateClassEndDate(payload);
  assert.equal(endDate, "2027-01-07");
  const sessions = generateSessionOccurrences({ ...payload, classId: "swahili-holidays", endDate });
  assert.equal(sessions.length, 20);
  assert.ok(sessions.every((session) => !session.startsAt.startsWith("2026-12-24")));
});

test("Swahili A1 requires a valid date and teaching day", () => {
  assert.equal(calculateClassEndDate({ language: "Swahili", levelId: "A1", startDate: "", scheduleRules }), "");
  assert.equal(calculateClassEndDate({ language: "Swahili", levelId: "A1", startDate: "2026-10-29", scheduleRules: [] }), "");
});
