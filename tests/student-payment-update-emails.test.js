import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { _test } = require("../functions/studentPaymentUpdateEmails.js");

const {
  buildPaymentMessage,
  detectPaymentChange,
  hasNewPaymentEvidence,
  hasVerifiedPaystackCredit,
  isImplausibleCourseTotal,
  isLikelySecondHalfOfSameSync,
  resolveClassWebhookConfig,
  resolveStudentWebhookConfig,
  resolveWebhookConfig,
  rowForPaymentUpdate,
} = _test;

test("changing only a balance never creates a payment receipt", () => {
  assert.equal(detectPaymentChange(
    { paid: 2000, balanceDue: 1000 },
    { paid: 2000, balanceDue: 0 },
  ), null);
});

test("a planned initial payment is not a confirmed paid credit", () => {
  assert.equal(detectPaymentChange(
    { initialPaymentAmount: 2000, balanceDue: 3000 },
    { initialPaymentAmount: 3000, balanceDue: 2000 },
  ), null);
  assert.ok(!_test.PAID_FIELDS.includes("initialPaymentAmount"));
});

test("Rashid's two Paystack tuition credits produce a 3000 total, not 5020", () => {
  const initial = detectPaymentChange(
    { paid: 0, balanceDue: 3000 },
    { paid: 2000, balanceDue: 1000, lastPaymentAmount: 2000, lastPaymentReference: "FAL-first" },
  );
  const final = detectPaymentChange(
    { paid: 2000, balanceDue: 1000, lastPaymentReference: "FAL-first" },
    { paid: 3000, balanceDue: 0, lastPaymentAmount: 1000, lastPaymentReference: "FAL-final" },
  );
  assert.equal(initial.amount, 2000);
  assert.equal(initial.totalPaid, 2000);
  assert.equal(final.amount, 1000);
  assert.equal(final.totalPaid, 3000);
  assert.equal(final.balance, 0);
});

test("payment changes need a new reference and matching credited amount", () => {
  const before = { paid: 2000, balanceDue: 1000, lastPaymentReference: "FAL-first" };
  const after = { paid: 3000, balanceDue: 0, lastPaymentReference: "FAL-final", lastPaymentAmount: 1000 };
  const change = detectPaymentChange(before, after);
  assert.equal(hasNewPaymentEvidence(before, after, change), true);
  assert.equal(hasNewPaymentEvidence(before, { ...after, lastPaymentReference: "FAL-first" }, change), false);
  assert.equal(hasNewPaymentEvidence(before, { ...after, lastPaymentAmount: 1010 }, change), false);
  assert.equal(hasNewPaymentEvidence(before, { ...after, lastPaymentReference: "" }, change), false);
});

test("Paystack receipt verifies paid reference, student and tuition credit (not checkout gross)", async () => {
  const payment = { studentId: "rashid-id", status: "paid", tuitionCredit: 1000, checkoutAmount: 1010 };
  const db = { collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => payment }) }) }) };
  const candidate = { db, studentId: "rashid-id", student: { lastPaymentProvider: "Paystack" }, change: { amount: 1000, reference: "FAL-final" } };
  assert.equal(await hasVerifiedPaystackCredit(candidate), true);
  assert.equal(await hasVerifiedPaystackCredit({ ...candidate, change: { ...candidate.change, amount: 1010 } }), false);
  assert.equal(await hasVerifiedPaystackCredit({ ...candidate, studentId: "wrong-student" }), false);
  assert.equal(await hasVerifiedPaystackCredit({ ...candidate, db: { collection: () => ({ doc: () => ({ get: async () => ({ exists: false }) }) }) } }), false);
});

test("an overstated ordinary-course paid total suppresses misleading emails", () => {
  assert.equal(isImplausibleCourseTotal({ tuitionFee: 3000 }, { totalPaid: 5020 }), true);
  assert.equal(isImplausibleCourseTotal({ tuitionFee: 3000 }, { totalPaid: 3000 }), false);
  assert.equal(isImplausibleCourseTotal({ tuitionFee: 3000, upgradeStatus: "completed" }, { totalPaid: 5020 }), false);
});

