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

test("payment and link tabs use the same level records, with legacy fallback only when there are no records", () => {
 const source=read("src/pages/StudentDirectoryPage.jsx");
 const component=read("src/components/StudentLevelEnrollments.jsx");
 assert.match(source,/mode="payments" student=\{selectedStudent\}/);
 assert.match(source,/mode="links" student=\{selectedStudent\}/);
 assert.match(source,/mode="overview" student=\{selectedStudent\}/);
 assert.match(component,/rows\.length===0\)return legacyFallback/);
 assert.match(component,/loadedId!==id/);
 assert.match(component,/amountLabel\(row\.balanceDue\)/);
 assert.match(component,/\/api\/payments\/enrollment-link/);
 assert.match(component,/enrollmentId:selected/);
 assert.match(source,/legacyHistory=\{<StudentPaymentTools mode="history" readOnly/);
 const contracts=source.slice(source.indexOf('{detailTab === "contracts" &&'),source.indexOf('id="student-panel-access"'));
 assert.match(contracts,/<StudentUpgradeTools/);
 assert.equal((source.match(/<StudentUpgradeTools/g)||[]).length,1);
 const support=source.slice(source.indexOf('id="student-panel-support"'),source.indexOf('id="student-panel-documents"'));
 assert.doesNotMatch(support,/<StudentPaymentTools|<StudentUpgradeTools/);
 const tools=read("src/components/StudentPaymentTools.jsx");
 assert.match(tools,/mode !== "history"/);
 assert.match(tools,/mode !== "links"/);
 assert.match(tools,/reconciling \|\| readOnly/);
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
