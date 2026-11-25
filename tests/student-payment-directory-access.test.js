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
  assert.match(source, /onClick=\{\(\) => \{\s*setDetailTab\("payment-links"\)/);
  assert.match(source, /student-tab-payment-links/);
});

test("payment history, link generation and upgrade tools have independent, lazy mounted panels", () => {
  const source = read("src/pages/StudentDirectoryPage.jsx");
  assert.match(source, /tab\.id === "payments" && !isHamburgCohortStudent\(selectedStudent\) && <StudentLevelEnrollments/);
  assert.match(source, /mode="history" legacyHistory=/);
  assert.match(source, /<StudentPaymentTools mode="history" legacyOnly readOnlyHistory/);
  const levels = read("src/components/StudentLevelEnrollments.jsx");
  assert.match(levels, /Payment progress by level/);
  assert.match(levels, /legacyOpen&&legacyHistory/);
  const links = source.slice(source.indexOf('{detailTab === "payment-links" &&'),source.indexOf('{detailTab === "contracts" &&'));
  assert.match(links, /<StudentPaymentTools mode="links"/);
  assert.match(links, /onStudentUpdated=\{handleSupportStudentUpdated\}/);
  const contracts = source.slice(source.indexOf('{detailTab === "contracts" &&'),source.indexOf('id="student-panel-access"'));
  assert.match(contracts, /<StudentUpgradeTools/);
  assert.match(contracts, /onStudentUpdated=\{handleSupportStudentUpdated\}/);
  assert.equal((source.match(/<StudentPaymentTools/g) || []).length, 2);
  assert.equal((source.match(/<StudentUpgradeTools/g) || []).length, 1);
  const support = source.slice(source.indexOf('id="student-panel-support"'), source.indexOf('id="student-panel-documents"'));
  assert.doesNotMatch(support, /<StudentPaymentTools|<StudentUpgradeTools/);
  const tools = read("src/components/StudentPaymentTools.jsx");
  assert.match(tools, /mode !== "history"/);
  assert.match(tools, /mode !== "links"/);
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
