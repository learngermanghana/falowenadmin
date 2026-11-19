import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getCuratedMusicByAssignment} from '../src/data/curatedLessonMusic.js';
import {getReusableSongDraft} from '../src/data/reusableMusicSongbook.js';
import {recordedSongQuestions} from '../src/utils/recordedLessonMusic.js';
import {A1_DAY22_STAGES} from '../src/data/a1Day22Classroom.js';

test('A1 Day 22 has one body-parts vocabulary stage and one distinct practice stage',()=>{
  const steps=A1_DAY22_STAGES.map(s=>s.step);
  assert.equal(steps.length,12);
  assert.equal(steps.filter(s=>s==='body-parts').length,1);
  assert.equal(steps[2],'body-parts');
  assert.equal(steps[3],'body-practice');
  assert.equal(steps.includes('weather'),false);
  const ui=readFileSync(new URL('../src/components/A1Day22ClassroomStage.jsx',import.meta.url),'utf8');
  for(const part of ['der Kopf','der Hals','der Bauch','der Rücken','der Arm','die Hand','das Bein','der Fuß'])
    assert.ok(ui.includes(part),part);
  assert.match(ui,/Meine Hände tun weh/);
});

test('A1 Day 22 music reuses A2 Day 26 tab and question renderer without replacing the recording',()=>{
  const ui=readFileSync(new URL('../src/components/A1Day22ClassroomStage.jsx',import.meta.url),'utf8');
  const shared=readFileSync(new URL('../src/components/LinkedPublishedSongLessonStage.jsx',import.meta.url),'utf8');
  assert.match(ui,/LinkedPublishedSongLessonStage/);
  assert.match(shared,/level === 'A1' && day === 22/);
  assert.match(shared,/3 · Fragen/);
  assert.match(shared,/published-song-lesson__options/);
  assert.match(shared,/Musterlösung für Lehrkraft zeigen/);
  assert.match(shared,/reference=\{lyrics:draft.lyrics,objectKey:track.objectKey,draftOnly:true\}/);
  assert.match(shared,/LESETEXT-ÜBUNG/);
  const recording=getCuratedMusicByAssignment('A1-14.1');
  assert.equal(recording.objectKey,'music/a1/day-22/Arzttermin.mp3');
  assert.ok(recording.audioUrl.startsWith('https://'));
  const draft=getReusableSongDraft('A1-14.1');
  const questions=recordedSongQuestions({lyrics:draft.lyrics},22,'A1');
  assert.ok(questions.some(q=>q.options?.length===3));
  for(const q of questions.filter(q=>q.options)) assert.equal(q.options[q.correctIndex],q.answer);
});
