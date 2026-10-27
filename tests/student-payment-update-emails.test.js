import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { _test } = require("../functions/studentPaymentUpdateEmails.js");

const {
  applyStoredPaymentBaseline,
  buildPaymentMessage,
  detectPaymentChange,
  isLikelySecondHalfOfSameSync,
  resolveClassWebhookConfig,
  resolveStudentWebhookConfig,
  resolveWebhookConfig,
  rowForPaymentUpdate,
} = _test;

test("manual balance reduction is detected as a payment", () => {
  const change = detectPaymentChange(
    { paid: 1000, balanceDue: 1800 },
    { paid: 1000, balanceDue: 1300 },
  );

  assert.equal(change.amount, 500);
  assert.equal(change.source, "balance_decrease");
  assert.equal(change.totalPaid, 1500);
  assert.equal(change.balance, 1300);
});

test("Ruth test balance reduction from 3000 to zero is detected", () => {
  const change = detectPaymentChange(
    { initialPaymentAmount: 3000, balanceDue: 3000, email: "ruth@example.com" },
    { initialPaymentAmount: 3000, balanceDue: 0, email: "ruth@example.com" },
  );

  assert.equal(change.amount, 3000);
  assert.equal(change.source, "balance_decrease");
  assert.equal(change.balance, 0);
});

test("stored payment state keeps successive manual balance payments cumulative", () => {
  const rawChange = detectPaymentChange(
    { paid: 1000, balanceDue: 1300 },
    { paid: 1000, balanceDue: 800 },
  );
  const adjusted = applyStoredPaymentBaseline({ lastPaid: 1500 }, rawChange);

  assert.equal(adjusted.amount, 500);
  assert.equal(adjusted.totalPaid, 2000);
  assert.equal(adjusted.balance, 800);
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
