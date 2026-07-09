import test from "node:test";
import assert from "node:assert/strict";
import {
  dedupeCompatibleSessions,
  enrichSessionsWithStableCurriculum,
  resolveSessionCourseGroup,
  suppressGeneratedDateDuplicates,
} from "../src/utils/liveClassSessionDedupe.js";

test("manual rescheduled session suppresses generated scheduled session on the same Ghana date", () => {
  const sessions = suppressGeneratedDateDuplicates([
    { id: "day-12", status: "rescheduled", manualDateOverride: true, startsAt: "2026-07-09T06:00:00.000Z" },
    { id: "day-13", status: "scheduled", startsAt: "2026-07-09T17:00:00.000Z" },
    { id: "day-14", status: "scheduled", startsAt: "2026-07-10T18:00:00.000Z" },
  ], "Africa/Accra");

  assert.deepEqual(sessions.map((session) => session.id), ["day-12", "day-14"]);
});

test("normal generated same-date sessions stay visible when no manual reschedule exists", () => {
  const sessions = suppressGeneratedDateDuplicates([
    { id: "morning", status: "scheduled", startsAt: "2026-06-25T06:00:00.000Z" },
    { id: "evening", status: "scheduled", startsAt: "2026-06-25T18:00:00.000Z" },
  ], "Africa/Accra");

  assert.deepEqual(sessions.map((session) => session.id), ["morning", "evening"]);
});

test("date duplicate suppression runs after exact-time dedupe and keeps preferred manual session", () => {
  const sessions = dedupeCompatibleSessions([
    { id: "legacy-copy", classId: "class-name", status: "scheduled", startsAt: "2026-07-09T06:00:00.000Z" },
    { id: "day-12", classId: "class-id", status: "rescheduled", previousStartsAt: "2026-07-04T08:00:00.000Z", startsAt: "2026-07-09T06:00:00.000Z" },
    { id: "day-13", classId: "class-id", status: "scheduled", startsAt: "2026-07-09T17:00:00.000Z" },
  ], { classId: "class-id", timezone: "Africa/Accra" });

  assert.deepEqual(sessions.map((session) => session.id), ["day-12"]);
});

test("rescheduled session keeps the selected curriculum instead of taking the next row", () => {
  const groups = [
    { index: 1, day: 1, assignmentIds: ["A1-0.1"], topic: "Day 1" },
    { index: 2, day: 2, assignmentIds: ["A1-0.2"], topic: "Day 2" },
    { index: 3, day: 3, assignmentIds: ["A1-0.3"], topic: "Day 3" },
    { index: 4, day: 4, assignmentIds: ["A1-0.4"], topic: "Day 4" },
  ];

  const selected = {
    id: "day-3",
    status: "rescheduled",
    manualDateOverride: true,
    startsAt: "2026-07-09T18:00:00.000Z",
    assignmentIds: ["A1-0.3"],
    chapterIds: ["A1-0.3"],
    curriculumIndex: 3,
  };

  const group = resolveSessionCourseGroup(selected, groups, 3);
  assert.equal(group.topic, "Day 3");

  const enriched = enrichSessionsWithStableCurriculum({}, [
    { id: "day-1", startsAt: "2026-07-01T18:00:00.000Z" },
    { id: "day-2", startsAt: "2026-07-02T18:00:00.000Z" },
    selected,
    { id: "day-4", startsAt: "2026-07-10T18:00:00.000Z" },
  ], groups);

  const moved = enriched.find((session) => session.id === "day-3");
  assert.equal(moved.assignment_id, "A1-0.3");
  assert.equal(moved.topic, "Day 3");
  assert.equal(moved.curriculumIndex, 3);
});
