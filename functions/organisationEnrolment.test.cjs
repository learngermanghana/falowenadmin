const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateSubmission, owner, reviewRow, registerOrganisationEnrolmentRoutes } = require('./organisationEnrolment.js');
const body = () => ({ organisation: { name:'Example school',contactName:'Coordinator',email:'Coordinator@example.org',phone:'0200000000' }, consent:true,students:[{name:'Example Student',email:'STUDENT@example.org',phone:'0200000001',level:'a1'}] });
test('validates and normalizes a table submission, ignoring privileged fields',()=>{const b=body();b.students[0].status='approved';b.students[0].uid='injected';const r=validateSubmission(b);assert.equal(r.students[0].email,'student@example.org');assert.equal(r.students[0].status,'pending');assert.equal(r.students[0].uid,undefined);assert.equal(r.organisation.email,'coordinator@example.org');});
test('rejects duplicate rows, missing consent, invalid level and oversized batches',()=>{for(const mutate of [b=>b.students.push({...b.students[0]}),b=>b.consent=false,b=>b.students[0].level='X',b=>b.students=Array(51).fill(b.students[0]),b=>b.website='spam']){const b=body();mutate(b);assert.throws(()=>validateSubmission(b),{status:400});}});
test('review requires a verified owner, including token revocation check',async()=>{await assert.rejects(owner({headers:{}},{}),{status:401});let checked=false;const admin={auth:()=>({verifyIdToken:async(token,revoke)=>{checked=revoke;return{email:'other@example.org',email_verified:true};}})};await assert.rejects(owner({headers:{authorization:'Bearer token'}},admin),{status:403});assert.equal(checked,true);});
function fixture({ duplicate=false }={}){const records=new Map([['organisationEnrolments/batch1',{...validateSubmission(body())}]]);const ref=(collection,id)=>({key:`${collection}/${id}`});const db={collection:collection=>({doc:id=>ref(collection,id),where:()=>({limit:()=>({query:true})})}),runTransaction:async fn=>fn({get:async r=>r.query?{empty:!duplicate}:{exists:records.has(r.key),data:()=>structuredClone(records.get(r.key))},create:(r,v)=>{assert.ok(!records.has(r.key));records.set(r.key,v);},update:(r,v)=>records.set(r.key,{...records.get(r.key),...v})})};return{records,db,admin:{firestore:{FieldValue:{serverTimestamp:()=>null}}},batchId:'batch1',index:0,actor:{email:'owner@example.org'}};}
test('approval creates one pending organisation-funded student and marks it for sheet sync',async()=>{const f=fixture();const r=await reviewRow({...f,decision:'approve'});const s=f.records.get(`students/${r.studentId}`);assert.equal(s.billingResponsibility,'organisation');assert.equal(s.status,'pending');assert.equal(s.syncedToSheets,false);assert.equal(s.uid,undefined);assert.equal(s.studentCode,r.studentId);const again=await reviewRow({...f,decision:'approve'});assert.equal(again.studentId,r.studentId);assert.equal(f.records.size,2);});
test('duplicate student email blocks approval without creating another student',async()=>{const f=fixture({duplicate:true});await assert.rejects(reviewRow({...f,decision:'approve'}),{status:409});assert.equal(f.records.size,1);assert.equal(f.records.get('organisationEnrolments/batch1').students[0].status,'pending');});
test('rejection never creates a student account',async()=>{const f=fixture();assert.equal((await reviewRow({...f,decision:'reject'})).status,'rejected');assert.equal(f.records.size,1);});
test('only submission is public; review/list handlers enforce owner auth',async()=>{const routes={};registerOrganisationEnrolmentRoutes({post:(p,h)=>routes[p]=h,get:(p,h)=>routes[p]=h},{db:{},admin:{}});for(const path of ['/admin/organisation-enrolments','/admin/organisation-enrolments/:batchId/review']){let code;let data;const res={set(){},status(s){code=s;return this;},json(v){data=v;}};await routes[path]({headers:{},params:{},body:{}},res);assert.equal(code,401);assert.equal(data.ok,false);}});
test('public submission is idempotent and quota rejects new submissions over its limit',async()=>{const records=new Map();const routes={};const db={collection:c=>({doc:id=>({key:`${c}/${id}`})}),runTransaction:async fn=>fn({get:async r=>({exists:records.has(r.key),data:()=>records.get(r.key)}),create:(r,v)=>records.set(r.key,v),set:(r,v)=>records.set(r.key,v)})};registerOrganisationEnrolmentRoutes({post:(p,h)=>routes[p]=h,get(){}},{db,admin:{firestore:{FieldValue:{serverTimestamp:()=>null}}}});async function submit(id){let status=200,payload;await routes['/organisation-enrolments']({body:{...body(),requestId:id}},{set(){},status(s){status=s;return this;},json(v){payload=v;}});return{status,payload};}const id='12345678-1234-1234-1234-123456789012';assert.equal((await submit(id)).status,200);assert.equal((await submit(id)).status,200);assert.equal([...records.keys()].filter(k=>k.startsWith('organisationEnrolments/')).length,1);const quota=[...records.keys()].find(k=>k.startsWith('organisationEnrolmentLimits/'));assert.equal(records.get(quota).count,1);records.set(quota,{count:10});assert.equal((await submit('22345678-1234-1234-1234-123456789012')).status,429);});
test('delete removes batch personal data, preserves student records, and is repeat-safe',async()=>{
 const {deleteSubmission}=require('./organisationEnrolment.js');const f=fixture();const approved=await reviewRow({...f,decision:'approve'});const student=structuredClone(f.records.get(`students/${approved.studentId}`));
 const original=f.db.runTransaction;f.db.runTransaction=fn=>original(tx=>fn({...tx,set:(r,v)=>f.records.set(r.key,v)}));
 await deleteSubmission(f);await deleteSubmission(f);
 const marker=f.records.get('organisationEnrolments/batch1');assert.equal(marker.deleted,true);assert.equal(marker.organisation,undefined);assert.equal(marker.students,undefined);assert.deepEqual(f.records.get(`students/${approved.studentId}`),student);
 await assert.rejects(reviewRow({...f,decision:'approve'}),{status:404});
});
test('delete endpoint requires verified owner and validates submission references',async()=>{
 const routes={};registerOrganisationEnrolmentRoutes({post:(p,h)=>routes[p]=h,get(){}},{db:{},admin:{}});let code;const res={set(){},status(s){code=s;return this;},json(){}};
 await routes['/admin/organisation-enrolments/:batchId/delete']({headers:{},params:{batchId:'batch1'}},res);assert.equal(code,401);
 const {deleteSubmission}=require('./organisationEnrolment.js');await assert.rejects(deleteSubmission({batchId:'../students',db:{}}),{status:400});
});
test('student lists retain their signed agreement and require its organisation email',async()=>{
 const {fixture:createFixture}=require('./partnershipTestFixture.cjs');const f=createFixture();
 const agreementReference='a'.repeat(64);
 f.data.set('referralApplications/'+agreementReference,{kind:'institutional',signedAt:'2026-11-05T00:00:00Z',status:'pending',email:'coordinator@example.org'});
 registerOrganisationEnrolmentRoutes(f.app,f);
 const requestId='12345678-1234-1234-1234-123456789012';
 const payload={...body(),requestId,agreementReference};
 assert.equal((await f.call('/organisation-enrolments',payload)).status,200);
 assert.equal(f.data.get('organisationEnrolments/'+requestId).agreementReference,agreementReference);
 const mismatch={...payload,requestId:'22345678-1234-1234-1234-123456789012',organisation:{...payload.organisation,email:'other@example.org'}};
 assert.equal((await f.call('/organisation-enrolments',mismatch)).status,409);
});

test('new student lists require class requests and retain them without assigning a confirmed class',async()=>{
 const b={...body(),schemaVersion:2};
 assert.throws(()=>validateSubmission(b),{status:400});
 Object.assign(b.students[0],{requestedClassId:'a1-example',requestedClassName:'A1 Example',requestedClassStartDate:'2027-01-04',className:'injected',contractEnd:'2099-01-01'});
 const validated=validateSubmission(b);
 assert.equal(validated.students[0].requestedClassId,'a1-example');
 assert.equal(validated.students[0].className,undefined);
 const f=fixture();f.records.set('organisationEnrolments/batch1',validated);
 const result=await reviewRow({...f,decision:'approve'});
 const student=f.records.get('students/'+result.studentId);
 assert.equal(student.requestedClassName,'A1 Example');assert.equal(student.requestedClassStartDate,'2027-01-04');
 assert.equal(student.className,'');assert.equal(student.contractEnd,'');
});
