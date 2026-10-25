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
