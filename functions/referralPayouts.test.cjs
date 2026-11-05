const {test}=require('node:test');const assert=require('node:assert/strict');
const {fixture}=require('./partnershipTestFixture.cjs');
const {VERSION,hash}=require('./partnershipAgreements');
const {processReferral,verifyTransfer,cancelRefundedCommission,handlePayoutWebhook}=require('./referralPayouts');
function setup(){const f=fixture(),email='learner@example.test',claimId=hash(email),partnerId=hash('partner@example.test');
 f.data.set('students/student',{email,paid:1000});
 f.data.set('referralClaims/'+claimId,{email,partnerId,status:'pending',createdAt:'2026-01-01T00:00:00Z'});
 f.data.set('referralApplications/'+partnerId,{kind:'referral',terms:VERSION,status:'approved',autoPayoutEnabled:true,recipientCode:'RCP_test'});
 f.data.set('payments/first',{studentId:'student',status:'paid',currency:'GHS',tuitionCredit:1000,paidAt:'2026-02-01T00:00:00Z'});
 const proof={receipt:{id:123,reference:'first',status:'success',currency:'GHS',amount:101000,paid_at:'2026-02-01T00:00:00Z',metadata:{studentId:'student',tuitionCredit:1000,paidSoFar:0}},refund:false};
 const calls=[];const api=async(path,args)=>{calls.push({path,args});return {reference:'fal-ref-'+claimId.slice(0,40),currency:'GHS',amount:10000,recipient:{recipient_code:'RCP_test'},status:'success',transfer_code:'TRF_test'};};
 const args={...f,studentId:'student',getSecret:()=> 'secret',isEnabled:()=>true,verify:async()=>proof,api};return {...f,args,claimId,partnerId,proof,calls};}
test('only first verified tuition earns 10%; retries never initiate another transfer',async()=>{
 const f=setup();assert.equal((await processReferral(f.args)).state,'success');assert.equal(f.calls.filter(c=>c.path==='transfer').length,1);
 assert.equal(f.calls[0].args.body.amount,10000);assert.equal(f.data.get('referralClaims/'+f.claimId).commissionMinor,10000);
 assert.equal((await processReferral(f.args)).skipped,'closed_or_already_paid');assert.equal(f.calls.filter(c=>c.path==='transfer').length,1);
});
test('signup, disabled automation, unapproved partner, institutional payments and prior offline cash never transfer',async()=>{
 for(const mutate of [f=>f.data.delete('payments/first'),f=>f.args.isEnabled=()=>false,f=>f.data.get('referralApplications/'+f.partnerId).status='pending',f=>f.data.get('students/student').billingResponsibility='organisation',f=>f.data.get('students/student').paid=1100]){
  const f=setup();mutate(f);await processReferral(f.args);assert.equal(f.calls.length,0);
 }
});
test('refunds prevent transfers and cancel earned commissions with payout history retained',async()=>{
 const f=setup();f.proof.refund=true;await assert.rejects(processReferral(f.args));assert.equal(f.calls.length,0);
 f.proof.refund=false;await processReferral(f.args);await cancelRefundedCommission({...f,reference:'first'});
 const row=f.data.get('referralClaims/'+f.claimId);assert.equal(row.status,'reversed');assert.equal(row.recoveryRequired,true);assert.ok(row.payoutReference);
});
test('ambiguous provider outcome uses verification of the same reference, never another initiation',async()=>{
 const f=setup();f.args.api=async()=>{throw new Error('timeout');};await assert.rejects(processReferral(f.args));
 assert.equal(f.data.get('referralClaims/'+f.claimId).payoutState,'needs_review');f.args.api=async(path,args)=>{assert.notEqual(path,'transfer');return f.args._result;};
 f.args._result={reference:'fal-ref-'+f.claimId.slice(0,40),currency:'GHS',amount:10000,recipient:{recipient_code:'RCP_test'},status:'success'};
 await processReferral(f.args);assert.ok(f.data.get('referralClaims/'+f.claimId).payoutReference);
});
test('transfer validation rejects wrong reference, currency, amount or recipient',()=>{
 const claim={transferReference:'ref',commissionMinor:10000,recipientCode:'RCP_test'},good={reference:'ref',currency:'GHS',amount:10000,recipient:{recipient_code:'RCP_test'},status:'success'};
 assert.equal(verifyTransfer(good,claim),'success');for(const patch of [{reference:'other'},{currency:'USD'},{amount:1},{recipient:'other'}])assert.throws(()=>verifyTransfer({...good,...patch},claim));
});
test('a refund discovered after reserving the commission stops initiation',async()=>{
 const f=setup();let checks=0;f.args.verify=async()=>({...f.proof,refund:++checks>1});
 assert.equal((await processReferral(f.args)).state,'cancelled_refund');assert.equal(f.calls.length,0);assert.equal(f.data.get('referralClaims/'+f.claimId).status,'reversed');
});
test('transfer webhook verifies provider reference, amount and destination before changing the ledger',async()=>{
 const f=setup();await processReferral(f.args);
 const event={event:'transfer.success',data:{reference:'fal-ref-'+f.claimId.slice(0,40)}};
 await assert.rejects(handlePayoutWebhook({...f,event,getSecret:()=> 'secret',api:async()=>({reference:event.data.reference,currency:'GHS',amount:1,recipient:'RCP_test',status:'success'})}));
 assert.equal(await handlePayoutWebhook({...f,event,getSecret:()=> 'secret',api:f.args.api}),true);
 assert.equal(f.data.get('referralClaims/'+f.claimId).payoutState,'success');
});
