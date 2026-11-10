import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getTeachingSlideByAssignmentId,getTeachingSlideById} from '../src/data/teachingSlides.js';
import {buildTeachingPresenterStages,isA2PresenterV2Slide} from '../src/utils/teachingPresenter.js';
import {getInteractiveLessonOpening,isInteractiveOpeningStage} from '../src/data/interactiveLessonOpenings.js';
import {selectRecordedLessonTrack} from '../src/utils/recordedLessonMusic.js';
import {A2_DAY1_LISTENING} from '../src/data/a2Day1Listening.js';
import supplied from '../src/data/a2Day1ListeningQuestions.json' with {type:'json'};

test('A2 Day 1 uses modern music then Hören without removing its grammar and reading stages',()=>{
 const slide=getTeachingSlideById('a2-day-1-small-talk');
 assert.equal(slide.assignmentId,'A2-1.1');assert.equal(isA2PresenterV2Slide(slide),true);
 assert.equal(getTeachingSlideByAssignmentId('A2-1.1').id,slide.id);
 const stages=buildTeachingPresenterStages(slide,slide.topic);
 assert.deepEqual(stages.slice(0, 7).map(s=>s.id),['intro','warmup','knowledge','workbook-grammar', 'common-mistakes','reading','grammar-check']);
 assert.equal(stages[1].variant,'interactive-music-video');
 assert.equal(stages[1].musicVideo.title,'Ein nettes Gespräch');
 assert.equal(stages[2].variant,'interactive-listening');
 assert.equal(stages[2].audioKey,'a2/day-01/small-talk.mp3');
 assert.equal(isInteractiveOpeningStage('A2-1.1','knowledge'),true);
 assert.equal(getInteractiveLessonOpening('A2-1.1').listening,A2_DAY1_LISTENING);
 assert.equal(stages[2].transcript.length,0);
 assert.match(JSON.stringify(slide),/weil/);assert.match(JSON.stringify(slide),/deshalb/);assert.match(JSON.stringify(slide),/denn/);
});
test('all five supplied MCQs retain their options, evidence and B A C A B key',()=>{
 const questions=A2_DAY1_LISTENING.questions;
 assert.deepEqual(questions.map(q=>q.correctIndex),[1,0,2,0,1]);
 questions.forEach((q,i)=>{
  assert.equal(q.prompt,supplied.questions[i].question);
  assert.deepEqual(q.options,supplied.questions[i].options);
  assert.equal(q.evidence,supplied.questions[i].evidence);
  assert.equal(q.answer,q.options[q.correctIndex]);
 });
});
test('Day 1 chooses the observed published song and keeps other days out',()=>{
 const make=(key,id)=>({id:'r2-a2-day-01-'+id,objectKey:key,title:id,level:'A2',day:1,autoDiscovered:true,coursebook:true,audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-01-'+id});
 const expected=make('music/a2/day-01/Ein nettes Gespräch.mp3','b64_RWluIG5ldHRlcyBHZXNwcsOkY2gubXAz');
 assert.equal(selectRecordedLessonTrack({tracks:[make('music/a2/day-01/other.mp3','other'),expected]},{level:'A2',day:1,assignmentKey:'A2-1.1'}).objectKey,expected.objectKey);
 const component=readFileSync(new URL('../src/components/LinkedPublishedSongLessonStage.jsx',import.meta.url),'utf8');
 assert.ok(component.includes('[1,2,19,20,21,23].includes(day)'));
 assert.ok(component.includes("day === 1 ? 'A2-1.1'"));
 const opening=readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx',import.meta.url),'utf8');
 assert.ok(opening.includes('[1, 18, 19, 20, 21].includes(lesson.listening.day)'));
});
