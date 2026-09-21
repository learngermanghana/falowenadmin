import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  TRIAL_DURATION_MS,
  TRIAL_RETENTION_MS,
  expiredPendingReason,
  hasQualifyingPayment,
  isExpiredPendingStudent,
  pendingStartedAtMillis,
  syncTrialStatusToSheet,
} = require("../functions/pendingStudentCleanup.js");

const NOW = Date.UTC(2026, 8, 8, 12, 0, 0);

function pendingStudent(overrides = {}) {
  return {
    id: "student-1",
    role: "student",
    status: "pending",
    paymentStatus: "pending",
    paid: 0,
    createdAt: new Date(NOW - TRIAL_DURATION_MS),
    ...overrides,
  };
}

test("pending student remains eligible during the seven-day trial", () => {
  const student = pendingStudent({ createdAt: new Date(NOW - TRIAL_DURATION_MS + 60_000) });
  assert.equal(expiredPendingReason(student, NOW), "trial_active");
  assert.equal(isExpiredPendingStudent(student, NOW), false);
});

test("unpaid pending student is blocked at seven days but not purged", () => {
  const student = pendingStudent();
  assert.equal(expiredPendingReason(student, NOW), "needs_block");
  assert.equal(isExpiredPendingStudent(student, NOW), false);
});

test("trial-expired student stays recoverable during the 30-day retention window", () => {
  const student = pendingStudent({
    status: "trial_expired",
    createdAt: new Date(NOW - TRIAL_DURATION_MS - 15 * 24 * 60 * 60 * 1000),
  });
  assert.equal(expiredPendingReason(student, NOW), "retention_window");
  assert.equal(isExpiredPendingStudent(student, NOW), false);
});

test("trial-expired student is purge-eligible after seven days plus 30-day retention", () => {
  const student = pendingStudent({
    status: "trial_expired",
    createdAt: new Date(NOW - TRIAL_DURATION_MS - TRIAL_RETENTION_MS),
  });
  assert.equal(expiredPendingReason(student, NOW), "purge_due");
  assert.equal(isExpiredPendingStudent(student, NOW), true);
});

test("paid pending student is never selected for deletion", () => {
  const student = pendingStudent({ paymentStatus: "Paid", paid: 2800 });
  assert.equal(hasQualifyingPayment(student), true);
  assert.equal(expiredPendingReason(student, NOW), "has_payment");
  assert.equal(isExpiredPendingStudent(student, NOW), false);
});

test("partially paid pending student is never selected for deletion", () => {
  const student = pendingStudent({ paymentStatus: "Partially Paid", paid: 300 });
  assert.equal(hasQualifyingPayment(student), true);
  assert.equal(isExpiredPendingStudent(student, NOW), false);
});

test("positive paid amount protects student even if payment status has not synced", () => {
  const student = pendingStudent({ paymentStatus: "pending", amountPaid: "15.00" });
  assert.equal(hasQualifyingPayment(student), true);
  assert.equal(isExpiredPendingStudent(student, NOW), false);
});

test("missing registration date is skipped rather than guessed", () => {
  const student = pendingStudent({
    createdAt: null,
    registrationDate: null,
    registeredAt: null,
    trialStartedAt: null,
  });
  assert.equal(pendingStartedAtMillis(student), 0);
  assert.equal(expiredPendingReason(student, NOW), "missing_start_date");
  assert.equal(isExpiredPendingStudent(student, NOW), false);
});

test("only pending enrollment status can be deleted by this cleanup", () => {
  assert.equal(isExpiredPendingStudent(pendingStudent({ status: "active" }), NOW), false);
  assert.equal(isExpiredPendingStudent(pendingStudent({ status: "inactive" }), NOW), false);
  assert.equal(isExpiredPendingStudent(pendingStudent({ status: "Paid" }), NOW), false);
});


test("trial expiry sync posts the retained status to the Apps Script webhook", async () => {
  const originalFetch = globalThis.fetch;
  let captured = null;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return {
      ok: true,
      json: async () => ({ ok: true, updatedStudents: 1 }),
    };
  };

  try {
    const result = await syncTrialStatusToSheet({
      appsScriptUrl: "https://script.google.com/macros/s/test/exec",
      syncSecret: "private-secret",
      studentId: "student-1",
      studentCode: "ABC123",
      email: "student@example.com",
      trialExpiredAt: "2026-09-21T12:00:00.000Z",
      trialPurgeAt: "2026-10-21T12:00:00.000Z",
    });

    assert.equal(result.success, true);
    assert.equal(captured.url, "https://script.google.com/macros/s/test/exec");
    const body = JSON.parse(captured.options.body);
    assert.equal(body.action, "syncStudentTrialStatus");
    assert.equal(body.studentCode, "ABC123");
    assert.equal(body.secret, "private-secret");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
