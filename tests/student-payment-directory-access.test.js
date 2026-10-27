import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Students page restores a discoverable Generate payment link shortcut", () => {
  const source = read("src/pages/StudentDirectoryPage.jsx");
  assert.match(source, /Generate payment link for selected student/);
  assert.match(source, /onClick=\{\(\) => \{\s*setDetailTab\("payments"\)/);
  assert.match(source, /student-tab-payments/);
});

test("payment generator and upgrade flow each render only inside the Payments tab", () => {
  const source = read("src/pages/StudentDirectoryPage.jsx");
  const start = source.indexOf('{tab.id === "payments" && (');
  const end = source.indexOf('{tab.id === "class" &&', start);
  assert.ok(start > -1 && end > start, "payment tab must contain the tools ahead of the Class panel");
  const paymentPanel = source.slice(start, end);
  assert.match(paymentPanel, /<StudentPaymentTools/);
  assert.match(paymentPanel, /<StudentUpgradeTools/);
  assert.match(paymentPanel, /onStudentUpdated=\{handleSupportStudentUpdated\}/);
  assert.equal((source.match(/<StudentPaymentTools/g) || []).length, 1);
  assert.equal((source.match(/<StudentUpgradeTools/g) || []).length, 1);
  const supportPanel = source.slice(
    source.indexOf('id="student-panel-support"'),
    source.indexOf('id="student-panel-documents"'),
  );
  assert.doesNotMatch(supportPanel, /<StudentPaymentTools|<StudentUpgradeTools/);
});

test("the restored payment UI still exposes generation, copying, WhatsApp and reconciliation", () => {
  const source = read("src/components/StudentPaymentTools.jsx");
  assert.match(source, /createStudentPaymentLink/);
  assert.match(source, /Generate payment link/);
  assert.match(source, /Copy link/);
  assert.match(source, /Send on WhatsApp/);
  assert.match(source, /Recheck Paystack payment/);
  assert.match(source, /Payment history/);
});
