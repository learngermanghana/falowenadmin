import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { waitingRoomDiscoveredMusicTrack } from '../src/utils/waitingRoomDayMusic.js';

const assignmentKey = 'A2-5.12';
const objectKey = 'music/a2/day-12/Träume ändern sich.mp3';
const filename = 'Träume ändern sich.mp3';
const trackId = 'r2-a2-day-12-b64_' + Buffer.from(filename, 'utf8').toString('base64url');

test('A2 Day 12 songbook matches the teacher-recorded 8/4/8/4/outro layout', () => {
  const song = getReusableSongDraft(assignmentKey);
  assert.equal(song.title, 'Träume ändern sich');
  const sections = [...song.lyrics.matchAll(/\[(Verse 1|Verse 2|Chorus|Outro)\]([\s\S]*?)(?=\[(?:Verse 1|Verse 2|Chorus|Outro)\]|$)/g)];
  assert.deepEqual(sections.map(m => m[1]), ['Verse 1','Chorus','Verse 2','Chorus','Outro']);
  assert.deepEqual(sections.map(m => m[2].split(/\r?\n/).map(x=>x.trim()).filter(Boolean).length),[8,4,8,4,4]);
  assert.match(song.lyrics, /Jetzt interessiert mich die Medizin,/);
  assert.match(song.lyrics, /Wir dürfen neue Wege finden,/);
  assert.match(song.lyrics, /Bei Falowen sprechen wir von Träumen,/);
  assert.doesNotMatch(song.lyrics, /Dein Weg beginnt mit einem kleinen Schritt/);
});

test('A2 Day 12 discovery is pinned to the exact published song, not any MP3 in the folder', () => {
  const selection = getCuratedMusicByAssignment(assignmentKey);
  assert.equal(selection.status, 'published');
  assert.equal(selection.discover,true);
  assert.equal(selection.objectKey,objectKey);
  assert.equal(selection.title,'Träume ändern sich');
  const valid={id:trackId,title:'Träume ändern sich',level:'A2',day:12,objectKey,
    coursebook:true,autoDiscovered:true,
    audioUrl:'https://www.falowen.app/api/music?track='+trackId};
  const other={...valid, title:'Different song', id:'r2-a2-day-12-other',
    objectKey:'music/a2/day-12/Other song.mp3',
    audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-12-other'};
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[other,valid]},
    {level:'A2',day:12,assignmentKey}).objectKey,objectKey);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[other]},
    {level:'A2',day:12,assignmentKey}),null);
});

test('A2 Day 12 music questions and saved lyrics migration follow the recording', () => {
  const pack=getReusableMusicQuestions(assignmentKey);
  assert.match(pack.questions[0].prompt,/interessiert sich/);
  assert.match(pack.questions[0].answer,/Medizin/);
  const page=readFileSync(new URL('../src/pages/MusicStudioPage.jsx',import.meta.url),'utf8');
  assert.match(page,/approvedDay12/);
  assert.match(page,/Träume ändern sich lyrics saved to the cloud/);
});
