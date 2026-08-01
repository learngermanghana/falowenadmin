import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { buildSessionReschedulePlan } from "../src/utils/liveClassReschedulePlan.js";

const groups = getCourseSessionGroups("A1");
const klass = {
  id: "a1-thursday-saturday",
  levelId: "A1",
  startDate: "2026-06-18",
  timezone: "Africa/Accra",
  scheduleRules: [
    { day: "thu", startTime: "18:00", durationMinutes: 60 },
    { day: "sat", startTime: "08:00", durationMinutes: 60 },
  ],
};

function session(day, startsAt, status = "scheduled") {
  const start = new Date(startsAt);
  const group = groups.find((item) => Number(item.day) === day);
  return {
    id: `day-${day}`,
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    curriculumDay: day,
    curriculumIndex: day + 1,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 60 * 60000).toISOString(),
    status,
  };
}

test("following reschedule uses the next saved timetable slots", () => {
  const sessions = [
    session(0, "2026-06-18T18:00:00.000Z"),
    session(1, "2026-06-20T08:00:00.000Z"),
    session(2, "2026-06-25T18:00:00.000Z"),
    session(3, "2026-06-27T08:00:00.000Z", "cancelled"),
  ];

  const plan = buildSessionReschedulePlan({
    klass,
    sessions,
    sessionId: "day-1",
    targetStartsAt: "2026-06-27T08:00:00.000Z",
    targetEndsAt: "2026-06-27T09:00:00.000Z",
    mode: "following",
  });

  assert.deepEqual(
    plan.changes.map((change) => [change.session.id, change.startsAt, change.plannedStatus]),
    [
      ["day-1", "2026-06-27T08:00:00.000Z", "scheduled"],
      ["day-2", "2026-07-02T18:00:00.000Z", "scheduled"],
      ["day-3", "2026-07-04T08:00:00.000Z", "cancelled"],
    ],
  );
});

test("following reschedule repairs duplicate dates and invalid clock times", () => {
  const sessions = [
    session(19, "2026-07-30T18:00:00.000Z"),
    session(20, "2026-08-01T08:00:00.000Z"),
    session(21, "2026-08-01T22:00:00.000Z"),
    session(22, "2026-08-07T08:00:00.000Z"),
    session(23, "2026-08-08T08:00:00.000Z"),
  ];

  const plan = buildSessionReschedulePlan({
    klass,
    sessions,
    sessionId: "day-20",
    targetStartsAt: "2026-08-01T08:00:00.000Z",
    targetEndsAt: "2026-08-01T09:00:00.000Z",
    mode: "following",
  });

  assert.deepEqual(
    plan.changes.map((change) => [change.session.id, change.startsAt]),
    [
      ["day-20", "2026-08-01T08:00:00.000Z"],
      ["day-21", "2026-08-06T18:00:00.000Z"],
      ["day-22", "2026-08-08T08:00:00.000Z"],
      ["day-23", "2026-08-13T18:00:00.000Z"],
    ],
  );
});
