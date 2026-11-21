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

test('pending media have no recordings or borrowed Day 10 links', () => {
  for (const id of ['ai-video', 'music', 'radio']) {
    const stage = lesson.stages.find(s => s.id === id);
    assert.equal(stage.type, 'media-pending');
    for (const field of ['audio', 'videoId', 'radioVideoId', 'radioUrl']) assert.equal(stage[field], undefined);
  }
  const renderer = fs.readFileSync(new URL('../src/components/SwahiliA2LessonStage.jsx', import.meta.url), 'utf8');
  assert.match(renderer, /stage.type === "media-pending"/);
  assert.doesNotMatch(JSON.stringify(lesson), /4_ygEiW5QjI|xLN5QX669JA|swahili-a1-day-10/);
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
