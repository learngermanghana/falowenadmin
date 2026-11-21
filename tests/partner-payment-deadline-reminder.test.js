import test from "node:test";
import assert from "node:assert/strict";
import {
  partnerPaymentDeadline,
  partnerDeadlineLabel,
  buildPartnerPaymentDeadlineReminder,
} from "../src/utils/partnerPaymentDeadlineReminder.js";

const org = { name: "Example Partner", contactName: "Partner Contact" };
const ledger = students => ({
  students,
  outstandingTotal: students.reduce((sum, s) => sum + (s.balanceDue || 0), 0),
  unverifiedCount: 0,
});

test("uses the existing 30-day contract-start payment policy and states exact days left", () => {
  const student = { name: "Student A", level: "A1", balanceDue: 1000, paid: 0, contractStartDate: "2026-11-01" };
  assert.deepEqual(partnerPaymentDeadline(student), { date: "2026-12-01", type: "payment" });
  const message = buildPartnerPaymentDeadlineReminder(org, ledger([student]), "2026-11-21");
  assert.match(message, /Hello Partner Contact,/);
  assert.match(message, /Student A \(A1\).*1,000/);
  assert.match(message, /Payment due: 1 December 2026 \(10 days left\)/);
  assert.match(message, /help prevent interruption to the students' Falowen account access/);
  assert.doesNotMatch(message, /will be disconnected|automatically deactivated/i);
});

test("partial payment uses current paid-access end without falsely labelling it payment due", () => {
  const student = { balanceDue: 500, paid: 1000, contractStartDate: "2026-11-01", accessEndDate: "2026-11-25", paymentStatus: "Partially Paid" };
  assert.deepEqual(partnerPaymentDeadline(student), { date: "2026-11-25", type: "access" });
  assert.match(buildPartnerPaymentDeadlineReminder(org, ledger([student]), "2026-11-21"), /Current paid access ends: 25 November 2026 \(4 days left\)/);
});

test("an explicit confirmed payment deadline takes precedence over access end", () => {
  const student = { balanceDue: 300, paid: 120, paymentDueDate: "2026-11-23", contractStartDate: "2026-10-01", accessEndDate: "2026-12-05" };
  assert.deepEqual(partnerPaymentDeadline(student), { date: "2026-11-23", type: "payment" });
  assert.match(partnerDeadlineLabel(partnerPaymentDeadline(student), "2026-11-21"), /2 days left/);
});

test("handles payment due today and overdue without inventing days remaining", () => {
  const due = { type: "payment", date: "2026-11-21" };
  assert.match(partnerDeadlineLabel(due, "2026-11-21"), /due today/);
  assert.match(partnerDeadlineLabel(due, "2026-11-23"), /2 days past this date/);
});

test("no reliable deadline produces no invented date or countdown", () => {
  const student = { name: "Student B", balanceDue: 500, paid: null, contractStartDate: "", accessEndDate: "" };
  assert.equal(partnerPaymentDeadline(student), null);
  const message = buildPartnerPaymentDeadlineReminder(org, ledger([student]), "2026-11-21");
  assert.match(message, /Payment deadline not recorded/);
  assert.match(message, /Please confirm the due date with Falowen/);
  assert.doesNotMatch(message, /days left/);
});

test("does not send drafts to students with settled balance and warns about unverified balances", () => {
  const data = ledger([
    { name: "Student C", balanceDue: 0, contractStartDate: "2026-11-01" },
    { name: "Student D", balanceDue: 750, contractStartDate: "2026-11-05" },
    { name: "Student E", balanceDue: null, contractStartDate: "2026-11-05" },
  ]);
  data.unverifiedCount = 1;
  const message = buildPartnerPaymentDeadlineReminder(org, data, "2026-11-21");
  assert.match(message, /Student D/);
  assert.doesNotMatch(message, /Student C|Student E/);
  assert.match(message, /Other balances are still unverified/);
  assert.match(message, /16 November 2026|5 December 2026/);
});

test("invalid date values do not create countdowns", () => {
  assert.equal(partnerPaymentDeadline({ balanceDue: 100, contractStartDate: "2026-02-30" }), null);
  assert.equal(partnerPaymentDeadline({ balanceDue: 100, paymentDueDate: "unconfirmed" }), null);
  assert.equal(buildPartnerPaymentDeadlineReminder(org, ledger([{ balanceDue: 0 }]), "2026-11-21"), "");
});