test("student payment changing paid and balance is counted once from the paid increase", () => {
  const change = detectPaymentChange(
    { paid: "GHS 1,000", balanceDue: "1,800" },
    { paid: "1,500", balanceDue: "1,300" },
  );

  assert.equal(change.amount, 500);
  assert.equal(change.source, "paid_increase");
  assert.equal(change.paidIncrease, 500);
  assert.equal(change.balanceDecrease, 500);
});

test("balance increases and unrelated profile edits do not trigger payment email", () => {
  assert.equal(detectPaymentChange(
    { paid: 1000, balanceDue: 1000, name: "Ama" },
    { paid: 1000, balanceDue: 1200, name: "Ama Mensah" },
  ), null);
});

test("payment message includes amount, total paid, balance and account link", () => {
  const message = buildPaymentMessage({
    student: { name: "Ama", email: "ama@example.com" },
    change: { amount: 500, totalPaid: 1500, balance: 1300 },
  });

  assert.match(message, /GHS 500\.00/);
  assert.match(message, /Total paid: GHS 1,500\.00/);
  assert.match(message, /remaining balance is GHS 1,300\.00/);
  assert.match(message, /falowen\.app\/campus\/account/);
});

test("fully paid message confirms completion", () => {
  const message = buildPaymentMessage({
    student: { name: "Kojo" },
    change: { amount: 800, totalPaid: 2800, balance: 0 },
  });
  assert.match(message, /payment is now complete/i);
});

test("announcement row targets only the student's email", () => {
  const row = rowForPaymentUpdate({
    student: { name: "Ama", email: " AMA@EXAMPLE.COM ", level: "a1", className: "A1 Munich" },
    change: { amount: 500, totalPaid: 1500, balance: 1300 },
    now: new Date("2026-08-01T12:00:00Z"),
  });

  assert.equal(row.email, "ama@example.com");
  assert.equal(row.delivery_mode, "individual");
  assert.equal(row.allow_bcc_fallback, "FALSE");
  assert.equal(row.email_type, "payment_update");
  assert.equal(row.cert_level, "A1");
  assert.equal(JSON.parse(row.receipt_payload_json).balanceRemaining, 1300);
});


test("individual verified receipt payload uses the current transaction, not cumulative paid", () => {
  const before = { paid: 2000, balanceDue: 1000, lastPaymentReference: "FAL-first" };
  const after = {
    name: "Rashid", studentCode: "RASHID-198", email: "rashid@example.com",
    level: "A1", className: "A1 Berlin Klasse", tuitionFee: 3000,
    paid: 3000, balanceDue: 0, lastPaymentAmount: 1000,
    lastPaymentProvider: "Paystack", lastPaymentReference: "FAL-final",
  };
  const change = detectPaymentChange(before, after);
  const row = rowForPaymentUpdate({ student: after, change, now: new Date("2026-11-22T12:00:00Z") });
  const receipt = JSON.parse(row.receipt_payload_json);
  assert.equal(row.email_type, "payment_update");
  assert.match(row.subject, /payment receipt/i);
  assert.equal(receipt.reference, "FAL-final");
  assert.equal(receipt.amountReceived, 1000);
  assert.equal(receipt.totalPaid, 3000);
  assert.equal(receipt.balanceRemaining, 0);
  assert.equal(receipt.studentCode, "RASHID-198");
  assert.equal(receipt.paymentMethod, "Paystack");
});


test("receipt uses the recorded Firestore payment time instead of a later delivery time", () => {
  const row = rowForPaymentUpdate({
    student: {
      name: "Ama",
      email: "ama@example.com",
      lastPaymentAt: { toDate: () => new Date("2026-11-20T23:30:00Z") },
    },
    change: { amount: 500, totalPaid: 1500, balance: 1300 },
    now: new Date("2026-11-22T12:00:00Z"),
  });
  assert.equal(JSON.parse(row.receipt_payload_json).receivedDate, "2026-11-20");
  assert.equal(row.date, "2026-11-22"); // Announcement delivery date remains separate.
});

