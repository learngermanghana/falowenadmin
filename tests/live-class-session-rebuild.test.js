import test from "node:test";
import assert from "node:assert/strict";
import { generateSessionOccurrences, getEffectiveClassEndDate, latestSessionDateInTimezone } from "../src/utils/liveClassScheduling.js";
import { buildFinalRebuildSessionList, buildRebuildClassSessionsPlan } from "../src/utils/liveClassSessionRebuildPlan.js";

const klass = {
  id: "class-a1",
  name: "A1 Test Class",
  levelId: "A1",
  startDate: "2026-06-12",
  endDate: "2026-06-24",
  timezone: "Africa/Accra",
  scheduleRules: [
    { day: "Mon", startTime: "18:00", durationMinutes: 120 },
    { day: "Tue", startTime: "18:00", durationMinutes: 120 },
    { day: "Wed", startTime: "18:00", durationMinutes: 120 },
  ],
};

function desiredOccurrences() {
  return generateSessionOccurrences({ classId: klass.id, ...klass });
}

test("rebuild occurrences start on first timetable day after 2026-06-12", () => {
  const occurrences = desiredOccurrences();
  assert.equal(occurrences[0].id, "class-a1_2026-06-15_1800");
  assert.equal(occurrences[0].startsAt, "2026-06-15T18:00:00.000Z");
});

test("rebuild plan removes stale scheduled sessions beginning 2026-06-29", () => {
  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences: desiredOccurrences(),
    sessions: [
      { id: "class-a1_2026-06-29_1800", classId: klass.id, startsAt: "2026-06-29T18:00:00.000Z", status: "scheduled" },
      { id: "class-a1_2026-06-30_1800", classId: klass.id, startsAt: "2026-06-30T18:00:00.000Z", status: "scheduled" },
      { id: "class-a1_2026-07-01_1800", classId: klass.id, startsAt: "2026-07-01T18:00:00.000Z", status: "scheduled" },
    ],
  });
  assert.deepEqual(plan.deletions.map((session) => session.id), [
    "class-a1_2026-06-29_1800",
    "class-a1_2026-06-30_1800",
    "class-a1_2026-07-01_1800",
  ]);
});

test("rebuild plan preserves completed stale sessions", () => {
  const completed = { id: "class-a1_2026-06-29_1800", classId: klass.id, startsAt: "2026-06-29T18:00:00.000Z", status: "completed" };
  const plan = buildRebuildClassSessionsPlan({ klass, occurrences: desiredOccurrences(), sessions: [completed] });
  assert.deepEqual(plan.deletions, []);
  assert.deepEqual(plan.preserved, [completed]);
});

test("rebuild plan preserves legacy rescheduled sessions even when status is scheduled", () => {
  const rescheduled = {
    id: "class-a1_2026-06-29_1800",
    classId: klass.id,
    startsAt: "2026-07-03T11:00:00.000Z",
    previousStartsAt: "2026-06-29T18:00:00.000Z",
    rescheduledAt: "2026-07-01T10:00:00.000Z",
    status: "scheduled",
  };
  const plan = buildRebuildClassSessionsPlan({ klass, occurrences: desiredOccurrences(), sessions: [rescheduled] });
  assert.deepEqual(plan.deletions, []);
  assert.deepEqual(plan.preserved, [rescheduled]);
});

test("rebuild plan does not overwrite a date changed from Attendance", () => {
  const occurrences = desiredOccurrences();
  const original = occurrences[0];
  const overridden = {
    ...original,
    startsAt: "2026-06-18T18:00:00.000Z",
    endsAt: "2026-06-18T20:00:00.000Z",
    manualDateOverride: true,
    manualDateOverrideBy: "admin-user",
    status: "scheduled",
  };

  const plan = buildRebuildClassSessionsPlan({ klass, occurrences, sessions: [overridden] });
  const upsert = plan.upserts.find((item) => item.occurrence.id === original.id);
  const rebuilt = { ...upsert.existing, ...upsert.patch };

  assert.equal(upsert.patch.startsAt, undefined);
  assert.equal(upsert.patch.endsAt, undefined);
  assert.equal(rebuilt.startsAt, overridden.startsAt);
  assert.equal(rebuilt.endsAt, overridden.endsAt);
});

