import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bundledReferenceForAssignment, buildAutomaticMarkingReport, compareMarkingReferences } from '../src/utils/automaticMarkingReport.js';
import { computeObjectiveScore } from '../src/utils/objectiveMarking.js';
import { calculateWeightedMarkingOutcome } from '../src/utils/markingScorePolicy.js';

const dictionary = JSON.parse(fs.readFileSync(new URL('../src/data/answers_dictionary.json', import.meta.url), 'utf8'));
const sport = bundledReferenceForAssignment(dictionary, 'A2-6.15');
const pharmacy = bundledReferenceForAssignment(dictionary, 'A2-6.17');
const selasi = [
  'TEIL 2', 'Hallo Jan,', 'Mein Lieblingssport ist Schwimmen. Ich schwimme dreimal pro Woche.',
  'Ich liebe diesen Sport, weil er entspannend ist. Kommst du nächsten Samstag mit?',
  'Liebe Grüße', 'Selasi',
  'TEIL 3', '1. B', '2. D', '3. D', '4. C', '5. B',
  'TEIL 4', '1. B', '2. C', '3. A', '4. C', '5. B'
].join('\n');
const vicky = [
  'TEIL 3', '1. B', '2. B', '3. C', '4. A', '5. B', '6. A', '7. B', '8. A',
  'TEIL 4', '1. A', '2. C', '3. B', '4. B', '5. B'
].join('\n');

test('live A2-6.15 answer sheet corrections are bundled in Admin', () => {
  assert.deepEqual(sport.parts.teil3.answers.map(item => item.correctLetter), ['A', 'B', 'C', 'B', 'B']);
  assert.deepEqual(sport.parts.teil4.answers.map(item => item.correctLetter), ['B', 'C', 'A', 'C', 'B']);
});

test('Selasi objective results reflect current key and 40-30-30 weighting', () => {
  const result = computeObjectiveScore(sport, selasi);
  assert.equal(result.correctCount, 6);
  assert.equal(result.totalCount, 10);
  const weighted = calculateWeightedMarkingOutcome({
    level: 'A2', assignmentId: 'A2-6.15', objectiveScore: 60,
    objectiveDetails: result.details, writingPercent: 87.5, hasWriting: true
  });
  assert.equal(weighted.scoreBreakdown.teil3.points, 6);
  assert.equal(weighted.scoreBreakdown.teil4.points, 30);
  assert.equal(weighted.scoreBreakdown.teil2.points, 35);
  assert.equal(weighted.finalScore, 71);
});

test('Vicky objective work has four correct of ten keyed answers, not thirteen keyed answers', () => {
  const result = computeObjectiveScore(pharmacy, vicky);
  assert.equal(result.correctCount, 4);
  assert.equal(result.totalCount, 10);
  assert.equal(pharmacy.writingParts.length, 0);
});

test('reference diff shows original versus changed Admin answers and missing evidence', () => {
  const original = bundledReferenceForAssignment(dictionary, 'A2-6.15');
  const modified = structuredClone(original);
  modified.parts.teil3.answers[0].rawCorrectAnswer = 'D) Old answer';
  const diff = compareMarkingReferences(modified, original);
  assert.equal(diff.status, 'different');
  assert.ok(diff.rows.some(row => row.changed && /teil3/i.test(row.key)));
  assert.equal(compareMarkingReferences(null, original).status, 'unavailable');
});

test('full report includes saved and current evidence, with contact details removed', () => {
  const report = buildAutomaticMarkingReport({
    row: { assignmentId: 'A2-6.15', submissionPath: 'submissions/student-1', result: { score: 52 } },
    submission: { text: selasi, studentEmail: 'selasi@example.com' },
    audit: { referenceEntry: sport, result: { score: 52, studentEmail: 'selasi@example.com' } },
    job: { status: 'needs_review' },
    reviews: []
  }, sport);
  assert.match(report, /STUDENT WORK \(ORIGINAL\)/);
  assert.match(report, /REFERENCE SAVED WITH THE MARKING JOB/);
  assert.match(report, /CURRENT ADMIN BUNDLED REFERENCE/);
  assert.match(report, /Admin bundle vs saved audit reference: matching/);
  assert.doesNotMatch(report, /selasi@example\.com/);
  assert.match(report, /\[redacted\]/);
});
