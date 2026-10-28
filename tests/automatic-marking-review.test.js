import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildManualScoreCorrection } from '../src/utils/manualScoreCorrection.js';
import { assignmentTitle } from '../src/utils/assignmentTitle.js';
import { isAutomaticResultPublished, automaticPublicationLabel, automaticReviewReasons } from '../src/utils/automaticReviewStatus.js';

const source = fs.readFileSync(new URL('../src/services/automaticMarkingReviewService.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '').replace(/export /g, '');
function fixture() {
  const rows = new Map([
    ['scores/real__A1-1.1', { score: 80, updatedAt: 'v1', submissionPath: 'submissions/work', assignment: 'A1 Day 1', source: 'automatic_course_marking' }],
    ['markingResults/work', { result: { score: 80, feedback: 'Original AI' }, status: 'marked', sentToStudent: true }],
    ['submissions/work', { submissionText: 'Original student work' }],
    ['students/uid', { studentCode: 'real', uid: 'uid', name: 'Student' }],
  ]);
  let counter = 0;
  const doc = (...args) => {
    if (args.length === 1) return { path: `${args[0].path}/generated${++counter}` };
    return { path: args.slice(1).join('/') };
  };
  const collection = (parent, name) => ({ path: parent.path ? `${parent.path}/${name}` : name });
  const runTransaction = async (_db, work) => {
    const writes = [];
    await work({
      get: async ref => ({ exists: () => rows.has(ref.path), data: () => rows.get(ref.path) }),
      set: (ref, value, options) => writes.push(() => rows.set(ref.path, options?.merge ? { ...rows.get(ref.path), ...value } : value)),
    });
    writes.forEach(write => write());
  };
  const getDoc = async ref => ({ exists: () => rows.has(ref.path), data: () => rows.get(ref.path) });
  const api = new Function('collection', 'doc', 'auth', 'db', 'runTransaction', 'buildManualScoreCorrection', 'assignmentTitle', 'getDoc', 'isAutomaticResultPublished',
    `${source}; return { saveAutomaticMarkingReview, closeAutomaticMarkingReview };`)(collection, doc, { currentUser: { uid: 'tutor1' } }, {}, runTransaction, buildManualScoreCorrection, assignmentTitle, getDoc, isAutomaticResultPublished);
  return { rows, save: api.saveAutomaticMarkingReview, close: api.closeAutomaticMarkingReview,
    detail: { studentPath: 'students/uid', row: { id: 'work', assignmentId: 'A1-1.1', studentId: 'uid', submissionPath: 'submissions/work' }, score: { id: 'real__A1-1.1', score: 80, updatedAt: 'v1', submissionPath: 'submissions/work' } } };
}
test('tutor correction preserves AI evidence, records history and queues Sheet sync atomically', async () => {
  const f = fixture();
  await f.save(f.detail, { score: '55', feedback: 'Corrected feedback', reason: 'Writing task missed' });
  const score = f.rows.get('scores/real__A1-1.1');
  assert.equal(score.score, 55);
  assert.equal(score.passed, false);
  assert.equal(score.manualScoreOverride, true);
  assert.equal(score.source, 'automatic_course_marking');
  assert.equal(f.rows.get('markingResults/work').result.feedback, 'Original AI');
  assert.equal(f.rows.get('submissions/work').submissionText, 'Original student work');
  assert.equal(f.rows.get('submissions/work').finalScore, 55);
  const review = [...f.rows.entries()].find(([key]) => key.includes('/tutorReviews/'))[1];
  assert.equal(review.previousScore, 80);
  assert.equal(review.tutorUid, 'tutor1');
  assert.equal(review.reason, 'Writing task missed');
  const sync = [...f.rows.entries()].find(([key]) => key.startsWith('automaticScoreSync/'))[1];
  assert.equal(sync.status, 'pending');
  assert.equal(sync.scorePath, 'scores/real__A1-1.1');
});
test('stale result cannot overwrite another tutor correction', async () => {
  const f = fixture(); f.detail.score.updatedAt = 'old';
  await assert.rejects(f.save(f.detail, { score: 90, feedback: 'Changed', reason: 'Recheck' }), /changed/);
  assert.equal(f.rows.size, 4);
  assert.equal(f.rows.get('scores/real__A1-1.1').score, 80);
});
test('closing review persists acknowledgement without editing a score or queueing sync', async () => {
  const f = fixture();
  await f.close(f.detail);
  assert.equal(f.rows.get('markingResults/work').reviewClosedBy, 'tutor1');
  assert.ok(f.rows.get('markingResults/work').reviewClosedAt);
  assert.equal(f.rows.get('scores/real__A1-1.1').score, 80);
  assert.equal(f.rows.get('markingResults/work').result.feedback, 'Original AI');
  assert.equal(f.rows.size, 4);
});
test('feedback-only corrections also queue a Sheet update', async () => {
  const f = fixture();
  await f.save(f.detail, { score: 80, feedback: 'Clearer explanation', reason: 'Clarify feedback' });
  assert.equal(f.rows.get('scores/real__A1-1.1').score, 80);
  assert.equal(f.rows.get('scores/real__A1-1.1').comments, 'Clearer explanation');
  assert.equal([...f.rows.keys()].filter(key => key.startsWith('automaticScoreSync/')).length, 1);
});
test('invalid scores and missing reasons cannot change a result', async () => {
  for (const score of ['', 'oops', -1, 101]) {
    const f = fixture();
    await assert.rejects(f.save(f.detail, { score, feedback: 'Changed', reason: 'Recheck' }), /0 to 100/);
    assert.equal(f.rows.size, 4);
  }
  const f = fixture();
  await assert.rejects(f.save(f.detail, { score: 80, feedback: 'Changed', reason: '' }), /reason/);
});
test('approves original AI result without running AI again and publishes notification', async () => {
  const f = fixture(); f.rows.delete('scores/real__A1-1.1'); f.detail.score = null;
  Object.assign(f.rows.get('markingResults/work').result, { corrections: [{ original: 'a', corrected: 'b' }],
    objectiveCorrect: 12, objectiveTotal: 12, objectiveScore: 100, writingScorePercent: 60,
    writingMinimumMet: true, markingRubricVersion: 'v1', scoreBreakdown: [{ label: 'Writing', score: 60 }] });
  f.rows.get('markingResults/work').sentToStudent = false;
  await f.save(f.detail, { approve: true });
  assert.equal(f.rows.get('scores/real__A1-1.1').score, 80);
  assert.equal(f.rows.get('scores/real__A1-1.1').comments, 'Original AI');
  assert.equal(f.rows.get('markingResults/work').sentToStudent, true);
  assert.equal(f.rows.get('markingResults/work').tutorReview.action, 'approve');
  const published = f.rows.get('scores/real__A1-1.1');
  assert.equal(published.objectiveCorrect, 12);
  assert.equal(published.objective_score, 100);
  assert.equal(published.writing_score, 60);
  assert.equal(published.writingMinimumMet, true);
  assert.equal(published.markingRubricVersion, 'v1');
  assert.deepEqual(JSON.parse(published.corrections), [{ original: 'a', corrected: 'b' }]);
  const sync = [...f.rows.entries()].find(([key]) => key.startsWith('automaticScoreSync/'))[1];
  assert.deepEqual(sync.row.scoreBreakdown, published.scoreBreakdown);
  assert.equal([...f.rows.keys()].filter(key => key.startsWith('studentNotifications/')).length, 1);
});
test('approval retains the AI writing-minimum failure even above 60', async () => {
  const f = fixture();
  Object.assign(f.rows.get('markingResults/work').result, { passed: false, writingMinimumMet: false });
  await f.save(f.detail, { approve: true });
  assert.equal(f.rows.get('scores/real__A1-1.1').passed, false);
});
test('unpublished work cannot be closed or hidden as reviewed', async () => {
  const f = fixture(); f.rows.get('markingResults/work').sentToStudent = false;
  await assert.rejects(f.close(f.detail), /publish/);
  assert.equal(automaticPublicationLabel({ reviewClosedAt: 'old', sentToStudent: false }), 'Tutor review required');
});
test('approval refuses to overwrite another saved attempt', async () => {
  const f = fixture(); f.detail.score = null;
  f.rows.set('scores/real__A1-1.1', { score: 75, submissionPath: 'submissions/other' });
  await assert.rejects(f.save(f.detail, { approve: true }), /already exists/);
  assert.equal(f.rows.get('scores/real__A1-1.1').score, 75);
});
test('review reasons distinguish missing legacy explanations from actual flags', () => {
  assert.match(automaticReviewReasons({ row: { sentToStudent: false } })[0], /No review reason/);
  assert.ok(automaticReviewReasons({ row: { result: { confidence: 0.7 } } }).some(text => text.includes('confidence')));
});

 test('legacy unnamed inbox result resolves its registered student instead of generic Student', async () => {
  const entry = { id:'legacy', data:()=>({ source:'automatic_course_marking', studentId:'uid', studentName:'Student', submissionPath:'submissions/work' }) };
  const doc = (_db, ...parts) => ({path:parts.join('/')});
  const getDoc = async ref => ({exists:()=>true, data:()=>ref.path === 'students/uid'
    ? {firstName:'Samuel', lastName:'Kumar', studentCode:'SamaelKumar856', email:'samaelkumar@gmail.com'}
    : {studentId:'uid', studentName:'Student'}});
  const api = new Function('collection','doc','getDoc','getDocs','query','orderBy','limit','startAfter','db',
    `${source}; return loadAutomaticMarkingPage;`)(()=>({}),doc,getDoc,async()=>({docs:[entry],size:1}),()=>({}),()=>({}),()=>({}),()=>({}),{});
  const page = await api();
  assert.equal(page.rows[0].studentName,'Samuel Kumar');
  assert.equal(page.rows[0].studentCode,'SamaelKumar856');
  assert.equal(page.rows[0].studentEmail,'samaelkumar@gmail.com');
});

test('new A2 Day 17 attempt can replace a failed 40 with reviewed AI 90 without losing history', async () => {
  const f = fixture();
  f.rows.set('scores/real__A2-6.17', {
    score: 40, updatedAt: 'old-score', submissionPath: 'submissions/previous',
    studentcode: 'real', assignment_id: 'A2-6.17', comments: 'Previous attempt',
    manualScoreOverride: true, objectiveScore: 40,
  });
  f.rows.set('submissions/previous', { submittedAt: '2026-10-28T08:00:00Z' });
  f.rows.set('submissions/work', { submittedAt: '2026-10-28T10:33:00Z', submissionText: 'New answers' });
  f.rows.set('markingResults/work', { status: 'needs_review', sentToStudent: false, result: {
    score: 90, finalScore: 90, feedback: 'New work: 9 of 10 correct.', confidence: 1,
    objectiveScore: 90, objectiveCorrect: 9, objectiveTotal: 10,
  } });
  f.detail.row.assignmentId = 'A2-6.17';
  f.detail.score = { id: 'real__A2-6.17', score: 40, updatedAt: 'old-score',
    submissionPath: 'submissions/previous', comments: 'Previous attempt' };
  await f.save(f.detail, { approve: true });
  const revised = f.rows.get('scores/real__A2-6.17');
  assert.equal(revised.score, 90);
  assert.equal(revised.previousScore, 40);
  assert.equal(revised.markingHistory[0].score, 40);
  assert.equal(revised.markingHistory[0].submissionPath, 'submissions/previous');
  assert.equal(revised.submissionPath, 'submissions/work');
  assert.equal(revised.objectiveCorrect, 9);
  assert.equal(revised.manualScoreOverride, true);
  assert.equal(f.rows.get('markingResults/work').result.score, 90);
  assert.equal(f.rows.get('submissions/previous').submittedAt, '2026-10-28T08:00:00Z');
  assert.equal(f.rows.get('submissions/work').finalScore, 90);
  assert.ok([...f.rows.keys()].some(key => key.startsWith('automaticScoreSync/')));
});
test('an older attempt cannot replace a newer failed score', async () => {
  const f = fixture();
  f.rows.set('scores/real__A1-1.1', { score: 40, updatedAt: 'v1', submissionPath: 'submissions/previous' });
  f.rows.set('submissions/previous', { submittedAt: '2026-10-28T12:00:00Z' });
  f.rows.set('submissions/work', { submittedAt: '2026-10-28T10:00:00Z' });
  f.detail.score = { id: 'real__A1-1.1', score: 40, updatedAt: 'v1', submissionPath: 'submissions/previous' };
  await assert.rejects(f.save(f.detail, { approve: true }), /not newer/);
  assert.equal(f.rows.get('scores/real__A1-1.1').score, 40);
});
test('changing prior failed result in another tab is rejected before tutor publication', async () => {
  const f = fixture();
  f.rows.set('scores/real__A1-1.1', { score: 40, updatedAt: 'new-version', submissionPath: 'submissions/other' });
  await assert.rejects(f.save(f.detail, { score: 90, feedback: 'New', reason: 'Retake' }), /changed/);
  assert.equal(f.rows.get('scores/real__A1-1.1').score, 40);
});
