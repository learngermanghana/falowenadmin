import test from 'node:test';
import assert from 'node:assert/strict';
import {getTeachingSlideById} from '../src/data/teachingSlides.js';
import {buildTeachingPresenterStages} from '../src/utils/teachingPresenter.js';
import {getA2B1AdminLessonProfile} from '../src/data/a2B1LessonProfile.js';
import {getA2TeacherChallenge} from '../src/data/a2TeacherChallenges.js';
import {selectRecordedLessonTrack} from '../src/utils/recordedLessonMusic.js';
const slide=getTeachingSlideById('a2-day-23-schul-arbeitsweg');
const stages=buildTeachingPresenterStages(slide,slide.topic);
test('exact Day 23 permalink resolves music, separate private Hören, reading and scenario with 11 stages',()=>{
 assert.equal(slide.assignmentId,'A2-9.23');assert.equal(slide.dayNumber,23);
 assert.deepEqual(stages.slice(0,6).map(s=>s.id),['intro','warmup','knowledge','common-mistakes','reading','grammar-check']);
 assert.equal(stages.length,11);assert.equal(new Set(stages.map(s=>s.id)).size,11);
 assert.equal(stages[1].variant,'interactive-music-video');assert.equal(stages[1].musicVideo.title,'Fahrrad zur Schule');
 assert.equal(stages[2].variant,'interactive-listening');assert.equal(stages[2].audioKey,'a2/day-23/wie-kommst-du-zur-schule-oder-zur-arbeit.mp3');
 assert.equal(stages[2].listeningItems.length,5);assert.equal(stages[2].transcript,undefined);
 assert.ok(stages[2].listeningItems.every(q=>q.openResponse&&!q.options&&q.correctIndex===undefined),'No fabricated transcript or fixed recording answers');
});
test('Day 23 music chooses the exact published object when other MP3s share its folder',()=>{
 const track=(name,id)=>({id:'r2-a2-day-23-'+id,title:name.replace('.mp3',''),objectKey:'music/a2/day-23/'+name,level:'A2',day:23,autoDiscovered:true,coursebook:true,audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-23-'+id});
 const chosen=selectRecordedLessonTrack({tracks:[track('Another song.mp3','other'),track('Fahrrad zur Schule.mp3','published')]},{level:'A2',day:23,assignmentKey:'A2-9.23'});
 assert.equal(chosen.objectKey,'music/a2/day-23/Fahrrad zur Schule.mp3');
});
test('route scenarios replace exactly one practice slot and target usable A2 transport grammar',()=>{
 const challenge=getA2TeacherChallenge('A2-9.23');const stage=stages.find(s=>s.id==='scenario-challenge');assert.equal(stage.items,challenge.scenarios);
 assert.equal(stages.filter(s=>['practice','scenario-challenge'].includes(s.id)).length,1);
 assert.equal(challenge.scenarios.length,3);assert.ok(challenge.scenarios.every(s=>s.steps.length===3));
 const models=challenge.scenarios.flatMap(s=>s.steps.map(q=>q.modelDe)).join(' ');
 assert.match(models,/mit der Bahn/);assert.match(models,/mit dem Bus zum Bahnhof/);assert.match(models,/mit dem Zug nach Berlin/);assert.match(models,/zu Fuß/);assert.match(models,/weil/);assert.doesNotMatch(models,/wegen/);
});
test('new teacher listening does not introduce graded workbook Hören or writing for Day 23',()=>{
 const profile=getA2B1AdminLessonProfile('A2',23);
 assert.deepEqual(profile.requiredSubmissionParts.map(p=>p.partId),['teil3']);
 assert.ok(!slide.workbookConnection.parts.some(p=>/^Teil [24]/.test(p.label)));
});
