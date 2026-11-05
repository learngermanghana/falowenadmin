const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('./partnershipTestFixture.cjs');
const {VERSION,ORGANISATION_VERSION,TERMS,validateApplication,encryptBank,decryptBank,registerAgreementRoutes,buildAgreementPdf,hash}=require('./partnershipAgreements');
const body={kind:'institutional',billingResponsibility:'organisation',name:'Example partner',email:'partner@example.test',phone:'0200000000',address:'Accra',signerName:'Ama Ési',signerRole:'Director',termsVersion:ORGANISATION_VERSION,receiptToken:'a'.repeat(64),consent:true,signatureConsent:true,payoutConsent:true,payoutType:'ghipss',bankCode:'123',accountNumber:'0123456789',accountName:'Example partner'};
test('organisation agreement explains the 10% invoice share and keeps legacy terms separate',()=>{
 assert.equal(TERMS.referral.length,1);assert.match(TERMS.referral[0],/10%/);assert.match(TERMS.referral[0],/A refund cancels the commission\.$/);
 assert.match(TERMS.institutional.join(' '),/10%/);assert.match(TERMS.institutional.join(' '),/first tuition payment/);assert.match(TERMS.institutional.join(' '),/deducted/);assert.ok(!TERMS.institutional.join(' ').includes('normal student signup'));
});
test('organisation consent, current terms, payer choice and typed signature are required',()=>{
 assert.equal(validateApplication(body).bank,null);
 for(const patch of [{signatureConsent:false},{consent:false},{termsVersion:'old'},{signerName:''},{kind:'referral'},{billingResponsibility:'unknown'},{receiptToken:'short'},{website:'spam'}])assert.throws(()=>validateApplication({...body,...patch}));
 assert.equal(validateApplication({...body,kind:'institutional',billingResponsibility:'organisation',payoutConsent:false,accountNumber:''}).bank,null);
});
test('payout account numbers are authenticated-encrypted, never stored in the application summary',()=>{
 const bank={account_number:'0123456789'};const encrypted=encryptBank(bank,'test-secret');
 assert.ok(!JSON.stringify(encrypted).includes(bank.account_number));assert.deepEqual(decryptBank(encrypted,'test-secret'),bank);assert.throws(()=>decryptBank(encrypted,'wrong-secret'));
});
test('save creates an immediate signed immutable receipt; replay is safe and tokens protect download',async()=>{
 const f=fixture();let receivedSignature;
 registerAgreementRoutes(f.app,{...f,getSecret:()=> 'secret',loadSignature:async()=>Buffer.from('private-director-signature'),pdf:async(record,opts)=>{receivedSignature=opts?.signature;return Buffer.from('PDF:'+record.signerName);}});
 const saved=await f.call('/referrals/apply-signed',body);assert.equal(saved.status,200);assert.equal(receivedSignature.toString(),'private-director-signature');
 const id=saved.result.reference, stored=f.data.get('referralApplications/'+id);assert.equal(stored.status,'pending');assert.equal(stored.signatureMethod,'typed-name-with-explicit-consent');assert.ok(!JSON.stringify(stored).includes(body.accountNumber));
 const privateStored=f.data.get('partnershipPrivate/'+id);assert.equal(privateStored.tokenHash,hash(body.receiptToken));assert.ok(privateStored.pendingPdf);
 assert.equal((await f.call('/referrals/apply-signed',body)).status,200);
 assert.equal((await f.call('/referrals/apply-signed',{...body,receiptToken:'b'.repeat(64)})).status,409);
 assert.equal((await f.call('/referrals/agreement-copy',{reference:id,receiptToken:'b'.repeat(64)})).status,404);
 const downloaded=await f.call('/referrals/agreement-copy',{reference:id,receiptToken:body.receiptToken});assert.equal(downloaded.status,200);assert.equal(downloaded.headers['Cache-Control'],'no-store');assert.equal(downloaded.result.toString(),'PDF:'+body.signerName);
 assert.equal((await f.call('/admin/referrals/agreements/:id/copy',{},false,id)).status,401);
});
test('missing Falowen signature fails before accepting a signed application',async()=>{
 const f=fixture();registerAgreementRoutes(f.app,{...f,getSecret:()=> 'secret',loadSignature:async()=>{throw Object.assign(new Error('Configure signature'),{status:503});},pdf:async()=>Buffer.from('PDF')});
 assert.equal((await f.call('/referrals/apply-signed',body)).status,503);assert.equal(f.data.has('referralApplications/'+hash('organisation-v4:'+body.email)),false);
});
test('PDF creation supports Unicode signing names and unsigned samples',async()=>{
 const bytes=await buildAgreementPdf({...body,id:'example',signedAt:'2026-11-05T00:00:00Z',termsSnapshot:TERMS.institutional},{sample:true});assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>10000);
});
