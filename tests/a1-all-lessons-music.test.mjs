import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { transformWithEsbuild } from 'vite';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { A1_DAY2_LESSON_ID } from '../src/data/a1Day2Classroom.js';
import { getSlidesByCourse } from '../src/data/teachingSlides.js';
import { getA1PresenterRecording, getA1PresenterMusicStage } from '../src/data/a1PresenterMusicStage.js';
import { waitingRoomDiscoveredMusicTrack } from '../src/utils/waitingRoomDayMusic.js';

const require=createRequire(import.meta.url);
const presenterUrl=new URL('../src/components/A1GrammarPresenter.jsx',import.meta.url);
async function loadStageBuilder(){
 const {code}=await transformWithEsbuild(readFileSync(presenterUrl,'utf8'),presenterUrl.pathname,{loader:'jsx',format:'cjs',jsx:'automatic'});
 const modules=new Map();
 for(const match of code.matchAll(/require\("([^"]+)"\)/g)){
  const name=match[1];
  modules.set(name,name.endsWith('.css')||name.endsWith('.jsx')?{}:name.startsWith('.')?await import(new URL(name,presenterUrl)):require(name));
 }
 const module={exports:{}};
 new Function('require','module','exports',code)(name=>modules.get(name),module,module.exports);
 return module.exports.stageList;
}

test('A1 presenter uses one music stage for each lesson with complete authored song activity',async()=>{
 const stagesFor=await loadStageBuilder();
 const slides=getSlidesByCourse('A1').filter(s=>s.dayNumber>0);
 assert.equal(slides.length,28);
 assert.equal(new Set(slides.map(s=>s.dayNumber)).size,23);
 for(const slide of slides){
  const stages=stagesFor(slide,slide.topic);
  if (slide.id === A1_DAY2_LESSON_ID || slide.assignmentId === 'A1-8') {
   assert.equal(stages.filter(stage => stage.step === 'music').length, 1, slide.assignmentId);
   assert.ok(!stages.some(stage => stage.step === 'music-challenge'), slide.assignmentId);
   continue;
  }
  assert.equal(stages[0].type,'intro',slide.assignmentId);
  // Do not create empty music slides for A1 lessons with no complete
  // authored lyrics and question pack. Day 22 owns a separate music finale.
  const music=getA1PresenterMusicStage(slide.assignmentId,slide.dayNumber);
  const expected=music || slide.assignmentId==='A1-14.1' ? 1 : 0;
  assert.equal(stages.filter(s=>s.type==='published-music').length,expected,slide.assignmentId);
  const recording=getA1PresenterRecording(slide.assignmentId,slide.dayNumber);
  if (!recording) {
   assert.equal(expected,0,slide.assignmentId);
   continue;
  }
  assert.equal(recording.level,'A1');
  if(recording.status==='discovery'){
   assert.equal(recording.day,slide.dayNumber);
   assert.equal(recording.audioUrl,undefined,'drafts must not manufacture playable audio');
   assert.equal(recording.objectKey,undefined);
  }
 }
 const day5=slides.find(s=>s.id==='a1-day-5-introducing-yourself-articles');
 const day5Stages=stagesFor(day5,day5.topic);
 assert.equal(day5Stages.length,12,'Day 5 now uses the approved 12-page visual sequence');
 assert.equal(day5Stages[10].type,'published-music');
 assert.equal(day5Stages[10].day5CombinedReading,true);
 assert.equal(day5Stages[10].reading?.title,'Sich vorstellen');
 assert.equal(day5Stages[11].activityKind,'self-practice');
 assert.equal(getA1PresenterMusicStage('A1-Tutorial',0),null);
});

test('Day 5 discovery accepts only its exact public day and fails closed for missing or ambiguous audio',()=>{
 const recording=getA1PresenterRecording('A1-1.3',5);
 assert.equal(recording.discover,true);
 const id='r2-a1-day-05-example';
 const row={id,level:'A1',day:5,title:'Schön, dich kennenzulernen',objectKey:'music/a1/day-05/Schön, dich kennenzulernen.mp3',audioUrl:`https://www.falowen.app/api/music?track=${id}`,autoDiscovered:true,coursebook:true};
 const context={level:recording.level,day:recording.day,assignmentKey:'A1-1.3'};
 assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[row]},context).objectKey,row.objectKey);
 for(const tracks of [[],[row,row],[{...row,day:6}],[{...row,objectKey:'private/audio.mp3'}]])assert.equal(waitingRoomDiscoveredMusicTrack({tracks},context),null);
});

