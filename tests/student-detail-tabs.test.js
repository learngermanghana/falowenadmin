import test from "node:test";
import assert from "node:assert/strict";
import { STUDENT_DETAIL_TABS, nextStudentDetailTab } from "../src/utils/studentDetailTabs.js";

test("grouping preserves every editable student field exactly once", () => {
  const fields = STUDENT_DETAIL_TABS.flatMap((tab) => tab.fields);
  const expected = ["name", "email", "phone", "studentCode", "level", "program", "location", "status", "tuitionFee", "initialPaymentAmount", "paymentIntentAmount", "balanceDue", "paymentStatus", "contractStart", "contractEnd", "contractTermMonths"];
  assert.equal(new Set(fields).size, fields.length);
  assert.deepEqual([...fields].sort(), expected.sort());
  assert.ok(STUDENT_DETAIL_TABS.find((tab) => tab.id === "payments").fields.includes("balanceDue"));
  assert.ok(STUDENT_DETAIL_TABS.find((tab) => tab.id === "class").fields.includes("contractEnd"));
});

test("keyboard navigation wraps between the first and last detail tabs", () => {
  assert.equal(nextStudentDetailTab("profile", "ArrowLeft"), "documents");
  assert.equal(nextStudentDetailTab("documents", "ArrowRight"), "profile");
  assert.equal(nextStudentDetailTab("profile", "ArrowRight"), "payments");
  assert.equal(nextStudentDetailTab("class", "Home"), "profile");
  assert.equal(nextStudentDetailTab("class", "End"), "documents");
  assert.equal(nextStudentDetailTab("class", "Tab"), "class");
});
