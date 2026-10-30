import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getStudioCourseCatalog } from '../src/utils/hoerenCourseCatalog.js';

const approvedLyrics = "[Intro]\nHmm, hmm, hmm …\nOh-oh, eins, zwei, drei!\nHmm, hmm, hier bin ich!\n\n[Verse 1]\nHallo, ich heiße Ben,\nIch komme aus Ghana, aus Accra.\nIch bin vierundzwanzig Jahre alt,\nUnd heute stelle ich mich vor.\n\nIch wohne in der Blumenstraße,\nMeine Hausnummer ist eins zwei drei.\nDie Postleitzahl ist eins zwei drei vier fünf,\nHier bin ich zu Hause, hier bin ich gern.\n\n[Chorus]\nEins, zwei, drei, vier, fünf, sechs,\nSieben, acht, neun und zehn.\nElf, zwölf, dreizehn, vierzehn, fünfzehn,\nSechzehn, siebzehn, achtzehn, neunzehn, zwanzig!\n\nOh-oh, wie alt bist du?\nIch bin vierundzwanzig, und du?\nHmm-hmm, sag es mir,\nWie ist deine Hausnummer hier?\n\n[Verse 2]\nMeine Telefonnummer ist ganz einfach,\nNull, zwei, vier – fünf, sechs, sieben.\nAcht, neun, null – eins, zwei, drei,\nIch sage sie noch einmal langsam.\n\nNull, zwei, vier – fünf, sechs, sieben,\nAcht, neun, null – eins, zwei, drei.\n„Wie ist deine Telefonnummer?“\nJetzt kannst du sie auch sagen!\n\n[Chorus]\nEins, zwei, drei, vier, fünf, sechs,\nSieben, acht, neun und zehn.\nElf, zwölf, dreizehn, vierzehn, fünfzehn,\nSechzehn, siebzehn, achtzehn, neunzehn, zwanzig!\n\nOh-oh, wie alt bist du?\nIch bin vierundzwanzig, und du?\nHmm-hmm, sag es mir,\nWie ist deine Hausnummer hier?\n\n[Outro]\nHmm, hmm, mein Name ist Ben,\nVierundzwanzig Jahre, das bin ich.\nBlumenstraße, eins zwei drei,\nOh-oh, jetzt kennst du mich!";

test('A1 Day 4 loads the exact approved beginner lyrics from its songbook entry', () => {
  const day = getStudioCourseCatalog('A1').find(row => row.assignmentKey === 'A1-2');
  assert.equal(day.day, 4);
  assert.equal(getReusableSongDraft('A1-2').lyrics, approvedLyrics);
});

test('Day 4 questions match the age, address and telephone lyrics', () => {
  const bank = getReusableMusicQuestions('A1-2');
  assert.deepEqual(bank.questions.slice(0, 2).map(q => q.answer), ['Vierundzwanzig Jahre alt.', 'Null, zwei, vier.']);
  assert.match(bank.questions[0].evidence, /Ich bin vierundzwanzig/);
  assert.match(bank.questions[1].evidence, /Null, zwei, vier/);
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
  assert.equal(track.objectKey, 'music/a1/day-04/Meine Nummer, meine Adresse.mp3');
  assert.equal(track.trackId, 'r2-a1-day-04-b64_TWVpbmUgTnVtbWVyLCBtZWluZSBBZHJlc3NlLm1wMw');
  assert.equal(track.day, 4);
  assert.equal(getCuratedMusicForSession({ level: 'A1', day: 4 }), track);
});
