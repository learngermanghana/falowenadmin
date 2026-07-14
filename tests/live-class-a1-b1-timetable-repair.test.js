import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import {
  buildOfficialLessonSchedulePlan,
  resolveOfficialSessionNumber,
} from "../src/utils/liveClassLessonOrder.js";

const CLASS_DATES = [
  "2026-06-01", "2026-06-02", "2026-06-03",
  "2026-06-08", "2026-06-09", "2026-06-10",
  "2026-06-15", "2026-06-16", "2026-06-17",
  "2026-06-22", "2026-06-23", "2026-06-24",
  "2026-06-29", "2026-06-30", "2026-07-01",
  "2026-07-06", "2026-07-07", "2026-07-08",
  "2026-07-13", "2026-07-14", "2026-07-15",
  "2026-07-20", "2026-07-21", "2026-07-22",
  "2026-07-27", "2026-07-28", "2026-07-29",
  "2026-08-03",
];

const scheduleRules = [
  { day: "mon", startTime: "19:00", durationMinutes: 120 },
  { day: "tue", startTime: "19:00", durationMinutes: 120 },
  { day: "wed", startTime: "19:00", durationMinutes: 120 },
];

function sessionsFor(levelId, count) {
  const groups = getCourseSessionGroups(levelId);
  return groups.slice(0, count).map((group, index) => ({
    id: `${levelId.toLowerCase()}-${index + 1}`,
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    curriculumIndex: index + 1,
    startsAt: `${CLASS_DATES[index]}T19:00:00.000Z`,
    endsAt: `${CLASS_DATES[index]}T21:00:00.000Z`,
    status: "scheduled",
  }));
}

test("A1 grouped assignment identity overrides a stale curriculum index", () => {
  const groups = getCourseSessionGroups("A1");
  const groupIndex = groups.findIndex((group) => group.assignmentIds.length > 1);
  assert.ok(groupIndex >= 0);

  const session = {
    topic: groups[groupIndex].topic,
    assignmentIds: groups[groupIndex].assignmentIds,
    curriculumIndex: 1,
  };

  assert.equal(resolveOfficialSessionNumber(session, groups, "A1"), groupIndex + 1);
});

test("A1 repairs to 25 grouped attendance sessions", () => {
  const plan = buildOfficialLessonSchedulePlan({
    classId: "a1-class",
    klass: {
      id: "a1-class",
      levelId: "A1",
      startDate: "2026-06-01",
      endDate: "2026-07-20",
      timezone: "Africa/Accra",
      scheduleRules,
    },
    sessions: sessionsFor("A1", 22),
    excludedDates: [],
  });

  assert.equal(plan.levelId, "A1");
  assert.equal(plan.expectedLessons, 25);
  assert.equal(plan.currentSessions, 22);
  assert.equal(plan.missingLessons, 3);
  assert.equal(plan.countLabel, "attendance sessions");
  assert.equal(plan.itemLabel, "Day");
  assert.equal(plan.endDate, "2026-07-27");
  assert.equal(plan.items.at(-1).group.assignmentIds.includes("A1-5.10"), true);
});

test("B1 repairs to all 28 lessons", () => {
  const plan = buildOfficialLessonSchedulePlan({
    classId: "b1-class",
    klass: {
      id: "b1-class",
      levelId: "B1",
      startDate: "2026-06-01",
      endDate: "2026-07-27",
      timezone: "Africa/Accra",
      scheduleRules,
    },
    sessions: sessionsFor("B1", 25),
    excludedDates: [],
  });

  assert.equal(plan.levelId, "B1");
  assert.equal(plan.expectedLessons, 28);
  assert.equal(plan.currentSessions, 25);
  assert.equal(plan.missingLessons, 3);
  assert.equal(plan.countLabel, "lessons");
  assert.equal(plan.itemLabel, "Lesson");
  assert.equal(plan.endDate, "2026-08-03");
  assert.equal(plan.items.at(-1).group.assignmentIds[0], "B1-10.28");
  assert.equal(plan.items.at(-1).targetStartsAt, "2026-08-03T19:00:00.000Z");
});
