import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getSlidesByCourse } from '../src/data/teachingSlides.js';
import { A2_APPLICATION_LABS, getA2ApplicationLab } from '../src/data/a2ApplicationLabs.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';

const a2 = getSlidesByCourse('A2');

test('every A2 day 1–28 has a unique practical grammar application lab', () => {
  assert.equal(a2.length,28);
  assert.equal(Object.keys(A2_APPLICATION_LABS).length,28);
  const titles = new Set();
  for (const slide of a2) {
    const lab = getA2ApplicationLab(slide.assignmentId);
    assert.ok(lab,slide.assignmentId);
    assert.equal(lab.day,slide.dayNumber);
    assert.ok(lab.title.length>8 && lab.context.length>30,slide.assignmentId);
    assert.ok(!titles.has(lab.title),slide.assignmentId+' repeats a title');
    titles.add(lab.title);
    assert.ok(lab.columns.length>=3 && lab.rows.length>=3,slide.assignmentId);
    assert.ok(lab.rows.every(row=>row.length===lab.columns.length && row.every(Boolean)),slide.assignmentId);
    assert.equal(lab.tasks.length,3,slide.assignmentId);
    assert.deepEqual(lab.tasks.map(task=>task.id),['recognise-rule','fix-error','build-sentence']);
    assert.ok(lab.tasks.every(task=>task.label && task.prompt.length>18 && task.hint && task.answer.length>15 && task.criterion),slide.assignmentId);
    assert.equal(new Set(lab.tasks.map(task=>task.prompt)).size,3,slide.assignmentId);
  }
  assert.equal(getA2ApplicationLab('B1-1.1'),null);
  assert.equal(getA2ApplicationLab('A2-9.99'),null);
});

test('all 28 A2 grammar-check slots show an interactive lab without adding or removing workbook stages',()=>{
  for(const slide of a2){
    const stages=buildTeachingPresenterStages(slide,slide.topic);
    const matches=stages.filter(stage=>stage.id==='grammar-check');
    assert.equal(matches.length,1,slide.assignmentId);
    const stage=matches[0];
    assert.equal(stage.type,'grammar-check',slide.assignmentId);
    assert.equal(stage.variant,'a2-application-lab',slide.assignmentId);
    assert.equal(stage.lab,getA2ApplicationLab(slide.assignmentId),slide.assignmentId);
    assert.equal(stage.items.length,3,slide.assignmentId);
    assert.ok(stage.items.every(item=>item.prompt&&item.answer&&item.note),slide.assignmentId);
    assert.ok(stages.some(item=>item.id==='workbook-grammar'),slide.assignmentId);
    assert.ok(stages.some(item=>item.id==='common-mistakes'),slide.assignmentId);
    assert.ok(stages.some(item=>item.id==='reading'),slide.assignmentId);
    assert.ok(stages.some(item=>item.id==='workbook'),slide.assignmentId);
    assert.ok(stages.some(item=>item.id==='workbook-presentation'),slide.assignmentId);
    const practiceIndex=stages.findIndex(item=>item.id==='practice'||item.id==='scenario-challenge');
    assert.ok(practiceIndex>stages.indexOf(stage),slide.assignmentId);
  }
});

test('authored examples target the grammar already taught on the relevant day',()=>{
  const text=day=>getA2ApplicationLab(a2[day-1].assignmentId).tasks.map(task=>[task.prompt,task.hint,task.answer,task.criterion].join(' ')).join(' ');
  assert.match(text(1),/weil/); assert.match(text(1),/deshalb/);
  assert.match(text(2),/einen schwarzen Mantel/);
  assert.match(text(3),/genauso viele Zimmer wie/);
  assert.match(text(4),/Wohin\?/); assert.match(text(4),/Dativ/);
  assert.match(text(6),/Akkusativ/);
  assert.match(text(7),/die einen Balkon hat/);
  assert.match(text(9),/ist mit dem Zug nach Berlin gefahren/);
  assert.match(text(13),/musste/);
  assert.match(text(14),/damit/);
  assert.match(text(15),/seit drei Jahren/);
  assert.match(text(18),/Könnten Sie/);
  assert.match(text(20),/reklamiere/);
  assert.match(text(21),/falls/);
  assert.match(text(22),/Am Montag arbeite/);
  assert.match(text(23),/mit dem Fahrrad zur Universität/);
  assert.match(text(26),/Wenn ich/);
  assert.match(text(27),/dass/);
  assert.match(text(28),/wird Geld sparen/);
});

test('interactive player is present, accessible and ungraded; B1 remains unchanged',()=>{
  const renderer=readFileSync(new URL('../src/components/TeachingSlidePresenter.jsx',import.meta.url),'utf8');
  const component=readFileSync(new URL('../src/components/A2ApplicationLab.jsx',import.meta.url),'utf8');
  assert.match(renderer,/stage\.variant === "a2-application-lab"/);
  assert.match(renderer,/<A2ApplicationLab/);
  assert.match(component,/Lösung zeigen/);
  assert.match(component,/Noch üben/);
  assert.match(component,/role="region"/);
  assert.match(component,/Keine Benotung oder automatische Übertragung/);
  for(const slide of getSlidesByCourse('B1')){
    const stage=buildTeachingPresenterStages(slide,slide.topic).find(item=>item.id==='grammar-check');
    assert.notEqual(stage?.variant,'a2-application-lab',slide.assignmentId);
  }
});
