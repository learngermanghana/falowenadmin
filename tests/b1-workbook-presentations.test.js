import test from 'node:test';
import assert from 'node:assert/strict';
import {getSlidesByCourse} from '../src/data/teachingSlides.js';
import {buildTeachingPresenterStages} from '../src/utils/teachingPresenter.js';
import {B1_WORKBOOK_PRESENTATIONS,B1_PRESENTATION_SOURCE_SHA} from '../src/data/b1WorkbookPresentations.js';
import {A2_WORKBOOK_PRESENTATIONS} from '../src/data/a2WorkbookPresentations.js';

test('all 28 B1 lessons have their own workbook task, outline and single visible common-mistakes stage',()=>{
 assert.equal(Object.keys(B1_WORKBOOK_PRESENTATIONS).length,28);
 assert.match(B1_PRESENTATION_SOURCE_SHA,/^[a-f0-9]{40}$/);
 for(const slide of getSlidesByCourse('B1')){
  const stages=buildTeachingPresenterStages(slide),rows=stages.filter(s=>s.id==='workbook-presentation');
  assert.equal(rows.length,1,slide.assignmentId);
  assert.equal(rows[0].type,'b1-workbook-presentation');
  assert.deepEqual(rows[0].presentation,B1_WORKBOOK_PRESENTATIONS[slide.dayNumber]);
  assert.equal(stages.indexOf(rows[0])+1,stages.findIndex(s=>s.id==='workbook'));
  assert.ok(rows[0].presentation.structure.length>=5);
  assert.ok(rows[0].presentation.structure.every(s=>s.label));
  const mistakes=stages.filter(s=>s.type==='common-mistakes');assert.equal(mistakes.length,1);
  assert.match(mistakes[0].title,/Common mistakes/);
 }
});
test('B1 argument and specific task formats are copied faithfully',()=>{
 assert.equal(B1_WORKBOOK_PRESENTATIONS[20].prompt,'Welche Ausbildung und Qualifikationen sind für deinen Beruf wichtig?');
 assert.deepEqual(B1_WORKBOOK_PRESENTATIONS[20].structure.map(s=>s.label),['Thema vorstellen','Vorteile','Nachteile','Situation in deinem Land','Eigene Meinung','Schluss']);
 assert.match(B1_WORKBOOK_PRESENTATIONS[20].structure[1].starter,/Beispiel/);
 assert.equal(B1_WORKBOOK_PRESENTATIONS[5].roleplay,true);
 assert.equal(B1_WORKBOOK_PRESENTATIONS[5].structure[2].label,'Vier Fragen zur Wohnung');
 assert.match(B1_WORKBOOK_PRESENTATIONS[26].prompt,/Plant gemeinsam/);
 assert.equal(B1_WORKBOOK_PRESENTATIONS[8].structure.length,5,'retain the workbook-specific health outline');
 const mock=B1_WORKBOOK_PRESENTATIONS[23];assert.equal(mock.mode,'speaking-mock');
 assert.equal(mock.choices.length,8);assert.ok(mock.choices.every(q=>q.id.startsWith('b1-teil-2-')));
 assert.doesNotMatch(mock.prompt,/Date/,'do not teach the retired date task as the current mock');
});
test('A2 keeps its existing presentation tasks and renderer',()=>{
 for(const slide of getSlidesByCourse('A2')){
  const stage=buildTeachingPresenterStages(slide).find(s=>s.id==='workbook-presentation');
  assert.equal(stage.type,'workbook-presentation');assert.deepEqual(stage.presentation,A2_WORKBOOK_PRESENTATIONS[slide.dayNumber]);
 }
 for(const level of ['A1','B2','C1','C2'])for(const slide of getSlidesByCourse(level))assert.equal(buildTeachingPresenterStages(slide).some(s=>s.type==='b1-workbook-presentation'),false);
});
