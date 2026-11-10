import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getTeachingSlideById, getTeachingSlideByAssignmentId } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from '../src/data/interactiveLessonOpenings.js';
import { getA2TeacherChallenge } from '../src/data/a2TeacherChallenges.js';
import { A2_DAY3_LISTENING, A2_DAY3_AUDIO_KEY } from '../src/data/a2Day3Listening.js';
import { selectRecordedLessonTrack } from '../src/utils/recordedLessonMusic.js';
import supplied from '../src/data/a2Day3ListeningQuestions.json' with {type:'json'};

const slide = getTeachingSlideById('a2-day-3-vergleichen');
const stages = buildTeachingPresenterStages(slide, slide.topic);

test('A2 Day 3 permalink resolves workbook-aligned modern presenter with separate Hören',()=>{
  assert.equal(slide.assignmentId, 'A2-1.3');
  assert.equal(getTeachingSlideByAssignmentId('A2-1.3')?.id, slide.id);
  assert.deepEqual(stages.slice(0,7).map(s=>s.id),[
    'intro','warmup','knowledge','workbook-grammar','common-mistakes','reading','grammar-check'
  ]);
  const grammar=stages.find(s=>s.id==='workbook-grammar');
  assert.match(grammar.title,/Vergleiche mit wie und als/);
  assert.equal(grammar.items.length,4);
  assert.match(grammar.items[0].example,/genauso groß wie/);
  assert.match(grammar.items[1].example,/größer als/);
  assert.match(grammar.items[2].example,/am schnellsten/);
  assert.match(grammar.items[3].answer,/größer als/);
  assert.equal(stages.filter(s=>s.id==='workbook-grammar').length,1);
  assert.equal(stages[1].variant,'interactive-music-video');
  assert.equal(stages[1].musicVideo.title,'Zwei Städte');
  assert.equal(stages[1].musicVideo.day,3);
  assert.equal(stages[2].variant,'interactive-listening');
  assert.equal(stages[2].audioKey,A2_DAY3_AUDIO_KEY);
  assert.equal(stages[2].listeningItems.length,5);
  assert.equal(stages[2].transcript.length,0);
  assert.equal(isInteractiveOpeningStage('A2-1.3','knowledge'),true);
  assert.equal(getInteractiveLessonOpening('A2-1.3')?.listening,A2_DAY3_LISTENING);
  assert.equal(getInteractiveLessonOpening('A2-1.3')?.musicIntro?.title,'Zwei Städte');
  const scenarioIndex=stages.findIndex(s=>s.id==='scenario-challenge');
  const questionsIndex=stages.findIndex(s=>s.id==='questions');
  assert.ok(scenarioIndex>0&&scenarioIndex<questionsIndex,'three scenario cards must precede speaking questions');
  assert.equal(stages.filter(s=>['practice','scenario-challenge'].includes(s.id)).length,1);
  assert.ok(stages.some(s=>s.id==='workbook-presentation'));
  assert.ok(stages.some(s=>s.id==='lesson-summary'));
});

test('exact teacher-supplied five MCQs and evidence are preserved',()=>{
  assert.equal(supplied.mode,'course');
  assert.equal(supplied.title,'Dinge und Personen vergleichen');
  assert.deepEqual(A2_DAY3_LISTENING.questions.map(q=>q.correctIndex),[0,1,2,0,1]);
  A2_DAY3_LISTENING.questions.forEach((q,i)=>{
    assert.equal(q.prompt,supplied.questions[i].question);
    assert.deepEqual(q.options,supplied.questions[i].options);
    assert.equal(q.evidence,supplied.questions[i].evidence);
    assert.equal(q.answer,q.options[q.correctIndex]);
  });
  assert.equal(A2_DAY3_AUDIO_KEY,'a2/day-03/dinge-und-personen-vergleichen.mp3');
  const workbookListening = slide.workbookConnection.parts.find(part => part.label === "Teil 4 · Hören");
  assert.match(workbookListening.detailEn,/Julia and Tobias/,'graded workbook Hören stays separate');
});

test('Day 3 role-play has three interactive scenarios with graduated, revealable models',()=>{
  const challenge=getA2TeacherChallenge('A2-1.3');
  assert.equal(challenge.scenarios.length,3);
  assert.deepEqual(stages.find(s=>s.id==='scenario-challenge').items,challenge.scenarios);
  assert.ok(challenge.scenarios.every(s=>s.context&&s.steps.length===3));
  assert.ok(challenge.scenarios.every(s=>s.steps.every(q=>q.actionDe&&q.questionDe&&q.modelDe)));
  const examples=challenge.scenarios.flatMap(s=>s.steps.map(q=>q.modelDe)).join(' ');
  assert.match(examples,/genauso freundlich wie/);
  assert.match(examples,/billiger als/);
  assert.match(examples,/am günstigsten/);
});

test('Day 3 music uses the exact uploaded R2 song and the same inline player as Days 1 and 2',()=>{
  const make=(objectKey,id)=>({id,objectKey,level:'A2',day:3,coursebook:true,autoDiscovered:true,
    audioUrl:'https://www.falowen.app/api/music?track='+id,title:objectKey.includes('Zwei')?'Zwei Städte':'Andere Stadt'});
  const exact=make('music/a2/day-03/Zwei Städte.mp3','r2-a2-day-03-zwei');
  const another=make('music/a2/day-03/Andere Stadt.mp3','r2-a2-day-03-anderer');
  assert.equal(selectRecordedLessonTrack({tracks:[exact,another]},{level:'A2',day:3,assignmentKey:'A2-1.3'})?.objectKey,exact.objectKey);
  assert.equal(selectRecordedLessonTrack({tracks:[another]},{level:'A2',day:3,assignmentKey:'A2-1.3'}),null,'never substitute another Day-3 song');
  const player=readFileSync(new URL('../src/components/LinkedPublishedSongLessonStage.jsx',import.meta.url),'utf8');
  assert.ok(player.includes('Number.isInteger(day) && day >= 1 && day <= 28'));
  assert.equal(stages.filter(s=>s.variant==='interactive-music-video').length,1);
});

test('private recording is requested from A2 classroom signer, not music library or public R2',()=>{
  const source=readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx',import.meta.url),'utf8');
  assert.ok(source.includes('[1, 2, 3, 18, 19, 20, 21, 23].includes(lesson.listening.day)'));
  assert.match(source,/https:\/\/www\.falowen\.app\/api\/course-media\/a2\/classroom-audio-url/);
});
