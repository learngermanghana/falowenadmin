const test = require("node:test");
const assert = require("node:assert/strict");

const { _test } = require("../functions/studentPaymentUpdateEmails.js");

const {
  buildPaymentMessage,
  detectPaymentChange,
  isLikelySecondHalfOfSameSync,
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
  assert.equal(change.totalPaid, 1000);
  assert.equal(change.balance, 1300);
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
