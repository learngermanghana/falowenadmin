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
 assert.match(ui,/threeVerifiedHeardLyricQuestions\(quizPack, recording\)/);
 assert.match(ui,/Welche Liedzeile hast du gehört\?/);
 assert.match(ui,/Which lyric did you hear\?/);
 assert.doesNotMatch(ui,/Which lyric comes next\?/);
});
