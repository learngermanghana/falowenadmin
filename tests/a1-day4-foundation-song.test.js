import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getStudioCourseCatalog } from '../src/utils/hoerenCourseCatalog.js';

const approvedLyrics = "[Verse 1]\nHallo! Guten Tag!\nIch heiße Ben.\nWie heißt du?\nIch heiße Sam.\n\nWoher kommst du?\nIch komme aus Ghana.\nWo wohnst du?\nIch wohne in Accra.\n\n[Chorus]\nEins, zwei, drei,\nvier, fünf, sechs.\nSieben, acht, neun, zehn.\nHallo Sam! Hallo Ben!\n\nWie ist deine Nummer?\nVier, fünf, sechs.\nNoch einmal, bitte:\nVier, fünf, sechs.\n\n[Verse 2]\nWie schreibt man Ben?\nB–E–N.\nWie schreibt man Sam?\nS–A–M.\n\nWie alt bist du?\nIch bin zwanzig Jahre alt.\nWie geht es dir?\nGut, danke! Und dir?\n\n[Chorus]\nEins, zwei, drei,\nvier, fünf, sechs.\nSieben, acht, neun, zehn.\nHallo Sam! Hallo Ben!\n\nWie ist deine Nummer?\nVier, fünf, sechs.\nNoch einmal, bitte:\nVier, fünf, sechs.\n\n[Outro]\nHallo! Ich heiße Ben.\nB–E–N.\nEins, zwei, drei — Falowen!\nAuf Wiedersehen!";

test('A1 Day 4 loads the exact approved beginner lyrics from its songbook entry', () => {
  const day = getStudioCourseCatalog('A1').find(row => row.assignmentKey === 'A1-2');
  assert.equal(day.day, 4);
  assert.equal(getReusableSongDraft('A1-2').lyrics, approvedLyrics);
});

test('Day 4 song questions match the new verses and omit the removed address story', () => {
  const bank = getReusableMusicQuestions('A1-2');
  assert.deepEqual(bank.questions.slice(0, 2).map(q => q.answer), ['Vier, fünf, sechs.', 'Zwanzig Jahre alt.']);
  assert.match(bank.questions[0].evidence, /Vier, fünf, sechs/);
  assert.match(bank.questions[1].evidence, /Ich bin zwanzig Jahre alt/);
  for (const question of bank.questions.slice(0, 2)) {
    assert.equal(question.options.length, 3);
    assert.equal(question.options[question.correctIndex], question.answer);
  }
  assert.doesNotMatch(JSON.stringify(bank), /Hausnummer|Gartenstraße|Nummer sieben/);
  assert.equal(bank.questions[2].type, 'speaking');
  assert.match(bank.questions[2].prompt, /erfundene Nummer/);
  assert.ok(bank.questions[2].sentenceStarters.length >= 2);
});


test('approved Day 4 upload loads by exact path in slides and class waiting music', async () => {
  const { getCuratedMusicByAssignment, getCuratedMusicForSession } = await import('../src/data/curatedLessonMusic.js');
  const track = getCuratedMusicByAssignment('A1-2');
  assert.equal(track.objectKey, 'music/a1/day-04/welche-nummer-hast-du.mp3');
  assert.equal(track.trackId, 'a1-day-04-numbers');
  assert.equal(track.day, 4);
  assert.equal(getCuratedMusicForSession({ level: 'A1', day: 4 }), track);
});
