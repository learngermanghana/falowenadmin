import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  runStudentLearningNudgeJob,
  _test: {
    buildNudgeMessage,
    cooldownAllowsSend,
    resolveAutomatedNudge,
    rowForNudge,
    studentIsEligible,
  },
} = require("../functions/studentLearningInterventionEmails.js");

const NOW = new Date("2026-09-26T12:00:00.000Z");

function student(overrides = {}) {
  return {
    id: "student-1",
    role: "student",
    status: "Active",
    paymentStatus: "Paid",
    email: "ama@example.com",
    name: "Ama Mensah",
    level: "A2",
    className: "A2 Accra",
    ...overrides,
  };
}

function snapshot(rows = []) {
  return {
    size: rows.length,
    docs: rows.map((row, index) => ({
      id: row.id || `doc-${index + 1}`,
      data: () => ({ ...row }),
    })),
  };
}

function fakeDb({ students = [], states = [] } = {}) {
  const writes = [];
  const collections = {
    students,
    studentLearningInterventionStates: states,
  };

  const db = {
    collection(name) {
      return {
        limit() {
          return {
            async get() {
              return snapshot(collections[name] || []);
            },
          };
        },
        doc(id) {
          return { collection: name, id };
        },
      };
    },
    batch() {
      return {
        set(ref, data, options) {
          writes.push({ ref, data, options });
        },
        async commit() {
          return undefined;
        },
      };
    },
  };

  return { db, writes };
}

const admin = {
  firestore: {
    Timestamp: {
      fromDate(date) {
        return new Date(date);
      },
    },
  },
};

test("failed work outranks inactivity, attendance and A1 finish nudges", () => {
  const nudge = resolveAutomatedNudge(student({
    level: "A1",
    latestScore: 48,
    lastActivityAt: "2026-09-18T12:00:00.000Z",
    attendanceRate: 62,
    completionPercent: 88,
  }), NOW);

  assert.equal(nudge.reason, "needs-improvement");
  assert.equal(nudge.cooldownDays, 7);
});

test("pending tutor review suppresses stale failure score", () => {
  const nudge = resolveAutomatedNudge(student({
    latestScore: 42,
    latestSubmissionStatus: "submitted",
    awaitingReview: 1,
    lastActivityAt: "2026-09-26T09:00:00.000Z",
  }), NOW);

  assert.equal(nudge, null);
});

test("inactivity starts at four days and resumes the exact synced route when present", () => {
  assert.equal(resolveAutomatedNudge(student({
    lastActivityAt: "2026-09-23T12:00:00.000Z",
  }), NOW), null);

  const nudge = resolveAutomatedNudge(student({
    lastActivityAt: "2026-09-21T12:00:00.000Z",
    lastRoute: "/campus/course/lesson/A2/6?chapter=3.6&view=hoeren&radio=done",
  }), NOW);

  assert.equal(nudge.reason, "inactive");
  assert.equal(
    nudge.actionUrl,
    "https://www.falowen.app/campus/course/lesson/A2/6?chapter=3.6&view=hoeren&radio=done",
  );
});

test("trial, blocked and archived students do not receive learning nudges", () => {
  assert.equal(studentIsEligible(student({ status: "pending" })), false);
  assert.equal(studentIsEligible(student({ status: "trial_expired" })), false);
  assert.equal(studentIsEligible(student({ status: "archived" })), false);
  assert.equal(studentIsEligible(student({ paymentStatus: "overdue" })), false);
});

test("cooldown prevents the same nudge from being sent every day", () => {
  const nudge = { reason: "inactive", cooldownDays: 7 };
  const recentState = {
    byReason: {
      inactive: {
        lastSentAt: new Date("2026-09-23T12:00:00.000Z"),
      },
    },
  };
  const oldState = {
    byReason: {
      inactive: {
        lastSentAt: new Date("2026-09-15T12:00:00.000Z"),
      },
    },
  };

  assert.equal(cooldownAllowsSend(recentState, nudge, NOW), false);
  assert.equal(cooldownAllowsSend(oldState, nudge, NOW), true);
  assert.equal(cooldownAllowsSend({}, nudge, NOW), true);
});

test("messages stay specific to the selected intervention", () => {
  const nudge = resolveAutomatedNudge(student({
    latestScore: 52,
    lastRoute: "/campus/course/lesson/A2/5?view=submit",
  }), NOW);
  const message = buildNudgeMessage({ student: student(), nudge });

  assert.match(message, /needs improvement/i);
  assert.match(message, /52%/);
  assert.match(message, /Review & retry|review the tutor feedback/i);
  assert.match(rowForNudge({ student: student(), nudge, now: NOW }).email_type, /learning_nudge_needs-improvement/);
});

test("daily job performs zero writes when nothing is due", async () => {
  const { db, writes } = fakeDb({
    students: [
      student({
        lastActivityAt: "2026-09-26T09:00:00.000Z",
        attendanceRate: 95,
        latestScore: 78,
        completionPercent: 35,
      }),
    ],
  });

  let fetchCalls = 0;
  const result = await runStudentLearningNudgeJob({
    admin,
    db,
    runtimeConfig: {
      communication: { announcement_webhook_url: "https://example.test/webhook" },
    },
    now: NOW,
    fetchImpl: async () => {
      fetchCalls += 1;
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });

  assert.equal(result.checked, 1);
  assert.equal(result.due, 0);
  assert.equal(result.sent, 0);
  assert.equal(result.writes, 0);
  assert.equal(writes.length, 0);
  assert.equal(fetchCalls, 0);
});

test("daily job writes cooldown state only after successful reminder delivery", async () => {
  const { db, writes } = fakeDb({
    students: [
      student({
        id: "inactive-student",
        email: "inactive@example.com",
        lastActivityAt: "2026-09-18T12:00:00.000Z",
      }),
      student({
        id: "failed-student",
        email: "failed@example.com",
        latestScore: 45,
      }),
    ],
  });

  let postedRows = [];
  const result = await runStudentLearningNudgeJob({
    admin,
    db,
    runtimeConfig: {
      learning_nudges: { max_sends: 1 },
      communication: { announcement_webhook_url: "https://example.test/webhook" },
    },
    now: NOW,
    fetchImpl: async (_url, options) => {
      postedRows = JSON.parse(options.body).rows;
      return { ok: true, json: async () => ({ ok: true, sent: postedRows.length }) };
    },
  });

  assert.equal(result.due, 1);
  assert.equal(result.sent, 1);
  assert.equal(result.writes, 1);
  assert.equal(postedRows.length, 1);
  assert.equal(postedRows[0].email, "failed@example.com");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].data.lastReason, "needs-improvement");
});

test("failed delivery does not write a sent cooldown marker", async () => {
  const { db, writes } = fakeDb({
    students: [
      student({
        id: "inactive-student",
        lastActivityAt: "2026-09-18T12:00:00.000Z",
      }),
    ],
  });

  await assert.rejects(
    runStudentLearningNudgeJob({
      admin,
      db,
      runtimeConfig: {
        communication: { announcement_webhook_url: "https://example.test/webhook" },
      },
      now: NOW,
      fetchImpl: async () => ({
        ok: false,
        status: 503,
        json: async () => ({ ok: false, error: "temporary outage" }),
      }),
    }),
    /temporary outage/,
  );

  assert.equal(writes.length, 0);
});
