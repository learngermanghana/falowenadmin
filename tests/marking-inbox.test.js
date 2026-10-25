import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterMarkingInbox, markingInboxCategory } from '../src/utils/markingInbox.js';
const rows = [
  { id:'old', createdAt:'2026-10-24T10:00:00Z', sentToStudent:true, finalScore:90, studentName:'Samuel', assignmentId:'A1-3' },
  { id:'failed', createdAt:'2026-10-25T10:00:00Z', finalScore:50, studentName:'Samuel', assignmentId:'A1-14.1' },
  { id:'issue', createdAt:'2026-10-25T11:00:00Z', finalScore:90, studentName:'Augustina', assignmentId:'A2-1.1' },
  { id:'missing', createdAt:'2026-10-25T12:00:00Z', finalScore:null },
];
test('inbox shows unpublished results newest first and keeps published results separate', () => {
  assert.deepEqual(filterMarkingInbox(rows).map(row=>row.id), ['missing','issue','failed']);
  assert.deepEqual(filterMarkingInbox(rows,{view:'published'}).map(row=>row.id),['old']);
});
test('filters distinguish failed assessment from technical issue and support identity and level', () => {
  assert.equal(markingInboxCategory(rows[3]), 'issues');
  assert.deepEqual(filterMarkingInbox(rows,{view:'failed',search:'samuel',level:'A1'}).map(row=>row.id),['failed']);
  assert.deepEqual(filterMarkingInbox(rows,{view:'issues',search:'A2-1.1'}).map(row=>row.id),['issue']);
  assert.equal(markingInboxCategory({finalScore:90,result:{writingMinimumMet:false}}),'failed');
});

 test('invalid or uncertain provisional failures remain marking issues', () => {
  for (const result of [{finalScore:40,score:90}, {finalScore:40,confidence:0.3}, {finalScore:40,secondExaminer:{requiresTutorReview:true}}, {finalScore:40,consistencyWarnings:['Invalid writing marks']}]) {
    assert.equal(markingInboxCategory({result}), 'issues');
  }
  assert.equal(markingInboxCategory({finalScore:40,publicationReviewReasons:['Failed assessment requires tutor review before publication.'],result:{score:40,finalScore:40,confidence:1,status:'marked'}}),'failed');
});
