const {preparePlan,paymentLifecycle,addMonths,payableStatus}=require("../functions/levelUpgradeLifecycle");
const a1={program:"german",level:"A1",status:"active",tuitionFee:3000,paid:3000,balanceDue:0,contractStart:"2026-10-01",contractEnd:"2027-03-31"};
const plan=()=>preparePlan({student:{program:"german"},rows:[a1],targetLevel:"A2",today:"2026-11-25"}).row;
const assert=require("node:assert/strict");

function cases(){
 const row=plan();
 assert.equal(row.status,"planned");assert.equal(row.paid,0);assert.equal(payableStatus(row),true);
 const temp=paymentLifecycle(row,1000,"2026-11-25");
 assert.equal(temp.status,"active");assert.equal(temp.paymentDeadline,"2026-12-25");
 const partial={...row,...temp,paid:2000,balanceDue:1000};
 assert.deepEqual(paymentLifecycle(partial,500,"2026-12-01"),{});
 assert.deepEqual(paymentLifecycle(partial,500,"2026-12-26"),{status:"expired"});
 assert.equal(paymentLifecycle(partial,0,"2026-12-26").contractEnd,"2027-09-30");
 assert.equal(paymentLifecycle(row,0,"2026-11-25").contractEnd,"2027-09-30");
 assert.equal(paymentLifecycle(partial,0,"2027-04-30").contractEnd,"2027-10-30");
 assert.equal(addMonths("2028-01-31",1),"2028-02-29");
 assert.throws(()=>preparePlan({student:{program:"german"},rows:[{...a1,balanceDue:1000,paid:2000}],targetLevel:"A2",today:"2026-11-25"}));
 assert.throws(()=>preparePlan({student:{program:"german",upgradeStatus:"pending"},rows:[a1],targetLevel:"A2",today:"2026-11-25"}));
 assert.throws(()=>preparePlan({student:{program:"german"},rows:[a1],targetLevel:"B1",today:"2026-11-25"}));
 assert.equal(preparePlan({student:{program:"german"},rows:[a1,row],targetLevel:"A2",today:"2026-11-25"}).existing.level,"A2");
}
require("node:test")("event driven upgrade policy",cases);
