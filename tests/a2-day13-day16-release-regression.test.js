import fixture from "./fixtures/a2-day13-day16-submissions.json" with {type:"json"};
const {leonard,selasi}=fixture;
import test from 'node:test';
import assert from 'node:assert/strict';
import {getA2WritingTaskSpec} from '../src/data/a2WritingTaskSpecs.js';
import {evaluateWritingTaskEvidence} from '../src/utils/writingTaskEvidence.js';
import {applyQuestionAwareWritingGuard} from '../src/utils/questionAwareWritingMarking.js';
import {computeObjectiveScore} from '../src/utils/objectiveMarking.js';
import {checkDeterministicObjectiveAnswers} from '../src/utils/autoMarking.js';
import {normalizeAnswerKeyEntry} from '../src/utils/answerKeyNormalizer.js';
import dictionary from '../src/data/answers_dictionary.json' with {type:'json'};



const cases = [
 ['A2-5.13',leonard,'1. A 2. B 3. B 4. B 5. C','1. B 2. C 3. B 4. B 5. C'],
 ['A2-6.16',selasi,'1. B 2. C 3. D 4. A 5. C','1. B 2. A 3. B 4. B 5. A'],
];
for(const [assignmentKey,writing,reading,listening] of cases){
 const [title,raw]=Object.entries(dictionary).find(([,entry])=>entry.assignment_id===assignmentKey);
 const referenceEntry=normalizeAnswerKeyEntry(title,raw);
 test(`${assignmentKey}: concrete writing evidence meets all three points`,()=>{
  const evidence=evaluateWritingTaskEvidence(getA2WritingTaskSpec(assignmentKey),writing);
  assert.deepEqual(evidence.map(e=>e.status),['met','met','met']);
  assert.ok(evidence.every(e=>e.evidence));
 });
 for(const separator of [' ','\n'])test(`${assignmentKey}: same-line headings preserve writing and every objective answer (${JSON.stringify(separator)})`,()=>{
  const text=`TEIL 2 ${writing}${separator}TEIL 3 ${reading}${separator}TEIL 4 ${listening}`;
  const objective=computeObjectiveScore(referenceEntry,text);
  assert.equal(objective.correctCount,9);assert.equal(objective.totalCount,10);
  assert.equal(objective.details['teil3.1'].student,assignmentKey==='A2-5.13'?'A':'B');
  assert.equal(objective.details['teil4.1'].student,'B');
  const firstPass=checkDeterministicObjectiveAnswers({referenceEntry,submissionText:text});
  assert.equal(firstPass.objectiveCorrect,9);assert.equal(firstPass.objectiveTotal,10);
  const guarded=applyQuestionAwareWritingGuard({status:'marked',confidence:.95,writingScore:80,writingScorePercent:80,taskCompletion:{completed:3,total:3},feedback:'Clear task response.'},{referenceEntry,submission:{assignmentKey,level:'A2'},submissionText:text},text);
  assert.deepEqual(guarded.missingTaskPoints,[]);
  assert.equal(guarded.taskCompletion.completed,3);
  assert.equal(guarded.status,'marked');
 });
}
test('A2-5.13 still requires both experience and a positive skill',()=>{
 const task=getA2WritingTaskSpec('A2-5.13');
 for(const text of ['Ich habe in einem Supermarkt gearbeitet.','Ich habe keine Erfahrung. Ich kann nicht im Team arbeiten.']) assert.equal(evaluateWritingTaskEvidence(task,text)[1].status,'missing');
 assert.equal(evaluateWritingTaskEvidence(task,'Ich habe in einem Supermarkt gearbeitet. Ich konnte Kunden beraten.')[1].status,'met');
 assert.equal(evaluateWritingTaskEvidence(task,'Ich habe ein Praktikum gemacht und im Team gearbeitet.')[1].status,'met');
});
test('A2-6.16 still requires a benefit, not only a topic, price or negated statement',()=>{
 const task=getA2WritingTaskSpec('A2-6.16');
 for(const text of ['Ich mache Yoga im Park.','Yoga ist kostenlos.','Yoga ist nicht entspannend.','Die Übungen sind nicht besonders erholsam.','Ich fühle mich danach nicht besser.','Ich mache Yoga, weil ich Zeit habe.']) assert.equal(evaluateWritingTaskEvidence(task,text)[1].status,'missing');
 for(const text of ['Die Übungen sind einfach und entspannend.','Yoga hilft mir, Stress abzubauen.','Ich fühle mich danach besser.','Ich mache Yoga, weil es entspannend ist und nicht viel kostet.','Ich mache Yoga, weil es mir hilft, Stress zu reduzieren.']) assert.equal(evaluateWritingTaskEvidence(task,text)[1].status,'met');
});
