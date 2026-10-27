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

const klass = {
  id: "a1-preview-persist",
  name: "A1 Preview Persist Klasse",
  levelId: "A1",
  startDate: "2026-06-19",
  endDate: "2026-08-15",
  timezone: "Africa/Accra",
  scheduleRules,
};

function sessionForDay(day, startsAt, extra = {}) {
  const group = groups.find((item) => Number(item.day) === day);
  return {
    id: `day-${day}`,
    classId: klass.id,
    classRecordId: klass.id,
    className: klass.name,
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

test("service reload keeps the preview session canonical so the visible record receives the rebuilt date", () => {
  const anchor = sessionForDay(15, "2026-07-18T08:00:00.000Z", {
    id: "anchor-day-15",
    repairPreferredRecord: true,
  });
  const visiblePreviewRecord = sessionForDay(16, "2026-07-19T08:00:00.000Z", {
    id: "visible-day-16",
    repairPreferredRecord: true,
  });
  const hiddenAttendedDuplicate = sessionForDay(16, "2026-07-23T18:00:00.000Z", {
    id: "hidden-attended-day-16",
    status: "completed",
    attendanceCount: 9,
    students: { student1: { present: true } },
    manualCompletion: true,
  });

  const plan = buildFollowingScheduleRestorePlan({
    classId: klass.id,
    klass,
    sessions: [anchor, visiblePreviewRecord, hiddenAttendedDuplicate],
    anchorSessionId: anchor.id,
  });

  const day16 = plan.followingItems.find((item) => Number(item.group.day) === 16);
  assert.equal(day16?.session?.id, visiblePreviewRecord.id);
  assert.equal(day16?.targetStartsAt, "2026-07-23T18:00:00.000Z");

  const restoredIds = new Set(plan.restorableItems.map((item) => item.session?.id));
  assert.equal(restoredIds.has(visiblePreviewRecord.id), true);

  const staleIds = new Set(plan.staleFutureRecords.map((item) => item.sessionId));
  assert.equal(staleIds.has(hiddenAttendedDuplicate.id), true);
});
