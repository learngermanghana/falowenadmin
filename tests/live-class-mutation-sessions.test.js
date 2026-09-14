import test from "node:test";
import assert from "node:assert/strict";
import { loadMutationClassSessions } from "../src/utils/liveClassMutationSessions.js";
import { buildSessionReschedulePlan } from "../src/utils/liveClassReschedulePlan.js";

const klass = { id: "cohort-123", name: "Thursday Saturday class", slug: "thu-sat", levelId: "A1", scheduleRules: [{ dayOfWeek: 4, startTime: "19:00", durationMinutes: 60 }, { dayOfWeek: 6, startTime: "19:00", durationMinutes: 60 }] };
const rows = [
  { id: "thursday", curriculumDay: 0, curriculumIndex: 1, classId: klass.name, startsAt: "2026-09-10T19:00:00Z", endsAt: "2026-09-10T20:00:00Z" },
  { id: "saturday", curriculumDay: 1, curriculumIndex: 2, className: klass.name, startsAt: "2026-09-12T19:00:00Z", endsAt: "2026-09-12T20:00:00Z" },
  { id: "foreign", classId: klass.name, classRecordId: "another-cohort", startsAt: "2026-09-11T19:00:00Z", endsAt: "2026-09-11T20:00:00Z" },
];
const queryRows = async (field, identifier) => rows.filter((row) => row[field] === identifier);
const move = (sessions, date) => buildSessionReschedulePlan({
  klass, sessions, sessionId: "thursday", mode: "single",
  targetStartsAt: `${date}T19:00:00Z`, targetEndsAt: `${date}T20:00:00Z`,
});

test("legacy Thursday lesson can move to Friday while Saturday stays in place", async () => {
  const sessions = await loadMutationClassSessions(klass.id, klass, queryRows);
  assert.deepEqual(sessions.map((session) => session.id).sort(), ["saturday", "thursday"]);
  const plan = move(sessions, "2026-09-11");
  assert.equal(plan.affectedCount, 1);
  assert.equal(plan.changes[0].session.id, "thursday");
  assert.equal(plan.changes[0].startsAt, "2026-09-11T19:00:00.000Z");
  assert.equal(sessions.find((session) => session.id === "saturday").startsAt, rows[1].startsAt);
});

test("legacy neighbours still enforce curriculum order", async () => {
  const sessions = await loadMutationClassSessions(klass.id, klass, queryRows);
  assert.throws(() => move(sessions, "2026-09-13"), { code: "live-class/curriculum-order" });
});

test("records found through multiple identity fields are only included once", async () => {
  const canonical = { id: "canonical", classId: klass.id, classRecordId: klass.id };
  const sessions = await loadMutationClassSessions(klass.id, klass, async () => [canonical]);
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].id, "canonical");
});

test("a failed lookup rejects the mutation instead of using an incomplete timetable", async () => {
  await assert.rejects(loadMutationClassSessions(klass.id, klass, async (field, identifier) => {
    if (field === "className") throw new Error("Permission denied");
    return queryRows(field, identifier);
  }), /Permission denied/);
});

test("Berlin reschedule uses the same chronological A1 lesson identity shown in Live Classes", async () => {
  const berlin = { id: "berlin-2026", name: "A1 Berlin Klasse", slug: "a1-berlin", levelId: "A1" };
  const berlinRows = [
    { id: "tutorial", classRecordId: berlin.id, className: berlin.name, startsAt: "2026-09-02T11:00:00Z", endsAt: "2026-09-02T12:00:00Z", assignmentIds: ["A1-TUTORIAL"], curriculumDay: 0, topic: "Day 0: Orientation and Tutorial" },
    { id: "day1", classRecordId: berlin.id, className: berlin.name, startsAt: "2026-09-07T11:00:00Z", endsAt: "2026-09-07T12:00:00Z", assignmentIds: ["A1-0.1"], curriculumDay: 1, topic: "Day 1: Greetings and Asking About Well-being" },
    { id: "day2", classRecordId: berlin.id, className: berlin.name, startsAt: "2026-09-08T11:00:00Z", endsAt: "2026-09-08T12:00:00Z", assignmentIds: ["A1-0.2", "A1-1.1"], curriculumDay: 2, topic: "Day 2: German Alphabet + Personal Pronouns and Verb Conjugation" },
    { id: "day3", classRecordId: berlin.id, className: berlin.name, startsAt: "2026-09-09T11:00:00Z", endsAt: "2026-09-09T12:00:00Z", assignmentIds: ["A1-1.1-PRACTICE", "A1-1.2"], curriculumDay: 3, topic: "Day 3: Personal Information + Present-Tense Verb Conjugation Practice" },
    { id: "day4", classRecordId: berlin.id, className: berlin.name, startsAt: "2026-09-14T11:00:00Z", endsAt: "2026-09-14T12:00:00Z", assignmentIds: ["A1-2"], curriculumDay: 4, topic: "Day 4: Numbers, Phone Numbers and Addresses" },
    { id: "day5-stale", classRecordId: berlin.id, className: berlin.name, startsAt: "2026-09-15T11:00:00Z", endsAt: "2026-09-15T12:00:00Z", assignmentIds: ["A1-1.2"], curriculumDay: 3, curriculumIndex: 4, topic: "1.2. Present-Tense Verb Conjugation Practice" },
    { id: "day6", classRecordId: berlin.id, className: berlin.name, startsAt: "2026-09-21T11:00:00Z", endsAt: "2026-09-21T12:00:00Z", assignmentIds: ["A1-2.3"], curriculumDay: 6, topic: "Day 6" },
  ];
  const queryBerlin = async (field, identifier) => berlinRows.filter((row) => row[field] === identifier);
  const sessions = await loadMutationClassSessions(berlin.id, berlin, queryBerlin);
  const selected = sessions.find((item) => item.id === "day5-stale");

  assert.equal(selected.curriculumDay, 5);
  assert.deepEqual(selected.assignmentIds, ["A1-1.3"]);
  assert.match(selected.topic, /^Day 5:/);

  const plan = buildSessionReschedulePlan({
    klass: berlin,
    sessions,
    sessionId: "day5-stale",
    mode: "single",
    targetStartsAt: "2026-09-16T11:00:00Z",
    targetEndsAt: "2026-09-16T12:00:00Z",
  });
  assert.equal(plan.affectedCount, 1);
  assert.equal(plan.changes[0].session.id, "day5-stale");
  assert.equal(plan.changes[0].startsAt, "2026-09-16T11:00:00.000Z");
});
