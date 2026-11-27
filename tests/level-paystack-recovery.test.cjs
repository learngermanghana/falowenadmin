const test=require("node:test");
const assert=require("node:assert/strict");
const {applyEnrollmentCheckout,registerEnrollmentCheckout}=require("../functions/studentLevelEnrollments");
const {syncEnrollmentSheet}=require("../functions/levelEnrollmentSheetSync");
const payment={studentId:"student-test",enrollmentId:"german-A2",reference:"FAL-test-reference",tuitionCredit:1000,checkoutAmount:1010,status:"pending",purpose:"level_enrollment"};
const row={program:"german",level:"A2",accessType:"paid",status:"active",tuitionFee:3000,paid:2000,balanceDue:1000,contractStart:"2026-11-02",contractEnd:"2027-04-26",paymentDeadline:"2026-12-02",sheetVersion:2};
test("replayed paid reference cannot issue another credit",async()=>{
 const result=await applyEnrollmentCheckout({payment:{...payment,status:"paid"}});
 assert.equal(result.duplicate,true);assert.equal(result.enrollmentId,"german-A2");
 const review=await applyEnrollmentCheckout({payment:{...payment,status:"paid_unallocated",allocationError:"Review ledger"}});
 assert.equal(review.requiresAllocation,true);assert.equal(review.allocationError,"Review ledger");
});
test("amount or currency mismatch is rejected before writes",async()=>{
 await assert.rejects(applyEnrollmentCheckout({payment,eventData:{status:"success",currency:"GHS",amount:100000}}),/verification mismatch/);
 await assert.rejects(applyEnrollmentCheckout({payment,eventData:{status:"success",currency:"USD",amount:101000}}),/verification mismatch/);
});
test("confirmed checkout allocates tuition only and stores gross/surcharge under the same reference",async()=>{
 const ref=(path)=>({path,doc:id=>ref(path+"/"+id),collection:id=>ref(path+"/"+id)});
 const db={collection:id=>ref(id)};
 const writes=[];
 const tx={get:async r=>r.path.startsWith("levelPaymentReferences/")?{exists:false}:r.path.includes("levelEnrollments")?{exists:true,data:()=>row}:{exists:true,data:()=>({})},set:(r,data)=>writes.push({path:r.path,data}),update:(r,data)=>writes.push({path:r.path,data})};
 const admin={firestore:{FieldValue:{serverTimestamp:()=>"stamp"}}};
 const result=await applyEnrollmentCheckout({transaction:tx,db,admin,paymentRef:ref("payments/"+payment.reference),payment,eventData:{status:"success",currency:"GHS",amount:101000,paid_at:"2026-11-27T16:46:00Z",id:1}});
 assert.equal(result.nextBalance,0);
 const level=writes.find(x=>x.path==="students/student-test/levelEnrollments/german-A2").data;
 assert.equal(level.paid,3000);assert.equal(level.sheetVersion,3);assert.equal(level.sheetSyncStatus,"pending");
 const record=writes.find(x=>x.path.startsWith("levelPaymentReferences/")).data;
 assert.equal(record.amount,1000);assert.equal(record.checkoutAmount,1010);assert.equal(record.processingSurcharge,10);
});
test("manual recovery rejects a reference belonging to another student before verification",async()=>{
 const routes=new Map();
 const app={post:(p,h)=>routes.set(p,h)};
 const db={collection:()=>({doc:()=>({get:async()=>({exists:true,id:payment.reference,data:()=>payment})})})};
 registerEnrollmentCheckout({app,db,requirePaymentAdmin:async()=>({uid:"admin"}),verifyPaystackTransaction:async()=>{throw Error("must not verify another student's reference")}});
 let code=200,body;
 const res={status(n){code=n;return this;},json(v){body=v;return this;}};
 await routes.get("/payments/reconcile-enrollment/:studentId")({params:{studentId:"different-student"},body:{reference:payment.reference}},res);
 assert.equal(code,404);assert.match(body.error,/No matching level payment link/);
});
test("new sheet payload requires explicit acknowledgment of both mirrors",async()=>{
 const base={id:"german-A2",studentId:"student-test",record:{...row,paid:3000,balanceDue:0,paymentStatus:"Paid"},url:"https://example.com",secret:"test",primaryPayment:{studentCode:"student-test",level:"A2",paid:3000,balance:0},levelPayments:[[payment.reference,"student-test","german-A2","german","A2",1000,10,1010,"GHS","2026-11-27","Paid"]]};
 const ack=(extra={})=>async()=>({ok:true,json:async()=>({ok:true,action:"upsertLevelEnrollment",...extra})});
 await assert.rejects(syncEnrollmentSheet({...base,fetchImpl:ack()}),/Main student sheet did not acknowledge/);
 await assert.rejects(syncEnrollmentSheet({...base,fetchImpl:ack({primaryPaymentSynced:true})}),/ledger did not acknowledge/);
 await syncEnrollmentSheet({...base,fetchImpl:async(url,opts)=>{const payload=JSON.parse(opts.body);assert.equal(payload.primaryPayment.paid,3000);assert.equal(payload.levelPayments[0][6],10);return ack({primaryPaymentSynced:true,levelPaymentsSynced:true})();}});
});
