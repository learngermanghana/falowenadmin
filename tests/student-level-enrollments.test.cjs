const test=require("node:test");
const assert=require("node:assert/strict");
const {normalizeEnrollment,manualTotals,enrollmentStatus,paymentPatch,legacyOpeningEnrollment,contractPatch}=require("../functions/studentLevelEnrollments");
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
test("active enrollment is independent of dates and payment status",()=>{
 const dates={status:"active",contractStart:"2026-11-02",contractEnd:"2027-05-02",paymentDeadline:"2026-12-02"};
 for(const totals of [manualTotals({tuitionFee:"",paid:""}),manualTotals({tuitionFee:3000,paid:0}),manualTotals({tuitionFee:3000,paid:2000}),manualTotals({tuitionFee:3000,paid:3000})]){
  assert.equal(contractPatch({...base,...totals},{status:"active"}).status,"active");
  assert.equal(contractPatch({...base,...totals},dates).status,"active");
 }
 assert.equal(enrollmentStatus("active"),"active");
 assert.equal(enrollmentStatus("planned"),"planned");
 assert.throws(()=>enrollmentStatus("unknown"));
 assert.throws(()=>normalizeEnrollment({...base,contractStart:"2026-02-30"}));
});
test("blank tuition is unknown, never incorrectly fully paid",()=>{
 const blank=manualTotals({tuitionFee:"",paid:""});
 assert.deepEqual(blank,{tuitionFee:null,paid:0,balanceDue:null,paymentStatus:"Unpaid"});
 assert.equal(normalizeEnrollment({...base,tuitionFee:""}).tuitionFee,null);
 assert.equal(manualTotals({tuitionFee:"",paid:"100"}).paymentStatus,"Fee not set");
 assert.equal(manualTotals({tuitionFee:0,paid:0}).paymentStatus,"Paid");
 assert.throws(()=>paymentPatch({...base,...blank},1),/Set the tuition fee/);
});
test("sheet row uses canonical enrollment identity and version",async()=>{
 const record={...base,studentCode:"S1",paymentStatus:"Unpaid"};
 const row=sheetRow("german-A2","student1",record);assert.equal(row[0],"student1:german-A2");assert.equal(row[8],3000);assert.equal(row[14],1);
 await assert.rejects(syncEnrollmentSheet({id:"german-A2",studentId:"student1",record,url:"https://example.com",secret:"test",fetchImpl:async()=>({ok:true,json:async()=>({ok:true})})}),/acknowledge/);
 await syncEnrollmentSheet({id:"german-A2",studentId:"student1",record,url:"https://example.com",secret:"test",fetchImpl:async(url,options)=>{assert.deepEqual(JSON.parse(options.body).row,row);return {ok:true,json:async()=>({ok:true,action:"upsertLevelEnrollment"})};}});
});

test("missing sheet credentials leave core enrollment API deployable",async()=>{
 const fs=require("node:fs");
 const patch=fs.readFileSync("scripts/patchStudentUpgradePaymentDriven.mjs","utf8");
 assert.doesNotMatch(patch,/secrets:\[levelEnrollmentSyncSecret\]/);
 const {syncEnrollmentRef}=require("../functions/levelEnrollmentSheetSync");
 const result=await syncEnrollmentRef({ref:{get:async()=>({exists:true,data:()=>({sheetVersion:1,sheetSyncStatus:"pending"})})},url:"",secret:""});
 assert.equal(result.status,"not_configured");
});

test("manual historical totals do not require legacy reconciliation or reference",()=>{
 assert.deepEqual(manualTotals({tuitionFee:"3000",paid:"2000"}),{tuitionFee:3000,paid:2000,balanceDue:1000,paymentStatus:"Partially Paid"});
 assert.equal(manualTotals({tuitionFee:3000,paid:3000}).paymentStatus,"Paid");
 assert.equal(manualTotals({tuitionFee:3000}).balanceDue,3000);
 assert.throws(()=>manualTotals({tuitionFee:3000,paid:3100}),/cannot exceed/);
 assert.throws(()=>manualTotals({tuitionFee:3000,paid:-1}));
 const next=paymentPatch({...base,...manualTotals({tuitionFee:3000,paid:2000})},1000);
 assert.equal(next.paid,3000);assert.equal(next.balanceDue,0);
});

