import test from "node:test";
import assert from "node:assert/strict";
import {
  dedupeCompatibleSessions,
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
