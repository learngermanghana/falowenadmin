import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getSlidesByCourse } from '../src/data/teachingSlides.js';
import { getPresenterReadingLesson } from '../src/data/presenterReadingLessons.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';

for (const level of ['A2', 'B1']) {
  test(`${level} replaces the repeated vocabulary page with its existing Lesen`, () => {
    for (const slide of getSlidesByCourse(level)) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const reading = stages.find(s => s.id === 'reading');
      assert.equal(stages.some(s => s.id === 'phrases' || s.type === 'vocabulary'), false);
      assert.equal(reading.textDe, getPresenterReadingLesson(slide.assignmentId).textDe);
      assert.equal(stages.filter(s => s.id === 'reading').length, 1);
      assert.ok(slide.keyPhrasesDe.length >= 4);
      assert.ok(stages.find(s => s.id === 'questions'));
      assert.ok(stages.find(s => s.id === 'grammar-check'));
    }
  });
}

test('vocabulary renderer stays available for the other levels', () => {
  const source = fs.readFileSync(new URL('../src/components/TeachingSlidePresenter.jsx', import.meta.url), 'utf8');
  assert.match(source, /stage\.type === "vocabulary"/);
  for (const level of ['B2', 'C1', 'C2']) {
    assert.ok(getSlidesByCourse(level).every(slide => buildTeachingPresenterStages(slide, slide.topic).some(s => s.type === 'vocabulary')));
  }
});
