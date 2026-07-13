import test from "node:test";
import assert from "node:assert/strict";
import {
  dedupeCompatibleSessionRecords,
  enrichSessionsWithStableCurriculum,
} from "../src/utils/liveClassSessionDedupe.js";

test("same Ghana date lessons remain visible while exact duplicate aliases collapse", () => {
  const sessions = dedupeCompatibleSessionRecords([
    {
      id: "canonical-morning",
      classId: "class-123",
      status: "rescheduled",
      manualDateOverride: true,
      startsAt: "2026-07-09T06:00:00.000Z",
      assignmentIds: ["A1-1.3"],
    },
    {
      id: "legacy-morning-copy",
      classId: "A1 Munich Klasse",
      status: "scheduled",
      startsAt: "2026-07-09T06:00:00.000Z",
    },
    {
      id: "regular-evening",
      classId: "class-123",
      status: "scheduled",
      startsAt: "2026-07-09T18:00:00.000Z",
    },
  ], { classId: "class-123" });

  assert.deepEqual(sessions.map((session) => session.id), [
    "canonical-morning",
    "regular-evening",
  ]);
});

test("a complete rebuilt session set keeps every row and assigns each curriculum day once", () => {
  const groups = [
    { key: "day:0", index: 0, day: 0, assignmentIds: ["A1-Tutorial"], topic: "Day 0" },
    { key: "day:1", index: 1, day: 1, assignmentIds: ["A1-0.1"], topic: "Day 1" },
    { key: "day:2", index: 2, day: 2, assignmentIds: ["A1-0.2", "A1-1.1"], topic: "Day 2" },
  ];

  const sessions = enrichSessionsWithStableCurriculum({}, [
    {
      id: "slot-day-0",
      classId: "class-123",
      status: "scheduled",
      startsAt: "2026-07-04T06:00:00.000Z",
    },
    {
      id: "moved-day-1",
      classId: "class-123",
      status: "rescheduled",
      manualDateOverride: true,
      startsAt: "2026-07-09T06:00:00.000Z",
      assignmentIds: ["A1-0.1"],
      curriculumIndex: 2,
      curriculumDay: 1,
    },
    {
      id: "regular-same-date",
      classId: "class-123",
      status: "scheduled",
      startsAt: "2026-07-09T18:00:00.000Z",
    },
  ], groups);

  assert.equal(sessions.length, 3);
  assert.deepEqual(sessions.map((session) => session.id), [
    "slot-day-0",
    "moved-day-1",
    "regular-same-date",
  ]);
  assert.deepEqual(sessions.map((session) => session.topic), ["Day 0", "Day 1", "Day 2"]);
  assert.deepEqual(
    sessions.flatMap((session) => session.assignmentIds),
    ["A1-Tutorial", "A1-0.1", "A1-0.2", "A1-1.1"],
  );
});
