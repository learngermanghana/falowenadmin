import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { buildFollowingScheduleRestorePlan } from "../src/utils/liveClassFollowingScheduleRestore.js";

const groups = getCourseSessionGroups("A1");
const scheduleRules = [
  { day: "thu", startTime: "18:00", durationMinutes: 60 },
  { day: "fri", startTime: "18:00", durationMinutes: 60 },
  { day: "sat", startTime: "08:00", durationMinutes: 60 },
];

function sessionForDay(day, startsAt, status = "scheduled") {
  const group = groups.find((item) => Number(item.day) === day);
  return {
    id: `day-${day}`,
    classId: "a1-munich",
    classRecordId: "a1-munich",
    className: "A1 Munich Klasse",
    status,
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString(),
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    chapterIds: group.assignmentIds,
    curriculumIds: group.assignmentIds,
    assignment_id: group.assignmentIds[0],
    curriculumDay: day,
    curriculumIndex: groups.indexOf(group) + 1,
    rescheduledAt: "2026-07-18T00:00:00.000Z",
    previousStartsAt: startsAt,
  };
}

function damagedSessions() {
  return [
    sessionForDay(15, "2026-07-18T08:00:00.000Z"),
    sessionForDay(16, "2026-07-19T08:00:00.000Z"),
    sessionForDay(17, "2026-07-24T18:00:00.000Z"),
    sessionForDay(18, "2026-07-25T18:00:00.000Z"),
    sessionForDay(19, "2026-07-26T08:00:00.000Z"),
    sessionForDay(20, "2026-07-31T18:00:00.000Z"),
    sessionForDay(21, "2026-08-01T18:00:00.000Z"),
    sessionForDay(22, "2026-08-02T08:00:00.000Z"),
    sessionForDay(23, "2026-08-07T18:00:00.000Z"),
    sessionForDay(24, "2026-08-08T18:00:00.000Z"),
  ];
}

const klass = {
  id: "a1-munich",
  name: "A1 Munich Klasse",
  levelId: "A1",
  startDate: "2026-06-19",
  endDate: "2026-08-08",
  timezone: "Africa/Accra",
  scheduleRules,
};

test("restores each following lesson to the next valid weekly slot instead of applying one delta", () => {
  const plan = buildFollowingScheduleRestorePlan({
    classId: klass.id,
    klass,
    sessions: damagedSessions(),
    anchorSessionId: "day-15",
  });

  assert.equal(plan.anchorLessonNumber, 16);
  assert.equal(plan.anchorStartsAt, "2026-07-18T08:00:00.000Z");
  assert.equal(plan.movedCount, 6);
  assert.equal(plan.createdCount, 0);

  const targetByDay = new Map(plan.followingItems.map((item) => [Number(item.group.day), item.targetStartsAt]));
  assert.equal(targetByDay.get(16), "2026-07-23T18:00:00.000Z");
  assert.equal(targetByDay.get(17), "2026-07-24T18:00:00.000Z");
  assert.equal(targetByDay.get(18), "2026-07-25T08:00:00.000Z");
  assert.equal(targetByDay.get(19), "2026-07-30T18:00:00.000Z");
  assert.equal(targetByDay.get(20), "2026-07-31T18:00:00.000Z");
  assert.equal(targetByDay.get(21), "2026-08-01T08:00:00.000Z");
  assert.equal(targetByDay.get(22), "2026-08-06T18:00:00.000Z");
  assert.equal(targetByDay.get(23), "2026-08-07T18:00:00.000Z");
  assert.equal(targetByDay.get(24), "2026-08-08T08:00:00.000Z");

  const movedDays = plan.restorableItems.map((item) => Number(item.group.day));
  assert.deepEqual(movedDays, [16, 18, 19, 21, 22, 24]);
});

test("rejects an anchor that is outside the saved timetable", () => {
  const sessions = damagedSessions();
  sessions[0] = sessionForDay(15, "2026-07-19T08:00:00.000Z");
  assert.throws(
    () => buildFollowingScheduleRestorePlan({
      classId: klass.id,
      klass,
      sessions,
      anchorSessionId: "day-15",
    }),
    /matches the saved timetable/i,
  );
});

test("does not move a completed following lesson", () => {
  const sessions = damagedSessions();
  const completedIndex = sessions.findIndex((session) => session.id === "day-18");
  sessions[completedIndex] = { ...sessions[completedIndex], status: "completed" };
  assert.throws(
    () => buildFollowingScheduleRestorePlan({
      classId: klass.id,
      klass,
      sessions,
      anchorSessionId: "day-15",
    }),
    /completed and cannot be moved/i,
  );
});
