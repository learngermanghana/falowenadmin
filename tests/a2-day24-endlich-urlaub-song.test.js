import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getCuratedMusicByAssignment, getCuratedMusicForSession } from '../src/data/curatedLessonMusic.js';

const key = 'music/a2/day-24/Endlich Urlaub.mp3';
const trackId = 'r2-a2-day-24-b64_RW5kbGljaCBVcmxhdWIubXAz';

test('A2 Day 24 maps the exact uploaded Endlich Urlaub audio to lesson and check-in', () => {
  const track = getCuratedMusicByAssignment('A2-9.24');
  assert.equal(track.day, 24);
  assert.equal(track.title, 'Endlich Urlaub');
  assert.equal(track.level, 'A2');
  assert.equal(track.objectKey, key);
  assert.equal(track.trackId, trackId);
  assert.equal(Buffer.from(trackId.split('b64_')[1], 'base64url').toString('utf8'), 'Endlich Urlaub.mp3');
  assert.equal(track.audioUrl, 'https://www.falowen.app/api/music?track=' + trackId);
  assert.equal(getCuratedMusicForSession({level:'A2',day:24}), track);
  assert.equal(getCuratedMusicForSession({assignmentKey:'A2-9.24',level:'A2',day:24}), track);
  assert.equal(track.cues, undefined, 'Do not claim unreviewed timing is verified');
});

test('Day 24 songbook preserves all 38 sung lines, both choruses and soft repeated outro', () => {
  const song = getReusableSongDraft('A2-9.24');
  assert.equal(song.title, 'Endlich Urlaub');
  const lines = song.lyrics.split(String.fromCharCode(10)).filter(line => line.trim() && !(line.startsWith('[') && line.endsWith(']')));
  assert.equal(lines.length,38);
  assert.equal((song.lyrics.match(/\[Chorus\]/g)||[]).length,2);
  assert.ok(song.lyrics.includes('[Outro – Repeat, Softer]'));
  assert.equal((song.lyrics.match(/Am Mittag komme ich in Hamburg an,/g)||[]).length,2);
  assert.equal((song.lyrics.match(/Hamburg, ich freue mich auf dich!/g)||[]).length,2);
  assert.match(song.lyrics, /Mein Zug fährt schon um acht Uhr ab\./);
  assert.ok(song.lyrics.trim().endsWith('Doo-doo, doo-doo …'));
  assert.doesNotMatch(song.lyrics, /Mia sucht ein Zimmer in der Altstadt/);
});

test('Day 24 music questions and stale-draft safety follow the new recording', () => {
  const questions=getReusableMusicQuestions('A2-9.24').questions;
  assert.deepEqual(questions.map(q=>q.type),['listening','listening','speaking']);
  assert.equal(questions[0].answer,'Nach Hamburg.');
  assert.equal(questions[1].answer,'Um acht Uhr.');
  assert.match(questions[0].evidence,/träume ich von Hamburg/);
  assert.match(questions[1].evidence,/Mein Zug fährt schon um acht Uhr ab/);
  assert.match(questions[2].prompt,/vor deinem Urlaub/);
  const musicStudio=readFileSync(new URL('../src/pages/MusicStudioPage.jsx',import.meta.url),'utf8');
  const videoStudio=readFileSync(new URL('../src/components/MusicLyricsVideoStudio.jsx',import.meta.url),'utf8');
  assert.match(musicStudio,/key === 'A2-9\.24' && text\.includes\('Mia sucht ein Zimmer/);
  assert.ok(videoStudio.includes('"music/a2/day-24/Endlich Urlaub.mp3":"A2-9.24"'));
});
