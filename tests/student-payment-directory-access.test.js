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

test("history, enrollment edits and manual links have separate lazy panels",()=>{
 const source=read("src/pages/StudentDirectoryPage.jsx"),levels=read("src/components/StudentLevelEnrollments.jsx");
 assert.ok(source.includes('detailTab === "payments"'));assert.ok(source.includes('mode="history" legacyHistory='));
 assert.ok(source.includes('mode="links" legacyControls='));assert.ok(source.includes('detailTab === "enrollments"'));
 assert.ok(source.includes('<StudentUpgradeTools'));assert.ok(source.includes('<StudentPaymentTools mode="history" legacyOnly readOnlyHistory'));
 assert.ok(levels.includes('if(mode==="links")'));assert.ok(levels.includes('/api/payments/enrollment-link'));assert.ok(levels.includes('enrollmentId:selected'));
 assert.ok(levels.includes('mode!=="history"&&row.balanceDue>0'));assert.ok(!source.includes('id="student-panel-contracts"'));assert.ok(!source.includes('id="student-panel-access"'));
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
