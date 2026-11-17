import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getA1PresenterRecording } from '../src/data/a1PresenterMusicStage.js';
import { waitingRoomDiscoveredMusicTrack } from '../src/utils/waitingRoomDayMusic.js';
import { lyricLines } from '../src/utils/songLyrics.js';

const track = title => ({
  id:'r2-a1-day-12-b64_'+title.replace(/[^a-zA-Z0-9]/g,'_'),
  title,
  autoDiscovered:true,
  coursebook:true,
  level:'A1',
  day:12,
  objectKey:'music/a1/day-12/'+title+'.mp3',
});
const feedRow = title => {
  const row=track(title);
  return {...row,audioUrl:'https://www.falowen.app/api/music?track='+row.id};
};

test('A1 Day 12 songbook uses the user-approved new recording lyrics',()=>{
  const song=getReusableSongDraft('A1-8');
  assert.equal(song.title,'Samstag um zehn');
  assert.equal(song.lyrics.match(/\[Chorus\]/g).length,2);
  assert.ok(song.lyrics.includes('Anna ruft mich heute an,'));
  assert.ok(song.lyrics.includes('Am Samstag fahr ich mit dem Bus,'));
  assert.ok(song.lyrics.includes('Wir trinken Kaffee um halb elf,'));
  assert.ok(song.lyrics.includes('Oh, oh, der fünfte Mai!'));
  assert.ok(song.lyrics.includes('Hmm, hmm, bis nächsten Samstag!'));
  assert.ok(!song.lyrics.includes('Mein Handy zeigt vierzehn Uhr'));
  assert.equal(lyricLines(song.lyrics).length,18);
  assert.equal(getA1PresenterRecording('A1-8',12).title,'Samstag um zehn');
});

test('listening questions reference the new song rather than the retired May birthday story',()=>{
  const pack=getReusableMusicQuestions('A1-8');
  assert.equal(pack.questions[0].answer,'Um zehn Uhr.');
  assert.equal(pack.questions[1].answer,'Um halb elf.');
  assert.ok(pack.questions[0].evidence.includes('Um zehn Uhr bin ich bereit.'));
  assert.ok(pack.questions[1].evidence.includes('Wir trinken Kaffee um halb elf,'));
});

test('new same-day recording wins over old song; never play a different or ambiguous Day 12 track',()=>{
  const current=feedRow('Samstag um zehn');
  const old=feedRow('Zeit und Datum');
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[old,current]},{level:'A1',day:12,assignmentKey:'A1-8'}).objectKey,current.objectKey);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[old]},{level:'A1',day:12,assignmentKey:'A1-8'}),null);
  assert.equal(waitingRoomDiscoveredMusicTrack({tracks:[current,current]},{level:'A1',day:12,assignmentKey:'A1-8'}),null);
});
