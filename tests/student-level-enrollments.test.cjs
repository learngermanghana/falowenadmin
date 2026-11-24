const test=require("node:test");
const assert=require("node:assert/strict");
const {normalizeEnrollment,paymentPatch,legacyOpeningEnrollment,contractPatch}=require("../functions/studentLevelEnrollments");
const {sheetRow,syncEnrollmentSheet}=require("../functions/levelEnrollmentSheetSync");
const base={program:"german",level:"A2",tuitionFee:3000,paid:0,balanceDue:3000,status:"planned",sheetVersion:1};
test("separate level payment updates balance without changing original",()=>{
 const patch=paymentPatch(base,2000);assert.equal(patch.paid,2000);assert.equal(patch.balanceDue,1000);assert.equal(patch.paymentStatus,"Partially Paid");assert.equal(base.paid,0);assert.equal(patch.sheetVersion,2);
 const full=paymentPatch({...base,...patch},1000);assert.equal(full.balanceDue,0);assert.equal(full.paymentStatus,"Paid");
 assert.throws(()=>paymentPatch(base,3001));assert.throws(()=>paymentPatch({...base,paid:1},10));
});
test("safe migration imports only a reconciled single level",()=>{
 const legacy={...base,paid:2000,balanceDue:1000,contractStart:"2026-11-02",contractEnd:"2027-02-02"};
 const imported=legacyOpeningEnrollment(legacy);assert.equal(imported.paid,2000);assert.equal(imported.status,"planned");assert.equal(imported.openingBalanceImported,true);
 assert.throws(()=>legacyOpeningEnrollment({...legacy,upgradeId:"UPG-1"}));assert.throws(()=>legacyOpeningEnrollment({...legacy,balanceDue:6}));
});
test("active contracts require dates and qualifying payment",()=>{
 const dates={status:"active",contractStart:"2026-11-02",contractEnd:"2027-02-02",paymentDeadline:"2026-12-02"};
 assert.throws(()=>contractPatch(base,dates));assert.equal(contractPatch({...base,paid:2000,balanceDue:1000},dates).status,"active");
 assert.throws(()=>normalizeEnrollment({...base,contractStart:"2026-02-30"}));
});
test("sheet row uses canonical enrollment identity and version",async()=>{
 const record={...base,studentCode:"S1",paymentStatus:"Unpaid"};
 const row=sheetRow("german-A2","student1",record);assert.equal(row[0],"student1:german-A2");assert.equal(row[8],3000);assert.equal(row[14],1);
 await assert.rejects(syncEnrollmentSheet({id:"german-A2",studentId:"student1",record,url:"https://example.com",secret:"test",fetchImpl:async()=>({ok:true,json:async()=>({ok:true})})}),/acknowledge/);
 await syncEnrollmentSheet({id:"german-A2",studentId:"student1",record,url:"https://example.com",secret:"test",fetchImpl:async(url,options)=>{assert.deepEqual(JSON.parse(options.body).row,row);return {ok:true,json:async()=>({ok:true,action:"upsertLevelEnrollment"})};}});
});
