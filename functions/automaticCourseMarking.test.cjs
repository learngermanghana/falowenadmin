const { test } = require('node:test');
const assert = require('node:assert/strict');
const { eligible, releasable, idForPath, createScoreSyncWorker } = require('./automaticCourseMarking');
test('only course submissions at A1/A2/B1 are eligible', () => {
  for (const level of ['A1','A2','B1']) assert.equal(eligible({status:'submitted'},level,`${level}-12.1`), true);
  for (const s of [{status:'draft'}, {mockAttemptId:'mock'}, {type:'exam-speaking'}]) assert.equal(eligible(s,'A1','A1-12.1'),false);
  assert.equal(eligible({},'B2','B2-12.1'),false);
  assert.equal(eligible({},'A1','B1-12.1'),false);
});
test('release requires a valid, confident result with no review flags', () => {
  const good = {status:'marked', finalScore:80, confidence:0.95};
  assert.equal(releasable(good),true);
  assert.equal(releasable({...good,finalScore:0}),true);
  for (const patch of [{finalScore:null},{finalScore:'oops'},{confidence:0.4},{status:'needs_review'},
    {consistencyWarnings:['missing part']},{reviewReasons:[{code:'disagreement'}]},
    {secondExaminer:{requiresTutorReview:true}}]) assert.equal(releasable({...good,...patch}),false);
});
test('job identity is stable across repeated deliveries and distinct across paths', () => {
  assert.equal(idForPath('submissions/a'),idForPath('submissions/a'));
  assert.notEqual(idForPath('submissions/A1/posts/a'),idForPath('submissions/A2/posts/a'));
});
test('sheet retries use the saved result and stable upsert identity, not AI', async () => {
  let data={status:'pending',attempts:0,scorePath:'scores/s',row:{score:20}};
  const ref={id:'sync1',get:async()=>({data:()=>data}),set:async patch=>Object.assign(data,patch)};
  let calls=0; let payload;
  const db={doc:()=>({get:async()=>({exists:true,data:()=>({score:90,studentcode:'s',assignment_id:'A1-1.1'})})}),batch:()=>({set(){},commit:async()=>{data.status='synced';}})};
  const worker=createScoreSyncWorker({db,config:()=>({url:'https://example.test',token:'secret'}),post:async(_url,opts)=>{
    calls++; payload=JSON.parse(opts.body);
    if(calls===1) throw Error('offline');
    return {ok:true,json:async()=>({ok:true,mode:'upsert'})};
  }});
  await assert.rejects(worker({data:{ref}}),/offline/);
  assert.equal(data.status,'pending');
  await worker({data:{ref}});
  assert.equal(payload.rows[0].score,90);
  assert.equal(payload.event_id,'sync1');
  await worker({data:{ref}});
  assert.equal(calls,2);
});