test("receipt date handles timestamp seconds and unavailable or invalid payment times", () => {
  const now = new Date("2026-11-22T12:00:00Z");
  const change = { amount: 500, totalPaid: 1500, balance: 1300 };
  const getReceivedDate = (lastPaymentAt) => JSON.parse(rowForPaymentUpdate({
    student: { name: "Ama", email: "ama@example.com", lastPaymentAt },
    change,
    now,
  }).receipt_payload_json).receivedDate;

  assert.equal(getReceivedDate({ seconds: Date.parse("2026-11-21T23:30:00Z") / 1000, nanoseconds: 0 }), "2026-11-21");
  assert.equal(getReceivedDate(undefined), "2026-11-22");
  assert.equal(getReceivedDate("not-a-date"), "2026-11-22");
});

test("receipt does not invent a zero balance when the student's balance is missing", () => {
  const before = { paid: 0, lastPaymentReference: "before" };
  const after = {
    name: "Ama", studentCode: "AMA-001", email: "ama@example.com",
    paid: 500, lastPaymentReference: "current", lastPaymentAmount: 500,
  };
  const change = detectPaymentChange(before, after);
  const receipt = JSON.parse(rowForPaymentUpdate({ student: after, change }).receipt_payload_json);
  assert.equal(receipt.amountReceived, 500);
  assert.equal(receipt.balanceRemaining, null);
});

test("second half of a two-step paid/balance sync is suppressed", () => {
  const now = new Date("2026-08-01T12:05:00Z");
  const state = {
    lastPaid: 1500,
    lastBalance: 1800,
    lastPaymentAmount: 500,
    lastSentAt: "2026-08-01T12:00:00Z",
  };
  const change = {
    source: "balance_decrease",
    amount: 500,
    paidIncrease: 0,
    totalPaid: 1500,
    balance: 1300,
    reference: "",
  };
  assert.equal(isLikelySecondHalfOfSameSync(state, change, now), true);
});

test("webhook config uses the shared announcement webhook as fallback", () => {
  const config = resolveWebhookConfig({
    communication: {
      announcement_webhook_url: "https://example.com/webhook",
      announcement_webhook_token: "secret",
    },
  }, {});
  assert.equal(config.url, "https://example.com/webhook");
  assert.equal(config.token, "secret");
});

test("saved class delivery config overrides an empty Firebase runtime config", () => {
  const config = resolveClassWebhookConfig({
    attendanceConfirmationEmailDelivery: {
      url: "https://script.google.com/payment-mail",
      token: "class-secret",
      sheetName: "Announcements",
      sheetGid: "123",
    },
  }, {});

  assert.equal(config.url, "https://script.google.com/payment-mail");
  assert.equal(config.token, "class-secret");
  assert.equal(config.sheetName, "Announcements");
  assert.equal(config.sheetGid, "123");
});

test("student class name resolves its saved communication delivery", async () => {
  const classRecord = {
    attendanceConfirmationEmailDelivery: {
      url: "https://script.google.com/payment-mail",
      token: "class-secret",
    },
  };
  const emptySnap = { exists: false, data: () => ({}) };
  const querySnap = {
    empty: false,
    docs: [{ id: "b1-bonn", data: () => classRecord }],
  };
  const classes = {
    doc: () => ({ get: async () => emptySnap }),
    where: (field, operator, value) => ({
      limit: () => ({
        get: async () => field === "name" && operator === "==" && value === "B1 Bonn Klasse"
          ? querySnap
          : { empty: true, docs: [] },
      }),
    }),
  };
  const db = { collection: (name) => name === "classes" ? classes : null };

  const config = await resolveStudentWebhookConfig({
    db,
    student: { className: "B1 Bonn Klasse" },
    fallback: {},
  });

  assert.equal(config.url, "https://script.google.com/payment-mail");
  assert.equal(config.token, "class-secret");
});