test("rebuild plan preserves stale sessions that have attendance records", () => {
  const stale = { id: "class-a1_2026-06-29_1800", classId: klass.id, startsAt: "2026-06-29T18:00:00.000Z", status: "scheduled" };
  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences: desiredOccurrences(),
    sessions: [stale],
    attendanceBySessionId: new Map([[stale.id, { students: { student1: { present: true } } }]]),
  });
  assert.deepEqual(plan.deletions, []);
  assert.deepEqual(plan.preserved, [stale]);
});

test("rebuild deletes old pre-start sessions that only contain a roster template", () => {
  const corrected = {
    ...klass,
    startDate: "2026-06-27",
    endDate: "2026-07-31",
    scheduleRules: [
      { day: "Thu", startTime: "18:00", durationMinutes: 60 },
      { day: "Fri", startTime: "18:00", durationMinutes: 60 },
      { day: "Sat", startTime: "08:00", durationMinutes: 60 },
    ],
  };
  const occurrences = generateSessionOccurrences({ classId: corrected.id, ...corrected });
  const oldBeforeStart = {
    id: "class-a1_2026-06-25_0600",
    classId: corrected.id,
    startsAt: "2026-06-25T06:00:00.000Z",
    status: "scheduled",
    curriculumIndex: 1,
  };
  const plan = buildRebuildClassSessionsPlan({
    klass: corrected,
    occurrences,
    sessions: [oldBeforeStart],
    attendanceBySessionId: new Map([[oldBeforeStart.id, {
      students: {
        student1: { name: "Student One", present: false },
        student2: { name: "Student Two", present: false },
      },
    }]]),
  });

  assert.equal(occurrences[0].startsAt, "2026-06-27T08:00:00.000Z");
  assert.equal(plan.upserts[0].existing, undefined);
  assert.deepEqual(plan.deletions.map((session) => session.id), [oldBeforeStart.id]);
});


test("A1 Munich rebuild deletes stale pre-start roster templates and starts Day 0 on first generated occurrence", () => {
  const munich = {
    id: "a1-munich",
    name: "A1 Munich Klasse",
    levelId: "A1",
    startDate: "2026-06-27",
    endDate: "2026-07-31",
    timezone: "Africa/Accra",
    historical: false,
    scheduleRules: [
      { day: "Thu", startTime: "18:00", durationMinutes: 60 },
      { day: "Fri", startTime: "18:00", durationMinutes: 60 },
      { day: "Sat", startTime: "08:00", durationMinutes: 60 },
    ],
  };
  const staleSessions = [
    { id: "a1-munich_2026-06-25_0600", startsAt: "2026-06-25T06:00:00.000Z", status: "scheduled", curriculumIndex: 1 },
    { id: "a1-munich_2026-06-26_0600", startsAt: "2026-06-26T06:00:00.000Z", status: "scheduled", curriculumIndex: 2 },
  ];
  const occurrences = generateSessionOccurrences({ classId: munich.id, ...munich });
  const plan = buildRebuildClassSessionsPlan({
    klass: munich,
    occurrences,
    sessions: staleSessions,
    attendanceBySessionId: new Map(staleSessions.map((session) => [session.id, {
      students: {
        s1: { name: "Student One", present: false },
        s2: { name: "Student Two", present: false },
      },
    }])),
    buildCurriculumPatch: (levelId, index) => ({ curriculumIndex: index + 1, topic: `Day ${index}` }),
  });
  const finalSessions = buildFinalRebuildSessionList(plan);

  assert.equal(occurrences[0].id, "a1-munich_2026-06-27_0800");
  assert.equal(occurrences[0].startsAt, "2026-06-27T08:00:00.000Z");
  assert.deepEqual(plan.deletions.map((session) => session.id), staleSessions.map((session) => session.id));
  assert.equal(plan.upserts[0].existing, undefined);
  assert.equal(plan.upserts[0].patch.curriculumIndex, 1);
  assert.equal(plan.upserts[0].patch.topic, "Day 0");
  assert.equal(finalSessions.some((session) => String(session.startsAt).slice(0, 10) < munich.startDate), false);
});

