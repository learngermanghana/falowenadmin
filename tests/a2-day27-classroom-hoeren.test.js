import test from 'node:test';
import assert from 'node:assert/strict';
import { getTeachingSlideById } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';

test('A2 Day 27 presents the Anna and Lukas dialogue after Handy weg', () => {
  const slide = getTeachingSlideById('a2-day-27-digitale-kommunikation');
  const [, music, listening] = buildTeachingPresenterStages(slide, slide.topic);
  assert.equal(music.musicVideo.title, 'Handy weg');
  assert.equal(listening.variant, 'interactive-listening');
  assert.equal(listening.audioKey, 'a2/day-27/digitale-kommunikation.mp3');
  assert.equal(listening.audioDay, 27);
  assert.equal(listening.transcript.length, 14);
  assert.deepEqual(listening.listeningItems.map(q => q.correctIndex), [1, 0, 2, 1, 0]);
  for (const q of listening.listeningItems) {
    assert.equal(q.answer, q.options[q.correctIndex]);
    assert.ok(listening.transcript.some(([, line]) => line === q.evidence));
  }
});
