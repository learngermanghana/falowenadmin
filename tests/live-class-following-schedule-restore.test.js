import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { buildFollowingScheduleRestorePlan } from "../src/utils/liveClassFollowingScheduleRestore.js";
import { buildOfficialLessonSchedulePlan } from "../src/utils/liveClassLessonOrder.js";

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

test("accepts the selected last live session as the anchor even when it was held outside the saved weekly slot", () => {
  const sessions = damagedSessions();
  sessions[0] = sessionForDay(15, "2026-07-19T08:00:00.000Z", "live");

  const plan = buildFollowingScheduleRestorePlan({
    classId: klass.id,
    klass,
    sessions,
    anchorSessionId: "day-15",
  });

  assert.equal(plan.anchorLessonNumber, 16);
  assert.equal(plan.anchorStartsAt, "2026-07-19T08:00:00.000Z");
  assert.ok(plan.followingItems.length > 0);
});

test("rebuilds later completed or live sessions instead of letting their status block the anchor restore", () => {
  const sessions = damagedSessions();
  const liveIndex = sessions.findIndex((session) => session.id === "day-17");
  const completedIndex = sessions.findIndex((session) => session.id === "day-18");
  sessions[liveIndex] = { ...sessions[liveIndex], status: "live" };
  sessions[completedIndex] = { ...sessions[completedIndex], status: "completed" };

  const plan = buildFollowingScheduleRestorePlan({
    classId: klass.id,
    klass,
    sessions,
    anchorSessionId: "day-15",
  });

  const restoredIds = new Set(plan.restorableItems.map((item) => item.session?.id));
  assert.equal(restoredIds.has("day-17"), true);
  assert.equal(restoredIds.has("day-18"), true);
});

test("plans colliding future duplicate and protected orphan records for atomic supersession", () => {
  const sessions = damagedSessions();
  const duplicate = {
    ...sessionForDay(16, "2026-07-23T18:00:00.000Z"),
    id: "duplicate-day-16",
  };
  const protectedOrphan = {
    id: "protected-orphan",
    classId: klass.id,
    classRecordId: klass.id,
    className: klass.name,
    status: "completed",
    startsAt: "2026-07-23T18:00:00.000Z",
    endsAt: "2026-07-23T19:00:00.000Z",
    topic: "Legacy manual session",
    students: { student1: { present: true } },
    attendanceCount: 1,
    manualDateOverride: true,
  };
  sessions.push(duplicate, protectedOrphan);

  const plan = buildFollowingScheduleRestorePlan({
    classId: klass.id,
    klass,
    sessions,
    anchorSessionId: "day-15",
  });

  const staleIds = new Set(plan.staleFutureRecords.map((item) => item.sessionId));
  assert.equal(staleIds.has("duplicate-day-16"), true);
  assert.equal(staleIds.has("protected-orphan"), true);
  assert.equal(plan.unresolvedCollisions, 0);
});

test("restore service supersedes stale future records in both session and attendance documents", async () => {
  const serviceSource = await readFile(
    new URL("../src/services/liveClassFollowingScheduleRestoreService.js", import.meta.url),
    "utf8",
  );
  assert.match(serviceSource, /plan\.staleFutureRecords\.forEach/);
  assert.match(serviceSource, /sessionStatus: "superseded"/);
  assert.match(serviceSource, /supersededRepairType: "anchor-following-collision"/);
  assert.match(serviceSource, /remindersSuppressed: true/);
});

test("persisted off-pattern admin anchor is null-safe in the official timetable planner", () => {
  const anchoredKlass = {
    ...klass,
    scheduleAnchorSessionNumber: 16,
    scheduleAnchorDay: 15,
    scheduleAnchorStartsAt: "2026-07-19T08:00:00.000Z",
    scheduleAnchorSource: "admin-selected-following-restore",
  };

  const plan = buildOfficialLessonSchedulePlan({
    classId: klass.id,
    klass: anchoredKlass,
    sessions: damagedSessions(),
  });

  assert.equal(plan.scheduleAnchor?.sessionNumber, 16);
  assert.equal(plan.scheduleAnchor?.startsAt, "2026-07-19T08:00:00.000Z");
  assert.equal(plan.scheduleAnchor?.source, "admin-selected-following-restore");
});
