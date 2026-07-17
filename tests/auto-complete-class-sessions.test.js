import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { _test } = require("../functions/autoCompleteClassSessions.js");

const session = (overrides = {}) => ({
  id: "session-1",
  classId: "class-1",
  status: "scheduled",
  startsAt: "2026-07-17T09:00:00.000Z",
  endsAt: "2026-07-17T10:00:00.000Z",
  ...overrides,
});

test("completes a scheduled session 30 minutes after it ends", () => {
  assert.equal(_test.findDueAutoCompletions({
    sessions: [session()],
    now: new Date("2026-07-17T10:29:59.000Z"),
  }).length, 0);

  const due = _test.findDueAutoCompletions({
    sessions: [session()],
    now: new Date("2026-07-17T10:30:00.000Z"),
  });
  assert.equal(due.length, 1);
  assert.equal(due[0].session.id, "session-1");
});

test("does not auto-complete cancelled, completed, superseded or held sessions", () => {
  const sessions = [
    session({ id: "cancelled", status: "cancelled" }),
    session({ id: "completed", status: "completed" }),
    session({ id: "superseded", status: "superseded" }),
    session({ id: "held", autoCompletionSuppressed: true }),
    session({ id: "alias", supersededBySessionId: "new-session" }),
  ];
  assert.deepEqual(_test.findDueAutoCompletions({
    sessions,
    now: new Date("2026-07-17T12:00:00.000Z"),
  }), []);
});

test("supports live and rescheduled sessions and derives a one-hour end when missing", () => {
  const due = _test.findDueAutoCompletions({
    sessions: [
      session({ id: "live", status: "live" }),
      session({
        id: "rescheduled",
        status: "rescheduled",
        startsAt: "2026-07-17T09:00:00.000Z",
        endsAt: null,
      }),
    ],
    now: new Date("2026-07-17T10:31:00.000Z"),
  });
  assert.deepEqual(due.map((item) => item.session.id), ["live", "rescheduled"]);
});

test("ignores very old backlog outside the configured lookback", () => {
  assert.equal(_test.findDueAutoCompletions({
    sessions: [session({ startsAt: "2026-06-01T09:00:00.000Z", endsAt: "2026-06-01T10:00:00.000Z" })],
    now: new Date("2026-07-17T12:00:00.000Z"),
    lookbackDays: 14,
  }).length, 0);
});