test("enrollment sync configuration can use existing Firebase runtime configuration",()=>{
 const {resolveEnrollmentSyncConfig}=require("../functions/levelEnrollmentSheetSync");
 const env={CLOUD_RUNTIME_CONFIG_B64:Buffer.from(JSON.stringify({level_enrollment:{url:"https://example.com",secret:"test"}})).toString("base64")};
 assert.deepEqual(resolveEnrollmentSyncConfig(env),{url:"https://example.com",secret:"test"});
 assert.deepEqual(resolveEnrollmentSyncConfig({}),{url:"",secret:""});
});

const {legacyCourseCandidates,legacyCourseRecord}=require("../functions/studentLevelEnrollments");
const dualLegacy={program:"swahili",level:"B1",className:"B1 Bonn Klasse",paid:3000,balance:0,tuitionFee:3000,contractStart:"2026-08-01",contractEnd:"2027-01-31",secondaryProgram:"german",coursePlacements:{german:{level:"B1",className:"German class"}}};
const edited=(c,extra={})=>({revision:c.revision,accessType:"paid",contractStart:"2026-08-01",contractEnd:"2099-01-31",paymentDeadline:c.paymentDeadline,...extra});
test("existing dual courses retain their independent balances and dates",()=>{
 const [sw,de]=legacyCourseCandidates(dualLegacy);
 assert.equal(sw.id,"swahili-B1");assert.equal(de.id,"german-B1");assert.equal(de.paid,null);assert.equal(de.contractEnd,"");assert.equal(de.canPaid,false);
 const result=legacyCourseRecord(sw,edited(sw));
 assert.equal(result.program,"swahili");assert.equal(result.className,"B1 Bonn Klasse");assert.equal(result.paid,3000);assert.equal(result.contractEnd,"2099-01-31");assert.equal(result.status,"active");
 assert.equal(dualLegacy.contractEnd,"2027-01-31");
});
test("an explicit complimentary choice never borrows or erases other course payments",()=>{
 const [sw,de]=legacyCourseCandidates(dualLegacy);
 assert.throws(()=>legacyCourseRecord(sw,edited(sw,{accessType:"complimentary",confirmComplimentary:true})),/Confirm complimentary/);
 assert.throws(()=>legacyCourseRecord(de,edited(de,{accessType:"complimentary"})),/Confirm complimentary/);
 const free=legacyCourseRecord(de,edited(de,{accessType:"complimentary",confirmComplimentary:true}));
 assert.equal(free.program,"german");assert.equal(free.paid,0);assert.equal(free.tuitionFee,0);assert.equal(free.balanceDue,0);assert.equal(free.paymentStatus,"Complimentary");
});
test("legacy edits reject duplicate, changed, institutional and ambiguous records",()=>{
 assert.deepEqual(legacyCourseCandidates(dualLegacy,[{id:"swahili-B1"},{id:"german-B1"}]),[]);
 const [sw]=legacyCourseCandidates(dualLegacy);
 assert.throws(()=>legacyCourseRecord(sw,edited(sw,{revision:"old"})),/changed/);
 const [institution]=legacyCourseCandidates({...dualLegacy,institutionId:"university-hamburg"});
 assert.throws(()=>legacyCourseRecord(institution,edited(institution)),/Institutional/);
 const [bad]=legacyCourseCandidates({...dualLegacy,paid:2000});
 assert.throws(()=>legacyCourseRecord(bad,edited(bad)),/do not reconcile/);
 assert.deepEqual(legacyCourseCandidates({...dualLegacy,accountType:"exam_only"}),[]);
});
test("legacy partial payment requires deadline and keeps original paid total",()=>{
 const [row]=legacyCourseCandidates({...dualLegacy,paid:1500,balance:1500});
 assert.throws(()=>legacyCourseRecord(row,edited(row)),/deadline/);
 const saved=legacyCourseRecord(row,edited(row,{paymentDeadline:"2099-01-01"}));
 assert.equal(saved.paid,1500);assert.equal(saved.balanceDue,1500);
 assert.throws(()=>legacyCourseRecord(row,edited(row,{contractStart:"2099-02-01",paymentDeadline:"2099-01-01"})),/precedes/);
});
