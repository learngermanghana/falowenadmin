import test from 'node:test';
import assert from 'node:assert/strict';
import dictionary from '../src/data/answers_dictionary.json' with { type: 'json' };
import { computeObjectiveScore } from '../src/utils/objectiveMarking.js';
import { normalizeAnswerKeyEntry } from '../src/utils/answerKeyNormalizer.js';
const entry = Object.values(dictionary).find(row => row.assignment_id === 'A1-12.1');
const reference = normalizeAnswerKeyEntry('A1 Two Case Preposition 12.1', entry);
const revised = 'TEIL 1\nA1-12.1-READING-V2\n1. Richtig\n2. Falsch\n3. Falsch\n4. Richtig\n5. Falsch\n\nTEIL 3\n1. Richtig\n2. Richtig\n3. Richtig\n4. Richtig\n5. Richtig';
test('new signs and unchanged listening score ten answers, including normalized cloud references', () => {
 for (const ref of ['A1-12.1', reference]) {
  const result = computeObjectiveScore(ref, revised);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
  assert.equal(computeObjectiveScore(ref, revised.replace('4. Richtig', '4. Falsch')).correctCount, 9);
 }
});
test('untagged historical submissions retain all fifteen original answers', () => {
 const text = 'TEIL 1\n1. B\n2. A\n3. B\n4. C\n5. C\n\nTEIL 2\n1. Falsch\n2. Falsch\n3. Falsch\n4. Falsch\n5. Falsch\n\nTEIL 3\n1. Richtig\n2. Richtig\n3. Richtig\n4. Richtig\n5. Richtig';
 const result = computeObjectiveScore(reference, text);
 assert.equal(result.totalCount, 15);
 assert.equal(result.correctCount, 15);
});