test("A1 Munich rebuild preserves real pre-start attendance without shifting generated Day 0", () => {
  const munich = {
    id: "a1-munich",
    name: "A1 Munich Klasse",
    levelId: "A1",
    startDate: "2026-06-27",
    endDate: "2026-07-31",
    timezone: "Africa/Accra",
    historical: false,
    scheduleRules: [
      { day: "Thu", startTime: "18:00", durationMinutes: 60 },
      { day: "Fri", startTime: "18:00", durationMinutes: 60 },
      { day: "Sat", startTime: "08:00", durationMinutes: 60 },
    ],
  };
  const protectedStale = { id: "a1-munich_2026-06-25_0600", startsAt: "2026-06-25T06:00:00.000Z", status: "scheduled", curriculumIndex: 15 };
  const occurrences = generateSessionOccurrences({ classId: munich.id, ...munich });
  const plan = buildRebuildClassSessionsPlan({
    klass: munich,
    occurrences,
    sessions: [protectedStale],
    attendanceBySessionId: new Map([[protectedStale.id, { students: { s1: { name: "Student One", present: true } } }]]),
    buildCurriculumPatch: (levelId, index) => ({ curriculumIndex: index + 1, topic: `Day ${index}` }),
  });

  assert.deepEqual(plan.deletions, []);
  assert.deepEqual(plan.preserved, [protectedStale]);
  assert.equal(plan.upserts[0].existing, undefined);
  assert.equal(plan.upserts[0].occurrence.startsAt, "2026-06-27T08:00:00.000Z");
  assert.equal(plan.upserts[0].patch.curriculumIndex, 1);
  assert.equal(plan.upserts[0].patch.topic, "Day 0");
});

test("latest session date helper derives synced class end date from sessions", () => {
  const sessions = [
    { startsAt: "2026-06-29T18:00:00.000Z", status: "scheduled" },
    { startsAt: "2026-07-01T18:00:00.000Z", status: "scheduled" },
    { startsAt: "2026-07-08T18:00:00.000Z", status: "cancelled" },
  ];

  assert.equal(latestSessionDateInTimezone(sessions, "Africa/Accra"), "2026-07-01");
});

test("final rebuild session list includes preserved sessions when deriving end date", () => {
  const preserved = { id: "class-a1_2026-07-10_1800", classId: klass.id, startsAt: "2026-07-10T18:00:00.000Z", status: "completed" };
  const plan = buildRebuildClassSessionsPlan({ klass, occurrences: desiredOccurrences(), sessions: [preserved] });
  const finalSessions = buildFinalRebuildSessionList(plan);

  assert.equal(latestSessionDateInTimezone(desiredOccurrences(), "Africa/Accra"), "2026-06-24");
  assert.equal(latestSessionDateInTimezone(finalSessions, "Africa/Accra"), "2026-07-10");
});

test("effective class end date keeps a later manual graduation date over an older session-derived date", () => {
  assert.equal(
    getEffectiveClassEndDate({ endDate: "2026-07-29", sessionDerivedEndDate: "2026-07-28" }),
    "2026-07-29",
  );
});

test("effective class end date uses sessions when sessions extend past the saved class date", () => {
  assert.equal(
    getEffectiveClassEndDate(
      { endDate: "2026-07-28", timezone: "Africa/Accra" },
      [{ startsAt: "2026-07-29T18:00:00.000Z", status: "scheduled" }],
    ),
    "2026-07-29",
  );
});

test("repeated rebuild plans upsert existing desired sessions without duplicates", () => {
  const occurrences = desiredOccurrences();
  const sessions = occurrences.map((occurrence) => ({ ...occurrence, classId: klass.id }));
  const plan = buildRebuildClassSessionsPlan({ klass, occurrences, sessions });
  assert.equal(plan.deletions.length, 0);
  assert.equal(plan.upserts.length, occurrences.length);
  assert.equal(new Set(plan.upserts.map((item) => item.occurrence.id)).size, occurrences.length);
  assert.ok(plan.upserts.every((item) => item.existing));
});
