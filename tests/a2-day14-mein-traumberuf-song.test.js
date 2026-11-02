import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';

const blocks = text => [...text.matchAll(/^\[([^\]]+)\]\n([^[]*)/gm)]
  .map(m => ({name:m[1],lines:m[2].trim().split('\n').filter(Boolean)}));

test('A2 Day 14 final German lesson song matches the new engineer story exactly',()=>{
  const song=getReusableSongDraft('A2-5.14');
  assert.ok(song);
  assert.equal(song.title,'Mein Traumberuf');
  assert.deepEqual(blocks(song.lyrics).map(x=>[x.name,x.lines.length]),[
    ['Verse 1',4],['Bridge',2],['Chorus',4],['Verse 2',8],['Chorus',8],['Outro',4],
  ]);
  assert.match(song.lyrics,/Schon als Kind hatte ich einen Traum,/);
  assert.match(song.lyrics,/Ingenieur zu sein, das ist mein Ziel\./);
  assert.match(song.lyrics,/Zurzeit besuche ich einen Deutschkurs,/);
  assert.match(song.lyrics,/ein Praktikum steht auch auf dem Plan,/i);
  assert.match(song.lyrics,/Mein Traumberuf, mein großes Ziel,/);
  assert.match(song.lyrics,/dafür will ich mein Bestes geben\./);
  assert.equal(song.lyrics.match(/Mein Traumberuf, mein großer Plan,/g)?.length,2);
  assert.doesNotMatch(song.lyrics,/Nora arbeitet seit zwei Jahren|Schritt für Schritt wächst mein Mut/);
});

test('A2 Day 14 teacher listening questions use engineer and language-course evidence',()=>{
  const q=getReusableMusicQuestions('A2-5.14');
  assert.equal(q.songTitle,'Mein Traumberuf');
  assert.deepEqual(q.questions.map(x=>x.type),['listening','listening','speaking']);
  assert.equal(q.questions[0].answer,'Sie möchte Ingenieur werden.');
  assert.equal(q.questions[1].answer,'Weil sie später studieren möchte.');
  assert.match(q.questions[0].evidence,/Ingenieur zu sein/);
  assert.match(q.questions[1].evidence,/denn später möchte ich studieren/);
  assert.doesNotMatch(JSON.stringify(q),/Nora|Chef|kleines Projekt/);
  assert.equal(getCuratedMusicByAssignment('A2-5.14'),null,
    'Do not claim unpublished Cloudflare R2 recording is playable in teacher slides');
});
