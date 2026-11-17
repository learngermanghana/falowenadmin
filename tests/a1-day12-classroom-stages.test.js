import test from 'node:test';
import assert from 'node:assert/strict';
import { A1_DAY12_STAGES, DAY12_MONTHS, DAY12_MINUTES, DAY12_ORDINALS } from '../src/data/a1Day12Classroom.js';
import { getTeachingSlideByAssignmentId } from '../src/data/teachingSlides.js';
test('Day 12 has the approved fourteen projected classroom stages in order',()=>{
  assert.equal(A1_DAY12_STAGES.length,14);
  assert.deepEqual(A1_DAY12_STAGES.map(s=>s.step),[
    'intro','compare','all-hours','convert','minutes','minute-practice',
    'months','months-practice','ordinals','calendar','timetable','music',
    'music-challenge','workbook'
  ]);
  assert.equal(new Set(A1_DAY12_STAGES.map(s=>s.id)).size,14);
  assert.ok(A1_DAY12_STAGES.every(s=>s.items.length>0));
});
test('Day 12 teaches all months, exact minutes and ordinal dates without adding a graded section',()=>{
  assert.equal(DAY12_MONTHS.length,12);
  assert.equal(DAY12_MONTHS[2],'März');
  assert.deepEqual(DAY12_MINUTES[0],['13:43','dreizehn Uhr dreiundvierzig']);
  assert.ok(DAY12_ORDINALS.some(row=>row[1]==='der dreiundzwanzigste'));
  const slide=getTeachingSlideByAssignmentId('A1-8');
  assert.equal(slide.dayNumber,12);
  assert.equal(slide.workbookConnection.parts.length,2);
  assert.ok(slide.workbookConnection.parts.every(p=>p.label.includes('Lesen')));
});
