import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { buildSessionReschedulePlan } from "../src/utils/liveClassReschedulePlan.js";

const groups = getCourseSessionGroups("A1");
const weeklyRules = [
  { day: "thu", startTime: "18:00", durationMinutes: 60 },
  { day: "fri", startTime: "18:00", durationMinutes: 60 },
  { day: "sat", startTime: "08:00", durationMinutes: 60 },
];
const klass = {
  id: "a1-thursday-friday-saturday",
  levelId: "A1",
  startDate: "2026-06-19",
  timezone: "Africa/Accra",
  scheduleRules: weeklyRules,
};

function session(day, startsAt, status = "scheduled") {
  const start = new Date(startsAt);
  const group = groups.find((item) => Number(item.day) === day);
  return {
    id: `day-${day}`,
    classId: klass.id,
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    curriculumDay: day,
    curriculumIndex: day + 1,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 60 * 60000).toISOString(),
    status,
  };
}

test("following reschedule uses every saved weekly timetable slot", () => {
  const sessions = [
    session(0, "2026-06-19T18:00:00.000Z"),
    session(1, "2026-06-20T08:00:00.000Z"),
    session(2, "2026-06-25T18:00:00.000Z"),
    session(3, "2026-06-26T18:00:00.000Z", "cancelled"),
  ];

  const plan = buildSessionReschedulePlan({
    klass,
    sessions,
    sessionId: "day-1",
    targetStartsAt: "2026-06-25T18:00:00.000Z",
    targetEndsAt: "2026-06-25T19:00:00.000Z",
    mode: "following",
  });

  assert.deepEqual(
    plan.changes.map((change) => [change.session.id, change.startsAt, change.plannedStatus]),
    [
      ["day-1", "2026-06-25T18:00:00.000Z", "scheduled"],
      ["day-2", "2026-06-26T18:00:00.000Z", "scheduled"],
      ["day-3", "2026-06-27T08:00:00.000Z", "cancelled"],
    ],
  );
});

test("object-shaped weekly rules place lessons on Thursday Friday and Saturday", () => {
  const objectRulesClass = {
    ...klass,
    id: "a1-object-weekly-rules",
    scheduleRules: { weekly: weeklyRules },
  };
  const sessions = [
    session(20, "2026-08-01T08:00:00.000Z"),
    session(21, "2026-08-01T22:00:00.000Z"),
    session(22, "2026-08-12T04:00:00.000Z"),
    session(23, "2026-08-13T04:00:00.000Z"),
    session(24, "2026-08-14T18:00:00.000Z"),
  ];

  const plan = buildSessionReschedulePlan({
    klass: objectRulesClass,
    sessions,
    sessionId: "day-21",
    targetStartsAt: "2026-08-06T18:00:00.000Z",
    targetEndsAt: "2026-08-06T19:00:00.000Z",
    mode: "following",
  });

  assert.deepEqual(
    plan.changes.map((change) => [change.session.id, change.startsAt]),
    [
      ["day-21", "2026-08-06T18:00:00.000Z"],
      ["day-22", "2026-08-07T18:00:00.000Z"],
      ["day-23", "2026-08-08T08:00:00.000Z"],
      ["day-24", "2026-08-13T18:00:00.000Z"],
    ],
  );
});
