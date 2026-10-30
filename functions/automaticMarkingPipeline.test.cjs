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

 test('bundled B1-2.6 reference contains current five Lesen and five Hoeren answers', () => {
  const ref = loadPipeline().canonicalCourseReference('B1-2.6');
  assert.equal(ref.totalAnswers, 10);
  const letters = part => Array.from(ref.parts[part].answers, answer => answer.correctLetter);
  assert.deepEqual(letters('teil3'), ['A','B','C','B','B']);
  assert.deepEqual(letters('teil4'), ['B','A','B','A','C']);
});

test('verified A1-11 speaking is included with objective marks without another AI request',async()=>{
 const pipeline=loadPipeline();
 const referenceEntry=pipeline.canonicalCourseReference('A1-11');
 const submissionText='TEIL 1\nGOETHE_A1_TUTOR_SPEAKING_V1\nScore: 10/10\nVerified speaking assessment: receipt123\nTEIL 2\n1. A\n2. B\n3. A\n4. B\n5. A\nTEIL 3\n1. Richtig\n2. Falsch\n3. Falsch\n4. Richtig\n5. Falsch';
 let calls=0;
 const result=await withMarkingTransport(async()=>{calls++;throw Error('Must reuse saved assessment');},()=>pipeline.markSubmissionWithAI({referenceEntry,submissionText,serverSpeakingAssessment:{assignmentKey:'A1-11',score:8,maxScore:10,feedback:'Polite request.',assessmentId:'receipt123'}}));
 assert.equal(result.objectiveCorrect,10);assert.equal(result.objectiveTotal,10);
 assert.equal(result.speakingScore,8);assert.equal(result.finalScore,90);
 assert.equal(result.writingScore,null);assert.equal(result.status,'marked');assert.equal(calls,0);
});

for(const [assignmentKey,student,reading,listening] of [
 ['A2-5.13','leonard','1. A 2. B 3. B 4. B 5. C','1. B 2. C 3. B 4. B 5. C'],
 ['A2-6.16','selasi','1. B 2. C 3. D 4. A 5. C','1. B 2. A 3. B 4. B 5. A'],
])test(`${assignmentKey}: valid writing and shared objective marks release without false examiner disagreement`,async()=>{
 const pipeline=loadPipeline();
 const fixtures=require('../tests/fixtures/a2-day13-day16-submissions.json');
 const submissionText=`TEIL 2 ${fixtures[student]} TEIL 3 ${reading} TEIL 4 ${listening}`;
 let calls=0;
 const result=await withMarkingTransport(async(payload)=>{
  calls++;
  // Simulate the old secondary objective-scoring error: writing agrees,
  // but the AI's combined total differs by 12 marks.
  const score=payload.markingMode==='second_examiner'?74:86;
  return {level:'A2',assignmentKey,score,finalScore:score,writingScore:80,writingScorePercent:80,confidence:.99,status:'marked',shouldSendAutomatically:true,taskCompletion:{completed:3,total:3,missing:[]},feedback:'Clear relevant response.',parts:[{partId:'teil2',partType:'writing',score:80,maxScore:100}]};
 },()=>pipeline.markSubmissionWithAI({referenceEntry:pipeline.canonicalCourseReference(assignmentKey),submission:{level:'A2',assignmentKey},submissionText}));
 assert.equal(calls,2);
 assert.equal(result.objectiveCorrect,9);assert.equal(result.objectiveTotal,10);
 assert.equal(result.taskCompletion.completed,3);
 assert.equal(result.secondExaminer.scoreDelta,0);
 assert.equal(result.secondExaminer.requiresTutorReview,false);
 assert.equal(result.finalScore,86);
 assert.equal(require('./automaticCourseMarking').releasable(result),true);
 assert.equal(result.status,'marked',JSON.stringify({reasons:result.reviewReasons,warnings:result.consistencyWarnings,evidence:result.taskPointEvidence,ai:result.ai?.questionAwareWritingGuard,confidence:result.confidence}));
 assert.ok(result.confidence>=.8);
 assert.deepEqual(Array.from(result.missingTaskPoints),[]);
 assert.ok(!/missing points|required writing points are missing|answer was blank/i.test(result.feedback));
});

test('bundled automatic worker uses the current five-question B1 Day 7 listening key without AI',async()=>{
 const pipeline=loadPipeline();let calls=0;
 const result=await withMarkingTransport(async()=>{calls++;throw Error('No AI needed for objective answers');},()=>pipeline.markSubmissionWithAI({
  referenceEntry:pipeline.canonicalCourseReference('B1-3.7'),submission:{level:'B1',assignmentKey:'B1-3.7'},
  submissionText:'TEIL 3 1. A 2. B 3. B 4. B 5. B 6. C 7. A 8. F 9. B 10. C 11. D 12. E TEIL 4 1. B 2. B 3. A 4. A 5. B',
 }));
 assert.equal(result.objectiveTotal,17);assert.equal(result.objectiveCorrect,17);assert.equal(result.finalScore,100);assert.equal(calls,0);
 assert.match(result.feedback,/Teil 4: 5\/5 correct/);assert.doesNotMatch(result.feedback,/1\/10|questions? 6/);
});

test('Leonard’s A2 Day 16 weekend-before-Lust invitation releases without false missing-point or examiner holds',async()=>{
 const pipeline=loadPipeline();let calls=0;
 const submissionText='TEIL 2 Lieber Markus, Zur Entspannung lese ich ein Buch und dann schlafe genug, weil beides für mich gesund ist. Danach fahre ich mit dem Fahrrad im Park. Hast du nächstes Wochenende Lust, Yoga zu machen? Viele Grüße, Leonard TEIL 3 1. B 2. C 3. D 4. A 5. C TEIL 4 1. B 2. A 3. C 4. B 5. A';
 const result=await withMarkingTransport(async()=>{calls++;return {
  level:'A2',assignmentKey:'A2-6.16',score:92,finalScore:92,writingScore:80,writingScorePercent:80,confidence:.99,status:'marked',shouldSendAutomatically:true,
  taskCompletion:{completed:3,total:3,missing:[]},feedback:'The invitation clearly proposes a shared activity next weekend. Write “dann schlafe ich genug” instead of “dann schlafe genug”.',
  parts:[{partId:'teil2',partType:'writing',score:80,maxScore:100}],
 };},()=>pipeline.markSubmissionWithAI({referenceEntry:pipeline.canonicalCourseReference('A2-6.16'),submission:{level:'A2',assignmentKey:'A2-6.16'},submissionText}));
 assert.equal(calls,2);assert.equal(result.objectiveCorrect,10);assert.equal(result.objectiveTotal,10);
 assert.equal(result.taskCompletion.completed,3);assert.equal(result.taskCompletion.missing.length,0);
 assert.equal(result.secondExaminer.scoreDelta,0);assert.equal(result.secondExaminer.requiresTutorReview,false);
 assert.equal(result.status,'marked');assert.equal(result.finalScore,92);
 assert.doesNotMatch(result.feedback,/2 of 3|Invite Markus.*missing|required content point.*addressed/);
});
