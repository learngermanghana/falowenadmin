const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const requireHere = createRequire(__filename);
const { withMarkingTransport } = require('./automaticMarkingContext');
function loadPipeline() {
  const module = { exports: {} };
  const db = { doc: () => ({ set: async () => {} }) };
  vm.runInNewContext(fs.readFileSync(__dirname + '/automaticMarkingPipeline.cjs', 'utf8'), {
    module, exports: module.exports, console, process, URL, AbortSignal,
    require: name => name === 'firebase-admin' ? { firestore: () => db } : requireHere(name),
  });
  return module.exports;
}
for (const level of ['A1','A2','B1']) test(`bundled tutor objective parser marks ${level} without an AI request`, async () => {
  const pipeline = loadPipeline();
  let calls = 0;
  const result = await withMarkingTransport(async () => { calls++; throw Error('objective marking must be deterministic'); }, () => pipeline.markSubmissionWithAI({
    referenceEntry: {assignmentKey:`${level}-99.1`,level,writingParts:[],rawAnswers:{1:'A',2:'B'}},
    submission:{level}, submissionText:'Teil 1\n1. A\n2. B',
  }));
  assert.equal(result.objectiveTotal,2);
  assert.equal(result.finalScore,100);
  assert.equal(calls,0);
});

test('bundled Firebase worker grades versioned A1-12.1 Bahnhof Hören, not the prior all-Richtig key', async () => {
  const pipeline = loadPipeline();
  const dictionary = require('../src/data/answers_dictionary.json');
  const original = Object.values(dictionary).find(entry => entry.assignment_id === 'A1-12.1');
  assert.ok(original?.workbookRevisions?.['a1-12.1-bahnhof-hoeren-v3']);
  const referenceEntry = {
    ...original,
    assignmentKey: 'A1-12.1',
    level: 'A1',
    writingParts: [],
    parts: {
      teil1: { answers: [
        { questionKey: 'Answer1', correctLetter: 'R', correctText: 'Richtig' },
      ] },
    },
    rawAnswers: original.answers,
  };
  const answers = [
    'TEIL 1',
    'A1-12.1-BAHNHOF-HOEREN-V3',
    '1. Richtig',
    '2. Falsch',
    '3. Falsch',
    '4. Richtig',
    '5. Falsch',
    'TEIL 3',
    '1. Richtig',
    '2. Falsch',
    '3. Richtig',
    '4. Falsch',
    '5. Richtig',
  ].join('\n');
  let calls = 0;
  const mark = async (text) => withMarkingTransport(async () => {
    calls += 1;
    throw new Error('objective-only workbook must not call Gemini');
  }, () => pipeline.markSubmissionWithAI({
    referenceEntry,
    submission: { level: 'A1', assignmentKey: 'A1-12.1' },
    submissionText: text,
  }));

  const correct = await mark(answers);
  assert.equal(correct.objectiveTotal, 10);
  assert.equal(correct.objectiveCorrect, 10);
  assert.equal(correct.finalScore, 100);

  const incorrect = await mark(answers.replace('TEIL 3\n1. Richtig\n2. Falsch', 'TEIL 3\n1. Richtig\n2. Richtig'));
  assert.equal(incorrect.objectiveTotal, 10);
  assert.equal(incorrect.objectiveCorrect, 9);
  assert.equal(calls, 0);

  const legacy = await mark(answers
    .replace('A1-12.1-BAHNHOF-HOEREN-V3', 'A1-12.1-READING-V2')
    .replace('TEIL 3\n1. Richtig\n2. Falsch\n3. Richtig\n4. Falsch\n5. Richtig',
      'TEIL 3\n1. Richtig\n2. Richtig\n3. Richtig\n4. Richtig\n5. Richtig'));
  assert.equal(legacy.objectiveCorrect, 10);
  assert.equal(legacy.objectiveTotal, 10);
});


test('A2-5.14 current five-answer workbook grades 5/5, never old 5/12', async () => {
  const pipeline = loadPipeline();
  const referenceEntry = pipeline.canonicalCourseReference('A2-5.14');
  assert.ok(referenceEntry, 'A2-5.14 must be included in the bundled marking dictionary');
  assert.deepEqual(Array.from(referenceEntry.referenceAnswerParts), ['teil3']);
  assert.equal(referenceEntry.totalAnswers, 5);
  const result = await withMarkingTransport(
    async () => { throw new Error('five-question objective assignment must never request AI'); },
    () => pipeline.markSubmissionWithAI({
      referenceEntry,
      submission: { assignmentKey: 'A2-5.14', level: 'A2' },
      submissionText: 'TEIL 3\n1. A\n2. C\n3. B\n4. A\n5. B',
    }),
  );
  assert.equal(result.objectiveCorrect, 5);
  assert.equal(result.objectiveTotal, 5);
  assert.equal(result.finalScore, 100);
});
