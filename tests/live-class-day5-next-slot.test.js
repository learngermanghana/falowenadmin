import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { buildFollowingScheduleRestorePlan } from "../src/utils/liveClassFollowingScheduleRestore.js";

const groups = getCourseSessionGroups("A1");

function sessionForDay(day, startsAt, extra = {}) {
  const group = groups.find((item) => Number(item.day) === day);
  return {
    id: `day-${day}`,
    classId: "a1-day5-repair",
    classRecordId: "a1-day5-repair",
    className: "A1 Day 5 Repair Klasse",
    status: "scheduled",
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString(),
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    chapterIds: group.assignmentIds,
    curriculumIds: group.assignmentIds,
    assignment_id: group.assignmentIds[0],
    curriculumDay: day,
    curriculumIndex: groups.indexOf(group) + 1,
    ...extra,
  };
}

test("selecting Day 5 on Monday 24 Aug rebuilds Day 6 to Tuesday 25 Aug", () => {
  const klass = {
    id: "a1-day5-repair",
    name: "A1 Day 5 Repair Klasse",
    levelId: "A1",
    startDate: "2026-08-10",
    endDate: "2026-10-07",
    timezone: "Africa/Accra",
    scheduleRules: [
      { day: "mon", startTime: "18:00", durationMinutes: 60 },
      { day: "tue", startTime: "18:00", durationMinutes: 60 },
      { day: "wed", startTime: "18:00", durationMinutes: 60 },
    ],
  };

  const day5 = sessionForDay(5, "2026-08-24T18:00:00.000Z", { repairPreferredRecord: true });
  const day6 = sessionForDay(6, "2026-08-31T18:00:00.000Z", { repairPreferredRecord: true });

  const plan = buildFollowingScheduleRestorePlan({
    classId: klass.id,
    klass,
    sessions: [day5, day6],
    anchorSessionId: day5.id,
  });

  assert.equal(plan.anchorSession.id, day5.id);
  assert.equal(plan.anchorStartsAt, "2026-08-24T18:00:00.000Z");
  const next = plan.followingItems.find((item) => Number(item.group.day) === 6);
  assert.equal(next?.session?.id, day6.id);
  assert.equal(next?.targetStartsAt, "2026-08-25T18:00:00.000Z");
  assert.equal(plan.restorableItems.some((item) => item.session?.id === day6.id), true);
});
