const {test}=require("node:test");
const assert=require("node:assert/strict");
const {readCleanupCandidate,hasTrialHistory,hasConversion}=require("../enrollmentCleanupProtection");
function ref({rows=[],profiles=[{status:"trial_expired"},{status:"trial_expired"}],fail=false}={}){
 let i=0;
 return {get:async()=>{const data=profiles[Math.min(i++,profiles.length-1)];return {exists:!!data,data:()=>data};},
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
