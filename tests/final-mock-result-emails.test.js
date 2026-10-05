import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  createFinalMockResultEmailTrigger,
  processFinalMockResultScore,
  _test,
} = require("../functions/finalMockResultEmails.js");

const {
  buildFinalMockAnnouncementRow,
  buildFinalMockResultMessage,
  isFinalMockScore,
  resolveAnnouncementConfig,
  upstreamEventId,
} = _test;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function score(overrides = {}) {
  return {
    source: "a1_final_mock",
    level: "A1",
    studentCode: "AMA123",
    studentName: "Ama Mensah",
    email: "Ama@example.com",
    assignment: "A1 Final Mock Exam",
    assignmentId: "A1-FINAL-MOCK",
    score: 78,
    finalScore: 78,
    passed: true,
    attempt: 1,
    firstAttempt: true,
    attemptLabel: "First readiness attempt",
    attemptType: "readiness",
    mockAttemptId: "attempt-a1-1",
    sectionScores: {
      lesen: 20,
      hoeren: 18,
      schreiben: 19,
      sprechen: 21,
    },
    strongestArea: "Sprechen",
    practiseNext: "Hören",
    ...overrides,
  };
}

function testAdmin() {
  return {
    firestore: {
      FieldValue: {
        serverTimestamp() {
          return new Date("2026-10-05T19:00:00.000Z");
        },
      },
    },
  };
}

function testDb({ existingSend = null } = {}) {
  const sendWrites = [];
  const historyWrites = [];
  const sendRef = {
    async set(payload) {
      sendWrites.push(payload);
    },
  };
  const historyRef = {
    async set(payload) {
      historyWrites.push(payload);
    },
  };

  return {
    sendWrites,
    historyWrites,
    db: {
      collection(name) {
        if (name === "finalMockResultEmailSends") {
          return { doc: () => sendRef };
        }
        if (name === "announcements") {
          return { doc: () => historyRef };
        }
        throw new Error(`Unexpected collection ${name}`);
      },
      async runTransaction(work) {
        return work({
          async get() {
            return existingSend
              ? { exists: true, data: () => existingSend }
              : { exists: false, data: () => ({}) };
          },
          set() {},
        });
      },
    },
  };
}

test("only A1 and A2 final mock scores enter the announcement flow", () => {
  assert.equal(isFinalMockScore(score()), true);
  assert.equal(isFinalMockScore(score({ source: "a2_final_mock", level: "A2" })), true);
  assert.equal(isFinalMockScore(score({ source: "falowen_admin_marking" })), false);
});

test("A1 result announcement includes overall and all four section scores", () => {
  const message = buildFinalMockResultMessage(score());

  assert.match(message, /A1 Final Mock Exam result is ready/);
  assert.match(message, /First readiness attempt/);
  assert.match(message, /Overall: 78\/100 — PASS/);
  assert.match(message, /Lesen: 20\/25/);
  assert.match(message, /Hören: 18\/25/);
  assert.match(message, /Schreiben: 19\/25/);
  assert.match(message, /Sprechen: 21\/25/);
  assert.match(message, /Strongest area: Sprechen/);
  assert.match(message, /Practise next: Hören/);
  assert.match(message, /does not issue a course certificate/i);
});

test("A2 practice attempt is labelled and targeted to one learner", () => {
  const row = buildFinalMockAnnouncementRow(score({
    source: "a2_final_mock",
    level: "A2",
    assignment: "A2 Final Mock Exam",
    assignmentId: "A2-FINAL-MOCK-PRACTICE-2",
    score: 64,
    finalScore: 64,
    passed: true,
    attempt: 2,
    firstAttempt: false,
    attemptLabel: "Practice attempt 2",
    attemptType: "practice",
    mockAttemptId: "attempt-a2-2",
    email: " LEARNER@EXAMPLE.COM ",
    sectionScores: { lesen: 15, hoeren: 14, schreiben: 17, sprechen: 18 },
  }), { scoreId: "score-a2-2", now: new Date("2026-10-05T19:00:00Z") });

  assert.equal(row.email, "learner@example.com");
  assert.equal(row.delivery_mode, "individual");
  assert.equal(row.allow_bcc_fallback, "FALSE");
  assert.equal(row.email_type, "final_mock_result");
  assert.equal(row.event_id, upstreamEventId("score-a2-2"));
  assert.equal(row.idempotency_key, upstreamEventId("score-a2-2"));
  assert.equal(row.cert_level, "A2");
  assert.equal(row.attempt_label, "Practice attempt 2");
  assert.equal(row.score, "64");
  assert.equal(row.lesen_score, "15");
  assert.equal(row.hoeren_score, "14");
  assert.equal(row.schreiben_score, "17");
  assert.equal(row.sprechen_score, "18");
  assert.equal(row.attach_certificate, "FALSE");
  assert.equal(row.button_label, "Open Falowen Results");
});

