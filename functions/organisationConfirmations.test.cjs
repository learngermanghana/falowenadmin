"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { organisationStudentConfirmation } = require("./organisationConfirmations");

function student(patch = {}) {
  return {
    name: "Example Learner", email: "learner@example.test", organisationName: "Example Organisation",
    billingResponsibility: "organisation", className: "A1 Class", level: "A1",
    lastPaymentReference: "TEST-RECEIPT-REFERENCE", paid: 2000,
    balanceDue: 1000, paymentStatus: "Partially Paid", contractTermMonths: "1",
    contractEnd: "2026-12-05T12:00:00.000Z", ...patch,
  };
}

test("partial organisation payment email states one-month access and outstanding balance, not six months", () => {
  const confirmation = organisationStudentConfirmation(student());
  assert.ok(confirmation);
  assert.equal(confirmation.email, "learner@example.test");
  assert.match(confirmation.announcement, /GHS 2,000\.00/);
  assert.match(confirmation.announcement, /GHS 1,000\.00 remains outstanding/);
  assert.match(confirmation.announcement, /one month of paid access/);
  assert.match(confirmation.announcement, /5 December 2026/);
  assert.doesNotMatch(confirmation.announcement, /six.month/i);
  assert.match(confirmation.announcement, /Do not make a duplicate personal payment/);
});

test("fully paid organisation student retains standard six-month terms", () => {
  const confirmation = organisationStudentConfirmation(student({
    paid: 3000, balanceDue: 0, paymentStatus: "Paid", contractTermMonths: "6",
  }));
  assert.match(confirmation.announcement, /six months from account activation/);
  assert.doesNotMatch(confirmation.announcement, /GHS 1,000\.00 remains outstanding/);
});

test("no announcement for zero paid, absent class or non-organisation billing", () => {
  assert.equal(organisationStudentConfirmation(student({ paid: 0 })), null);
  assert.equal(organisationStudentConfirmation(student({ className: "" })), null);
  assert.equal(organisationStudentConfirmation(student({ billingResponsibility: "student" })), null);
});
