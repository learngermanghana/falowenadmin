import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getStudioCourseCatalog } from '../src/utils/hoerenCourseCatalog.js';

test('A1 Day 4 uses the replacement recording transcript draft in its songbook entry', () => {
  const day = getStudioCourseCatalog('A1').find(row => row.assignmentKey === 'A1-2');
  const song = getReusableSongDraft('A1-2');
  assert.equal(day.day, 4);
  assert.equal(song.title, 'Das ist meine Nummer');
  assert.match(song.lyrics, /Mein Name ist Daniel/);
  assert.doesNotMatch(song.lyrics, /vierundzwanzig|Blumenstraße/);
});

test('Day 4 questions match the age and city in the replacement recording', () => {
  const bank = getReusableMusicQuestions('A1-2');
  assert.deepEqual(bank.questions.slice(0, 2).map(q => q.answer), ['Einundzwanzig Jahre alt.', 'In Berlin.']);
  assert.match(bank.questions[0].evidence, /ich bin 21 Jahre alt/);
  assert.match(bank.questions[1].evidence, /Mein Zuhause ist in Berlin/);
  for (const question of bank.questions.slice(0, 2)) {
    assert.equal(question.options.length, 3);
    assert.equal(question.options[question.correctIndex], question.answer);
  }
  assert.match(JSON.stringify(bank), /Hausnummer|Telefonnummer/);
  assert.equal(bank.questions[2].type, 'speaking');
  assert.match(bank.questions[2].prompt, /Hausnummer und Telefonnummer/);
  assert.ok(bank.questions[2].sentenceStarters.length >= 2);
});


test('approved Day 4 upload loads by exact path in slides and class waiting music', async () => {
  const { getCuratedMusicByAssignment, getCuratedMusicForSession } = await import('../src/data/curatedLessonMusic.js');
  const track = getCuratedMusicByAssignment('A1-2');
  assert.equal(track.objectKey, 'music/a1/day-04/Das ist meine Nummer.mp3');
  assert.equal(track.trackId, 'r2-a1-day-04-b64_RGFzIGlzdCBtZWluZSBOdW1tZXIubXAz');
  assert.equal(track.day, 4);
  assert.equal(getCuratedMusicForSession({ level: 'A1', day: 4 }), track);
});
