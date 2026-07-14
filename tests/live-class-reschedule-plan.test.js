import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import {
  buildSessionReschedulePlan,
  intervalsOverlap,
} from "../src/utils/liveClassReschedulePlan.js";

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

test("single-session move is blocked when it overlaps another lesson", () => {
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