function memoryDb(initial) {
  const rows = new Map(Object.entries(initial));
  const ref = path => ({path,id:path.split('/').at(-1),get:async()=>snapshot(path),set:async(data,opts)=>put(path,data,opts)});
  const snapshot = path => ({ref:ref(path),id:path.split('/').at(-1),exists:rows.has(path),data:()=>rows.get(path)});
  const put = (path,data,opts) => rows.set(path,opts?.merge ? {...rows.get(path),...data}:data);
  const db={
    doc:ref,
    collection:path=>({
      doc:id=>ref(`${path}/${id}`),
      where:(field,_operator,value)=>({
        limit:()=>({get:async()=>({docs:[...rows.keys()]
          .filter(k=>k.startsWith(path+'/') && rows.get(k)?.[field]===value)
          .slice(0,1).map(snapshot)})}),
      }),
    }),
    runTransaction:async work=>{
    const pending=[];
    const tx={get:r=>r.get(),set:(r,d,o)=>pending.push(()=>put(r.path,d,o)),create:(r,d)=>pending.push(()=>{assert.equal(rows.has(r.path),false);put(r.path,d);})};
    const result=await work(tx);pending.forEach(f=>f());return result;
  }};
  return {db,rows,snapshot};
}
const { createCourseMarkingWorker } = require('./automaticCourseMarking');
for (const existing of [false,true]) test(`marking publishes once and preserves tutor score (existing=${existing})`, async()=>{
  const job={automatic:true,submissionPath:'submissions/s1',level:'A1',assignmentKey:'A1-1.1',status:'pending'};
  const store=memoryDb({'markingJobs/j1':job,'submissions/s1':{status:'submitted',studentId:'uid',studentCode:'spoof',submissionText:'Meine Antwort'},
    'students/uid':{studentCode:'real',email:'student@example.test'},...(existing?{'scores/real__A1-1.1':{score:77,source:'manual'}}:{})});
  let marks=0;
  const worker=createCourseMarkingWorker({db:store.db,loadReference:async()=>({parts:[{}],version:'v1'}),mark:async()=>{marks++;return {status:'marked',score:90,finalScore:90,feedback:'Feedback',confidence:.99};}});
  const event={data:store.snapshot('markingJobs/j1')};
  await worker(event);await worker(event);
  assert.equal(marks,1);
  assert.equal(store.rows.get('scores/real__A1-1.1').score,existing?77:90);
  assert.equal(store.rows.get('submissions/s1').markingStatus,existing?'needs_review':'marked');
  assert.equal([...store.rows.keys()].filter(k=>k.startsWith('automaticScoreSync/')).length,existing?0:1);
  const notifications = [...store.rows.entries()].filter(([key])=>key.startsWith('studentNotifications/'));
  assert.equal(notifications.length,existing?0:1);
  if (!existing) {
    const [path, notification] = notifications[0];
    assert.equal(path, `studentNotifications/${idForPath('submissions/s1')}`);
    assert.equal(notification.title, 'Your assignment has been marked');
    assert.equal(notification.score,90);
    assert.equal(notification.studentCode,'real');
    assert.equal(notification.data.route,'/campus/results');
    assert.deepEqual(store.rows.get(`students/uid/notifications/${idForPath('submissions/s1')}`),notification);
  }
  assert.equal(store.rows.get(`aiMarkingAudit/${idForPath('submissions/s1')}`).referenceVersion,'v1');
});
for (const outcome of [{passed:false,writingMinimumMet:false},{writingMinimumMet:false},{passed:true}]) {
  test(`notification follows grading outcome ${JSON.stringify(outcome)}`,async()=>{
    const store=memoryDb({'markingJobs/j':{automatic:true,submissionPath:'submissions/s',level:'A2',assignmentKey:'A2-1.1',status:'pending'},
      'submissions/s':{studentId:'uid',submissionText:'Work'},'students/uid':{studentCode:'real'}});
    await createCourseMarkingWorker({db:store.db,loadReference:async()=>({parts:[{}]}),mark:async()=>({status:'marked',score:80,confidence:.99,...outcome})})({data:store.snapshot('markingJobs/j')});
    const notification=store.rows.get(`studentNotifications/${idForPath('submissions/s')}`);
    assert.equal(notification.status,outcome.passed===true?'passed':'needs_improvement');
    assert.equal(notification.data.status,notification.status);
    assert.match(notification.body,outcome.passed===true?/Passed/:/Needs improvement/);
  });
}
test('missing answer key preserves original work and routes to tutor without score',async()=>{
  const store=memoryDb({'markingJobs/j':{automatic:true,submissionPath:'submissions/s',level:'A2',assignmentKey:'A2-1.1',status:'pending'},
    'submissions/s':{studentId:'uid',submissionText:'Work'},'students/uid':{studentCode:'real'}});
  await createCourseMarkingWorker({db:store.db,loadReference:async()=>null,mark:async()=>assert.fail('must not mark without key')})({data:store.snapshot('markingJobs/j')});
  assert.equal(store.rows.get('submissions/s').submissionText,'Work');
  assert.equal(store.rows.get('submissions/s').markingStatus,'needs_review');
  assert.equal([...store.rows.keys()].some(k=>k.startsWith('scores/')),false);
  assert.equal([...store.rows.keys()].some(k=>k.startsWith('studentNotifications/')),false);
});
for (const title of [true, 'TRUE', undefined, 'A1 · Day 1 · Grüße']) test(`automatic export uses a real assignment title (${title})`,async()=>{
  const store=memoryDb({'markingJobs/j':{automatic:true,submissionPath:'submissions/s',level:'A1',assignmentKey:'A1-1.1',status:'pending'},
    'submissions/s':{studentId:'uid',submissionText:'Work',assignment:true,assignmentTitle:title},'students/uid':{studentCode:'real'}});
  await createCourseMarkingWorker({db:store.db,loadReference:async()=>({parts:[{}],title:'Reference title'}),mark:async()=>({status:'marked',score:80,confidence:.99})})({data:store.snapshot('markingJobs/j')});
  const expected=typeof title==='string' && title!=='TRUE'?title:'Reference title';
  assert.equal(store.rows.get('scores/real__A1-1.1').assignment,expected);
  assert.equal(store.rows.get(`automaticScoreSync/${idForPath('submissions/s')}`).row.assignment,expected);
});

for (const shape of ['nested','uid']) test(`resolves server-owned student identity for ${shape} submissions`,async()=>{
 const path=shape==='nested'?'submissions/A2/real/nested1':'submissions/flatUid';
 const store=memoryDb({'markingJobs/j':{automatic:true,submissionPath:path,level:'A2',assignmentKey:'A2-1.1',studentCode:shape==='nested'?'real':'',status:'pending'},
  [path]:{status:'submitted',submissionText:'Meine Antwort',...(shape==='uid'?{uid:'user1'}:{})},
  'students/user1':{studentCode:'real',uid:'user1',email:'test@example.test'}});
 await createCourseMarkingWorker({db:store.db,loadReference:async()=>({parts:[{}]}),mark:async()=>({status:'marked',score:90,finalScore:90,confidence:.99,feedback:'Clear'})})({data:store.snapshot('markingJobs/j')});
 assert.equal(store.rows.get(path).markingStatus,'marked');
 assert.equal(store.rows.get('scores/real__A2-1.1').studentId,'user1');
});
