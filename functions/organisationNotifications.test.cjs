const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture, seedPartner } = require('./partnershipTestFixture.cjs');
const { notify, message } = require('./organisationNotifications');
const { registerReferralRoutes } = require('./referralProgramme');
test('approval sends welcome once; rejection and unauthenticated requests send nothing', async () => {
 const f = fixture(), id = seedPartner(f, {status:'pending'}); let sends=0;
 registerReferralRoutes(f.app,{...f,sendNotification: args=>notify({...args,send:async()=>{sends++;}})});
 assert.equal((await f.call('/admin/referrals/applications/:id',{status:'approved'},false,id)).status,401);
 await f.call('/admin/referrals/applications/:id',{status:'approved'},true,id);
 await f.call('/admin/referrals/applications/:id',{status:'approved'},true,id);
 assert.equal(sends,1);
 assert.equal(f.data.get('referralApplications/'+id).welcomeEmail.status,'sent');
 const g=fixture(), rejected=seedPartner(g,{status:'pending'});
 registerReferralRoutes(g.app,{...g,sendNotification:async()=>{throw Error('must not send');}});
 assert.equal((await g.call('/admin/referrals/applications/:id',{status:'rejected'},true,rejected)).status,200);
});
test('failed welcome retains approval, retries, and an active lease prevents overlap', async()=>{
 const f=fixture(), id=seedPartner(f), ref=f.db.collection('referralApplications').doc(id);
 assert.equal((await notify({...f,ref,kind:'welcome',send:async()=>{throw Error('private');}})).status,'failed');
 assert.equal((await ref.get()).data().status,'approved');
 let payload;
 await notify({...f,ref,kind:'welcome',send:async(_,row)=>{payload=row;}});
 assert.match(payload.announcement,/book-appointment/); assert.match(payload.announcement,/existing partner account/);
 assert.match(payload.announcement,/After Falowen reviews/); assert.equal(payload.allow_bcc_fallback,'FALSE');
 await ref.update({welcomeEmail:{status:'sending',leaseUntil:Date.now()+10000}});
 assert.equal((await notify({...f,ref,kind:'welcome',send:async()=>{throw Error('overlap');}})).status,'unchanged');
});
test('payment link sends once only for pending checkout and preserves financial state',async()=>{
 const f=fixture(),ref=f.db.collection('payments').doc('reference'); let sends=0;
 await ref.set({status:'pending',email:'billing@example.test',authorizationUrl:'https://checkout.paystack.com/test',reference:'reference',checkoutAmount:100});
 const send=async(_,row)=>{sends++;assert.match(row.announcement,/checkout.paystack.com/);};
 await notify({...f,ref,kind:'payment_link',send}); await notify({...f,ref,kind:'payment_link',send});
 assert.equal(sends,1); assert.equal((await ref.get()).data().status,'pending');
 await ref.update({status:'paid',paymentLinkEmail:{status:'failed'}});
 assert.equal((await notify({...f,ref,kind:'payment_link',send})).status,'unchanged');
 assert.equal(message('welcome',{email:'partner@example.test'}).show_app_button,'FALSE');
});
