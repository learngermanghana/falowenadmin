import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { enrichSessionsWithStableCurriculum, recoverA1MissingGreetings } from "../src/utils/liveClassSessionDedupe.js";

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

test("A1 missing Greetings and duplicated final day are repaired in the existing session slots", () => {
  const groups = getCourseSessionGroups("A1");
  const sessions = [groups[0], ...groups.slice(2), groups.at(-1)].map((group, index) => ({
    id: `slot-${index}`,
    status: index === 0 ? "completed" : "scheduled",
    startsAt: new Date(Date.UTC(2026, 10, 11 + index)).toISOString(),
    curriculumDay: group.day,
    assignmentIds: group.assignmentIds,
    manualDateOverride: index > 0,
  }));
  const repaired = recoverA1MissingGreetings(sessions, groups);
  assert.equal(repaired[0], sessions[0]);
  assert.deepEqual(repaired.map((session) => session.curriculumDay), groups.map((group) => group.day));
  assert.deepEqual(repaired.map((session) => session.startsAt), sessions.map((session) => session.startsAt));
  assert.deepEqual(repaired[1].assignmentIds, ["A1-0.1"]);
  assert.equal(recoverA1MissingGreetings(repaired, groups), null);
  const taught = sessions.map((session, index) => index === 1 ? { ...session, status: "completed" } : session);
  assert.equal(recoverA1MissingGreetings(taught, groups), null);
});
