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
  assert.deepEqual(sessions, [canonical]);
});

test("a failed lookup rejects the mutation instead of using an incomplete timetable", async () => {
  await assert.rejects(loadMutationClassSessions(klass.id, klass, async (field, identifier) => {
    if (field === "className") throw new Error("Permission denied");
    return queryRows(field, identifier);
  }), /Permission denied/);
});
