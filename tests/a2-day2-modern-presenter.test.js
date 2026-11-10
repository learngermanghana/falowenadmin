import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getTeachingSlideById, getTeachingSlideByAssignmentId } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from '../src/data/interactiveLessonOpenings.js';
import { getA2TeacherChallenge } from '../src/data/a2TeacherChallenges.js';
import { A2_DAY2_LISTENING, A2_DAY2_AUDIO_KEY } from '../src/data/a2Day2Listening.js';
import { selectRecordedLessonTrack } from '../src/utils/recordedLessonMusic.js';
import supplied from '../src/data/a2Day2ListeningQuestions.json' with {type:'json'};

const slide = getTeachingSlideById('a2-day-2-personen-beschreiben');
const stages = buildTeachingPresenterStages(slide, slide.topic);

test('A2 Day 2 uses published music, then separate classroom Hören and later scenario before Sprechen', () => {
  assert.equal(slide.assignmentId, 'A2-1.2');
  assert.equal(getTeachingSlideByAssignmentId('A2-1.2')?.id, slide.id);
  assert.deepEqual(stages.slice(0, 7).map(s=>s.id),
    ['intro','warmup','knowledge','workbook-grammar', 'common-mistakes','reading','grammar-check']);
  assert.equal(stages[1].variant, 'interactive-music-video');
  assert.equal(stages[1].musicVideo.day, 2);
  assert.equal(stages[2].variant, 'interactive-listening');
  assert.equal(stages[2].audioKey, A2_DAY2_AUDIO_KEY);
  assert.equal(stages[2].listeningItems.length, 5);
  assert.equal(stages[2].transcript.length, 0);
  assert.equal(isInteractiveOpeningStage('A2-1.2','knowledge'),true);
  assert.equal(getInteractiveLessonOpening('A2-1.2')?.listening,A2_DAY2_LISTENING);
  assert.equal(stages.filter(s=>['practice','scenario-challenge'].includes(s.id)).length,1);
  const scenarioIndex=stages.findIndex(s=>s.id==='scenario-challenge');
  const questionsIndex=stages.findIndex(s=>s.id==='questions');
  assert.ok(scenarioIndex>0 && scenarioIndex<questionsIndex,'role-play must come before speaking questions');
  assert.ok(stages.some(s=>s.id==='workbook-presentation'));
  assert.ok(stages.some(s=>s.id==='lesson-summary'));
});

test('supplied five MCQs and evidence remain unchanged with A B C A B answer positions', () => {
  assert.equal(supplied.mode,'course');
  assert.equal(supplied.title,'Personen beschreiben');
  assert.deepEqual(A2_DAY2_LISTENING.questions.map(q=>q.correctIndex),[0,1,2,0,1]);
  assert.equal(A2_DAY2_LISTENING.questions.length,5);
  A2_DAY2_LISTENING.questions.forEach((q,i)=>{
    assert.equal(q.prompt,supplied.questions[i].question);
    assert.deepEqual(q.options,supplied.questions[i].options);
    assert.equal(q.evidence,supplied.questions[i].evidence);
    assert.equal(q.answer,q.options[q.correctIndex]);
  });
});

test('three interactive speaking scenarios contain progressive prompts and hidden model answers', () => {
  const c=getA2TeacherChallenge('A2-1.2');
  assert.equal(c.scenarios.length,3);
  assert.deepEqual(stages.find(s=>s.id==='scenario-challenge').items,c.scenarios);
  assert.ok(c.scenarios.every(s=>s.context && s.steps.length===3));
  assert.ok(c.scenarios.every(s=>s.steps.every(x=>x.actionDe && x.questionDe && x.modelDe)));
  const models=c.scenarios.flatMap(s=>s.steps.map(q=>q.modelDe)).join(' ');
  assert.match(models,/einen grünen Pullover/);
  assert.match(models,/eine rote Jacke/);
  assert.match(models,/weil/);
});

test('Day 2 music chooses one actual library track instead of inventing a song object',()=>{
  const make=(key,id)=>({id,objectKey:key,level:'A2',day:2,coursebook:true,autoDiscovered:true,
    audioUrl:'https://www.falowen.app/api/music?track='+id,title:'Lied '+id});
  const song=make('music/a2/day-02/Recorded Day2 Song.mp3','r2-a2-day-02-real');
  const chosen=selectRecordedLessonTrack({tracks:[song,make('music/a2/day-03/other.mp3','r2-a2-day-03-other')]},
    {level:'A2',day:2,assignmentKey:'A2-1.2'});
  assert.equal(chosen?.objectKey,song.objectKey);
  const player=readFileSync(new URL('../src/components/LinkedPublishedSongLessonStage.jsx',import.meta.url),'utf8');
  assert.ok(player.includes('[1,2,19,20,21,23].includes(day)'));
  assert.ok(player.includes("day === 2 ? 'A2-1.2'"));
  const listening=readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx',import.meta.url),'utf8');
  assert.ok(listening.includes('[1, 2, 3, 18, 19, 20, 21, 23].includes(lesson.listening.day)'));
});
