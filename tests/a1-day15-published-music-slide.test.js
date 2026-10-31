import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getSlidesByCourse} from '../src/data/teachingSlides.js';
import {getCuratedMusicByAssignment, getCuratedMusicForSession} from '../src/data/curatedLessonMusic.js';
import {getA1PresenterMusicStage} from '../src/data/a1PresenterMusicStage.js';
import {getReusableSongDraft} from '../src/data/reusableMusicSongbook.js';
import {getReusableMusicQuestions} from '../src/data/reusableMusicQuestions.js';
import {waitingRoomDiscoveredMusicTrack} from '../src/utils/waitingRoomDayMusic.js';

const assignmentKey='A1-4.7';

test('A1 Day 15 uses the same one-slide Hören, Liedtext, Fragen music activity as previous A1 days',()=>{
  const slide=getSlidesByCourse('A1').find(row=>row.assignmentId===assignmentKey);
  assert.equal(slide?.dayNumber,15);
  const recorded=getCuratedMusicByAssignment(assignmentKey);
  assert.equal(recorded.day,15);
  assert.equal(recorded.level,'A1');
  assert.equal(recorded.discover,true);
  assert.equal(recorded.objectKey,undefined,'Do not guess a Cloudflare object filename');
  assert.equal(recorded.audioUrl,undefined,'Resolve the exact track from the music library');
  assert.equal(getCuratedMusicForSession({level:'A1',day:15,assignmentKey}),recorded);
  const prev=getA1PresenterMusicStage('A1-3.6');
  const stage=getA1PresenterMusicStage(assignmentKey);
  assert.ok(stage);
  assert.equal(stage.type,prev.type);
  assert.equal(stage.id,'music-lesson');
  assert.match(stage.title,/Ich bin bereit zu sprechen/);
  assert.equal(stage.items.length,1);
  assert.match(getReusableSongDraft(assignmentKey).lyrics,/Vor der Prüfung bin ich nervös/);
  assert.deepEqual(getReusableMusicQuestions(assignmentKey).questions.map(q=>q.type),['listening','listening','speaking']);
});

test('Day 15 discovery selects only a unique genuine R2 upload in its own folder',()=>{
  const filename='Ich bin bereit zu sprechen.mp3'; // synthetic fixture; not a claim about the uploaded filename
  const id='r2-a1-day-15-b64_'+Buffer.from(filename).toString('base64url');
  const track={
    id,level:'A1',day:15,title:'Ich bin bereit zu sprechen',
    autoDiscovered:true,coursebook:true,
    objectKey:'music/a1/day-15/'+filename,
    audioUrl:'https://www.falowen.app/api/music?track='+id,
  };
  const chosen=waitingRoomDiscoveredMusicTrack({tracks:[track]},{level:'A1',day:15,assignmentKey});
  assert.equal(chosen?.objectKey,track.objectKey);
  assert.equal(chosen?.src,track.audioUrl);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[{...track,objectKey:'music/a1/day-14/'+filename}]},{level:'A1',day:15,assignmentKey}),null);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[track,{...track,id:id+'x',title:'Other song',objectKey:'music/a1/day-15/Other song.mp3',audioUrl:track.audioUrl+'x'}]},{level:'A1',day:15,assignmentKey})?.objectKey,track.objectKey,'Known song title wins over a second MP3');
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[]},{level:'A1',day:15,assignmentKey}),null);
});

test('A1 projector fetches Day 15 audio dynamically without hardcoding Day 13',()=>{
  const src=readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx',import.meta.url),'utf8');
  assert.match(src,/fetch\('\/api\/attendance-music-library'/);
  assert.match(src,/level:approvedRecording\.level, day:approvedRecording\.day, assignmentKey/);
  assert.match(src,/waitingRoomDiscoveredMusicTrack\(data/);
  assert.match(src,/\$\{encodeURIComponent\(recording\.day\)\}/);
  assert.match(src,/publishedTrack\?\.src/);
  assert.match(src,/view==='listen'/);
  assert.match(src,/view==='lyrics'/);
  assert.match(src,/view==='questions'/);
  const presenter=readFileSync(new URL('../src/components/A1GrammarPresenter.jsx',import.meta.url),'utf8');
  assert.match(presenter,/\.\.\.\(a1SongStage \? \[a1SongStage\] : \[\]\)/);
  assert.match(presenter,/<PublishedSongLessonStage assignmentKey=\{slide\.assignmentId\} compact/);
});
