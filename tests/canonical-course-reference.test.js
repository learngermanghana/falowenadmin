import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalCourseReference } from '../src/utils/canonicalCourseReference.js';

test('automatic marking reads the same live source dictionary as Admin for A1-11', () => {
  const source = canonicalCourseReference('A1-11');
  assert.equal(source.assignmentKey, 'A1-11');
  assert.equal(source.totalAnswers, 10);
  assert.deepEqual(source.referenceAnswerParts, ['teil2', 'teil3']);
  assert.equal(source.parts.teil3.answerCount, 5);
});

test('canonical lookup is case-safe and does not invent missing answer keys', () => {
  assert.equal(canonicalCourseReference('  a1-11 ')?.assignmentKey, 'A1-11');
  assert.equal(canonicalCourseReference('B9-999'), null);
});
