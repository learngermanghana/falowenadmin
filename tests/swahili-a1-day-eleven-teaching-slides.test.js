import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { swahiliSlidePacks } from '../src/data/swahiliSlidePacks.js';
import { SWAHILI_DAY_TEN_ADMIN_LESSON as dayTen } from '../src/data/swahiliDayTenTeachingSlides.js';
import { SWAHILI_DAY_ELEVEN_ADMIN_LESSON as lesson } from '../src/data/swahiliDayElevenTeachingSlides.js';

test('Day 11 is selectable in A1 and follows the Day 10 core teaching flow', () => {
  assert.ok(swahiliSlidePacks.A1.includes(lesson));
  assert.deepEqual(lesson.stages.map(s => s.id), dayTen.stages.filter(s => !s.id.startsWith('radio-')).map(s => s.id));
  const presenter = fs.readFileSync(new URL('../src/components/SwahiliTeachingSlides.jsx', import.meta.url), 'utf8');
  assert.match(presenter, /slideId === SWAHILI_DAY_ELEVEN_ADMIN_LESSON.id \? dayElevenPresenterSlide/);
  assert.match(presenter, /assignmentId: "SWAHILI-DAY-11"/);
  assert.match(presenter, /campus\/course\/swahili\/day-11/);
});

test('Day 11 uses its own AI lesson and Falowen Radio videos', () => {
  const video = lesson.stages.find(s => s.id === 'ai-video');
  const radio = lesson.stages.find(s => s.id === 'radio');
  assert.equal(video.type, 'teacher-lecture');
  assert.equal(video.videoId, '4DpZGme4Bu4');
  assert.equal(radio.radioVideoId, '_eSAXWecsgY');
  assert.doesNotMatch(JSON.stringify(lesson), /4_ygEiW5QjI|xLN5QX669JA|swahili-a1-day-10/);
});

test('Day 11 Music opens the Dukani recording and its own classroom questions', () => {
  const music = lesson.stages.find(stage => stage.id === 'music');
  assert.equal(music.type, 'music');
  assert.equal(music.audio.objectKey, 'swahili/music/A1/day-11/Dukani.mp3');
  assert.equal(music.audio.id, 'swahili-a1-day-11');
  assert.ok(music.questions.some(question => question.answer.includes('elfu kumi na moja')));
});

test('teacher listening and separate dialogue use the source quantities and prices', () => {
  const dialogue = lesson.stages.find(s => s.id === 'dialogue');
  const listening = lesson.stages.find(s => s.id === 'listening');
  assert.ok(listening.notes.includes(dialogue.content));
  assert.match(dialogue.content, /kalamu kumi/);
  assert.match(dialogue.content, /mia tano/);
  assert.match(dialogue.content, /mia nne/);
  assert.equal(lesson.stages.find(s => s.id === 'grammar').details.length, 5);
});
