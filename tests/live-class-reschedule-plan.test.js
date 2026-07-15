import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import {
  buildSessionReschedulePlan,
  intervalsOverlap,
} from "../src/utils/liveClassReschedulePlan.js";
import { inspectTimetableIntegrity } from "../src/utils/liveClassTimetableIntegrity.js";

const groups = getCourseSessionGroups("A1");

function session(day, startsAt, status = "scheduled") {
  const start = new Date(startsAt);
  const group = groups.find((item) => Number(item.day) === day);
  return {
    id: `day-${day}`,
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    curriculumDay: day,
    curriculumIndex: day + 1,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 60 * 60000).toISOString(),
    status,
  };
}

const klass = {
  id: "a1-test",
  levelId: "A1",
  startDate: "2026-06-19",
  endDate: "2026-08-14",
  timezone: "Africa/Accra",
};

const A1_MUNICH_DATES = [
  "2026-06-19T18:00:00.000Z",
  "2026-06-20T08:00:00.000Z",
  "2026-06-25T18:00:00.000Z",
  "2026-06-26T18:00:00.000Z",
  "2026-06-27T08:00:00.000Z",
  "2026-07-02T18:00:00.000Z",
  "2026-07-03T18:00:00.000Z",
  "2026-07-04T08:00:00.000Z",
  "2026-07-09T18:00:00.000Z",
  "2026-07-10T18:00:00.000Z",
  "2026-07-11T08:00:00.000Z",
  "2026-07-16T18:00:00.000Z",
  "2026-07-17T18:00:00.000Z",
  "2026-07-18T08:00:00.000Z",
  "2026-07-23T18:00:00.000Z",
  "2026-07-24T18:00:00.000Z",
  "2026-07-25T08:00:00.000Z",
  "2026-07-30T18:00:00.000Z",
  "2026-07-31T18:00:00.000Z",
  "2026-08-01T08:00:00.000Z",
  "2026-08-06T18:00:00.000Z",
  "2026-08-07T18:00:00.000Z",
  "2026-08-08T08:00:00.000Z",
  "2026-08-13T18:00:00.000Z",
  "2026-08-14T18:00:00.000Z",
];

test("interval overlap detects partial collisions, not only equal start times", () => {
  assert.equal(
    intervalsOverlap(
      "2026-07-18T18:30:00.000Z",
      "2026-07-18T19:30:00.000Z",
      "2026-07-18T18:00:00.000Z",
      "2026-07-18T19:00:00.000Z",
    ),
    true,
  );
  assert.equal(
    intervalsOverlap(
      "2026-07-18T19:00:00.000Z",
      "2026-07-18T20:00:00.000Z",
      "2026-07-18T18:00:00.000Z",
      "2026-07-18T19:00:00.000Z",
    ),
    false,
  );
});

test("single-session move is blocked when it overlaps another unfinished lesson", () => {
  const sessions = [
    session(0, "2026-06-19T18:00:00.000Z"),
    session(1, "2026-06-20T08:00:00.000Z"),
    session(2, "2026-06-25T18:00:00.000Z"),
  ];

  assert.throws(
    () => buildSessionReschedulePlan({
      klass,
      sessions,
      sessionId: "day-1",
      targetStartsAt: "2026-06-19T18:30:00.000Z",
      targetEndsAt: "2026-06-19T19:30:00.000Z",
      mode: "single",
    }),
    (error) => error?.code === "live-class/time-overlap" && /overlap/i.test(error.message),
  );
});

test("single-session move must remain between previous and next curriculum positions", () => {
  const sessions = [
    session(0, "2026-06-19T18:00:00.000Z"),
    session(1, "2026-06-20T08:00:00.000Z"),
    session(2, "2026-06-25T18:00:00.000Z"),
  ];

  assert.throws(
    () => buildSessionReschedulePlan({
      klass,
      sessions,
      sessionId: "day-1",
      targetStartsAt: "2026-06-26T18:00:00.000Z",
      targetEndsAt: "2026-06-26T19:00:00.000Z",
      mode: "single",
    }),
    (error) => error?.code === "live-class/curriculum-order" && /Move this and all following sessions/.test(error.message),
  );
});

test("completed predecessors do not block the next unfinished lesson from moving earlier", () => {
  const sessions = [
    session(11, "2026-07-16T18:00:00.000Z", "completed"),
    session(12, "2026-07-17T18:00:00.000Z", "completed"),
    session(13, "2026-07-18T08:00:00.000Z"),
    session(14, "2026-07-23T18:00:00.000Z"),
  ];

  const plan = buildSessionReschedulePlan({
    klass,
    sessions,
    sessionId: "day-13",
    targetStartsAt: "2026-07-16T08:00:00.000Z",
    targetEndsAt: "2026-07-16T09:00:00.000Z",
    mode: "single",
  });

  assert.equal(plan.affectedCount, 1);
  assert.equal(plan.changes[0].session.id, "day-13");
  assert.equal(plan.changes[0].startsAt, "2026-07-16T08:00:00.000Z");
});

test("Day 13 can reuse Day 11's exact time after Day 11 and Day 12 are completed", () => {
  const sessions = [
    session(11, "2026-07-16T18:00:00.000Z", "completed"),
    session(12, "2026-07-17T18:00:00.000Z", "completed"),
    session(13, "2026-07-18T08:00:00.000Z"),
    session(14, "2026-07-23T18:00:00.000Z"),
  ];

  const plan = buildSessionReschedulePlan({
    klass,
    sessions,
    sessionId: "day-13",
    targetStartsAt: "2026-07-16T18:00:00.000Z",
    targetEndsAt: "2026-07-16T19:00:00.000Z",
    mode: "single",
  });

  assert.equal(plan.affectedCount, 1);
  assert.equal(plan.releasedCompletedCount, 2);
  assert.deepEqual(
    plan.releasedCompletedSessions.map(({ session: item }) => item.id),
    ["day-11", "day-12"],
  );
  assert.equal(plan.changes[0].startsAt, "2026-07-16T18:00:00.000Z");
});

