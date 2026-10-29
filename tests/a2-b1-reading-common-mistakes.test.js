import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getSlidesByCourse } from '../src/data/teachingSlides.js';
import { getPresenterReadingLesson } from '../src/data/presenterReadingLessons.js';
import { A2_B1_COMMON_MISTAKES } from '../src/data/a2B1CommonMistakes.js';
import { getInteractiveLessonOpening } from '../src/data/interactiveLessonOpenings.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';

test('all 56 lessons have one existing reading and a distinct topic correction page', () => {
  const slides = ['A2', 'B1'].flatMap(getSlidesByCourse);
  assert.equal(slides.length, 56);
  assert.deepEqual(Object.keys(A2_B1_COMMON_MISTAKES).sort(), slides.map(s => s.assignmentId).sort());
  const errors = new Set();
  for (const slide of slides) {
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const ids = stages.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, slide.assignmentId);
    const reading = stages.find(s => s.id === 'reading');
    const original = getPresenterReadingLesson(slide.assignmentId);
    assert.equal(reading.textDe, original.textDe);
    assert.deepEqual(reading.items, original.checks);
    assert.deepEqual(reading.answerItems, original.answers);
    assert.equal(stages.filter(s => s.textDe === original.textDe && !s.variant?.startsWith('interactive-')).length, 1);
    assert.equal(ids.includes('phrases'), false);
    assert.equal(stages.filter(s => s.type === 'vocabulary').length, 0);
    const mistakes = stages.find(s => s.id === 'common-mistakes');
    assert.ok(mistakes.items.length >= 2 && mistakes.items.length <= 3);
    assert.equal(ids.indexOf('common-mistakes') + 1, ids.indexOf('reading'));
    assert.equal(ids.indexOf('reading') + 1, ids.indexOf('grammar-check'));
    for (const item of mistakes.items) {
      assert.notEqual(item.prompt, item.answer);
      assert.ok(item.note.length > 20);
      assert.ok(!errors.has(item.prompt), `Reused placeholder: ${item.prompt}`);
      errors.add(item.prompt);
    }
    assert.ok(stages.find(s => s.id === 'questions'));
    assert.ok(stages.find(s => s.id === 'workbook'));
    const media = stages.find(s => s.id === 'knowledge');
    const opening = getInteractiveLessonOpening(slide.assignmentId);
    assert.equal(Boolean(media), Boolean(opening?.listening), slide.assignmentId);
    if (media) assert.ok(media.variant.startsWith('interactive-'));
  }
});

test('bank music, conversation, mistakes and original Ama reading remain separate', () => {
  const slide = getSlidesByCourse('A2').find(s => s.assignmentId === 'A2-7.18');
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.deepEqual(stages.slice(0, 6).map(s => s.id), ['intro', 'warmup', 'knowledge', 'common-mistakes', 'reading', 'grammar-check']);
  assert.equal(stages[1].musicVideo.trackId, 'a2-day-18-bank');
  assert.equal(stages[2].audioKey, 'a2/day-18/bank-telefonat.mp3');
  assert.match(stages[4].textDe, /Ama.*Bankkarte/);
  assert.equal(stages[4].listeningItems, undefined);
  assert.equal(stages[3].items.length, 3);
});

test('correction page uses existing reveal controls without a writing form', () => {
  const source = readFileSync(new URL('../src/components/TeachingSlidePresenter.jsx', import.meta.url), 'utf8');
  const branch = source.split('stage.type === "common-mistakes") ? (')[1].split('stage.type === "b2-grammar"')[0];
  assert.match(branch, /<details>/);
  assert.match(branch, /Lösung zeigen/);
  assert.match(branch, /item.answer/);
  assert.doesNotMatch(branch, /<textarea|<input|<form|submit|fetch\(/);
});

test('A2 days 18-20 retain music, separate Hören, Lesen, Common Mistakes and approved page count', () => {
  const audio = {
    'A2-7.18': 'a2/day-18/bank-telefonat.mp3',
    'A2-7.19': 'a2/day-19/einkaufen-wo-und-wie.mp3',
    'A2-7.20': 'a2/day-20/reklamation-falsches-hemd.mp3',
  };
  const slides = getSlidesByCourse('A2');
  for (const [assignmentId, audioKey] of Object.entries(audio)) {
    const slide = slides.find(row => row.assignmentId === assignmentId);
    assert.ok(slide, assignmentId);
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    assert.equal(stages.length, 10, assignmentId);
    assert.deepEqual(stages.slice(0, 6).map(s => s.id),
      ['intro', 'warmup', 'knowledge', 'common-mistakes', 'reading', 'grammar-check'], assignmentId);
    assert.equal(stages[1].variant, 'interactive-music-video', assignmentId);
    assert.equal(stages[1].musicVideo.mediaType, 'music', assignmentId);
    assert.equal(stages[2].variant, 'interactive-listening', assignmentId);
    assert.equal(stages[2].audioKey, audioKey, assignmentId);
    assert.equal(stages[2].listeningItems.length, 5, assignmentId);
    assert.equal(stages[4].textDe, getPresenterReadingLesson(assignmentId).textDe);
    assert.ok(stages[3].items.length >= 2, assignmentId);
  }
  assert.equal(getInteractiveLessonOpening('A2-7.19').musicIntro.audioUrl, undefined);
  assert.equal(getInteractiveLessonOpening('A2-7.20').musicIntro.youtubeId, undefined);
});
