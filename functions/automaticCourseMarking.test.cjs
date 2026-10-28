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
  assert.equal(releasable({...good,finalScore:0}),false);
  assert.equal(releasable({...good,finalScore:59}),false);
  assert.equal(releasable({...good,finalScore:60}),true);
  assert.equal(releasable({...good,passed:false}),false);
  assert.equal(releasable({...good,writingMinimumMet:false}),false);
  assert.equal(releasable({...good,writingScore:null,writingScorePercent:null,maxWritingScore:100}),true);
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
test('speaking sync preserves its separate history identity and marks background export complete', async () => {
  const updates = [];
  const ref = { id: 'speaking-job', get: async () => ({ data: () => ({ source: 'course_speaking_mock', scorePath: 'scores/s', attempts: 0 }) }), set: async () => {} };
  const saved = { score: 69, dedupe_id: 'student__A2-8.22__course_speaking_mock' };
  let payload;
  const db = { doc: path => ({ path, get: async () => ({ exists: true, data: () => saved }) }),
    batch: () => ({ set: (target, patch) => updates.push([target.path, patch]), commit: async () => {} }) };
  await createScoreSyncWorker({ db, config: () => ({ url: 'https://example.test', token: 'secret' }),
    post: async (_url, options) => { payload = JSON.parse(options.body); return { ok: true, json: async () => ({ ok: true, mode: 'upsert' }) }; } })({ data: { ref } });
  assert.equal(payload.rows[0].dedupe_id, saved.dedupe_id);
  assert.ok(updates.some(([path, patch]) => path === 'scores/s' && patch.sheetSyncStatus === 'complete'));
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
  assert.equal(store.rows.get('markingResults/s1').publicationStatus,existing?'awaiting_approval':'published');
  if (existing) assert.match(store.rows.get('markingResults/s1').publicationReviewReasons[0], /existing score/);
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
for (const grade of [90, 60, 59, 40]) test(`A1–B1 score ${grade}/100 follows pass or review policy`, async () => {
  for (const level of ['A1', 'A2', 'B1']) {
    const key = `${level}-7.22`;
    const store = memoryDb({
      'markingJobs/j': { automatic: true, submissionPath: 'submissions/s', level, assignmentKey: key, status: 'pending' },
      'submissions/s': { status: 'submitted', studentId: 'uid', submissionText: 'Teil 3\\n1. B\\n2. B\\n3. B' },
      'students/uid': { studentCode: 'ST1', email: 'student@example.test' },
    });
    await createCourseMarkingWorker({
      db: store.db,
      loadReference: async () => ({ parts: [{}], version: 'v1' }),
      mark: async () => ({ status: 'marked', score: grade, finalScore: grade,
        confidence: 1, writingScore:null, writingScorePercent:null, maxWritingScore:100, objectiveScore: grade, objectiveCorrect: grade / 10,
        objectiveTotal: 10, feedback: 'Review the one incorrect answer.' }),
    })({ data: store.snapshot('markingJobs/j') });
    const review = store.rows.get('markingResults/s');
    if (grade < 60) {
      assert.equal(review.status, 'needs_review');
      assert.equal(review.sentToStudent, false);
      assert.match(review.publicationReviewReasons.join(' '), /Failed assessment/);
      assert.equal(store.rows.has('scores/ST1__' + key), false);
      assert.equal([...store.rows.keys()].some(key => key.startsWith('automaticScoreSync/')), false);
    } else {
      assert.equal(review.status, 'marked');
      assert.equal(review.publicationStatus, 'published');
      assert.equal(review.sentToStudent, true);
      assert.equal(review.publicationReviewReasons.length, 0);
      assert.equal(store.rows.get('scores/ST1__' + key).score, grade);
      assert.equal(store.rows.get('submissions/s').feedbackSentToStudent, true);
    }
  }
});

test('an existing published score for the same submission does not demand re-approval or create duplicate Sheet rows', async () => {
  const path = 'submissions/s';
  const store = memoryDb({
    'markingJobs/j': { automatic: true, submissionPath: path, level: 'B1', assignmentKey: 'B1-7.22', status: 'pending' },
    [path]: { status: 'submitted', studentId: 'uid', submissionText: 'TEIL 3\\n1. B\\n2. B\\n3. B' },
    'students/uid': { studentCode: 'ST1', email: 'student@example.test' },
    'scores/ST1__B1-7.22': { source: 'automatic_course_marking', score: 90,
      submissionPath: path, comments: 'Original saved feedback', sheetSaved: true },
  });
  await createCourseMarkingWorker({
    db: store.db,
    loadReference: async () => ({ parts: [{}], version: 'v1' }),
    mark: async () => ({ status: 'marked', score: 90, finalScore: 90, confidence: 1,
      feedback: 'A duplicate explanation from a replay' }),
  })({ data: store.snapshot('markingJobs/j') });
  const review = store.rows.get('markingResults/s');
  assert.equal(review.status, 'marked');
  assert.equal(review.publicationStatus, 'published');
  assert.equal(review.sentToStudent, true);
  assert.equal(store.rows.get('scores/ST1__B1-7.22').comments, 'Original saved feedback');
  assert.equal(store.rows.get(path).aiFeedback, 'Original saved feedback');
  assert.equal([...store.rows.keys()].filter(key => key.startsWith('automaticScoreSync/')).length, 0);
  assert.equal([...store.rows.keys()].filter(key => key.startsWith('studentNotifications/')).length, 0);
});

test('a manual correction of the same submission is never replaced by the automatic 90/100 result', async () => {
  const path = 'submissions/s';
  const store = memoryDb({
    'markingJobs/j': { automatic: true, submissionPath: path, level: 'B1', assignmentKey: 'B1-7.22', status: 'pending' },
    [path]: { status: 'submitted', studentId: 'uid', submissionText: 'TEIL 3\\n1. B\\n2. B\\n3. B' },
    'students/uid': { studentCode: 'ST1', email: 'student@example.test' },
    'scores/ST1__B1-7.22': { source: 'automatic_course_marking', score: 90,
      submissionPath: path, reviewedByTutor: true, comments: 'Teacher correction' },
  });
  await createCourseMarkingWorker({
    db: store.db,
    loadReference: async () => ({ parts: [{}], version: 'v1' }),
    mark: async () => ({ status: 'marked', score: 90, finalScore: 90, confidence: 1,
      feedback: 'Automated feedback' }),
  })({ data: store.snapshot('markingJobs/j') });
  assert.equal(store.rows.get('markingResults/s').publicationStatus, 'awaiting_approval');
  assert.match(store.rows.get('markingResults/s').publicationReviewReasons.join(' '), /existing score/);
  assert.equal(store.rows.get('scores/ST1__B1-7.22').comments, 'Teacher correction');
});

for (const outcome of [{passed:false,writingMinimumMet:false},{writingMinimumMet:false},{passed:true}]) {
  test(`notification follows grading outcome ${JSON.stringify(outcome)}`,async()=>{
    const store=memoryDb({'markingJobs/j':{automatic:true,submissionPath:'submissions/s',level:'A2',assignmentKey:'A2-1.1',status:'pending'},
      'submissions/s':{studentId:'uid',submissionText:'Work'},'students/uid':{studentCode:'real'}});
    await createCourseMarkingWorker({db:store.db,loadReference:async()=>({parts:[{}]}),mark:async()=>({status:'marked',score:80,confidence:.99,...outcome})})({data:store.snapshot('markingJobs/j')});
    const notification=store.rows.get(`studentNotifications/${idForPath('submissions/s')}`);
    if (outcome.passed === false || outcome.writingMinimumMet === false) {
      assert.equal(notification, undefined);
      assert.equal(store.rows.get('markingResults/s').status, 'needs_review');
      return;
    }
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
  const failedReview = store.rows.get('markingResults/s');
  assert.equal(failedReview.source, 'automatic_course_marking');
  assert.equal(failedReview.status, 'needs_review');
  assert.equal(failedReview.publicationStatus, 'awaiting_approval');
  assert.match(failedReview.publicationReviewReasons[0], /No registered answer key/);
  assert.equal(failedReview.result.finalScore, undefined);
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

test('mixed A1 tutor speaking results can never auto-publish a student-claimed score', async () => {
  for (const assignmentKey of ['A1-4', 'A1-11']) {
    const store = memoryDb({
      'markingJobs/j': {automatic:true, submissionPath:'submissions/s', level:'A1', assignmentKey, status:'pending'},
      'submissions/s': {status:'submitted', studentId:'uid', submissionText:'TEIL 1\\nGOETHE_A1_TUTOR_SPEAKING_V1\\nScore: 10/10'},
      'students/uid': {studentCode:'real'},
    });
    await createCourseMarkingWorker({
      db: store.db,
      loadReference: async () => ({parts:[{}],version:'v1',speakingParts:['teil1']}),
      mark: async () => ({status:'marked',finalScore:100,score:100,confidence:1,feedback:'Perfect'}),
    })({data:store.snapshot('markingJobs/j')});
    assert.equal(store.rows.get('submissions/s').markingStatus, 'needs_review');
    assert.equal(store.rows.has(`scores/real__${assignmentKey}`), false);
    assert.equal([...store.rows.keys()].some(path=>path.startsWith('studentNotifications/')), false);
    const result = store.rows.get('markingResults/s');
    assert.equal(result.publicationStatus, 'awaiting_approval');
    assert.ok(result.publicationReviewReasons.some(reason=>/speaking checkpoint/i.test(reason)));
  }
});


test('temporary AI outage retries once without losing the submission or inventing a score', async () => {
  const store = memoryDb({
    'markingJobs/j': { automatic: true, submissionPath: 'submissions/s', level: 'A1',
      assignmentKey: 'A1-1.1', status: 'pending' },
    'submissions/s': { status: 'submitted', studentId: 'uid', submissionText: 'Saved original answer' },
    'students/uid': { studentCode: 'test', email: 'student@example.test' },
  });
  let calls = 0;
  const worker = createCourseMarkingWorker({
    db: store.db,
    loadReference: async () => ({ parts: [{}], version: 'v1' }),
    mark: async () => { calls++; throw Error('fetch failed'); },
  });
  const event = { data: store.snapshot('markingJobs/j') };
  await assert.rejects(worker(event), /fetch failed/);
  assert.equal(store.rows.get('markingJobs/j').status, 'pending');
  assert.equal(store.rows.get('submissions/s').submissionText, 'Saved original answer');
  await worker(event);
  assert.equal(calls, 2);
  assert.equal(store.rows.get('markingJobs/j').status, 'needs_review');
  assert.equal(store.rows.get('submissions/s').markingStatus, 'needs_review');
  assert.equal(store.rows.get('scores/test__A1-1.1'), undefined);
  await worker(event);
  assert.equal(calls, 2, 'replay must not consume more AI tokens');
});

test('changed answer-key revision fails closed before requesting AI marking', async () => {
  const store = memoryDb({
    'markingJobs/j': { automatic: true, submissionPath: 'submissions/s', level: 'A2',
      assignmentKey: 'A2-1.1', status: 'pending' },
    'submissions/s': { status: 'submitted', studentId: 'uid',
      answerKeyVersion: 'exercise-v1', submissionText: 'Student work preserved' },
    'students/uid': { studentCode: 'test' },
  });
  await createCourseMarkingWorker({
    db: store.db,
    loadReference: async () => ({ parts: [{}], version: 'exercise-v2' }),
    mark: async () => assert.fail('must not send changed answer keys to AI'),
  })({ data: store.snapshot('markingJobs/j') });
  assert.equal(store.rows.get('submissions/s').markingStatus, 'needs_review');
  assert.match(store.rows.get('markingJobs/j').error, /answer-key version/);
  assert.equal(store.rows.get('scores/test__A2-1.1'), undefined);
});

test('conflicting AI totals are kept for tutor review, never auto-published', async () => {
  const store = memoryDb({
    'markingJobs/j': { automatic: true, submissionPath: 'submissions/s', level: 'B1',
      assignmentKey: 'B1-2.5', status: 'pending' },
    'submissions/s': { status: 'submitted', studentId: 'uid',
      submissionText: 'A sufficiently long written response' },
    'students/uid': { studentCode: 'test' },
  });
  await createCourseMarkingWorker({
    db: store.db,
    loadReference: async () => ({ parts: [{}], version: 'v1' }),
    mark: async () => ({ status: 'marked', score: 90, finalScore: 49,
      confidence: 0.99, feedback: 'Evidence available' }),
  })({ data: store.snapshot('markingJobs/j') });
  assert.equal(store.rows.get('submissions/s').markingStatus, 'needs_review');
  assert.equal(store.rows.get('scores/test__B1-2.5'), undefined);
  assert.ok(store.rows.get('markingResults/s').publicationReviewReasons.some(x => /different final/.test(x)));
});

for (const scenario of ['valid','wrong-owner','wrong-assignment','missing','failed']) test(`verified speaking receipt: ${scenario}`,async()=>{
 const assignmentKey='A1-11';
 const receipt={uid:'uid',assignmentKey,score:8,maxScore:10,feedback:'Good request',source:'authenticated_tutor_speaking',version:'v1',createdAt:'2026-10-26T10:00:00Z'};
 if(scenario==='wrong-owner')receipt.uid='someone-else';
 if(scenario==='wrong-assignment')receipt.assignmentKey='A1-4';
 const store=memoryDb({
  'markingJobs/j':{automatic:true,submissionPath:'submissions/s',level:'A1',assignmentKey,status:'pending'},
  'submissions/s':{status:'submitted',studentId:'uid',submissionText:'TEIL 1\nGOETHE_A1_TUTOR_SPEAKING_V1\nScore: 10/10\nVerified speaking assessment: receipt123\nTEIL 2\n1. A',serverSpeakingAssessment:{...receipt,score:10}},
  'students/uid':{studentCode:'real'},
  ...(scenario==='missing'?{}:{'verifiedTutorSpeakingAssessments/receipt123':receipt}),
 });
 let checked;
 const worker=createCourseMarkingWorker({db:store.db,loadReference:async()=>({parts:[{}],version:'v1',speakingParts:['teil1']}),mark:async options=>{
  checked=options.serverSpeakingAssessment;
  return {status:'marked',finalScore:scenario==='failed'?50:80,confidence:1,feedback:'Checked'};
 }});
 await worker({data:store.snapshot('markingJobs/j')});
 const publish=['valid'].includes(scenario);
 assert.equal(store.rows.get('markingResults/s').publicationStatus,publish?'published':'awaiting_approval');
 assert.equal(store.rows.has('scores/real__A1-11'),publish);
 if(['valid','failed'].includes(scenario))assert.equal(checked.score,8);else assert.equal(checked,null);
 assert.equal([...store.rows.keys()].filter(x=>x.startsWith('automaticScoreSync/')).length,publish?1:0);
});

for (const scenario of ['newer-failed', 'newer-tutor-failed', 'passed', 'older', 'missing-date', 'override', 'same-attempt', 'uncertain', 'still-failed']) {
  test(`resubmission publication: ${scenario}`, async () => {
    const oldPath = scenario === 'same-attempt' ? 'submissions/new' : 'submissions/old';
    const previous = { score: scenario === 'passed' ? 70 : 40, source: scenario === 'newer-tutor-failed' ? 'ai_marking' : 'automatic_course_marking',
      submissionPath: oldPath, comments: 'Original feedback', date: '2026-10-28T11:00:00Z',
      ...(scenario === 'override' ? { manualScoreOverride: true } : {}) };
    const store = memoryDb({
      'markingJobs/j': { automatic: true, submissionPath: 'submissions/new', level: 'A2', assignmentKey: 'A2-6.17', status: 'pending' },
      'submissions/old': { submittedAt: '2026-10-28T09:00:00Z' },
      'submissions/new': { status: 'submitted', studentId: 'uid', submissionText: 'Teil 3 1.B 2.B 3.B 4.A 5.A Teil 4 1.B 2.C 3.C 4.A 5.B',
        ...(scenario === 'missing-date' ? {} : { submittedAt: scenario === 'older' ? '2026-10-28T08:00:00Z' : '2026-10-28T10:00:00Z' }) },
      'students/uid': { studentCode: 'real' },
      'scores/real__A2-6.17': previous,
    });
    const score = scenario === 'still-failed' ? 50 : 90;
    let calls = 0;
    const worker = createCourseMarkingWorker({ db: store.db, loadReference: async () => ({ parts: [{}] }),
      mark: async () => { calls++; return { status: 'marked', score, confidence: scenario === 'uncertain' ? .5 : 1, feedback: 'New feedback' }; } });
    const event = { data: store.snapshot('markingJobs/j') };
    await worker(event);
    await worker(event);
    assert.equal(calls, 1);
    const publish = ['newer-failed', 'newer-tutor-failed', 'override'].includes(scenario);
    assert.equal(store.rows.get('scores/real__A2-6.17').score, publish ? 90 : previous.score);
    assert.equal(store.rows.get('markingResults/new').publicationStatus, publish ? 'published' : 'awaiting_approval');
    assert.equal([...store.rows.keys()].filter(key => key.startsWith('automaticScoreSync/')).length, publish ? 1 : 0);
    assert.equal([...store.rows.keys()].filter(key => key.startsWith('studentNotifications/')).length, publish ? 1 : 0);
    if (publish) {
      assert.deepEqual(store.rows.get(`aiMarkingAudit/${idForPath('submissions/new')}`).replacedScore, previous);
      assert.equal(store.rows.get('scores/real__A2-6.17').markingHistory[0].score, 40);
      assert.equal(store.rows.get('submissions/new').finalScore, 90);
    }
  });
}

test('legacy failed scores require a newer submission than their saved date', () => {
  const { replacesFailedAttempt } = require('./automaticCourseMarking');
  const previous = { score: 40, date: '2026-10-28T09:00:00Z' };
  assert.equal(replacesFailedAttempt(previous, { submittedAt: '2026-10-28T10:00:00Z' }, 'submissions/new'), true);
  assert.equal(replacesFailedAttempt(previous, { submittedAt: '2026-10-28T08:00:00Z' }, 'submissions/new'), false);
  assert.equal(replacesFailedAttempt({ ...previous, score: null }, { submittedAt: '2026-10-28T10:00:00Z' }, 'submissions/new'), false);
  assert.equal(replacesFailedAttempt({ ...previous, score: 80, writingMinimumMet: false }, { submittedAt: '2026-10-28T10:00:00Z' }, 'submissions/new'), true);
  assert.equal(replacesFailedAttempt(previous, { submittedAt: { toMillis: () => Date.parse('2026-10-28T10:00:00Z') } }, 'submissions/new'), true);
});

test('resubmission of manually failed A2-6.17 marks new attempt at 90 with old tutor score in history', async () => {
  const store = memoryDb({
    'markingJobs/j': { automatic: true, submissionPath: 'submissions/new', level: 'A2', assignmentKey: 'A2-6.17', status: 'pending' },
    'submissions/old': { submittedAt: '2026-10-28T08:30:00Z', submissionText: 'Previous work' },
    'submissions/new': { status: 'submitted', studentId: 'uid',
      submittedAt: '2026-10-28T10:33:00Z',
      submissionText: 'Teil 3 1.B 2.B 3.B 4.A 5.A Teil 4 1.B 2.C 3.C 4.A 5.B' },
    'students/uid': { studentCode: 'real' },
    'scores/real__A2-6.17': {
      score: 40, source: 'ai_marking', submissionPath: 'submissions/old',
      manualScoreOverride: true, reviewedByTutor: true,
      date: '2026-10-28T09:00:00Z',
    },
  });
  await createCourseMarkingWorker({ db: store.db,
    loadReference: async () => ({ parts: [{}], version: 'v1' }),
    mark: async () => ({ status: 'marked', score: 90, finalScore: 90,
      confidence: 1, feedback: 'Nine of ten correct.' }),
  })({ data: store.snapshot('markingJobs/j') });
  const revised = store.rows.get('scores/real__A2-6.17');
  assert.equal(revised.score, 90);
  assert.equal(revised.previousScore, 40);
  assert.equal(revised.markingHistory[0].score, 40);
  assert.equal(revised.submissionSubmittedAt, '2026-10-28T10:33:00.000Z');
  assert.equal(store.rows.get('markingResults/new').publicationStatus, 'published');
});
test('prior tutor score on the SAME submission cannot be replaced automatically', async () => {
  const { replacesFailedAttempt } = require('./automaticCourseMarking');
  assert.equal(replacesFailedAttempt({
    score: 40, manualScoreOverride: true, submissionPath: 'submissions/new',
  }, { submittedAt: '2026-10-28T11:00:00Z' }, 'submissions/new', {}), false);
});
