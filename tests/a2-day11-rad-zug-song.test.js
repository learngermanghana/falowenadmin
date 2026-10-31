import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getCuratedMusicByAssignment,getCuratedMusicForSession } from '../src/data/curatedLessonMusic.js';

const key='music/a2/day-11/Mit dem Rad, mit dem Zug.mp3';
const id='r2-a2-day-11-b64_TWl0IGRlbSBSYWQsIG1pdCBkZW0gWnVnLm1wMw';

test('A2 Day 11 has the correct published recording in lesson and attendance',()=>{
 const track=getCuratedMusicByAssignment('A2-4.11');
 assert.equal(track.level,'A2');
 assert.equal(track.day,11);
 assert.equal(track.objectKey,key);
 assert.equal(track.title,'Mit dem Rad, mit dem Zug');
 assert.equal(track.trackId,id);
 assert.equal(Buffer.from(id.split('b64_')[1],'base64url').toString('utf8'),'Mit dem Rad, mit dem Zug.mp3');
 assert.equal(getCuratedMusicForSession({level:'A2',day:11}),track);
 assert.equal(track.cues,undefined,'Song timings are not reviewed');
});

test('A2 Day 11 songbook replaces old bus story with recorded bike and train lyrics',()=>{
 const song=getReusableSongDraft('A2-4.11');
 assert.equal(song.title,'Mit dem Rad, mit dem Zug');
 assert.match(song.lyrics,/Am Morgen fahre ich mit dem Rad,/);
 assert.match(song.lyrics,/Am Nachmittag nehme ich den Zug,/);
 assert.match(song.lyrics,/Am Bahnhof wartest du auf mich,/);
 assert.doesNotMatch(song.lyrics,/Ben fährt jeden Morgen zur Arbeit/);
 const sections=[...song.lyrics.matchAll(/\\[(Verse 1|Verse 2|Chorus|Outro)\\]\\n([^[]*)/g)]
   .map(m=>({title:m[1],lines:m[2].trim().split('\\n').filter(Boolean)}));
 assert.deepEqual(sections.map(s=>s.lines.length),[4,3,8,4,4]);
});
test('A2 Day 11 questions refer to the new recording rather than the old bus story',()=>{
 const bank=getReusableMusicQuestions('A2-4.11');
 assert.deepEqual(bank.questions.map(q=>q.type),['listening','listening','speaking']);
 assert.equal(bank.questions[0].answer,'Mit dem Rad.');
 assert.equal(bank.questions[1].answer,'Mit dem Zug.');
 assert.match(bank.questions[0].evidence,/Am Morgen fahre ich mit dem Rad/);
 assert.match(bank.questions[1].evidence,/Am Nachmittag nehme ich den Zug/);
 assert.doesNotMatch(JSON.stringify(bank),/Bus oft zu spät/);
});
