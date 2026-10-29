import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { waitingRoomDiscoveredMusicTrack } from '../src/utils/waitingRoomDayMusic.js';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';

const filename = 'Zwei Tees, vier Euro.mp3';
const objectKey = 'music/a1/day-13/' + filename;
const id = 'r2-a1-day-13-b64_' + Buffer.from(filename,'utf8').toString('base64url');
const approved = {
  id, title:'Zwei Tees, vier Euro', level:'A1', day:13, objectKey,
  autoDiscovered:true, coursebook:true,
  audioUrl:'https://www.falowen.app/api/music?track=' + id,
};
const other = {...approved, id:'r2-a1-day-13-other', title:'Other song',
  objectKey:'music/a1/day-13/other.mp3',
  audioUrl:'https://www.falowen.app/api/music?track=r2-a1-day-13-other'};

test('Day13 selects the genuine published MP3 including spaces, commas and capitalization',()=>{
  const selected = waitingRoomDiscoveredMusicTrack({tracks:[other,approved]}, {
    level:'A1',day:13,assignmentKey:'A1-3.5',
  });
  assert.equal(selected.objectKey,objectKey);
  assert.equal(selected.src,approved.audioUrl);
  assert.equal(selected.id,id);
  assert.equal(selected.nativePlayback,true);
});

test('never select unknown files or a duplicate ambiguous Day13 song',()=>{
  const payload={tracks:[other,approved]};
  assert.equal(waitingRoomDiscoveredMusicTrack(payload,{level:'A1',day:13,assignmentKey:'A1-999'}),null);
  const duplicate={...approved,id:'r2-a1-day-13-another',objectKey:'music/a1/day-13/another.mp3',
    audioUrl:'https://www.falowen.app/api/music?track=r2-a1-day-13-another'};
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[approved,duplicate]}, {level:'A1',day:13,assignmentKey:'A1-3.5'}),null);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[{...approved,objectKey:'a1/day-13/private-hoeren.mp3'}]},{level:'A1',day:13,assignmentKey:'A1-3.5'}),null);
  assert.equal(getCuratedMusicByAssignment('A1-3.5').objectKey,undefined);
});

test('teacher slide and attendance both use the shared on-demand library, not a guessed ID',()=>{
  const slides=readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx',import.meta.url),'utf8');
  const attendance=readFileSync(new URL('../src/pages/CheckinDisplayPage.jsx',import.meta.url),'utf8');
  assert.match(slides,/fetch\('\/api\/attendance-music-library'/);
  assert.match(slides,/waitingRoomDiscoveredMusicTrack\(data/);
  assert.match(slides,/publishedTrack\?\.src/);
  assert.match(attendance,/curatedDayMusic\?\.discover/);
  assert.match(attendance,/waitingRoomDiscoveredMusicTrack\(data/);
  assert.match(attendance,/The \$\{waitingClassLevel\} Day/);
  assert.doesNotMatch(slides,/r2-a1-day-13-zwei-tees-vier-euro/);
  assert.doesNotMatch(attendance,/r2-a1-day-13-zwei-tees-vier-euro/);
});
