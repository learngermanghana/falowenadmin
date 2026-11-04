import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {prepareSubmission,emailRow,sendWritingToTutor,registerExamWritingTutorEmail}=require('../functions/examWritingTutorEmail.js');
const user={uid:'example-student',email:'student@example.com',name:'Example Student'};
const body={level:'A2',promptId:'a2-letter-1',promptTitle:'Invitation',draft:'Liebe Anna,\nkommst du am Samstag?\nViele Grüße',aiAssessment:{score:18,maxScore:25,feedback:'Clear letter',corrections:[{original:'kommst',suggestion:'Kommst'}],improvedVersion:'Liebe Anna, ...'}};
const config={url:'https://example.com/email',token:'test'};
function database(){const values=new Map();return {values,collection:name=>({doc:id=>({key:name+'/'+id,async set(value){values.set(this.key,{...values.get(this.key),...value});}})}),async runTransaction(fn){return fn({get:async ref=>({exists:values.has(ref.key),data:()=>values.get(ref.key)}),set:(ref,v)=>values.set(ref.key,{...values.get(ref.key),...v})});}};}
test('full original letter and every assessment field are retained; recipient and identity cannot be supplied by client',()=>{
 const r=prepareSubmission(user,{...body,studentEmail:'intruder@example.com',email:'other@example.com'});
 assert.equal(r.studentEmail,user.email);assert.equal(r.draft,body.draft);assert.deepEqual(r.aiAssessment,body.aiAssessment);
 const row=emailRow(r);assert.equal(row.email,'learngermanghana@gmail.com');assert.match(row.announcement,/COMPLETE AI ASSESSMENT/);assert.match(row.announcement,/improvedVersion/);
 assert.ok(!emailRow({...r,draft:'<img src=x onerror=alert(1)>'}).announcement.includes('<img'));
 assert.throws(()=>prepareSubmission({uid:'guest',firebase:{sign_in_provider:'anonymous'}},body),/Sign in/);
 assert.throws(()=>prepareSubmission(user,{...body,aiAssessment:null}),/assessment/);
});
test('successful delivery keeps saved full content and repeated clicks do not email twice',async()=>{
 const db=database();let calls=0;
 const fetchImpl=async(url,opts)=>{calls++;const payload=JSON.parse(opts.body);assert.equal(payload.rows[0].email,'learngermanghana@gmail.com');assert.ok(payload.event_id);return {ok:true,json:async()=>({ok:true,count:1})};};
 const opts={db,user,body,config,fetchImpl,now:1000000};
 const r=await sendWritingToTutor(opts);assert.equal(r.emailed,true);
 assert.equal((await sendWritingToTutor(opts)).duplicate,true);assert.equal(calls,1);
 assert.deepEqual(db.values.get('examTutorReviewQueue/'+r.id).aiAssessment,body.aiAssessment);
});
test('failed email keeps letter and a later click retries the same record',async()=>{
 const db=database();const opts={db,user,body,config,now:1000000};
 await assert.rejects(()=>sendWritingToTutor({...opts,fetchImpl:async()=>({ok:false,json:async()=>({ok:false})})}),/saved/);
 const id=prepareSubmission(user,body).id;
 assert.equal(db.values.get('examTutorReviewQueue/'+id).draft,body.draft);
 assert.equal(db.values.get('examTutorReviewQueue/'+id).tutorEmailDelivery.status,'failed');
 const result=await sendWritingToTutor({...opts,fetchImpl:async()=>({ok:true,json:async()=>({ok:true})})});assert.equal(result.id,id);
});
test('missing config and invalid authentication never send email',async()=>{
 await assert.rejects(()=>sendWritingToTutor({db:database(),user,body,config:{}}),/configured/);
 let handler;registerExamWritingTutorEmail({app:{post:(path,fn)=>{handler=fn;}},db:database(),verifyToken:async()=>{throw Error('bad token');}});
 const res={status(code){this.code=code;return this;},json(){return this;}};await handler({headers:{authorization:'Bearer invalid'},body},res);assert.equal(res.code,401);
});
test('active send lease and daily cap reject extra delivery without touching the saved record',async()=>{
 const db=database();const record=prepareSubmission(user,body);
 db.values.set('examTutorReviewQueue/'+record.id,{...record,tutorEmailDelivery:{status:'sending',startedAt:1000000}});
 await assert.rejects(()=>sendWritingToTutor({db,user,body,config,now:1000010}),/already being sent/);
 const crypto=require('node:crypto');const id=crypto.createHash('sha256').update(user.uid).digest('hex');
 db.values.delete('examTutorReviewQueue/'+record.id);
 db.values.set('examWritingTutorEmailLimits/'+id,{day:'1970-01-01',count:20});
 await assert.rejects(()=>sendWritingToTutor({db,user,body,config,now:1000000}),/limit reached/);
});
