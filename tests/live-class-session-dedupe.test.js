import test from "node:test";
import assert from "node:assert/strict";
import {
  dedupeCompatibleSessionRecords,
  dedupeCompatibleSessions,
  enrichSessionsWithStableCurriculum,
  resolveSessionCourseGroup,
  suppressGeneratedDateDuplicates,
} from "../src/utils/liveClassSessionDedupe.js";
import { sessionDateInTimezone } from "../src/utils/liveClassScheduling.js";

test("manual rescheduled session suppresses generated scheduled session on the same Ghana date", () => {
  const sessions = suppressGeneratedDateDuplicates([
    { id: "day-12", status: "rescheduled", manualDateOverride: true, startsAt: "2026-07-09T06:00:00.000Z" },
    { id: "day-13", status: "scheduled", startsAt: "2026-07-09T17:00:00.000Z" },
    { id: "day-14", status: "scheduled", startsAt: "2026-07-10T18:00:00.000Z" },
  ], "Africa/Accra");

  assert.deepEqual(sessions.map((session) => session.id), ["day-12", "day-14"]);
});

test("manual duplicate suppression works when startsAt is a Firestore Timestamp-like value", () => {
  const sessions = suppressGeneratedDateDuplicates([
    { id: "day-12", status: "rescheduled", manualDateOverride: true, startsAt: { toDate: () => new Date("2026-07-09T06:00:00.000Z") } },
    { id: "day-13", status: "scheduled", startsAt: { toDate: () => new Date("2026-07-09T17:00:00.000Z") } },
    { id: "day-14", status: "scheduled", startsAt: { toDate: () => new Date("2026-07-10T18:00:00.000Z") } },
  ], "Africa/Accra");

  assert.equal(sessionDateInTimezone({ toDate: () => new Date("2026-07-09T17:00:00.000Z") }, "Africa/Accra"), "2026-07-09");
  assert.deepEqual(sessions.map((session) => session.id), ["day-12", "day-14"]);
});

test("normal generated same-date sessions collapse to one official class date", () => {
  const sessions = suppressGeneratedDateDuplicates([
    { id: "morning", status: "scheduled", startsAt: "2026-06-25T06:00:00.000Z" },
    { id: "evening", status: "scheduled", startsAt: "2026-06-25T18:00:00.000Z" },
  ], "Africa/Accra");

  assert.deepEqual(sessions.map((session) => session.id), ["morning"]);
});

test("different curriculum lessons sharing one timestamp both remain visible", () => {
  const sessions = dedupeCompatibleSessionRecords([
    {
      id: "day-11",
      classId: "a1-munich",
      status: "completed",
      startsAt: "2026-07-16T18:00:00.000Z",
      assignmentIds: ["A1-7"],
      curriculumDay: 11,
      curriculumIndex: 12,
      topic: "Day 11: The 12 Hour Clock",
    },
    {
      id: "day-13",
      classRecordId: "a1-munich",
      status: "scheduled",
      previousStartsAt: "2026-07-18T08:00:00.000Z",
      startsAt: "2026-07-16T18:00:00.000Z",
      assignmentIds: ["A1-3.5"],
      curriculumDay: 13,
      curriculumIndex: 14,
      topic: "Day 13: Numbers, Time and Prices Revision",
    },
  ], { classId: "a1-munich" });

  assert.deepEqual(sessions.map((session) => session.id).sort(), ["day-11", "day-13"]);
});

test("aliases for the same curriculum lesson at one timestamp still collapse", () => {
  const sessions = dedupeCompatibleSessionRecords([
    {
      id: "legacy-day-13",
      classId: "class-name",
      status: "scheduled",
      startsAt: "2026-07-16T18:00:00.000Z",
      assignmentIds: ["A1-3.5"],
      curriculumDay: 13,
    },
    {
      id: "official-day-13",
      classId: "a1-munich",
      status: "scheduled",
      previousStartsAt: "2026-07-18T08:00:00.000Z",
      startsAt: "2026-07-16T18:00:00.000Z",
      assignmentIds: ["A1-3.5"],
      curriculumDay: 13,
    },
  ], { classId: "a1-munich" });

  assert.deepEqual(sessions.map((session) => session.id), ["official-day-13"]);
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


test("manual rescheduled curriculum hides the generated original slot", () => {
  const groups = [
    { index: 10, day: 10, assignmentIds: ["A1-1.6"], topic: "Day 10" },
    { index: 11, day: 11, assignmentIds: ["A1-1.7"], topic: "Day 11" },
    { index: 12, day: 12, assignmentIds: ["A1-1.8"], topic: "Day 12" },
  ];

  const enriched = enrichSessionsWithStableCurriculum({}, [
    { id: "day-10", status: "scheduled", startsAt: "2026-07-09T18:00:00.000Z" },
    {
      id: "day-11",
      status: "rescheduled",
      manualDateOverride: true,
      startsAt: "2026-07-11T18:00:00.000Z",
      assignmentIds: ["A1-1.7"],
      curriculumIndex: 11,
      curriculumDay: 11,
    },
    { id: "generated-original-day-11", status: "scheduled", startsAt: "2026-07-30T18:00:00.000Z" },
    { id: "day-12", status: "scheduled", startsAt: "2026-07-31T18:00:00.000Z" },
  ], groups);

  assert.deepEqual(enriched.map((session) => session.id), ["day-10", "day-11", "day-12"]);
  assert.equal(enriched.find((session) => session.id === "day-11").topic, "Day 11");
});

test("normal scheduled sessions follow main source order even when old stored IDs are wrong", () => {
  const groups = [
    { index: 1, day: 1, assignmentIds: ["A1-0.1"], topic: "Day 1" },
    { index: 2, day: 2, assignmentIds: ["A1-0.2"], topic: "Day 2" },
    { index: 3, day: 3, assignmentIds: ["A1-0.3"], topic: "Day 3" },
    { index: 4, day: 4, assignmentIds: ["A1-0.4"], topic: "Day 4" },
  ];

  const enriched = enrichSessionsWithStableCurriculum({}, [
    { id: "slot-1", status: "scheduled", startsAt: "2026-07-01T18:00:00.000Z", assignmentIds: ["A1-0.1"] },
    { id: "slot-2", status: "scheduled", startsAt: "2026-07-02T18:00:00.000Z", assignmentIds: ["A1-0.4"], topic: "Wrong old Day 4" },
    { id: "slot-3", status: "scheduled", startsAt: "2026-07-03T18:00:00.000Z", assignmentIds: ["A1-0.2"] },
  ], groups);

  assert.equal(enriched[1].assignment_id, "A1-0.2");
  assert.equal(enriched[1].topic, "Day 2");
  assert.equal(enriched[2].assignment_id, "A1-0.3");
  assert.equal(enriched[2].topic, "Day 3");
});
