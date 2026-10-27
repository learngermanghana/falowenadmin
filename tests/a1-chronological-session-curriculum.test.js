import test from "node:test";
import assert from "node:assert/strict";
import { enrichSessionsWithStableCurriculum } from "../src/utils/liveClassSessionDedupe.js";

const groups = [
  { key: "day:0", day: 0, index: 0, assignmentIds: ["A1-TUTORIAL"], topic: "Day 0: Orientation and Tutorial" },
  { key: "day:1", day: 1, index: 1, assignmentIds: ["A1-0.1"], topic: "Day 1: Greetings and Asking About Well-being" },
  { key: "day:2", day: 2, index: 2, assignmentIds: ["A1-0.2", "A1-1.1"], topic: "Day 2: German Alphabet + Personal Pronouns and Verb Conjugation" },
];

test("A1 stale later-day metadata cannot appear before Day 1 and Day 2", () => {
  const sessions = [
    {
      id: "orientation",
      startsAt: "2026-07-31T18:00:00.000Z",
      status: "completed",
      curriculumDay: 0,
      assignmentIds: ["A1-TUTORIAL"],
    },
    {
      id: "stale-day-20",
      startsAt: "2026-08-11T18:00:00.000Z",
      status: "scheduled",
      curriculumDay: 20,
      curriculumIndex: 21,
      assignmentIds: ["A1-12.3"],
      assignment_id: "A1-12.3",
      topic: "Day 20: Introduction to Letter Writing",
      previousStartsAt: "2026-10-01T18:00:00.000Z",
    },
    {
      id: "next",
      startsAt: "2026-08-12T18:00:00.000Z",
      status: "scheduled",
      curriculumDay: 2,
      assignmentIds: ["A1-0.2", "A1-1.1"],
    },
  ];

  const result = enrichSessionsWithStableCurriculum({}, sessions, groups);

  assert.equal(result[0].curriculumDay, 0);
  assert.equal(result[1].curriculumDay, 1);
  assert.equal(result[1].assignment_id, "A1-0.1");
  assert.match(result[1].topic, /^Day 1:/);
  assert.equal(result[2].curriculumDay, 2);
  assert.deepEqual(result[2].assignmentIds, ["A1-0.2", "A1-1.1"]);
  assert.match(result[2].topic, /^Day 2:/);
});
