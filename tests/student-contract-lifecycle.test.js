import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const require = createRequire(import.meta.url);
const lifecycle = require("../functions/studentContractLifecycle.js");

test("contract lifecycle moves students only to the next CEFR level", () => {
  assert.equal(lifecycle.nextLevel("A1"), "A2");
  assert.equal(lifecycle.nextLevel("A2 Munich Klasse"), "B1");
  assert.equal(lifecycle.nextLevel("B1"), "B2");
  assert.equal(lifecycle.nextLevel("B2"), "C1");
  assert.equal(lifecycle.nextLevel("C1"), "");
});

test("upgrade grace and contract extension use calendar months", () => {
  assert.equal(lifecycle.isoDate(lifecycle.computeUpgradeGraceEnd("2026-08-20")), "2026-09-20");
  assert.equal(lifecycle.computeExtendedContractEnd("2026-12-31", "2026-09-20"), "2027-06-30");
  assert.equal(lifecycle.computeExtendedContractEnd("2026-08-01", "2026-09-20"), "2027-03-20");
  assert.equal(lifecycle.contractIsActive("2026-08-20", "2026-08-20"), true);
  assert.equal(lifecycle.contractIsActive("2026-08-19", "2026-08-20"), false);
});

test("payment-driven upgrade rules start grace only after a partial payment", () => {
  const functionsSource = read("functions/index.js");
  const start = functionsSource.indexOf('app.post("/payments/start-upgrade"');
  const end = functionsSource.indexOf('app.post("/payments/reconcile-student/:studentId"', start);
  assert.ok(start >= 0 && end > start);
  const startRoute = functionsSource.slice(start, end);

  assert.match(startRoute, /upgradeStatus: "awaiting_payment"/);
  assert.match(startRoute, /Complete the current level balance before preparing a next-level upgrade/);
  assert.doesNotMatch(startRoute, /level: targetLevel/);
  assert.doesNotMatch(startRoute, /balanceDue: tuitionFee/);
  assert.doesNotMatch(startRoute, /paymentReminderLevel: targetLevel/);

  const accountingStart = functionsSource.indexOf('if (paymentPurpose === "level_upgrade")');
  const accountingEnd = functionsSource.indexOf('transaction.set(studentRef, studentUpdate', accountingStart);
  assert.ok(accountingStart >= 0 && accountingEnd > accountingStart);
  const accounting = functionsSource.slice(accountingStart, accountingEnd);

  assert.match(accounting, /\["awaiting_payment", "pending", "expired"\]/);
  assert.match(accounting, /if \(upgradeCompleted\)/);
  assert.match(accounting, /computeExtendedContractEnd\(student\.contractEnd, paidAtDate, CONTRACT_TERM_MONTHS\)/);
  assert.match(accounting, /else if \(upgradeStatus === "awaiting_payment"\)/);
  assert.match(accounting, /computeUpgradeGraceEnd\(paidAtDate\)/);
  assert.match(accounting, /upgradeStatus: "pending"/);
  assert.match(accounting, /paymentReminderLevel: targetLevel/);
});

test("confirmed partial tuition payment converts trial and grants one month of access", () => {
  const patch = read("scripts/patchStudentPaymentContractLifecycle.mjs");

  assert.match(patch, /grantPartialAccess = nextBalance > 0 && !hasActiveContract/);
  assert.match(patch, /status: nextBalance <= 0 \? "Paid" : "Active"/);
  assert.match(patch, /trialStatus: "converted"/);
  assert.match(patch, /trialConvertedAt: paymentTimestamp/);
  assert.match(patch, /computeExtendedContractEnd\("", paidAtDate, 1\)/);
  assert.match(patch, /contractTermMonths = "1"/);
});