test("final mock result sends through the shared Announcement webhook and records Admin history", async () => {
  const { db, sendWrites, historyWrites } = testDb();
  let webhookPayload = null;

  const result = await processFinalMockResultScore({
    db,
    admin: testAdmin(),
    runtimeConfig: {
      communication: {
        announcement_webhook_url: "https://script.google.com/macros/s/announcement/exec",
        announcement_webhook_token: "shared-secret",
        announcement_sheet_name: "Announcements",
      },
    },
    scoreId: "a1-final-mock-AMA123-attempt-a1-1",
    score: score(),
    now: new Date("2026-10-05T19:00:00Z"),
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://script.google.com/macros/s/announcement/exec");
      webhookPayload = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        async json() {
          return { ok: true, count: 1 };
        },
      };
    },
  });

  assert.equal(result.sent, true);
  assert.equal(result.email, "ama@example.com");
  assert.equal(webhookPayload.token, "shared-secret");
  assert.equal(webhookPayload.sheet_name, "Announcements");
  assert.equal(webhookPayload.rows.length, 1);
  assert.equal(webhookPayload.rows[0].email_type, "final_mock_result");
  assert.equal(webhookPayload.event_id, webhookPayload.rows[0].event_id);
  assert.equal(webhookPayload.idempotency_key, webhookPayload.rows[0].idempotency_key);
  assert.equal(webhookPayload.event_id, upstreamEventId("a1-final-mock-AMA123-attempt-a1-1"));
  assert.equal(webhookPayload.rows[0].student_code, "AMA123");
  assert.equal(webhookPayload.rows[0].score, "78");

  assert.equal(sendWrites.at(-1).status, "sent");
  assert.equal(historyWrites[0].deliveryStatus, "processing");
  assert.equal(historyWrites.at(-1).deliveryStatus, "sent");
  assert.equal(historyWrites.at(-1).source, "final_mock_result");
});

test("dedupe state prevents the same completed attempt from emailing twice", async () => {
  const { db } = testDb({
    existingSend: {
      status: "sent",
      sentAt: new Date("2026-10-05T19:00:00Z"),
    },
  });
  let fetchCount = 0;

  const result = await processFinalMockResultScore({
    db,
    admin: testAdmin(),
    runtimeConfig: {
      communication: { announcement_webhook_url: "https://example.test/announcement" },
    },
    scoreId: "a1-final-mock-AMA123-attempt-a1-1",
    score: score(),
    fetchImpl: async () => {
      fetchCount += 1;
      throw new Error("must not send");
    },
  });

  assert.equal(result.sent, false);
  assert.equal(result.reason, "already_sent");
  assert.equal(fetchCount, 0);
});

test("ambiguous webhook failure is terminal and is not made retryable", async () => {
  const { db, sendWrites, historyWrites } = testDb();

  const result = await processFinalMockResultScore({
    db,
    admin: testAdmin(),
    runtimeConfig: {
      communication: { announcement_webhook_url: "https://example.test/announcement" },
    },
    scoreId: "a1-final-mock-AMA123-ambiguous",
    score: score({ mockAttemptId: "attempt-ambiguous" }),
    fetchImpl: async () => {
      const error = new Error("socket closed after upload");
      throw error;
    },
  });

  assert.equal(result.sent, false);
  assert.equal(result.reason, "delivery_uncertain");
  assert.equal(result.retryable, false);
  assert.equal(result.eventId, upstreamEventId("a1-final-mock-AMA123-ambiguous"));
  assert.equal(sendWrites.at(-1).status, "delivery_uncertain");
  assert.equal(historyWrites.at(-1).deliveryStatus, "delivery_uncertain");
});

