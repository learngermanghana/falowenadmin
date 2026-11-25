const {test}=require("node:test");
const assert=require("node:assert/strict");
const {readCleanupCandidate,hasTrialHistory,hasConversion}=require("../enrollmentCleanupProtection");
function ref({rows=[],profiles=[{status:"trial_expired",uid:"student-auth"},{status:"trial_expired",uid:"student-auth"}],fail=false,examRows={},examFail=false}={}) {
 let i=0;
 const db={collection:name=>({where:(field,op,value)=>{
  assert.equal(op,"==");
  const query={limit:()=>query,get:async()=>{
   if(examFail)throw Error("exam unavailable");
   const matches=(examRows[name]||[]).filter(row=>row[field]===value);
   return {empty:!matches.length,docs:matches.map(row=>({data:()=>row}))};
  }};return query;
 }})};
 return {id:"student-doc",firestore:db,get:async()=>{const data=profiles[Math.min(i++,profiles.length-1)];return {exists:!!data,data:()=>data};},
 collection:name=>{assert.equal(name,"levelEnrollments");return {limit:n=>{assert.equal(n,1);return {get:async()=>{if(fail)throw Error("unavailable");return {empty:!rows.length};}};}};}};
}
const due=s=>s.status==="trial_expired"&&!hasConversion(s);
test("genuine unpaid trial remains eligible",async()=>assert.ok(await readCleanupCandidate(ref(),due)));
for(const row of [{status:"active",paid:2000},{status:"expired",paid:3000},{status:"planned"},{status:"cancelled"},{}]){
 test("protect ledger "+JSON.stringify(row),async()=>assert.equal(await readCleanupCandidate(ref({rows:[row]}),due),null));
}
test("payment conversion during eligibility check prevents deletion",async()=>assert.equal(await readCleanupCandidate(ref({profiles:[{status:"trial_expired"},{status:"trial_expired",trialConvertedAt:"2026-11-25"}]}),due),null));
test("failed ledger read fails closed",async()=>assert.rejects(readCleanupCandidate(ref({fail:true}),due),/unavailable/));
test("missing trial dates still protect marked trials from generic cleanup",()=>{assert.equal(hasTrialHistory({status:"trial_expired"}),true);assert.equal(hasTrialHistory({trialPurgeAt:"2026-12-01"}),true);assert.equal(hasTrialHistory({status:"active"}),false);});

test("expired course trial with independent paid A2 purchase is retained",async()=>assert.equal(await readCleanupCandidate(ref({examRows:{mockPurchases:[{uid:"student-auth",studentId:"student-doc",level:"A2",scope:"level",status:"active",reference:"synthetic-99"}]}}),due),null));
test("purchase linked by student document ID protects a missing or changed UID",async()=>assert.equal(await readCleanupCandidate(ref({examRows:{mockPurchases:[{uid:"old-uid",studentId:"student-doc",level:"A2"}]}}),due),null));
test("standalone paid subscription protects account even without purchase record",async()=>assert.equal(await readCleanupCandidate(ref({examRows:{mockSubscriptions:[{uid:"student-auth",scope:"level",level:"A2",status:"active"}]}}),due),null));
test("free exam trial does not indefinitely protect ordinary unpaid signup",async()=>assert.ok(await readCleanupCandidate(ref({examRows:{mockSubscriptions:[{uid:"student-auth",scope:"trial",status:"expired"}]}}),due)));
test("pending paid-exam checkout is retained for payment reconciliation",async()=>assert.equal(await readCleanupCandidate(ref({examRows:{mockOrders:[{studentId:"student-doc",status:"pending",level:"A2"}]}}),due),null));
test("rejected checkout is not a paid entitlement",async()=>assert.ok(await readCleanupCandidate(ref({examRows:{mockOrders:[{studentId:"student-doc",status:"rejected"}]}}),due)));
test("secondary complimentary placement protects account",async()=>assert.equal(await readCleanupCandidate(ref({profiles:[{status:"trial_expired",secondaryProgram:"swahili",coursePlacements:{swahili:{accessType:"complimentary",contractEnd:"2027-02-01"}}}]}),due),null));
test("exam ledger read failure prevents destructive cleanup",async()=>assert.rejects(readCleanupCandidate(ref({examFail:true}),due),/exam unavailable/));
