import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getTeachingSlideById } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getInteractiveLessonOpening } from '../src/data/interactiveLessonOpenings.js';
import { A2_DAY26_CLASSROOM_AUDIO_KEY, A2_DAY26_CLASSROOM_LISTENING } from '../src/data/a2Day26ClassroomListening.js';

const slide = getTeachingSlideById('a2-day-26-gefuehle-situationen');
test('A2 Day 26 teaching slide displays the supplied five questions, with answers revealed only for discussion', () => {
  assert.equal(slide.assignmentId,'A2-10.26');
  const opening = getInteractiveLessonOpening('A2-10.26');
  assert.equal(opening.listening, A2_DAY26_CLASSROOM_LISTENING);
  const stage = buildTeachingPresenterStages(slide,slide.topic).find(stage => stage.variant === 'interactive-listening');
  assert.ok(stage);
  assert.equal(stage.audioKey, A2_DAY26_CLASSROOM_AUDIO_KEY);
  assert.equal(stage.audioDay, 26);
  assert.equal(stage.audioLevel, 'A2');
  assert.equal(stage.listeningItems.length,5);
  assert.deepEqual(stage.listeningItems.map(item=>item.correctIndex),[1,0,1,1,0]);
  assert.equal(stage.listeningItems[0].prompt,'Wie sieht Lisa heute aus?');
  assert.equal(stage.listeningItems[4].answer,'Sie beruhigen sie ein bisschen');
  assert.match(slide.workbookConnection.parts.find(part=>part.label.includes('Hören')).detailEn,/graded/i);
});
test('A2 Day 26 audio remains staff-authenticated, protected and signed',()=>{
  const source=readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx',import.meta.url),'utf8');
  assert.match(source,/23, 24, 25, 26, 27\]\.includes\(lesson\.listening\.day\)/);
  assert.match(source,/\/api\/course-media\/a2\/classroom-audio-url/);
  assert.match(source,/Bearer \$\{await user\.getIdToken\(\)\}/);
  assert.match(source,/onClick=\{prepareAudio\}/);
});