test("payment lifecycle still wires reconciliation, downgrade, and six-month completion", () => {
  const functionsSource = read("functions/index.js");
  const directory = read("src/pages/StudentDirectoryPage.jsx");
  const support = read("src/components/StudentSupportTools.jsx");
  const paymentEmails = read("functions/studentPaymentUpdateEmails.js");

  assert.match(functionsSource, /app\.post\("\/payments\/reconcile-student\/:studentId"/);
  assert.match(functionsSource, /app\.post\("\/payments\/restore-paid-contract"/);
  assert.match(functionsSource, /studentUpgrade\.restoredPaidContract/);
  assert.match(functionsSource, /remainingBalance: remainingUpgradeBalance/);
  assert.match(functionsSource, /exports\.maintainStudentPaymentContracts = onSchedule/);
  assert.match(functionsSource, /upgradeStatus: "expired"/);
  assert.match(functionsSource, /upgradeStatus: "completed"/);
  assert.match(functionsSource, /contractTermMonths: String\(CONTRACT_TERM_MONTHS\)/);
  assert.match(functionsSource, /verifyPaystackTransaction/);

  assert.match(directory, /StudentUpgradeTools/);
  assert.match(directory, /contractTermMonths: "6"/);
  assert.match(directory, /paymentReminderLevel/);
  assert.match(support, /paymentReminderLevel/);
  assert.match(paymentEmails, /upgradeBalanceDue/);
  assert.match(paymentEmails, /upgradeToLevel/);
});

test("upgrade UI explains partial versus full payment behavior", () => {
  const component = read("src/components/StudentUpgradeTools.jsx");
  const service = read("src/services/studentContractService.js");
  const paymentService = read("src/services/studentPaymentService.js");
  const packageJson = read("package.json");

  assert.match(component, /Prepare .* upgrade payment/);
  assert.doesNotMatch(component, /Start 1-month/);
  assert.match(component, /partial payment starts one month/i);
  assert.match(component, /full payment.*add 6 months/i);
  assert.match(component, /purpose: "level_upgrade"/);
  assert.match(component, /Recheck pending Paystack payments/);
  assert.match(component, /Return to paid .* contract/);
  assert.match(component, /Current access:/);
  assert.match(service, /\/api\/payments\/start-upgrade/);
  assert.match(service, /\/api\/payments\/restore-paid-contract/);
  assert.match(service, /\/api\/payments\/reconcile-student/);
  assert.match(paymentService, /\/api\/payments\/create-link/);
  assert.match(packageJson, /patchStudentUpgradePaymentDriven\.mjs/);
});

const {buildManualUpgradePatch} = require("../functions/manualUpgradePayment.js");
const prepared = {level:"A1",paidLevel:"A1",paid:2828,upgradeId:"u1",upgradeToLevel:"A2",upgradeStatus:"awaiting_payment",upgradePaid:0,upgradeBalanceDue:3000,upgradeTuitionFee:3000,contractEnd:"2027-01-28"};
const now = new Date("2026-11-24T12:00:00Z");
test("manual upgrade starts grace from actual payment date",()=>{
  const patch=buildManualUpgradePatch(prepared,2000,"2026-11-02",false,now);
  assert.equal(patch.upgradeBalanceDue,1000);
  assert.equal(patch.balance,1000);
  assert.equal(patch.paymentStatus,"Partially Paid");
  assert.equal(patch.upgradeGraceEnd,"2026-12-02");
  assert.equal(patch.paid,4828);
  assert.equal(patch.paymentReminderLevel,"A2");
});
test("reallocation never adds the historical payment a second time",()=>{
  const patch=buildManualUpgradePatch({...prepared,paid:4828},2000,"2026-11-02",true,now);
  assert.equal(patch.paid,4828);
  assert.equal(patch.upgradePaid,2000);
});
test("later partial payment does not restart grace; full payment extends once",()=>{
  const first=buildManualUpgradePatch(prepared,2000,"2026-11-02",false,now);
  const partial=buildManualUpgradePatch({...prepared,...first},500,"2026-11-20",false,now);
  assert.equal(partial.upgradeGraceEnd,"2026-12-02");
  const full=buildManualUpgradePatch({...prepared,...first,...partial},500,"2026-11-24",false,now);
  assert.equal(full.upgradeStatus,"completed");
  assert.equal(full.contractEnd,"2027-07-28");
  assert.equal(full.balanceDue,0);
});
test("historical expired partial payment does not grant fresh grace",()=>{
  const patch=buildManualUpgradePatch(prepared,2000,"2026-10-02",false,now);
  assert.equal(patch.upgradeStatus,"expired");
  assert.equal(patch.level,"A1");
  assert.equal(patch.upgradeBalanceDue,1000);
});
test("invalid or excessive credits fail closed",()=>{
  for(const value of [0,-1,3001,"bad"]) assert.throws(()=>buildManualUpgradePatch(prepared,value,"2026-11-02",false,now));
  assert.throws(()=>buildManualUpgradePatch(prepared,1000,"2026-11-25",false,now));
});
