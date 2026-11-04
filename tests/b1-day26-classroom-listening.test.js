import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getSlidesByCourse } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from '../src/data/interactiveLessonOpenings.js';
import { B1_DAY26_AUDIO_KEY, B1_DAY26_LISTENING } from '../src/data/b1Day26Listening.js';

test('B1 Day 26 shows the supplied private hotel listening directly after its music', () => {
 const slide=getSlidesByCourse('B1').find(s=>s.assignmentId==='B1-9.26');
 const stages=buildTeachingPresenterStages(slide);
 assert.equal(stages[1].variant,'interactive-music-video');
 assert.equal(stages[1].musicVideo.day,26);
 assert.equal(stages[2].id,'knowledge');
 assert.equal(stages[2].variant,'interactive-listening');
 assert.equal(stages[2].audioKey,'a2/day-26/reiseprobleme-und-losungen.mp3');
 assert.equal(stages[2].audioLevel,'B1');
 assert.equal(stages[2].audioDay,26);
 assert.deepEqual(stages[2].listeningItems.map(q=>q.correctIndex),[1,0,2,0,1]);
 assert.ok(stages[2].listeningItems.every(q=>q.options.length===3&&q.evidence&&q.answer));
 assert.equal(stages[2].listeningItems[0].prompt,'Warum ruft Thomas Frau Weber an?');
 assert.equal(stages[2].transcript.length,0,'do not invent a transcript from answer snippets');
 assert.equal(isInteractiveOpeningStage('B1-9.26','knowledge'),true);
 assert.equal(getInteractiveLessonOpening('B1-9.26').listening,B1_DAY26_LISTENING);
 assert.ok(stages.some(s=>s.id==='common-mistakes'));
 assert.ok(stages.some(s=>s.id==='reading'));
});

test('the Admin routes the cross-prefix object through the exact-key staff gateway',()=>{
 const source=readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx',import.meta.url),'utf8');
 assert.ok(source.includes('lesson.listening.level === "B1"'));
 assert.ok(source.includes('lesson.listening.day === 26'));
 assert.ok(source.includes(B1_DAY26_AUDIO_KEY));
 assert.ok(source.includes('isB1Day25Classroom || isB1Day26Classroom'));
 assert.ok(source.includes('https://www.falowen.app/api/course-media/classroom/audio-url'));
 assert.ok(source.includes('Authorization: `Bearer ${await user.getIdToken()}`'));
});