test("delivery-uncertain reservation suppresses a later automatic retry", async () => {
  const { db } = testDb({
    existingSend: {
      status: "delivery_uncertain",
      deliveryUncertainAt: new Date("2026-10-05T19:00:00Z"),
    },
  });
  let fetchCount = 0;

  const result = await processFinalMockResultScore({
    db,
    admin: testAdmin(),
    runtimeConfig: {
      communication: { announcement_webhook_url: "https://example.test/announcement" },
    },
    scoreId: "a1-final-mock-AMA123-ambiguous",
    score: score(),
    fetchImpl: async () => {
      fetchCount += 1;
      return { ok: true, status: 200, async json() { return { ok: true }; } };
    },
  });

  assert.equal(result.sent, false);
  assert.equal(result.reason, "delivery_uncertain");
  assert.equal(fetchCount, 0);
});

test("missing webhook configuration stays retryable because delivery never started", async () => {
  const { db, sendWrites, historyWrites } = testDb();

  await assert.rejects(
    processFinalMockResultScore({
      db,
      admin: testAdmin(),
      runtimeConfig: {},
      scoreId: "a2-final-mock-missing-config",
      score: score({ source: "a2_final_mock", level: "A2" }),
    }),
    /webhook is not configured/i,
  );

  assert.equal(sendWrites.at(-1).status, "failed");
  assert.equal(historyWrites.at(-1).deliveryStatus, "failed");
});

test("non-mock score creation is ignored by the trigger", async () => {
  let registered = null;
  const trigger = createFinalMockResultEmailTrigger({
    db: { collection() {} },
    admin: testAdmin(),
    runtimeConfig: {},
    onDocumentCreated(options, handler) {
      registered = { options, handler };
      return "registered";
    },
  });

  assert.equal(trigger, "registered");
  assert.equal(registered.options.document, "scores/{scoreId}");
  assert.equal(registered.options.retry, false);

  const result = await registered.handler({
    params: { scoreId: "regular-score" },
    data: {
      exists: true,
      id: "regular-score",
      data: () => score({ source: "falowen_admin_marking" }),
    },
  });

  assert.equal(result.sent, false);
  assert.equal(result.reason, "not_final_mock");
});

test("Falowen Admin index exports the final mock result trigger", () => {
  const source = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");
  assert.match(source, /createFinalMockResultEmailTrigger/);
  assert.match(source, /exports\.sendFinalMockResultEmail/);
  assert.match(source, /onDocumentCreated/);
});

test("Firebase production workflow deploys and validates the final mock result worker", () => {
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/deploy-firebase.yml"), "utf8");
  const firebase = fs.readFileSync(path.join(root, "firebase.json"), "utf8");
  assert.match(workflow, /functions:falowenadmin:sendFinalMockResultEmail/);
  assert.match(workflow, /exports\.sendFinalMockResultEmail = createFinalMockResultEmailTrigger/);
  assert.match(firebase, /node --check functions\/finalMockResultEmails\.js/);
});

test("maintained Announcement Apps Script enforces event-level idempotency", () => {
  const script = fs.readFileSync(
    path.join(root, "docs/apps-script/announcement-idempotent-webhook.gs"),
    "utf8",
  );

  assert.match(script, /LockService\.getScriptLock/);
  assert.match(script, /body\.event_id/);
  assert.match(script, /idempotency_key/);
  assert.match(script, /announcementEventExists_/);
  assert.match(script, /duplicate: true/);
  assert.match(script, /event_id/);
});

test("final mock Firestore trigger keeps platform retries disabled until the deployed webhook is idempotent", () => {
  const source = fs.readFileSync(path.join(root, "functions/finalMockResultEmails.js"), "utf8");
  assert.match(source, /document: "scores\/\{scoreId\}"/);
  assert.match(source, /retry: false/);
});

test("final mock email reuses shared Announcement webhook configuration", () => {
  const config = resolveAnnouncementConfig({
    communication: {
      announcement_webhook_url: "https://example.test/webhook",
      announcement_webhook_token: "secret",
      announcement_sheet_name: "Announcements",
      announcement_sheet_gid: "123",
    },
  }, {});

  assert.equal(config.url, "https://example.test/webhook");
  assert.equal(config.token, "secret");
  assert.equal(config.sheetName, "Announcements");
  assert.equal(config.sheetGid, "123");
});