test('Day 5 player loads discovered audio once; unavailable days retain a visible music stage',async()=>{
 const componentUrl=new URL('../src/components/PublishedSongLessonStage.jsx',import.meta.url);
 const {code}=await transformWithEsbuild(readFileSync(componentUrl,'utf8'),componentUrl.pathname,{loader:'jsx',format:'cjs',jsx:'automatic'});
 const modules=new Map();
 for(const match of code.matchAll(/require\("([^"]+)"\)/g)){
  const name=match[1];
  modules.set(name,name.includes('useSongTiming')?{__esModule:true,default:song=>[[],()=>{},song?.lyrics||'']}:name.endsWith('.css')?{}:name.endsWith('.jsx')?{__esModule:true,default:()=>null}:name.startsWith('.')?await import(new URL(name,componentUrl)):require(name));
 }
 const module={exports:{}};
 new Function('require','module','exports',code)(name=>modules.get(name),module,module.exports);
 const Player=module.exports.default;
 const dom=new JSDOM('<div id="root"></div>',{url:'https://admin.falowen.app'});
 const prior={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 const id='r2-a1-day-05-example';
 const track={id,level:'A1',day:5,title:'Schön, dich kennenzulernen',objectKey:'music/a1/day-05/Schön, dich kennenzulernen.mp3',audioUrl:`https://www.falowen.app/api/music?track=${id}`,autoDiscovered:true,coursebook:true};
 let calls=0;
 globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({ok:true,tracks:[track]})};};
 const root=createRoot(document.getElementById('root'));
 try{
  await act(async()=>root.render(React.createElement(Player,{assignmentKey:'A1-1.3',courseDay:5})));
  assert.equal(document.querySelector('audio')?.getAttribute('src'),track.audioUrl);
  assert.equal(calls,1,'discovery must not repeat on state updates');
  assert.equal(document.querySelector('h2').textContent,track.title);
  await act(async()=>root.render(React.createElement(Player,{assignmentKey:'A1-5.10',courseDay:24})));
  assert.equal(document.querySelector('audio'),null,'do not play another day when no recording exists');
  assert.match(document.body.textContent,/Keine eindeutige A1-Day-24-Aufnahme/);
 }finally{
  await act(async()=>root.unmount());dom.window.close();
  Object.assign(globalThis,{window:prior.window,document:prior.document,fetch:prior.fetch,IS_REACT_ACT_ENVIRONMENT:prior.act});
 }
});

test('actual A1 presenter orders workbook grammar, Lesen and speaking for every visible teaching block', async () => {
 const stagesFor = await loadStageBuilder();
 for (const slide of getSlidesByCourse('A1').filter(slide => slide.dayNumber > 0)) {
  const stages = stagesFor(slide, slide.topic);
  if (slide.id === A1_DAY2_LESSON_ID || slide.assignmentId === 'A1-8') {
   const grammar = stages.findIndex(stage => ['pronouns', 'compare'].includes(stage.step));
   const music = stages.findIndex(stage => stage.step === 'music');
   assert.ok(grammar > 0 && music > grammar, slide.assignmentId);
   assert.ok(!stages.some(stage => stage.step === 'warmup'), slide.assignmentId);
   continue;
  }
  if (slide.assignmentId === 'A1-1.3') {
   assert.equal(stages.length,12);
   assert.equal(stages[9].id,'grammar-check');
   assert.equal(stages[10].type,'published-music');
   assert.equal(stages[10].reading?.checks.length,3);
   assert.equal(stages[11].activityKind,'self-practice');
   continue;
  }
  assert.equal(stages[0].id, 'intro', slide.assignmentId);
  assert.equal(stages[1].grammarTeaching, true, slide.assignmentId);
  const grammar = stages.filter(stage => stage.grammarTeaching);
  assert.ok(grammar.length >= 2, slide.assignmentId);
  assert.ok(grammar.every(stage => stage.items.length >= 2), slide.assignmentId);
  const readingIndex = stages.findIndex(stage => stage.type === 'reading');
  assert.ok(readingIndex > grammar.length, slide.assignmentId);
  const reading = stages[readingIndex];
  assert.ok(reading.reading.textDe && reading.items.length === 3, slide.assignmentId);
  assert.equal(reading.reading.answers.length, reading.items.length, slide.assignmentId);
  const speakingIndex = stages.findIndex(stage => stage.kind === 'mission' || stage.id === 'teil-1');
  assert.ok(speakingIndex > readingIndex, slide.assignmentId);
  assert.ok(!stages.some(stage => ['presentation', 'warmup'].includes(stage.id)), slide.assignmentId);
 }
});
