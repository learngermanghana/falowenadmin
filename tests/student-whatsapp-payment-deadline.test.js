import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { studentPaymentDeadline, studentPaymentDeadlineReminder } from "../src/utils/tuitionPaymentCountdown.js";

test("recorded payment deadline takes precedence over the contract dates", () => {
  const student = { contractStart: "2026-10-02", contractEnd: "2027-04-02", paymentDeadline: "2026-11-15" };
  assert.equal(studentPaymentDeadline(student), "2026-11-15");
  assert.match(studentPaymentDeadlineReminder(student), /15 Nov 2026/);
  assert.doesNotMatch(studentPaymentDeadlineReminder(student), /Apr 2027/);
});

test("legacy tuition follows the existing 30-day rule", () => {
  assert.equal(studentPaymentDeadline({ contractStart: "2026-10-02T10:00:00Z", contractEnd: "2027-04-02" }), "2026-11-01");
  assert.equal(studentPaymentDeadline({ paymentDueDate: "2026-11-12", contractStart: "2026-10-02" }), "2026-11-12");
});

test("missing or invalid deadlines do not use contract end or invent a managed deadline", () => {
  for (const student of [
    { contractEnd: "2027-04-02" },
    { paymentDeadline: "2026-02-30", contractEnd: "2027-04-02" },
    { effectiveEnrollmentId: "german-A2", contractStart: "2026-10-02", paymentDeadline: "" },
  ]) {
    assert.equal(studentPaymentDeadline(student), null);
    assert.match(studentPaymentDeadlineReminder(student), /confirm your payment deadline/);
  }
});

test("legacy pending upgrade uses the matching grace deadline", () => {
  assert.equal(studentPaymentDeadline({ upgradeStatus: "pending", upgradeGraceEnd: "2026-12-25", paymentDeadline: "2026-10-02" }), "2026-12-25");
});

test("directory keeps only three templates and both reminders share deadline helper", () => {
  const directory = readFileSync(new URL("../src/pages/StudentDirectoryPage.jsx", import.meta.url), "utf8");
  const support = readFileSync(new URL("../src/components/StudentSupportTools.jsx", import.meta.url), "utf8");
  const templates = directory.split("const followUpTemplates = [")[1].split("];")[0];
  assert.deepEqual([...templates.matchAll(/key: "([^"]+)"/g)].map(m => m[1]), ["balance", "review", "custom"]);
  for (const source of [directory, support]) {
    assert.match(source, /studentPaymentDeadlineReminder\(student, draft\)/);
    assert.doesNotMatch(source, /your Falowen access is scheduled to stop on/);
  }
});
