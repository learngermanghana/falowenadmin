const { test } = require('node:test');
const assert = require('node:assert/strict');
const { referenceVersionProblem, scoreProblems, isTransientMarkingError } = require('./markingReliability');

test('only explicit matching answer-key revisions permit automatic marking', () => {
  assert.equal(referenceVersionProblem({ answerKeyVersion: '2026-10-22-v1' }, { version: '2026-10-22-v1' }), '');
  assert.match(referenceVersionProblem({ answerKeyVersion: 'old' }, { version: 'new' }), /does not match/);
  assert.match(referenceVersionProblem({ markingReferenceVersion: 'old' }, { parts: [] }), /unversioned/);
  assert.equal(referenceVersionProblem({ submissionText: 'legacy' }, { version: 'new' }), '');
});

test('contradictory grade components block release but valid zero marks are accepted', () => {
  assert.deepEqual(scoreProblems({ finalScore: 0, score: 0, confidence: 0.85, objectiveCorrect: 0, objectiveTotal: 5 }), []);
  assert.match(scoreProblems({ score: 85, finalScore: 65 })[0], /different final/);
  assert.match(scoreProblems({ score: 60, objectiveCorrect: 6, objectiveTotal: 5 })[0], /Objective/);
  assert.match(scoreProblems({ score: 60, writingScore: 45, maxWritingScore: 40 })[0], /Writing/);
  assert.match(scoreProblems({ score: 60, writingMinimumMet: false, passed: true })[0], /contradicts/);
  assert.ok(scoreProblems({ score: 50, confidence: 3 }).length > 0);
});

test('retry only short-lived provider failures, never a bad reference or exhausted account quota', () => {
  for (const error of [new Error('fetch failed'), new Error('request timed out'),
    Object.assign(Error('upstream failed'), { status: 503 }),
    Object.assign(Error('rate limited'), { status: 429 })])
    assert.equal(isTransientMarkingError(error), true);
  for (const error of [Error('No registered answer key'), Error('Missing student identity'),
    Error('insufficient_quota'), Object.assign(Error('invalid request'), { status: 400 })])
    assert.equal(isTransientMarkingError(error), false);
});
