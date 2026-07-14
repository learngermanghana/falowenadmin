import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLessonDateRepairPlan,
  compareSessionsByLesson,
  sessionLessonNumber,
} from "../src/utils/liveClassLessonOrder.js";

const sessions = [
  {
    id: "slot-19",
    curriculumIndex: 19,
    topic: "Lesson 21: Ein Wochenende planen",
    assignmentIds: ["A2-8.21"],
    startsAt: "2026-07-13T19:00:00.000Z",
    endsAt: "2026-07-13T21:00:00.000Z",
    status: "scheduled",
  },
  {
    id: "slot-20",
    curriculumIndex: 20,
    topic: "Lesson 19: Einkaufen – wo und wie?",
    assignmentIds: ["A2-7.19"],
    startsAt: "2026-07-14T19:00:00.000Z",
    endsAt: "2026-07-14T21:00:00.000Z",
    status: "scheduled",
  },
  {
    id: "slot-21",
    curriculumIndex: 21,
    topic: "Lesson 20: Reklamationssituationen",
    assignmentIds: ["A2-7.20"],
    startsAt: "2026-07-21T19:00:00.000Z",
    endsAt: "2026-07-21T21:00:00.000Z",
    status: "scheduled",
  },
];

test("visible topic and assignment identity override stale generated indexes", () => {
  assert.equal(sessionLessonNumber(sessions[0]), 21);
  assert.equal(sessionLessonNumber(sessions[1]), 19);
  assert.equal(sessionLessonNumber(sessions[2]), 20);
});

test("sessions display in Lesson 19, Lesson 20, Lesson 21 order", () => {
  const ordered = [...sessions].sort(compareSessionsByLesson);
  assert.deepEqual(ordered.map(sessionLessonNumber), [19, 20, 21]);
});

test("repair plan assigns chronological slots to the correct lesson sequence", () => {
  const plan = buildLessonDateRepairPlan(sessions);
  assert.deepEqual(plan.map((item) => item.lessonNumber), [19, 20, 21]);
  assert.deepEqual(plan.map((item) => item.targetStartsAt), [
    "2026-07-13T19:00:00.000Z",
    "2026-07-14T19:00:00.000Z",
    "2026-07-21T19:00:00.000Z",
  ]);
  assert.equal(plan.find((item) => item.lessonNumber === 20)?.session.topic, "Lesson 20: Reklamationssituationen");
  assert.equal(plan.find((item) => item.lessonNumber === 20)?.targetStartsAt, "2026-07-14T19:00:00.000Z");
  assert.equal(plan.every((item) => item.changed), true);
});
