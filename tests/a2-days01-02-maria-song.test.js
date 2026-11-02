import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';

const sections = lyrics => [...lyrics.matchAll(/^\[([^\]]+)\]\n([^[]*)/gm)].map(match => ({
  name: match[1],
  lines: match[2].trim().split('\n').map(x => x.trim()).filter(Boolean),
}));

test('A2-1.1 teacher songbook and curated playback use the new restaurant recording', () => {
  const song=getReusableSongDraft('A2-1.1');
  const track=getCuratedMusicByAssignment('A2-1.1');
  const questions=getReusableMusicQuestions('A2-1.1');
  assert.equal(song.title,'Ein nettes Gespräch');
  assert.equal(track.title,song.title);
  assert.equal(track.objectKey,'music/a2/day-01/Ein nettes Gespräch.mp3');
  assert.equal(track.trackId,'r2-a2-day-01-b64_RWluIG5ldHRlcyBHZXNwcsOkY2gubXAz');
  assert.deepEqual(sections(song.lyrics).map(x=>[x.name,x.lines.length]),[
    ['Verse 1',4],['Chorus',4],['Verse 2',8],['Chorus',8],['Outro',4],
  ]);
  assert.match(song.lyrics,/Wir bestellen Pizza und etwas zu trinken/);
  assert.doesNotMatch(song.lyrics,/Hallo, ich heiße Daniel/);
  assert.equal(questions.questions[0].answer,'In einem Restaurant.');
  assert.equal(questions.questions[1].answer,'Pizza und etwas zu trinken.');
  assert.match(questions.questions[0].evidence,/Am Freitagabend gehe ich ins Restaurant/);
  assert.match(questions.questions[1].evidence,/Wir bestellen Pizza/);
  assert.doesNotMatch(JSON.stringify(questions),/Clara|Park am See/);
});

test('A2-1.2 Personen beschreiben uses exact Maria lyrics, bridge, varied final chorus and related exercises', () => {
  const song=getReusableSongDraft('A2-1.2');
  const questions=getReusableMusicQuestions('A2-1.2');
  assert.equal(song.title,'Maria, meine Mama');
  assert.deepEqual(sections(song.lyrics).map(x=>[x.name,x.lines.length]),[
    ['Verse 1',4],['Bridge – 2 Zeilen',2],['Chorus',4],['Verse 2',8],['Chorus',8],['Outro',4],
  ]);
  for(const phrase of ['Ihre Augen sind warm und braun,','weiß ich, dass sie mich versteht.',
    'Maria kocht gern Reis und Gemüse,','An meine Träume glaubt sie fest,',
    'Danke, Mama, für deine Zeit,','Maria, Maria, ich hab dich so lieb,'])
    assert.ok(song.lyrics.includes(phrase), phrase);
  assert.equal(song.lyrics.match(/Maria ist freundlich, immer da,/g)?.length,2);
  assert.doesNotMatch(song.lyrics,/Lea|Die neue Kollegin|Tennis spielen/);
  assert.equal(questions.songTitle,'Maria, meine Mama');
  assert.equal(questions.questions[0].answer,'Sie heißt Maria und hat braune Augen.');
  assert.equal(questions.questions[1].answer,'Im Krankenhaus.');
  assert.match(questions.questions[0].evidence,/Maria heißt sie/);
  assert.match(questions.questions[1].evidence,/Sie arbeitet im Krankenhaus/);
  assert.equal(getCuratedMusicByAssignment('A2-1.2'),null,'No A2 Day 2 MP3 verified: do not publish invented audio/timings');
});
