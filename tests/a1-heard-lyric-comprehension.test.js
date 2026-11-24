import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {threeVerifiedHeardLyricQuestions} from '../src/utils/nextLyricQuestions.js';
import classroomSongTiming from '../src/data/a1ClassroomSongTiming.js';
import {getCuratedMusicByAssignment} from '../src/data/curatedLessonMusic.js';
import {getA1PresenterRecording} from '../src/data/a1PresenterMusicStage.js';

for(const [key,recording] of [
  ['A1-0.2',getCuratedMusicByAssignment('A1-0.2')],
  ['A1-8',getA1PresenterRecording('A1-8',12)],
]) {
 test(key+' heard-lyric MCQs play the exact correct answer in the excerpt',()=>{
  const pack=classroomSongTiming[key];
  const questions=threeVerifiedHeardLyricQuestions(pack,recording);
  assert.equal(questions.length,3);
  for(const question of questions){
   const i=pack.cues.findIndex(cue=>cue.text===question.answer);
   assert.ok(i>=0);
   assert.equal(question.options.length,3);
   assert.equal(question.options[question.correctIndex],question.answer);
   assert.ok(question.previewRange.start<=pack.cues[i].start);
   assert.ok(question.previewRange.end>=pack.cues[i].end);
   assert.ok(question.previewRange.end-question.previewRange.start<=11);
   assert.ok(question.previewRange.end-question.previewRange.start>=4.5);
   assert.equal(new Set(question.options).size,3);
   for(const wrong of question.options.filter(line=>line!==question.answer)){
    const other=pack.cues.filter(cue=>cue.text===wrong);
    assert.ok(other.every(cue=>cue.start>=question.previewRange.end || cue.end<=question.previewRange.start));
   }
  }
 });
}
test('unverified or changed recordings do not produce fabricated heard-lyric answers',()=>{
 const pack=classroomSongTiming['A1-0.2'];
 const recording=getCuratedMusicByAssignment('A1-0.2');
 for(const bad of [
  {...pack,objectKey:'music/a1/day-02/other.mp3'},
  {...pack,referenceOnly:true},
  {...pack,transcriptionStatus:'automatic'},
  {...pack,timingStatus:'estimated'},
  {...pack,cues:pack.cues.slice(0,5)}
 ]) assert.deepEqual(threeVerifiedHeardLyricQuestions(bad,recording),[]);
});
test('presenter asks which lyric was heard, not which one comes later',()=>{
 const ui=readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx',import.meta.url),'utf8');
 assert.match(ui,/threeVerifiedHeardLyricQuestions\(quizPack, recording, heardLyricDuration\)/);
 assert.match(ui,/Welche Liedzeile hast du gehört\?/);
 assert.match(ui,/Which lyric did you hear\?/);
 assert.doesNotMatch(ui,/Which lyric comes next\?/);
});

test('Day 22 uses longer verified clips without weakening recording safeguards',()=>{
 const ui=readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx',import.meta.url),'utf8');
 assert.match(ui,/assignmentKey === 'A1-14.1' \? \{minSeconds: 10, maxSeconds: 15, targetSeconds: 12\}/);
 const pack=classroomSongTiming['A1-0.2'];
 const recording=getCuratedMusicByAssignment('A1-0.2');
 const examples=threeVerifiedHeardLyricQuestions(pack,recording,{minSeconds:10,maxSeconds:15,targetSeconds:12});
 for(const q of examples){
   assert.ok(q.previewRange.end-q.previewRange.start>=10);
   assert.ok(q.previewRange.end-q.previewRange.start<=15);
   assert.equal(q.options[q.correctIndex],q.answer);
 }
 for(const unverified of [
   {...pack,objectKey:'music/a1/day-22/other.mp3'},
   {...pack,referenceOnly:true},
   {...pack,timingStatus:'estimated'},
 ])assert.deepEqual(threeVerifiedHeardLyricQuestions(unverified,recording,{minSeconds:10,maxSeconds:15,targetSeconds:12}),[]);
});

test('short repeated A1 lines and fewer than three safe excerpts do not disable synchronized listening',()=>{
 const lines=['Hallo!','Hallo!','Guten Tag!','Tschüss!'];
 const pack={objectKey:'music/a1/day-05/test.mp3',lyrics:lines.join('\n'),
   cues:lines.map((text,i)=>({text,start:i*10,end:i*10+5}))};
 const recording={objectKey:pack.objectKey};
 const questions=threeVerifiedHeardLyricQuestions(pack,recording,{allowFewer:true,ignoreLegacyEndings:true});
 assert.ok(questions.length>=1);
 for(const q of questions){
  assert.equal(q.options.length,3);
  assert.equal(q.options[q.correctIndex],q.answer);
  assert.equal(new Set(q.options).size,3);
  assert.ok(pack.cues.some(c=>c.text===q.answer&&q.previewRange.start<=c.start&&q.previewRange.end>=c.end));
 }
});
test('all A1 question entry points use current lyric cues and no typed seconds',()=>{
 const ui=readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx',import.meta.url),'utf8');
 assert.match(ui,/nextLyricOnly = \/\^A1-\/i/);
 assert.match(ui,/const synchronized=hasCompleteSongTiming\(cues,recordedLyrics\)/);
 assert.match(ui,/lyrics: recordedLyrics,\s*cues,/);
 assert.match(ui,/allowFewer:true, ignoreLegacyEndings:true/);
 assert.doesNotMatch(ui,/Startzeit in Sekunden|teacherClipStart|type="number"/);
 assert.match(ui,/12 Sekunden abspielen/);
 assert.match(ui,/Ausschnitt wiederholen/);
 assert.match(ui,/Nächster Ausschnitt/);
 const day5=readFileSync(new URL('../src/components/A1Day5MusicReadingStage.jsx',import.meta.url),'utf8');
 const presenter=readFileSync(new URL('../src/components/A1GrammarPresenter.jsx',import.meta.url),'utf8');
 const linked=readFileSync(new URL('../src/components/LinkedPublishedSongLessonStage.jsx',import.meta.url),'utf8');
 assert.match(day5,/PublishedSongLessonStage.*nextLyricOnly/);
 assert.match(presenter,/PublishedSongLessonStage.*nextLyricOnly/);
 assert.match(linked,/PublishedSongLessonStage.*nextLyricOnly/);
});
