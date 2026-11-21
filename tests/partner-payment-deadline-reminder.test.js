import test from "node:test";
import assert from "node:assert/strict";
import {
  partnerPaymentDeadline,
  partnerAccessDeadline,
  partnerDeadlineLabel,
  buildPartnerPaymentDeadlineReminder,
} from "../src/utils/partnerPaymentDeadlineReminder.js";
import { paymentDueDateFromContractStart, daysUntilCalendarDate } from "../src/utils/tuitionPaymentCountdown.js";
import { loadWhatsappReminderDashboard } from "../src/services/whatsappRemindersService.js";

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

test("partial payment keeps WhatsApp's 30-day payment countdown and lists access expiry separately", () => {
  const student = { balanceDue: 500, paid: 1000, contractStartDate: "2026-11-01", accessEndDate: "2026-11-25", paymentStatus: "Partially Paid" };
  assert.deepEqual(partnerPaymentDeadline(student), { date: "2026-12-01", type: "payment" });
  assert.deepEqual(partnerAccessDeadline(student), { date: "2026-11-25", type: "access" });
  const message = buildPartnerPaymentDeadlineReminder(org, ledger([student]), "2026-11-21");
  assert.match(message, /Payment due: 1 December 2026 \(10 days left\)/);
  assert.match(message, /Current paid access ends: 25 November 2026 \(4 days left\)/);
});

test("uses access expiry only when no recorded contract-start payment date exists", () => {
  const student = { balanceDue: 500, paid: 1000, accessEndDate: "2026-11-25", paymentStatus: "Partially Paid" };
  assert.deepEqual(partnerPaymentDeadline(student), { date: "2026-11-25", type: "access" });
  assert.equal((buildPartnerPaymentDeadlineReminder(org, ledger([student]), "2026-11-21").match(/Current paid access ends/g) || []).length, 1);
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

test("shared tuition countdown returns identical days in Partnerships and WhatsApp Reminders", async () => {
  const today = new Date();
  const contractStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15);
  const start = [
    contractStart.getFullYear(),
    String(contractStart.getMonth() + 1).padStart(2, "0"),
    String(contractStart.getDate()).padStart(2, "0"),
  ].join("-");
  const due = paymentDueDateFromContractStart(start);
  assert.equal(daysUntilCalendarDate(due, today), 15);
  assert.equal(partnerPaymentDeadline({ contractStartDate: start, balanceDue: 100 }).date, due);
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    text: async () => "Name,Phone,Paid,Balance,Contract Start,Contract End\nLearner,0244556677,No,100," + start + ",\n",
  });
  try {
    const data = await loadWhatsappReminderDashboard();
    assert.equal(data.unpaidStudents.length, 1);
    assert.equal(data.unpaidStudents[0].daysUntilPaymentDue, 15);
    assert.equal(data.unpaidStudents[0].paymentDueDate.toISOString().slice(0, 10), due);
  } finally {
    global.fetch = originalFetch;
  }
});

test("shared tuition rule preserves 30 calendar days across month ends and ignores invalid starts", () => {
  assert.equal(paymentDueDateFromContractStart("2026-11-01"), "2026-12-01");
  assert.equal(paymentDueDateFromContractStart("2026-01-31"), "2026-03-02");
  assert.equal(paymentDueDateFromContractStart("2026-02-30"), null);
  assert.equal(daysUntilCalendarDate("2026-12-01", "2026-11-21"), 10);
});
