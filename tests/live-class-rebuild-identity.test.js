import test from "node:test";
import assert from "node:assert/strict";
import { generateSessionOccurrences } from "../src/utils/liveClassScheduling.js";
import { canonicalRebuildClassPayload } from "../src/utils/liveClassRebuildIdentity.js";

test("canonical rebuild identity overrides legacy class identifiers from saved data", () => {
  const payload = canonicalRebuildClassPayload("firestore-class-id", {
    id: "legacy-id",
    classId: "A1 Munich Klasse",
    classRecordId: "legacy-record-id",
    name: "A1 Munich Klasse",
    levelId: "A1",
    startDate: "2026-06-27",
    endDate: "2026-08-28",
    timezone: "Africa/Accra",
    scheduleRules: [
      { day: "Thu", startTime: "18:00", durationMinutes: 60 },
      { day: "Fri", startTime: "18:00", durationMinutes: 60 },
      { day: "Sat", startTime: "08:00", durationMinutes: 60 },
    ],
  });

  assert.equal(payload.id, "firestore-class-id");
  assert.equal(payload.classId, "firestore-class-id");
  assert.equal(payload.classRecordId, "firestore-class-id");

  const occurrences = generateSessionOccurrences(payload);
  assert.equal(occurrences.length, 25);
  assert.ok(occurrences.every((session) => session.classId === "firestore-class-id"));
  assert.ok(occurrences.every((session) => session.id.startsWith("firestore-class-id_")));
});

test("canonical desired IDs match the IDs produced by the rebuild path", () => {
  const canonical = canonicalRebuildClassPayload("class-123", {
    classId: "old-class-name",
    levelId: "A1",
    startDate: "2026-06-27",
    endDate: "2026-08-28",
    timezone: "Africa/Accra",
    scheduleRules: [{ day: "Sat", startTime: "08:00", durationMinutes: 60 }],
  });

  const desiredIds = new Set(generateSessionOccurrences(canonical).map((session) => session.id));
  assert.ok([...desiredIds].every((id) => id.startsWith("class-123_")));
  assert.equal([...desiredIds].some((id) => id.startsWith("old-class-name_")), false);
});
