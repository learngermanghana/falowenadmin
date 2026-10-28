const { test } = require('node:test');
const assert = require('node:assert/strict');
const { referenceVersionProblem, scoreProblems, isTransientMarkingError } = require('./markingReliability');

test('James-style count, evidence and percentage contradictions block release', () => {
  assert.ok(scoreProblems({ score: 52, objectiveCorrect: 4, objectiveTotal: 15, objectiveScore: 52 }).length);
  assert.ok(scoreProblems({ score: 52, objectiveCorrect: 13, objectiveTotal: 25,
    objectiveDetails: Object.fromEntries(Array.from({ length: 15 }, (_, i) => [i, { correct: i < 13 }])) }).length);
  assert.deepEqual(scoreProblems({ score: 87, objectiveCorrect: 13, objectiveTotal: 15,
    objectiveScore: 13 / 15 * 100, writingScore: null, writingScorePercent: null }), []);
});

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

 test('objective-only null writing fields do not block automatic publication', () => {
  assert.deepEqual(scoreProblems({score:90, writingScore:null, writingScorePercent:null, maxWritingScore:100}), []);
  assert.deepEqual(scoreProblems({score:90, writingScore:0, writingScorePercent:0, maxWritingScore:100}), []);
  assert.ok(scoreProblems({score:90, writingScore:'invalid', maxWritingScore:100}).length);
});

test('A1 verified speaking checkpoints compare combined points, not objective-only percent', () => {
  const verified = {
    status: 'marked', score: 70, finalScore: 70, confidence: 1,
    objectiveCorrect: 6, objectiveTotal: 10, objectiveScore: 60,
    writingScore: null, writingScorePercent: null,
    speakingScore: 8, maxSpeakingScore: 10, speakingAssessmentId: 'receipt_123',
    markingRubricVersion: 'a1-verified-speaking-v1',
  };
  assert.deepEqual(scoreProblems(verified), []);
  assert.deepEqual(scoreProblems({ ...verified, objectiveCorrect: 8, objectiveScore: 80,
    score: 80, finalScore: 80 }), []);
  assert.match(scoreProblems({ ...verified, score: 60, finalScore: 60 }).join(' '),
    /combined verified objective and speaking/);
  assert.match(scoreProblems({ ...verified, speakingAssessmentId: '' }).join(' '),
    /authenticated assessment receipt/);
  assert.match(scoreProblems({ ...verified, speakingScore: 11 }).join(' '),
    /Verified speaking score/);
  assert.match(scoreProblems({ score: 70, objectiveCorrect: 6, objectiveTotal: 10,
    objectiveScore: 60, writingScore: null, writingScorePercent: null }).join(' '),
    /Objective-only final score contradicts/);
});
