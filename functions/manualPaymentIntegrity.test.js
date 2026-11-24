const test = require("node:test");
const assert = require("node:assert/strict");
const { reconcileManualPaymentPatch: reconcile } = require("./studentProfileUpdate");
const student = { level:"A2", tuitionFee:3000, paid:5000, balance:0, status:"Paid", paymentStatus:"Paid" };
test("manual balance correction preserves historical payments and synchronizes aliases", () => {
  const patch = reconcile(student,{balanceDue:"1,000.00"});
  assert.equal(patch.balance,1000);
  assert.equal(patch.balanceDue,1000);
  assert.equal(patch.paymentStatus,"Partially Paid");
  assert.equal(patch.status,"Active");
  assert.equal(Object.hasOwn(patch,"paid"),false);
});
test("rejects level changes for paid students through ordinary editor", () => {
  assert.throws(()=>reconcile(student,{level:"B1"}), /Upgrade Tools/);
});
test("rejects inconsistent or invalid balances", () => {
  for (const balanceDue of [-1,3001,"abc",""]) assert.throws(()=>reconcile(student,{balanceDue}));
  assert.throws(()=>reconcile(student,{balanceDue:1000,paymentStatus:"Paid"}));
});
test("requires explicit balance when changing fee",()=>assert.throws(()=>reconcile(student,{tuitionFee:3500})));
test("pending upgrade must be reconciled separately",()=>assert.throws(()=>reconcile({...student,upgradeStatus:"pending"},{balanceDue:1000})));
test("ordinary profile changes do not alter payments",()=>assert.deepEqual(reconcile(student,{name:"Example"}),{name:"Example"}));
