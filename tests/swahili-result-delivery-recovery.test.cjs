const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const service = fs.readFileSync(path.join(__dirname, "../src/services/swahiliMarkingService.js"), "utf8");
const page = fs.readFileSync(path.join(__dirname, "../src/pages/SwahiliMarkingPage.jsx"), "utf8");
const workflow = fs.readFileSync(path.join(__dirname, "../.github/workflows/recover-swahili-delivery.yml"), "utf8");

function fixture({ sheetDelivery = "queued", emailDelivery = "queued", submissionSeconds = 10, reviewVersion = "10:0", status = "reviewed" } = {}) {
  const reviewPath = "swahiliTeacherReviews/uid";
  const lessonPath = "users/uid/swahiliLessons/day-1";
  const documents = new Map([
    [reviewPath, {
      studentId: "uid", lessonId: "swahili-day-1", program: "swahili",
      status, score: 80, feedback: "Good work.", submissionVersion: reviewVersion,
      sheetDelivery, emailDelivery, reviewedAt: "original-review",
    }],
    [lessonPath, {
      studentId: "uid", lessonId: "swahili-day-1", status: "submitted",
      submittedAt: { seconds: submissionSeconds, nanoseconds: 0 },
    }],
  ]);
  let writes = 0;
  const ctx = {
    db: {},
    swahiliReviewDocId: (uid, day) => Number(day) === 1 ? uid : `${uid}_day-${day}`,
    doc: (_db, ...pieces) => ({ path: pieces.join("/") }),
    serverTimestamp: () => "new-timestamp",
    canonicalSwahiliSubmission: (snapshot) => snapshot.data(),
    runTransaction: async (_db, fn) => fn({
      get: async (ref) => ({ data: () => documents.get(ref.path) }),
      update: (ref, fields) => {
        writes++;
        documents.set(ref.path, { ...documents.get(ref.path), ...fields });
      },
    }),
  };
  const code = service.replace(/^import .+\n/gm, "").replace(/^export /gm, "");
  vm.runInNewContext(code, ctx, { filename: "swahiliMarkingService.js" });
  return {
    retry: () => ctx.retryQueuedSwahiliDelivery({
      day: 1,
      submission: { studentId: "uid", path: lessonPath },
    }),
    current: () => documents.get(reviewPath),
    writes: () => writes,
  };
}

test("queued Swahili grade may retrigger existing score/email publisher without changing the marks", async () => {
  const state = fixture();
  await state.retry();
  assert.equal(state.writes(), 1);
  assert.equal(state.current().score, 80);
  assert.equal(state.current().status, "reviewed");
  assert.equal(state.current().feedback, "Good work.");
  assert.equal(state.current().reviewedAt, "new-timestamp");
  assert.equal(state.current().deliveryRetryRequestedAt, "new-timestamp");
});

test("never retry already delivered, in-progress, failed, or outdated Swahili grades", async () => {
  for (const options of [
    { sheetDelivery: "synced" },
    { emailDelivery: "sent" },
    { sheetDelivery: "pending" },
    { emailDelivery: "failed" },
    { submissionSeconds: 11 },
    { reviewVersion: "0:0" },
  ]) {
    const state = fixture(options);
    await assert.rejects(state.retry());
    assert.equal(state.writes(), 0);
  }
});

test("Swahili marking shows retry only for queued score and email receipts", () => {
  assert.match(page, /retryQueuedSwahiliDelivery/);
  assert.match(page, /currentReview\?\.sheetDelivery === "queued" && currentReview\?\.emailDelivery === "queued"/);
  assert.match(page, /type="button" disabled=\{retryingDelivery \|\| retryRequested \|\| saving\}/);
});

test("recovery workflow targets only the two existing worker deployments and shares their secrets", () => {
  assert.match(workflow, /on:\s*\n  push:/);
  assert.match(workflow, /group: falowenadmin-firebase-deploy/);
  assert.match(workflow, /secrets.FIREBASE_SERVICE_ACCOUNT_FALOWEN/);
  assert.match(workflow, /CLOUD_RUNTIME_CONFIG_B64/);
  assert.match(workflow, /ensureScoreWebhookSecrets\.mjs/);
  const targets = [...workflow.matchAll(/--only functions:falowenadmin:([a-zA-Z0-9]+)/g)].map(match => match[1]);
  assert.deepEqual(targets, ["syncAutomaticCourseScore", "publishSwahiliTutorResult"]);
  assert.doesNotMatch(workflow, /--only functions:falowenadmin:api/);
});
