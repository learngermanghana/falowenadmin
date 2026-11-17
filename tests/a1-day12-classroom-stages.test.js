import test from 'node:test';
import assert from 'node:assert/strict';
import { A1_DAY12_STAGES, DAY12_MONTHS, DAY12_MINUTES, DAY12_ORDINALS } from '../src/data/a1Day12Classroom.js';
import classroomSongTiming from '../src/data/a1ClassroomSongTiming.js';
import { getA1PresenterRecording } from '../src/data/a1PresenterMusicStage.js';
import { threeVerifiedNextLyricQuestions } from '../src/utils/nextLyricQuestions.js';
import { resolveTeachingSongEnglishTranslation } from '../src/utils/musicEnglishDrafts.js';
import { getTeachingSlideByAssignmentId } from '../src/data/teachingSlides.js';
test('Day 12 has the approved thirteen projected classroom stages in order',()=>{
  assert.equal(A1_DAY12_STAGES.length,13);
  assert.deepEqual(A1_DAY12_STAGES.map(s=>s.step),[
    'intro','compare','all-hours','convert','minutes','minute-practice',
    'months','months-practice','ordinals','calendar','timetable','music',
    'workbook'
  ]);
  assert.equal(new Set(A1_DAY12_STAGES.map(s=>s.id)).size,13);
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

test('Samstag um zehn has bilingual cues and three excerpts for the exact published recording', () => {
  const pack = classroomSongTiming['A1-8'];
  const recording = getA1PresenterRecording('A1-8', 12);
  assert.equal(pack.objectKey, recording.objectKey);
  const questions = threeVerifiedNextLyricQuestions(pack, recording);
  assert.equal(questions.length, 3);
  assert.equal(questions[0].evidence, '„Wann kommst du? Sag mir wann!“');
  assert.equal(questions[0].answer, 'Am Samstag habe ich Zeit,');
  for (const question of questions) {
    const line = pack.cues.findIndex(cue => cue.text === question.evidence);
    assert.ok(question.previewRange.end <= pack.cues[line].end);
    assert.ok(question.previewRange.end < pack.cues[line + 1].start);
    assert.ok(question.previewRange.end - question.previewRange.start <= 7.5);
    assert.ok(question.previewRange.end - question.previewRange.start >= 4.5);
    assert.equal(pack.cues[line + 1].text, question.answer);
    assert.equal(question.continuationRange.start, pack.cues[line + 1].start);
    assert.ok(question.continuationRange.start >= question.previewRange.end);
  }
  assert.equal(resolveTeachingSongEnglishTranslation({
    assignmentKey: 'A1-8', objectKey: recording.objectKey, lyrics: pack.lyrics,
    publishedEnglish: pack.englishTranslation,
  }).lines.length, pack.cues.length);
});
