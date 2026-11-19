import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getCuratedMusicByAssignment} from '../src/data/curatedLessonMusic.js';
import {getReusableSongDraft} from '../src/data/reusableMusicSongbook.js';
import {recordedSongQuestions} from '../src/utils/recordedLessonMusic.js';

const musicStage=readFileSync(new URL('../src/components/MusicTeachingStages.jsx',import.meta.url),'utf8');
const linked=readFileSync(new URL('../src/components/LinkedPublishedSongLessonStage.jsx',import.meta.url),'utf8');
test('A2 Day 27 uses the exact Day 26 music Fragen component',()=>{
 assert.match(musicStage,/music\?\.assignmentKey === 'A2-10.27'\)\s*\{\s*return <LinkedPublishedSongLessonStage music=\{music\}/);
 assert.match(linked,/3 · Fragen/);
 assert.match(linked,/published-song-lesson__options/);
 assert.match(linked,/Musterlösung für Lehrkraft zeigen/);
 assert.match(linked,/Fragen zum Liedtextentwurf/);
});
test('Day 27 retains the approved Handy weg R2 audio and has three-choice lyric exercises',()=>{
 const rec=getCuratedMusicByAssignment('A2-10.27');
 const draft=getReusableSongDraft('A2-10.27');
 assert.equal(rec.objectKey,'music/a2/day-27/Handy weg.mp3');
 assert.ok(rec.audioUrl.startsWith('https://'));
 assert.match(linked,/getCuratedMusicByAssignment\('A2-10\.27'\)/);
 assert.match(linked,/if \(!day27Recording\) \{/);
 assert.match(linked,/reference=\{lyrics:draft.lyrics,objectKey:track.objectKey,draftOnly:true\}/);
 const questions=recordedSongQuestions({lyrics:draft.lyrics},27,'A2');
 assert.ok(questions.some(q=>q.options?.length===3));
 for(const q of questions.filter(q=>q.options)){
   assert.equal(q.answer,q.options[q.correctIndex]);
 }
});
test('unverified Day 27 song draft never receives automatic heard-lyric marking',()=>{
 assert.match(linked,/LESETEXT-ÜBUNG/);
 assert.match(linked,/Musterlösung zum Textentwurf/);
 assert.match(linked,/nicht als bestätigtes Hörtranskript/);
});
