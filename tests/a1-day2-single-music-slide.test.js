import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {threeVerifiedNextLyricQuestions} from '../src/utils/nextLyricQuestions.js';
import {A1_DAY2_CLASSROOM_STAGES} from '../src/data/a1Day2Classroom.js';
import {getCuratedMusicByAssignment} from '../src/data/curatedLessonMusic.js';
const recording=getCuratedMusicByAssignment('A1-0.2');
const lyrics=[
  'Heute rufe ich die Schule an',
  'Ich möchte einen Deutschkurs machen',
  'Die Frau sagt freundlich guten Tag',
  'Wie heißen Sie sagen Sie es mir',
  'Ich sage hallo ich heiße Bina',
  'Ich komme aus Ghana das ist mein Land',
  'Sie fragt wie schreibt man Ihren Namen',
  'Ich buchstabiere langsam dann',
];
const pack={objectKey:recording.objectKey,lyrics:lyrics.join('\n'),
 cues:lyrics.map((line,i)=>({text:line,start:i*2,end:i*2+1.8})),
 timingStatus:'audio-aligned',transcriptionStatus:'reviewed',referenceOnly:false};
test('Day 2 uses exactly one music slide with the old Hören/Liedtext/Fragen player',()=>{
  assert.deepEqual(A1_DAY2_CLASSROOM_STAGES.filter(s=>s.step==='music').map(s=>s.id),['a1-day2-music']);
  assert.equal(A1_DAY2_CLASSROOM_STAGES.some(s=>s.step==='music-challenge'),false);
  assert.equal(A1_DAY2_CLASSROOM_STAGES.length,11);
  const source=readFileSync(new URL('../src/components/A1Day2TeachingStage.jsx',import.meta.url),'utf8');
  assert.match(source,/<PublishedSongLessonStage assignmentKey="A1-0\.2" courseDay=\{2\} compact nextLyricOnly/);
  assert.doesNotMatch(source,/function A1Day2Music/);
});
test('exact recording and reviewed cues yield precisely three playable next-lyric MCQs',()=>{
  assert.equal(recording.objectKey,'music/a1/day-02/Ich heiße Bina.mp3');
  const q=threeVerifiedNextLyricQuestions(pack,recording);
  assert.equal(q.length,3);
  assert.ok(q.every(x=>x.options.length===3&&x.options[x.correctIndex]===x.answer));
  assert.deepEqual(q.map(x=>x.previewRange),[{start:0,end:2},{start:2,end:4},{start:4,end:6}]);
});
test('never generate playable questions from another MP3, draft, auto transcript or incomplete timing',()=>{
  for(const altered of [
    {...pack,objectKey:'music/a1/day-02/old.mp3'},
    {...pack,referenceOnly:true},
    {...pack,timingStatus:'estimated'},
    {...pack,transcriptionStatus:'automatic'},
    {...pack,cues:pack.cues.slice(0,4)},
  ])assert.deepEqual(threeVerifiedNextLyricQuestions(altered,recording),[]);
});