test("completed history still counts toward all 25 lessons without causing an active duplicate", () => {
  const sessions = A1_MUNICH_DATES.map((startsAt, day) => session(
    day,
    day === 13 ? "2026-07-16T18:00:00.000Z" : startsAt,
    day <= 12 ? "completed" : "scheduled",
  ));

  const report = inspectTimetableIntegrity({
    klass,
    sessions,
    requireCurriculum: true,
    enforceEndDate: true,
  });

  assert.equal(report.actualCount, 25);
  assert.equal(report.expectedCount, 25);
  assert.equal(report.healthy, true, JSON.stringify(report.issues, null, 2));
  assert.equal(report.issues.some((issue) => ["duplicate-time", "overlap", "curriculum-order"].includes(issue.code)), false);
});

test("an unfinished predecessor still blocks an invalid backward move", () => {
  const sessions = [
    session(11, "2026-07-16T18:00:00.000Z", "completed"),
    session(12, "2026-07-17T18:00:00.000Z", "scheduled"),
    session(13, "2026-07-18T08:00:00.000Z"),
    session(14, "2026-07-23T18:00:00.000Z"),
  ];

  assert.throws(
    () => buildSessionReschedulePlan({
      klass,
      sessions,
      sessionId: "day-13",
      targetStartsAt: "2026-07-16T08:00:00.000Z",
      targetEndsAt: "2026-07-16T09:00:00.000Z",
      mode: "single",
    }),
    (error) => error?.code === "live-class/curriculum-order"
      && /cannot move before unfinished/i.test(error.message)
      && /Mark earlier lessons complete first/i.test(error.message),
  );
});

test("following mode shifts the selected and every later curriculum session by the same amount", () => {
  const sessions = [
    session(0, "2026-06-19T18:00:00.000Z"),
    session(1, "2026-06-20T08:00:00.000Z"),
    session(2, "2026-06-25T18:00:00.000Z"),
    session(3, "2026-06-26T18:00:00.000Z", "cancelled"),
  ];

  const plan = buildSessionReschedulePlan({
    klass,
    sessions,
    sessionId: "day-1",
    targetStartsAt: "2026-06-21T08:00:00.000Z",
    targetEndsAt: "2026-06-21T09:00:00.000Z",
    mode: "following",
  });

  assert.equal(plan.mode, "following");
  assert.equal(plan.affectedCount, 3);
  assert.equal(plan.deltaMs, 24 * 60 * 60 * 1000);
  assert.equal(plan.recoveredFromPreviousStart, false);
  assert.deepEqual(
    plan.changes.map((change) => [change.session.id, change.startsAt, change.plannedStatus]),
    [
      ["day-1", "2026-06-21T08:00:00.000Z", "scheduled"],
      ["day-2", "2026-06-26T18:00:00.000Z", "scheduled"],
      ["day-3", "2026-06-27T18:00:00.000Z", "cancelled"],
    ],
  );
});

test("following mode repairs a legacy move that placed Day 20 on Day 21", () => {
  const day19 = session(19, "2026-07-13T19:00:00.000Z");
  const day20 = {
    ...session(20, "2026-07-15T19:00:00.000Z"),
    previousStartsAt: "2026-07-14T19:00:00.000Z",
    previousEndsAt: "2026-07-14T20:00:00.000Z",
  };
  const day21 = session(21, "2026-07-15T19:00:00.000Z");
  const day22 = session(22, "2026-07-16T19:00:00.000Z");

  const plan = buildSessionReschedulePlan({
    klass: {
      ...klass,
      lastRescheduledSessionId: day20.id,
      lastSessionChangePreviousStartsAt: day20.previousStartsAt,
      lastSessionChangePreviousEndsAt: day20.previousEndsAt,
    },
    sessions: [day19, day20, day21, day22],
    sessionId: day20.id,
    targetStartsAt: day20.startsAt,
    targetEndsAt: day20.endsAt,
    mode: "following",
  });

  assert.equal(plan.recoveredFromPreviousStart, true);
  assert.equal(plan.deltaMs, 24 * 60 * 60 * 1000);
  assert.deepEqual(
    plan.changes.map((change) => [change.session.id, change.startsAt]),
    [
      ["day-20", "2026-07-15T19:00:00.000Z"],
      ["day-21", "2026-07-16T19:00:00.000Z"],
      ["day-22", "2026-07-17T19:00:00.000Z"],
    ],
  );
});

test("following mode refuses to move completed or live lessons", () => {
  const sessions = [
    session(0, "2026-06-19T18:00:00.000Z"),
    session(1, "2026-06-20T08:00:00.000Z"),
    session(2, "2026-06-25T18:00:00.000Z", "completed"),
  ];

  assert.throws(
    () => buildSessionReschedulePlan({
      klass,
      sessions,
      sessionId: "day-1",
      targetStartsAt: "2026-06-21T08:00:00.000Z",
      targetEndsAt: "2026-06-21T09:00:00.000Z",
      mode: "following",
    }),
    (error) => error?.code === "live-class/locked-following-session" && /completed/.test(error.message),
  );
});
