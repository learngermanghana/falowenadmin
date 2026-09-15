const test = require("node:test");
const assert = require("node:assert/strict");
const {
  identifiersFor,
  belongsToSelectedClass,
  dedupeCompatibleSessions,
  sanitizeSession,
} = require("../functions/publicLiveClassApi.js");

test("public live-class API discovers canonical and legacy class identities", () => {
  const klass = {
    id: "Y4xjoaF5wK0RmDyIEvkY",
    name: "A2 Munich Klasse",
    className: "A2 Munich Klasse",
    slug: "a2-munich",
  };
  assert.deepEqual(
    identifiersFor(klass.id, klass),
    [klass.id, "A2 Munich Klasse", "a2-munich"],
  );

  const aliases = identifiersFor(klass.id, klass);
  assert.equal(belongsToSelectedClass({ classId: "A2 Munich Klasse" }, klass.id, aliases), true);
  assert.equal(belongsToSelectedClass({ classRecordId: klass.id, classId: "A2 Munich Klasse" }, klass.id, aliases), true);
  assert.equal(belongsToSelectedClass({ classRecordId: "another-cohort", classId: "A2 Munich Klasse" }, klass.id, aliases), false);
});

test("public live-class API prefers canonical/manual duplicates without dropping later lessons", () => {
  const classId = "Y4xjoaF5wK0RmDyIEvkY";
  const sameMoment = "2026-09-15T19:00:00.000Z";
  const rows = [
    {
      id: "legacy-day19",
      classId: "A2 Munich Klasse",
      startsAt: sameMoment,
      endsAt: "2026-09-15T20:30:00.000Z",
      assignmentIds: ["A2-7.19"],
      topic: "Einkaufen – wo und wie?",
    },
    {
      id: "canonical-day19",
      classId,
      classRecordId: classId,
      startsAt: sameMoment,
      endsAt: "2026-09-15T20:30:00.000Z",
      assignmentIds: ["A2-7.19"],
      topic: "Einkaufen – wo und wie?",
      status: "rescheduled",
      previousStartsAt: "2026-09-14T19:00:00.000Z",
    },
    {
      id: "day20",
      classId: "A2 Munich Klasse",
      startsAt: "2026-09-16T19:00:00.000Z",
      endsAt: "2026-09-16T20:30:00.000Z",
      assignmentIds: ["A2-7.20"],
      topic: "Reklamationssituationen",
    },
  ];
  const result = dedupeCompatibleSessions(rows, classId);
  assert.deepEqual(result.map((row) => row.id), ["canonical-day19", "day20"]);
});

test("canonical attendance metadata wins when public session is sanitized", () => {
  const session = sanitizeSession(
    {
      id: "session-19",
      startsAt: "2026-09-15T19:00:00.000Z",
      topic: "stale title",
      assignmentIds: ["A2-7.18"],
      curriculumDay: 18,
    },
    {
      title: "Einkaufen – wo und wie?",
      assignmentIds: ["A2-7.19"],
      curriculumDay: 19,
      startsAt: "2026-09-15T19:00:00.000Z",
    },
  );
  assert.equal(session.topic, "Einkaufen – wo und wie?");
  assert.deepEqual(session.assignmentIds, ["A2-7.19"]);
  assert.equal(session.curriculumDay, 19);
});
