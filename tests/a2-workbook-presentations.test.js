import test from 'node:test';
import assert from 'node:assert/strict';
import {getSlidesByCourse} from '../src/data/teachingSlides.js';
import {buildTeachingPresenterStages} from '../src/utils/teachingPresenter.js';
import {A2_WORKBOOK_PRESENTATIONS,A2_PRESENTATION_SOURCE_SHA} from '../src/data/a2WorkbookPresentations.js';

test('every A2 lesson exposes one named correction slide and its existing workbook speaking task',()=>{
 assert.equal(Object.keys(A2_WORKBOOK_PRESENTATIONS).length,28);
 assert.match(A2_PRESENTATION_SOURCE_SHA,/^[a-f0-9]{40}$/);
 for(const slide of getSlidesByCourse('A2')){
  const stages=buildTeachingPresenterStages(slide);
  const presentations=stages.filter(s=>s.id==='workbook-presentation');
  assert.equal(presentations.length,1,slide.assignmentId);
  const stage=presentations[0],task=A2_WORKBOOK_PRESENTATIONS[slide.dayNumber];
  assert.deepEqual(stage.presentation,task);
  assert.equal(stages.indexOf(stage)+1,stages.findIndex(s=>s.id==='workbook'));
  const mistakes=stages.filter(s=>s.type==='common-mistakes');
  assert.equal(mistakes.length,1);
  assert.match(mistakes[0].title,/Common mistakes/);
  assert.ok(mistakes[0].items.every(i=>i.prompt&&i.answer&&i.note));
  assert.ok(task.sourcePath.startsWith('web/src/components/'));
  assert.ok(task.prompt&&task.instruction);
  if(slide.dayNumber!==22){
   assert.ok(task.branches.length>=4);
   assert.equal(new Set(task.branches.map(b=>b.id)).size,task.branches.length);
   assert.ok(task.branches.every(b=>b.label&&b.question&&(b.starter||task.mode==='roleplay')));
  }
 }
});
test('Day 20 copies its complaint task; Day 22 uses the current mock pool rather than the retired weekly plan',()=>{
 assert.equal(A2_WORKBOOK_PRESENTATIONS[20].prompt,'Du möchtest ein defektes oder falsches Produkt reklamieren. Erkläre das Problem höflich und sage, welche Lösung du möchtest.');
 assert.deepEqual(A2_WORKBOOK_PRESENTATIONS[20].branches.map(b=>b.label),['Produkt','Problem','Wunsch','Beleg','Lösung']);
 const mock=A2_WORKBOOK_PRESENTATIONS[22];
 assert.equal(mock.mode,'speaking-mock');
 assert.ok(mock.choices.length>1);
 assert.ok(mock.choices.every(q=>q.id.startsWith('a2-teil-2-')&&q.prompt&&q.keywords));
 assert.equal(mock.branches,undefined);
});
test('B1 and other courses receive no A2 presentation stages',()=>{
 for(const level of ['A1','B1','B2','C1','C2'])for(const slide of getSlidesByCourse(level))
  assert.equal(buildTeachingPresenterStages(slide).some(s=>s.type==='workbook-presentation'),false,slide.assignmentId);
});

test('Day 8 preserves the workbook restaurant role-play instead of the unused cooking mind map',()=>{
 const task=A2_WORKBOOK_PRESENTATIONS[8];
 assert.equal(task.mode,'roleplay');
 assert.match(task.situation,/Eine Person ist Gast/);
 assert.equal(task.branches[0].question,'Begrüße und bitte um die Speisekarte.');
 assert.equal(task.branches.at(-1).question,'Bitte am Ende um die Rechnung.');
 assert.doesNotMatch(task.branches.map(b=>b.question).join(' '),/Rezept|Zutaten/);
});
