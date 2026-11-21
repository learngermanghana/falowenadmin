import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  planPendingPaymentRecheck,
  PENDING_PAYMENT_MIN_AGE_MS,
} from "../src/utils/pendingPaymentRecheck.js";

const createdAt = "2026-11-21T09:00:00.000Z";
const origin = Date.parse(createdAt);
const pending = { reference: "PS-123", status: "pending", createdAt };

test("fresh pending payment gets a one-shot 90-second timer, not immediate verification", () => {
  const plan = planPendingPaymentRecheck([pending], new Set(), origin);
  assert.deepEqual(plan.dueReferences, []);
  assert.equal(plan.nextDelayMs, PENDING_PAYMENT_MIN_AGE_MS + 50);
});

test("a pending payment already 90 seconds old triggers one verification", () => {
  const plan = planPendingPaymentRecheck([pending], new Set(), origin + PENDING_PAYMENT_MIN_AGE_MS);
  assert.deepEqual(plan.dueReferences, ["PS-123"]);
  assert.equal(plan.nextDelayMs, null);
});

test("never verify paid, failed or already-attempted payment references", () => {
  for (const status of ["paid", "success", "failed", "cancelled"]) {
    const plan = planPendingPaymentRecheck([{ ...pending, status }], new Set(), origin + 300000);
    assert.deepEqual(plan.dueReferences, [], status);
    assert.equal(plan.nextDelayMs, null);
  }
  assert.deepEqual(
    planPendingPaymentRecheck([pending], new Set(["PS-123"]), origin + 300000).dueReferences,
    [],
  );
});

test("multiple pending payments share one timer and one student reconciliation", () => {
  const second = { reference: "PS-456", status: "pending", createdAt: new Date(origin + 15000) };
  const plan = planPendingPaymentRecheck([pending, second, { ...pending }], new Set(), origin + 5000);
  assert.deepEqual(plan.dueReferences, []);
  assert.equal(plan.nextDelayMs, PENDING_PAYMENT_MIN_AGE_MS - 5000 + 50);
  const due = planPendingPaymentRecheck([pending, second], new Set(), origin + PENDING_PAYMENT_MIN_AGE_MS);
  assert.deepEqual(due.dueReferences, ["PS-123"]);
  assert.ok(due.nextDelayMs !== null);
});

test("unusable timestamps do not cause unbounded or immediate reconciliation", () => {
  const plan = planPendingPaymentRecheck([{ ...pending, createdAt: undefined }], new Set(), origin);
  assert.deepEqual(plan, { dueReferences: [], nextDelayMs: null });
});

test("student panel uses cancellable delayed verification and keeps manual Paystack check", () => {
  const c = readFileSync(new URL("../src/components/StudentPaymentTools.jsx", import.meta.url), "utf8");
  assert.match(c, /window\.setTimeout\(runDueCheck, nextDelayMs\)/);
  assert.match(c, /window\.clearTimeout\(timer\)/);
  assert.match(c, /reconcilePendingPayments\(\{ silent: true \}\)/);
  assert.match(c, /Recheck Paystack payment/);
  assert.match(c, /pollIntervalMs: 0/);
});
