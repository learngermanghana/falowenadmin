import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildManualScoreCorrection } from '../src/utils/manualScoreCorrection.js';
import { assignmentTitle } from '../src/utils/assignmentTitle.js';

const source = fs.readFileSync(new URL('../src/services/automaticMarkingReviewService.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '').replace(/export /g, '');
function fixture() {
  const rows = new Map([
    ['scores/s', { score: 80, updatedAt: 'v1', submissionPath: 'submissions/work', assignment: 'A1 Day 1', source: 'automatic_course_marking' }],
    ['markingResults/work', { result: { score: 80, feedback: 'Original AI' }, status: 'marked' }],
    ['submissions/work', { submissionText: 'Original student work' }],
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
  const api = new Function('collection', 'doc', 'auth', 'db', 'runTransaction', 'buildManualScoreCorrection', 'assignmentTitle',
    `${source}; return { saveAutomaticMarkingReview };`)(collection, doc, { currentUser: { uid: 'tutor1' } }, {}, runTransaction, buildManualScoreCorrection, assignmentTitle);
  return { rows, save: api.saveAutomaticMarkingReview,
    detail: { row: { id: 'work', submissionPath: 'submissions/work' }, score: { id: 's', updatedAt: 'v1' } } };
}
test('tutor correction preserves AI evidence, records history and queues Sheet sync atomically', async () => {
  const f = fixture();
  await f.save(f.detail, { score: '55', feedback: 'Corrected feedback', reason: 'Writing task missed' });
  const score = f.rows.get('scores/s');
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
  assert.equal(sync.scorePath, 'scores/s');
});
test('stale result cannot overwrite another tutor correction', async () => {
  const f = fixture(); f.detail.score.updatedAt = 'old';
  await assert.rejects(f.save(f.detail, { score: 90, feedback: 'Changed', reason: 'Recheck' }), /changed/);
  assert.equal(f.rows.size, 3);
  assert.equal(f.rows.get('scores/s').score, 80);
});
test('feedback-only corrections also queue a Sheet update', async () => {
  const f = fixture();
  await f.save(f.detail, { score: 80, feedback: 'Clearer explanation', reason: 'Clarify feedback' });
  assert.equal(f.rows.get('scores/s').score, 80);
  assert.equal(f.rows.get('scores/s').comments, 'Clearer explanation');
  assert.equal([...f.rows.keys()].filter(key => key.startsWith('automaticScoreSync/')).length, 1);
});
test('invalid scores and missing reasons cannot change a result', async () => {
  for (const score of ['', 'oops', -1, 101]) {
    const f = fixture();
    await assert.rejects(f.save(f.detail, { score, feedback: 'Changed', reason: 'Recheck' }), /0 to 100/);
    assert.equal(f.rows.size, 3);
  }
  const f = fixture();
  await assert.rejects(f.save(f.detail, { score: 80, feedback: 'Changed', reason: '' }), /reason/);
});
