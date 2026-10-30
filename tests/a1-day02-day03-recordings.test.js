import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {getReusableSongDraft} from '../src/data/reusableMusicSongbook.js';
import {getReusableMusicQuestions} from '../src/data/reusableMusicQuestions.js';
import {getCuratedMusicByAssignment} from '../src/data/curatedLessonMusic.js';
import {getA1PresenterMusicStage} from '../src/data/a1PresenterMusicStage.js';
import {A1_DAY22_MUSIC} from '../src/data/a1Day22Music.js';
import {A1_DAY22_FINAL_RECORDING} from '../src/data/a1Day22FinalRecording.js';
import {validateLyricCues} from '../src/utils/songLyrics.js';
import {lyricLines} from '../src/utils/songLyrics.js';

test('Days 2 and 3 retain every supplied lyric line, section, repeated chorus and style',()=>{
 for(const [key,count,hash]of [
  ['A1-0.2',39,'19d3d414eff7281847003d943653f1e38542b63ccb67e8d070cf7b65d2636d04'],
  ['A1-1.1',37,'b668d2c940a75cce5722fbf4f7af378b01c581968a1386d3d15370ad7d681477'],
 ]){
  const song=getReusableSongDraft(key);assert.equal(lyricLines(song.lyrics).length,count);
  assert.equal(createHash('sha256').update(song.lyrics).digest('hex'),hash);
  assert.match(song.musicStyle,/96 BPM/);assert.match(song.musicStyle,/One Singer/);
  assert.equal((song.lyrics.match(/\[Chorus\]/g)||[]).length,2);
  assert.equal(getA1PresenterMusicStage(key).type,'published-music');
 }
});
test('new R2 filenames map only to their correct lessons and comprehension answers match the lyrics',()=>{
 for(const [key,day,file,answers]of [
  ['A1-0.2',2,'Ich heiße Bina.mp3',['Bina.','Am Montag.']],
  ['A1-1.1',3,'Wer bist du_ Sag es mir!.mp3',['Aus Berlin.','In Bonn.']],
 ]){
  const recording=getCuratedMusicByAssignment(key);assert.equal(recording.day,day);
  assert.equal(recording.objectKey,`music/a1/day-0${day}/${file}`);
  const filename=Buffer.from(recording.trackId.split('-b64_')[1],'base64url').toString('utf8');assert.equal(filename,file);
  assert.ok(recording.audioUrl.endsWith(recording.trackId));
  const bank=getReusableMusicQuestions(key);assert.deepEqual(bank.questions.filter(q=>q.type==='listening').map(q=>q.answer),answers);
  for(const q of bank.questions.filter(q=>q.type==='listening')){assert.equal(q.options[q.correctIndex],q.answer);assert.ok(q.evidence);assert.ok(getReusableSongDraft(key).lyrics.includes(q.evidence));}
 }
});
test('Day 22 completion uses Arzttermin playback, the ten o’clock appointment and actual doctor advice',()=>{
 const recording=getCuratedMusicByAssignment('A1-14.1');assert.equal(A1_DAY22_MUSIC.audioKey,'music/a1/day-22/Arzttermin.mp3');assert.equal(A1_DAY22_MUSIC.id,recording.trackId);
 const questions=A1_DAY22_MUSIC.questions;assert.deepEqual(questions.map(q=>q.answer),['Um zehn Uhr.','Viel Wasser trinken und heute zu Hause bleiben.']);
 for(const q of questions){assert.equal(q.options[q.correctIndex],q.answer);for(const line of lyricLines(q.evidence))assert.ok(lyricLines(A1_DAY22_MUSIC.lyrics).includes(line));}
 assert.doesNotMatch(questions.map(q=>q.evidence).join(' '),/Mia bringt/);
});

test('superseded PR 1292 keeps the full Day 21 replacement and Day 22 recording-specific review gate',()=>{
 const weather=getReusableSongDraft('A1-13');assert.equal(weather.title,'Heute kann ich leider nicht');
 assert.equal(lyricLines(weather.lyrics).length,36);assert.match(weather.lyrics,/Ich treffe Mia um drei im Park/);
 const recording=A1_DAY22_FINAL_RECORDING,lines=lyricLines(getReusableSongDraft('A1-14.1').lyrics);
 assert.equal(recording.objectKey,A1_DAY22_MUSIC.audioKey);
 assert.equal(recording.sha256,'2ec00cb7004809e6b34e103e943ac1a6fe29d9bab4d410f4febe0d00412a349b');
 assert.equal(recording.duration,176.76);assert.equal(recording.status,'draft-timing-review-required');
 assert.equal(lines.length,33);assert.equal(recording.cueStarts.length,33);
 const cues=recording.cueStarts.map((start,i)=>({start,text:lines[i]}));assert.equal(validateLyricCues(cues,lines).length,33);
 assert.ok(cues.at(-1).start<recording.duration);
});
