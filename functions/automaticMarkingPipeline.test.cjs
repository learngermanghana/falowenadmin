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
