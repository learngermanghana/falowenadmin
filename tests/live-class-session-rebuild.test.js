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

test("B1 rebuild anchors sequencing to real history and discards stale automatic orientations", () => {
  const b1 = { ...klass, id: "b1-accra", name: "B1 Accra", levelId: "B1", startDate: "2026-08-01", endDate: "2026-09-30" };
  const times = [
    "2026-08-06T19:00:00.000Z", "2026-08-08T07:00:00.000Z",
    "2026-08-13T19:00:00.000Z", "2026-08-15T07:00:00.000Z",
    "2026-08-15T08:00:00.000Z", "2026-08-22T07:00:00.000Z",
    "2026-08-27T19:00:00.000Z", "2026-08-29T07:00:00.000Z",
    "2026-09-03T19:00:00.000Z", "2026-09-05T07:00:00.000Z",
  ];
  const occurrences = times.map((startsAt, index) => ({
    id: `b1-slot-${index}`, classId: b1.id, startsAt, endsAt: startsAt, status: "scheduled",
  }));
  const automatic = (index, curriculumIndex = 1, topic = "Day 0: Einführung und Orientierung") => ({
    ...occurrences[index], status: "completed", completionSource: "automatic", autoCompletedAt: "2026-08-15T10:00:00.000Z",
    curriculumIndex, topic, assignmentIds: curriculumIndex === 1 ? ["B1-ORIENTATION"] : ["B1-STALE"],
  });
  const sessions = [
    automatic(0), automatic(1), automatic(2), automatic(3),
    automatic(4, 5, "Day 4: Wohnung suchen"),
    {
      ...occurrences[5], status: "completed", completionSource: "manual", completedBy: "admin-1",
      curriculumIndex: 2, topic: "Day 1: Traumwelten", assignmentIds: ["B1-1"],
    },
    ...occurrences.slice(6),
  ];
  const attendance = new Map([["b1-slot-5", { markedBy: "admin-1", students: { learner: { present: true } } }]]);
  const curriculumPatch = (level, index, session, { force }) => ({
    curriculumIndex: index + 1,
    ...((force || !session.topic) ? { topic: index === 0 ? "Day 0: Einführung und Orientierung" : `Day ${index}: lesson` } : {}),
    ...((force || !session.assignmentIds?.length) ? { assignmentIds: [index === 0 ? "B1-ORIENTATION" : `B1-${index}`] } : {}),
  });

  const first = buildRebuildClassSessionsPlan({
    klass: b1, occurrences, sessions, attendanceBySessionId: attendance, buildCurriculumPatch: curriculumPatch,
  });
  const rebuilt = buildFinalRebuildSessionList(first).sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));

  assert.deepEqual(first.deletions, []);
  assert.equal(rebuilt.filter((session) => session.curriculumIndex === 1).length, 1);
  assert.ok(rebuilt.slice(1, 5).every((session) => session.status === "scheduled"));
  assert.equal(rebuilt.find((session) => session.id === "b1-slot-5").topic, "Day 1: Traumwelten");
  assert.equal(rebuilt.find((session) => session.id === "b1-slot-5").status, "completed");
  assert.equal(attendance.get("b1-slot-5").students.learner.present, true);
  assert.deepEqual(rebuilt.map((session) => session.curriculumIndex), [1, 3, 4, 5, 6, 2, 7, 8, 9, 10]);

  const second = buildRebuildClassSessionsPlan({
    klass: b1, occurrences, sessions: rebuilt, attendanceBySessionId: attendance, buildCurriculumPatch: curriculumPatch,
  });
  const rebuiltAgain = buildFinalRebuildSessionList(second).sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
  assert.deepEqual(second.deletions, []);
  assert.deepEqual(rebuiltAgain.map((session) => [session.id, session.curriculumIndex]), rebuilt.map((session) => [session.id, session.curriculumIndex]));
});

test("rebuild retains missing timetable occurrences before a timestamp-backed historical anchor", () => {
  const occurrences = desiredOccurrences();
  const historical = {
    ...occurrences[1],
    status: "completed",
    curriculumIndex: 2,
    startsAt: { toDate: () => new Date(occurrences[1].startsAt), toMillis: () => Date.parse(occurrences[1].startsAt) },
  };

  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences,
    sessions: [historical],
    buildCurriculumPatch: (levelId, index) => ({ curriculumIndex: index + 1 }),
  });

  assert.equal(plan.upserts.length, occurrences.length);
  assert.equal(plan.upserts[0].occurrence.id, occurrences[0].id);
  assert.equal(plan.upserts[1].existing, historical);
});

test("protected unindexed orientation remains Day 0 when a later lesson anchors sequencing", () => {
  const occurrences = desiredOccurrences();
  const orientation = {
    ...occurrences[0],
    status: "completed",
    topic: "Day 0: Einführung und Orientierung",
    assignmentIds: ["A1-ORIENTATION"],
  };
  const lesson = { ...occurrences[1], status: "completed", curriculumIndex: 2, topic: "Day 1" };

  const plan = buildRebuildClassSessionsPlan({
    klass,
    occurrences,
    sessions: [orientation, lesson],
    buildCurriculumPatch: (levelId, index, session, { force }) => ({
      curriculumIndex: index + 1,
      ...((force || !session.topic) ? { topic: `Day ${index}` } : {}),
    }),
  });

  const orientationUpsert = plan.upserts.find(({ existing }) => existing?.id === orientation.id);
  assert.equal(orientationUpsert.patch.curriculumIndex, 1);
  assert.equal(orientationUpsert.patch.topic, undefined);
  assert.equal(buildFinalRebuildSessionList(plan).find(({ id }) => id === orientation.id).topic, orientation.topic);
  assert.equal(plan.upserts.find(({ existing }) => existing?.id === lesson.id).patch.curriculumIndex, 2);
});
