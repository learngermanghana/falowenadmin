import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { buildFollowingScheduleRestorePlan } from "../src/utils/liveClassFollowingScheduleRestore.js";

const groups = getCourseSessionGroups("A2");

function sessionForLesson(lessonNumber, startsAt, status = "scheduled") {
  const group = groups[lessonNumber - 1];
  return {
    id: `a2-munich-lesson-${lessonNumber}`,
    classId: "a2-munich",
    classRecordId: "a2-munich",
    className: "A2 Munich Klasse",
    status,
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 90 * 60 * 1000).toISOString(),
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    chapterIds: group.assignmentIds,
    curriculumIds: group.assignmentIds,
    assignment_id: group.assignmentIds[0],
    curriculumIndex: lessonNumber,
    curriculumDay: group.day,
    repairPreferredRecord: true,
  };
}

test("selected A2 anchor recreates missing future lessons instead of leaving list gaps", () => {
  const klass = {
    id: "a2-munich",
    name: "A2 Munich Klasse",
    levelId: "A2",
    startDate: "2026-08-10",
    endDate: "2026-10-30",
    timezone: "Africa/Accra",
    scheduleRules: [
      { day: "mon", startTime: "19:00", durationMinutes: 90 },
      { day: "wed", startTime: "19:00", durationMinutes: 90 },
      { day: "fri", startTime: "19:00", durationMinutes: 90 },
    ],
  };

  const sessions = [
    sessionForLesson(5, "2026-08-21T19:00:00.000Z", "completed"),
    sessionForLesson(6, "2026-08-24T19:00:00.000Z", "live"),
    // Lesson 7 is deliberately missing.
    sessionForLesson(8, "2026-08-31T19:00:00.000Z"),
    sessionForLesson(9, "2026-09-02T19:00:00.000Z"),
    sessionForLesson(10, "2026-09-04T19:00:00.000Z"),
    sessionForLesson(11, "2026-09-07T19:00:00.000Z"),
    sessionForLesson(12, "2026-09-09T19:00:00.000Z"),
    // Lesson 13 is deliberately missing.
    sessionForLesson(14, "2026-09-14T19:00:00.000Z", "completed"),
  ];

  const plan = buildFollowingScheduleRestorePlan({
    classId: klass.id,
    klass,
    sessions,
    anchorSessionId: "a2-munich-lesson-6",
  });

  assert.equal(plan.anchorLessonNumber, 6);
  assert.equal(plan.anchorStartsAt, "2026-08-24T19:00:00.000Z");

  const missingLessonNumbers = plan.restorableItems
    .filter((item) => !item.session)
    .map((item) => item.lessonNumber);

  assert.deepEqual(missingLessonNumbers, [7, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]);
  assert.equal(plan.createdCount, 16);

  const lesson7 = plan.followingItems.find((item) => item.lessonNumber === 7);
  assert.equal(lesson7?.targetStartsAt, "2026-08-26T19:00:00.000Z");
  assert.equal(lesson7?.session, null);

  const lesson13 = plan.followingItems.find((item) => item.lessonNumber === 13);
  assert.equal(lesson13?.session, null);
});
