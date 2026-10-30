import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getCuratedMusicByAssignment, getCuratedMusicForSession } from '../src/data/curatedLessonMusic.js';

test('A2 Days 24 and 25 keep independent uploaded MP3s with identical filenames',()=>{
  const day24=getCuratedMusicByAssignment('A2-9.24');
  const day25=getCuratedMusicByAssignment('A2-9.25');
  assert.equal(day24.objectKey,'music/a2/day-24/Endlich Urlaub.mp3');
  assert.equal(day25.objectKey,'music/a2/day-25/Endlich Urlaub.mp3');
  assert.equal(day25.trackId,'r2-a2-day-25-b64_RW5kbGljaCBVcmxhdWIubXAz');
  assert.notEqual(day24.trackId,day25.trackId);
  assert.equal(getCuratedMusicForSession({level:'A2',day:25}),day25);
  assert.equal(day25.audioUrl,'https://www.falowen.app/api/music?track='+day25.trackId);
});
test('A2 Day 25 follows the provided travel performance, not the retired daily-routine draft',()=>{
  const track=getReusableSongDraft('A2-9.25');
  assert.equal(track.title,'Endlich Urlaub');
  assert.equal(track.genre,'Warm Reggae-Pop');
  const lines=track.lyrics.split(String.fromCharCode(10)).filter(s=>s.trim()&&!s.startsWith('['));
  assert.equal(lines.length,49);
  assert.equal((track.lyrics.match(/\[Chorus\]/g)||[]).length,2);
  assert.equal((track.lyrics.match(/Endlich Urlaub, endlich frei\./g)||[]).length,6);
  assert.match(track.lyrics,/Seit Monaten spar ich Geld/);
  assert.match(track.lyrics,/Am Samstag stehe ich früh auf/);
  assert.match(track.lyrics,/Mein Zug fährt schon um acht Uhr ab/);
  assert.match(track.lyrics,/Hamburg, ich freue mich auf dich/);
  assert.doesNotMatch(track.lyrics,/Früher bin ich sehr spät aufgestanden/);
});
test('A2 Day 25 listening questions and music editors recognize the new recorded song',()=>{
  const questions=getReusableMusicQuestions('A2-9.25').questions;
  assert.deepEqual(questions.map(x=>x.type),['listening','listening','speaking']);
  assert.equal(questions[0].answer,'Nach Hamburg.');
  assert.equal(questions[1].answer,'Am Samstag um acht Uhr.');
  assert.match(questions[0].evidence,/Reise nach Hamburg/);
  assert.match(questions[1].evidence,/acht Uhr ab/);
  const studio=readFileSync(new URL('../src/pages/MusicStudioPage.jsx',import.meta.url),'utf8');
  const video=readFileSync(new URL('../src/components/MusicLyricsVideoStudio.jsx',import.meta.url),'utf8');
  assert.ok(studio.includes("key === 'A2-9.25'"));
  assert.ok(video.includes('"music/a2/day-25/Endlich Urlaub.mp3":"A2-9.25"'));
});
