import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildOfficialLessonSchedulePlan } from "../src/utils/liveClassLessonOrder.js";

const repairServicePath = new URL("../src/services/liveClassLessonDateRepairService.js", import.meta.url);
const EXCLUDED_DATES = ["2026-07-15", "2026-07-20", "2026-07-22"];
const SCHEDULE_RULES = [
  { day: "mon", startTime: "19:00", durationMinutes: 120 },
  { day: "tue", startTime: "19:00", durationMinutes: 120 },
  { day: "wed", startTime: "19:00", durationMinutes: 120 },
];

function session(lessonNumber, date) {
  return {
    id: `lesson-${lessonNumber}`,
    topic: `Lesson ${lessonNumber}: Example`,
    assignmentIds: [`A2-${lessonNumber}`],
    startsAt: `${date}T19:00:00.000Z`,
    endsAt: `${date}T21:00:00.000Z`,
    status: "scheduled",
  };
}

function reportedSessions() {
  return [
    session(1, "2026-06-01"),
    session(2, "2026-06-02"),
    session(3, "2026-06-03"),
    session(4, "2026-06-08"),
    session(5, "2026-06-09"),
    session(6, "2026-06-10"),
    session(7, "2026-06-15"),
    session(8, "2026-06-16"),
    session(9, "2026-06-17"),
    session(10, "2026-06-22"),
    session(11, "2026-06-23"),
    session(12, "2026-06-24"),
    session(13, "2026-06-29"),
    session(14, "2026-06-30"),
    session(15, "2026-07-01"),
    session(16, "2026-07-06"),
    session(17, "2026-07-07"),
    session(18, "2026-07-08"),
    session(19, "2026-07-21"),
    session(20, "2026-07-27"),
    session(21, "2026-07-13"),
    session(22, "2026-07-28"),
    session(23, "2026-07-14"),
    session(24, "2026-07-29"),
    session(25, "2026-08-03"),
  ];
}

function buildPlan(sessions) {
  return buildOfficialLessonSchedulePlan({
    classId: "a2-class",
    klass: {
      id: "a2-class",
      levelId: "A2",
      startDate: "2026-06-01",
      endDate: "2026-08-03",
      timezone: "Africa/Accra",
      scheduleRules: SCHEDULE_RULES,
    },
    sessions,
    excludedDates: EXCLUDED_DATES,
  });
}

test("repairs the reported 25-session A2 timetable and extends it to 28 lessons", () => {
  const plan = buildPlan(reportedSessions());

  assert.equal(plan.expectedLessons, 28);
  assert.equal(plan.currentSessions, 25);
  assert.equal(plan.missingLessons, 3);
  assert.equal(plan.endDate, "2026-08-10");

  const target = (lessonNumber) => plan.items.find((item) => item.lessonNumber === lessonNumber)?.targetStartsAt;
  assert.equal(target(19), "2026-07-13T19:00:00.000Z");
  assert.equal(target(20), "2026-07-14T19:00:00.000Z");
  assert.equal(target(21), "2026-07-21T19:00:00.000Z");
  assert.equal(target(22), "2026-07-27T19:00:00.000Z");
  assert.equal(target(23), "2026-07-28T19:00:00.000Z");
  assert.equal(target(26), "2026-08-04T19:00:00.000Z");
  assert.equal(target(27), "2026-08-05T19:00:00.000Z");
  assert.equal(target(28), "2026-08-10T19:00:00.000Z");
});

test("a Lesson 20 and Lesson 23 time collision is repaired into unique official slots", () => {
  const sessions = reportedSessions().map((item) => {
    if (item.id !== "lesson-20") return item;
    return {
      ...item,
      startsAt: "2026-07-14T19:00:00.000Z",
      endsAt: "2026-07-14T21:00:00.000Z",
    };
  });
  const plan = buildPlan(sessions);
  const lesson20 = plan.items.find((item) => item.lessonNumber === 20);
  const lesson23 = plan.items.find((item) => item.lessonNumber === 23);

  assert.equal(plan.collisionCount, 1);
  assert.equal(lesson20.targetStartsAt, "2026-07-14T19:00:00.000Z");
  assert.equal(lesson20.changed, false);
  assert.equal(lesson23.targetStartsAt, "2026-07-28T19:00:00.000Z");
  assert.equal(lesson23.changed, true);
  assert.notEqual(lesson20.targetStartsAt, lesson23.targetStartsAt);
});

test("the repair service loads raw Firestore sessions before building the atomic plan", async () => {
  const source = await readFile(repairServicePath, "utf8");
  assert.match(source, /loadRawRepairSessions/);
  assert.match(source, /sessions:\s*repairSessions/);
  assert.match(source, /collisionsResolved:\s*plan\.collisionCount/);
});
