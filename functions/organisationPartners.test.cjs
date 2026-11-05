const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fixture,seedPartner}=require('./partnershipTestFixture.cjs');
const {registerOrganisationPartnerRoutes,prepareLegacyPartner,idForEmail,nameKey}=require('./organisationPartners');
const {registerOrganisationEnrolmentRoutes}=require('./organisationEnrolment');
const registration={name:'Example Academy',contactName:'Coordinator',phone:'0200000000',address:'Accra'};
function setup(){const f=fixture();registerOrganisationPartnerRoutes(f.app,f);return f;}
test('all partner data and profile writes require verified identity',async()=>{
 const f=setup();for(const path of ['/organisation-partners/me','/organisation-partners/register','/organisation-partners/contact','/organisation-partners/submissions','/organisation-partners/agreement-copy']) assert.equal((await f.call(path,registration)).status,401);
 f.admin.auth=()=>({verifyIdToken:async()=>({uid:'x',email:'x@example.test',email_verified:false})});
 assert.equal((await f.call('/organisation-partners/me',{},'partner')).status,403);
});
test('owner-only activation cannot be requested by public or a partner',async()=>{
 const f=setup();assert.equal((await f.call('/admin/organisation-partners/prepare',{email:'partner@example.test'})).status,401);
 assert.equal((await f.call('/admin/organisation-partners/prepare',{email:'partner@example.test'},'partner')).status,403);
});
test('new verified login creates one profile and stable membership, not students',async()=>{
 const f=setup();let response=await f.call('/organisation-partners/register',registration,'partner');assert.equal(response.status,200);
 const id=response.result.profile.id;
 assert.equal((await f.call('/organisation-partners/register',registration,'partner')).result.profile.id,id);
 assert.equal([...f.data.keys()].filter(key=>key.startsWith('organisationPartners/')).length,1);
 assert.ok(![...f.data.keys()].some(key=>key.startsWith('students/')));
});
test('changing a contact phone keeps the permanent profile and login email',async()=>{
 const f=setup();const id=seedPartner(f);
 assert.equal((await f.call('/organisation-partners/contact',{contactName:'New coordinator',phone:'0200000099',email:'attacker@example.test',organisationId:'injected'},'partner')).status,200);
 const response=await f.call('/organisation-partners/me',{},'partner');
 assert.equal(response.result.profile.id,id);assert.equal(response.result.profile.phone,'0200000099');assert.equal(response.result.profile.email,'partner@example.test');
});
test('company name or claimed ID cannot read a different company or its signed PDF',async()=>{
 const f=setup();seedPartner(f);const other=seedPartner(f,{email:'other@example.test',uid:'other-user',name:'Other school'});
 f.data.set('partnershipPrivate/'+other,{pendingPdf:Buffer.from('PRIVATE OTHER').toString('base64')});
 const result=await f.call('/organisation-partners/agreement-copy',{organisationId:other},'partner');assert.equal(result.status,404);
 f.data.get('organisationPartnerMembers/partner-user').organisationId=other;
 assert.equal((await f.call('/organisation-partners/me',{},'partner')).status,403);
});
test('existing histories cannot be claimed by simply creating a new profile',async()=>{
 const f=setup();f.data.set('organisationEnrolments/legacy',{organisation:{email:'partner@example.test',name:'Old School'}});
 assert.equal((await f.call('/organisation-partners/register',registration,'partner')).status,409);
});
test('duplicate names are blocked for review without automatic membership transfer',async()=>{
 const f=setup();f.data.set('organisationPartnerNames/'+nameKey(registration.name),{organisationId:'another'});
 assert.equal((await f.call('/organisation-partners/register',{...registration,name:'Example ACADEMY!'},'partner')).status,409);
 assert.ok(!f.data.has('organisationPartnerMembers/partner-user'));
});
test('exact historical company names with another email also require manual review',async()=>{
 const f=setup();f.data.set('organisationEnrolments/legacy',{organisation:{email:'other@example.test',name:registration.name}});
 assert.equal((await f.call('/organisation-partners/register',registration,'partner')).status,409);
});
test('history is bounded and restricted to the verified partner, including legacy batches',async()=>{
 const f=setup();const id=seedPartner(f);
 for(const [key,email] of [['old','partner@example.test'],['other','other@example.test']]) f.data.set('organisationEnrolments/'+key,{organisation:{email},students:[{name:key,level:'A1',status:'approved',phone:'private',uid:'never expose'}]});
 f.data.set('organisationEnrolments/deleted',{organisation:{email:'partner@example.test'},deleted:true});
 const response=await f.call('/organisation-partners/submissions',{organisationId:'other'},'partner');assert.equal(response.status,200);
 assert.deepEqual(response.result.submissions,[{id:'old',students:[{name:'old',level:'A1',status:'approved'}]}]);
});
test('disabled membership and changed unverified login email deny access',async()=>{
 const f=setup();seedPartner(f);f.data.get('organisationPartnerMembers/partner-user').disabled=true;
 assert.equal((await f.call('/organisation-partners/me',{},'partner')).status,403);
});
test('legacy account preparation is repeat-safe and preserves all original records',async()=>{
 const f=setup();const org={name:'Old School',email:'partner@example.test',contactName:'Old contact',phone:'0200000000'};
 f.data.set('organisationEnrolments/old',{organisation:org,students:[{name:'Existing',status:'approved',studentId:'keep'}]});
 f.data.set('students/keep',{uid:'keep',paid:3000,contractEnd:'2027-01-01'});
 const before=structuredClone([...f.data]);let creates=0;
 let created=null;
 f.admin.auth=()=>({getUserByEmail:async()=>{if(created)return created;throw Object.assign(new Error(),{code:'auth/user-not-found'});},createUser:async data=>{creates++;assert.ok(data.password.length>40);created={uid:'prepared',email:data.email};return created;}});
 const deps={...f,email:org.email,actor:{uid:'owner'}};
 const first=await prepareLegacyPartner(deps),second=await prepareLegacyPartner(deps);
 assert.equal(first.organisationId,idForEmail(org.email));assert.equal(first.organisationId,second.organisationId);assert.equal(creates,1);
 assert.equal(f.data.get('organisationPartnerMembers/prepared').organisationId,first.organisationId);
 for(const [key,value] of before) assert.deepEqual(f.data.get(key),value);
 assert.ok(!JSON.stringify([...f.data]).includes('password'));
});
test('legacy preparation reuses existing login without changing credentials or roles',async()=>{
 const f=setup();seedPartner(f);let updated=false;
 f.admin.auth=()=>({getUserByEmail:async()=>({uid:'partner-user',email:'partner@example.test',customClaims:{role:'student'}}),createUser:()=>assert.fail(),updateUser:()=>{updated=true;}});
 await prepareLegacyPartner({...f,email:'partner@example.test',actor:{uid:'owner'}});assert.equal(updated,false);
});
test('request ID replay from another organisation cannot return success',async()=>{
 const f=setup();seedPartner(f);registerOrganisationEnrolmentRoutes(f.app,f);
 const id='12345678-1234-1234-1234-123456789012';f.data.set('organisationEnrolments/'+id,{organisationId:'other'});
 const result=await f.call('/organisation-enrolments',{requestId:id,consent:true,students:[{name:'Learner',email:'learner@example.test',phone:'123',level:'A1'}]},'partner');assert.equal(result.status,409);
});
test('partner-only membership does not grant campus course access',async()=>{
 const f=setup();await f.call('/organisation-partners/register',registration,'partner');
 assert.equal(f.data.get('organisationPartnerMembers/partner-user').courseAccessAllowed,false);
});
test('existing UID-linked student retains course access when registering a company',async()=>{
 const f=setup();f.data.set('students/real',{uid:'partner-user',email:'partner@example.test'});
 await f.call('/organisation-partners/register',registration,'partner');
 assert.equal(f.data.get('organisationPartnerMembers/partner-user').courseAccessAllowed,true);
});
