import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import {
  isArchivedStudent,
  isExpiredTrialStudent,
  isRetainedExpiredTrialStudent,
  isTrialOrUnpaidStudent,
  trialRecoveryPurgeAtMs,
} from "../src/utils/studentAttention.js";
import { matchesStudentDirectorySearch } from "../src/utils/studentDirectorySearch.js";

const require = createRequire(import.meta.url);
const { TRIAL_RETENTION_MS, trialPurgeAtMillis, expiredPendingReason } = require("../functions/pendingStudentCleanup.js");
const NOW = Date.parse("2026-10-17T12:00:00Z");
const EXPIRED_AT = Date.parse("2026-10-16T12:00:00Z");
const RETENTION_END = EXPIRED_AT + TRIAL_RETENTION_MS;

const retainedTrial = {
  id: "student-one",
  status: "inactive", // Legacy status aliases should not hide a recoverable trial.
  trialStatus: "expired",
  trialExpiredAt: new Date(EXPIRED_AT).toISOString(),
  trialPurgeAt: new Date(EXPIRED_AT + 24 * 60 * 60 * 1000).toISOString(), // Mistaken one-day purge.
  fullName: "Ama Sample",
  studentCode: "A2-123",
  paymentStatus: "pending",
  paid: 0,
};

test("expired trial stays in All and Trials & unpaid during the recovery window", () => {
  assert.equal(isExpiredTrialStudent(retainedTrial), true);
  assert.equal(isRetainedExpiredTrialStudent(retainedTrial, NOW), true);
  assert.equal(isArchivedStudent(retainedTrial, NOW), false);
  assert.equal(isTrialOrUnpaidStudent(retainedTrial, NOW), true);
  assert.equal(trialRecoveryPurgeAtMs(retainedTrial), RETENTION_END);
  assert.equal(isRetainedExpiredTrialStudent(retainedTrial, RETENTION_END), false);
  assert.equal(isArchivedStudent(retainedTrial, RETENTION_END), true);
});

test("staff can search a retained trial by legacy name, code and trial status", () => {
  assert.equal(matchesStudentDirectorySearch(retainedTrial, "ama sample"), true);
  assert.equal(matchesStudentDirectorySearch(retainedTrial, "A2-123"), true);
  assert.equal(matchesStudentDirectorySearch(retainedTrial, "expired"), true);
  assert.equal(matchesStudentDirectorySearch({ firstName: "Akua", lastName: "Mensah" }, "Akua Mensah"), true);
});

test("paid students are not presented as expired when old trial metadata remains", () => {
  assert.equal(isExpiredTrialStudent({ ...retainedTrial, paymentStatus: "Paid" }), false);
  assert.equal(isExpiredTrialStudent({ ...retainedTrial, paid: 800 }), false);
});

test("stale purge timestamps never allow less than 30 days of retention", () => {
  const candidate = {
    status: "trial_expired",
    trialStatus: "expired",
    paymentStatus: "pending",
    paid: 0,
    createdAt: new Date(EXPIRED_AT - 7 * 24 * 60 * 60 * 1000),
    trialExpiredAt: new Date(EXPIRED_AT),
    trialPurgeAt: new Date(EXPIRED_AT + 24 * 60 * 60 * 1000),
  };
  assert.equal(trialPurgeAtMillis(candidate), RETENTION_END);
  assert.equal(expiredPendingReason(candidate, NOW), "retention_window");
  assert.equal(expiredPendingReason(candidate, RETENTION_END), "purge_due");
});

test("directory exposes expired-trial view and global staff search", () => {
  const page = fs.readFileSync("src/pages/StudentDirectoryPage.jsx", "utf8");
  assert.match(page, /\["expired", "Expired trials"\]/);
  assert.match(page, /query\.trim\(\) \? students : viewStudents/);
  assert.match(page, /isRetainedExpiredTrialStudent\(student\)/);
});
