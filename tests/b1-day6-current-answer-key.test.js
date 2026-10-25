import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalCourseReference } from '../src/utils/canonicalCourseReference.js';
import { computeObjectiveScore } from '../src/utils/objectiveMarking.js';
import { calculateWeightedMarkingOutcome } from '../src/utils/markingScorePolicy.js';
const submission = 'TEIL 3\n1. A\n2. B\n3. C\n4. B\n5. B\nTEIL 4\n1. B\n2. A\n3. B\n4. A\n5. C';
test('current B1-2.6 workbook marks Reuben 5/5 Lesen and 5/5 Hoeren', () => {
  const result = computeObjectiveScore('B1-2.6', submission, canonicalCourseReference('B1-2.6'));
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
  assert.ok(Object.values(result.details).every(row => row.correct));
  const outcome = calculateWeightedMarkingOutcome({level:'B1',assignmentKey:'B1-2.6',writingPercent:85,objectiveScore:100,objectiveDetails:result.details,hasWriting:true});
  assert.equal(outcome.finalScore,94);
  assert.equal(outcome.passed,true);
});
test('current B1-2.6 key still distinguishes wrong and absent answers', () => {
  const ref = canonicalCourseReference('B1-2.6');
  const wrong = computeObjectiveScore('B1-2.6', submission.replace('1. A','1. C'),ref);
  assert.equal(wrong.correctCount,9);
  assert.equal(wrong.totalCount,10);
  const missing = computeObjectiveScore('B1-2.6',submission.replace('5. C',''),ref);
  assert.equal(missing.correctCount,9);
  assert.equal(missing.totalCount,10);
});
