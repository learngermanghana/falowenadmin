import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import {
  buildOfficialLessonSchedulePlan,
  compareSessionsByLesson,
  resolveOfficialSessionNumber,
  sessionLessonNumber,
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

const a1ScheduleRules = [
  { day: "thu", startTime: "18:00", durationMinutes: 60 },
  { day: "fri", startTime: "18:00", durationMinutes: 60 },
  { day: "sat", startTime: "08:00", durationMinutes: 60 },
];

const A1_CORRUPTED_DATES = {
  0: ["2026-06-27", "08:00"],
  1: ["2026-07-02", "18:00"],
  2: ["2026-07-03", "18:00"],
  3: ["2026-07-04", "08:00"],
  4: ["2026-07-10", "18:00"],
  5: ["2026-07-09", "18:00"],
  6: ["2026-07-11", "08:00"],
  7: ["2026-07-16", "18:00"],
  8: ["2026-07-23", "18:00"],
  9: ["2026-07-25", "08:00"],
  10: ["2026-08-01", "08:00"],
  11: ["2026-08-06", "18:00"],
  12: ["2026-08-07", "18:00"],
  13: ["2026-07-17", "18:00"],
  14: ["2026-07-18", "08:00"],
  15: ["2026-07-24", "18:00"],
  16: ["2026-08-08", "08:00"],
  17: ["2026-08-13", "18:00"],
  18: ["2026-08-14", "18:00"],
  19: ["2026-07-30", "18:00"],
  20: ["2026-08-15", "08:00"],
  21: ["2026-08-20", "18:00"],
  22: ["2026-08-21", "18:00"],
  23: ["2026-08-22", "08:00"],
  24: ["2026-07-31", "18:00"],
};

function sessionsFor(levelId, count) {
  const groups = getCourseSessionGroups(levelId);
  return groups.slice(0, count).map((group, index) => ({
    id: `${levelId.toLowerCase()}-${index + 1}`,
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    curriculumIndex: index + 1,
    curriculumDay: group.day,
    startsAt: `${CLASS_DATES[index]}T19:00:00.000Z`,
    endsAt: `${CLASS_DATES[index]}T21:00:00.000Z`,
    status: "scheduled",
  }));
}

function a1CorruptedSessions() {
  return getCourseSessionGroups("A1").map((group, index) => {
    const [date, time] = A1_CORRUPTED_DATES[group.day];
    const start = new Date(`${date}T${time}:00.000Z`);
    return {
      id: `a1-day-${group.day}`,
      topic: group.topic,
      assignmentIds: group.assignmentIds,
      curriculumIndex: index + 1,
      curriculumDay: group.day,
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + 60 * 60000).toISOString(),
      status: "scheduled",
    };
  });
}

test("A1 day identity overrides assignment suffixes and stale indexes", () => {
  const groups = getCourseSessionGroups("A1");
  const session = {
    topic: "Day 18: Two-way Prepositions + Professions and Prepositions",
    assignmentIds: ["A1-0.1"],
    curriculumIndex: 1,
    curriculumDay: 18,
  };

  assert.equal(resolveOfficialSessionNumber(session, groups, "A1"), 19);
  assert.equal(sessionLessonNumber(session), 19);
});

test("A1 table sorting follows Day 0 to Day 24 instead of assignment suffixes", () => {
  const sessions = [
    { id: "day-18", topic: "Day 18: Example", assignmentIds: ["A1-12.1"], curriculumDay: 18 },
    { id: "day-2", topic: "Day 2: Example", assignmentIds: ["A1-0.2"], curriculumDay: 2 },
    { id: "day-22", topic: "Day 22: Example", assignmentIds: ["A1-14.1"], curriculumDay: 22 },
    { id: "day-1", topic: "Day 1: Example", assignmentIds: ["A1-0.1"], curriculumDay: 1 },
  ];

  assert.deepEqual(
    [...sessions].sort(compareSessionsByLesson).map((session) => session.id),
    ["day-1", "day-2", "day-18", "day-22"],
  );
});

test("A1 repairs the reported mixed dates into the official Day 0 to Day 24 sequence", () => {
  const plan = buildOfficialLessonSchedulePlan({
    classId: "a1-reported-class",
    klass: {
      id: "a1-reported-class",
      levelId: "A1",
      startDate: "2026-06-27",
      endDate: "2026-08-22",
      timezone: "Africa/Accra",
      scheduleRules: a1ScheduleRules,
    },
    sessions: a1CorruptedSessions(),
    excludedDates: [],
  });

  const targetForDay = (day) => plan.items.find((item) => Number(item.group.day) === day)?.targetStartsAt;

  assert.equal(plan.expectedLessons, 25);
  assert.equal(plan.currentSessions, 25);
  assert.equal(plan.missingLessons, 0);
  assert.equal(plan.endDate, "2026-08-22");
  assert.equal(targetForDay(0), "2026-06-27T08:00:00.000Z");
  assert.equal(targetForDay(1), "2026-07-02T18:00:00.000Z");
  assert.equal(targetForDay(4), "2026-07-09T18:00:00.000Z");
  assert.equal(targetForDay(5), "2026-07-10T18:00:00.000Z");
  assert.equal(targetForDay(8), "2026-07-17T18:00:00.000Z");
  assert.equal(targetForDay(9), "2026-07-18T08:00:00.000Z");
  assert.equal(targetForDay(10), "2026-07-23T18:00:00.000Z");
  assert.equal(targetForDay(13), "2026-07-30T18:00:00.000Z");
  assert.equal(targetForDay(18), "2026-08-08T08:00:00.000Z");
  assert.equal(targetForDay(24), "2026-08-22T08:00:00.000Z");
});

test("A1 Munich anchors Day 13 to Saturday 18 July and rebuilds the full sequence around actual progress", () => {
  const plan = buildOfficialLessonSchedulePlan({
    classId: "a1-munich-klasse-2026-06-12",
    klass: {
      id: "a1-munich-klasse-2026-06-12",
      slug: "a1-munich-klasse-2026-06-12",
      name: "A1 Munich Klasse",
      levelId: "A1",
      startDate: "2026-06-27",
      endDate: "2026-08-22",
      timezone: "Africa/Accra",
      scheduleRules: a1ScheduleRules,
    },
    sessions: a1CorruptedSessions(),
    excludedDates: [],
  });

  const targetForDay = (day) => plan.items.find((item) => Number(item.group.day) === day)?.targetStartsAt;

  assert.equal(plan.scheduleAnchor?.day, 13);
  assert.equal(plan.scheduleAnchor?.startsAt, "2026-07-18T08:00:00.000Z");
  assert.equal(plan.scheduleAnchor?.source, "a1-munich-day-13-progress-correction");
  assert.equal(plan.startDate, "2026-06-19");
  assert.equal(plan.endDate, "2026-08-14");
  assert.equal(plan.missingLessons, 0);
  assert.equal(targetForDay(0), "2026-06-19T18:00:00.000Z");
  assert.equal(targetForDay(10), "2026-07-11T08:00:00.000Z");
  assert.equal(targetForDay(12), "2026-07-17T18:00:00.000Z");
  assert.equal(targetForDay(13), "2026-07-18T08:00:00.000Z");
  assert.equal(targetForDay(14), "2026-07-23T18:00:00.000Z");
  assert.equal(targetForDay(24), "2026-08-14T18:00:00.000Z");
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
  assert.equal(plan.items.at(-1).lessonNumber, 25);
  assert.equal(plan.items.at(-1).targetStartsAt, "2026-07-27T19:00:00.000Z");
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
