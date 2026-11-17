import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {A1_DAY2_CLASSROOM_STAGES,A1_DAY2_LESSON_ID,A1_DAY2_PRONOUNS} from '../src/data/a1Day2Classroom.js';
import {getTeachingSlideById} from '../src/data/teachingSlides.js';

// A1 Day 2 was previously added only to TeachingSlidePresenter, but the
// actual /teaching-slides/course/A1 route uses A1GrammarPresenter.
test('combined Day 2 permalink routes through the same active A1 presenter that renders all 12 stages',()=>{
  const page=readFileSync(new URL('../src/pages/TeachingSlidesPage.jsx',import.meta.url),'utf8');
  const presenter=readFileSync(new URL('../src/components/A1GrammarPresenter.jsx',import.meta.url),'utf8');
  assert.match(page,/if \(a1GrammarLesson\) \{/);
  assert.match(page,/<A1GrammarPresenter/);
  assert.match(presenter,/if \(slide\?\.id === A1_DAY2_LESSON_ID\) return A1_DAY2_CLASSROOM_STAGES/);
  assert.match(presenter,/<A1Day2TeachingStage key=\{stage\.id\} step=\{stage\.step\} \/>/);
  assert.equal(A1_DAY2_LESSON_ID,'a1-0-2-1-1');
  assert.equal(getTeachingSlideById(A1_DAY2_LESSON_ID)?.assignmentId,'A1-0.2_1.1');
  assert.equal(A1_DAY2_CLASSROOM_STAGES.length,12);
  assert.deepEqual(A1_DAY2_PRONOUNS.map(p=>p.de),['ich','du','er','sie','es']);
  assert.deepEqual(A1_DAY2_CLASSROOM_STAGES.slice(-3).map(s=>s.step),['music','music-challenge','recap']);
});
