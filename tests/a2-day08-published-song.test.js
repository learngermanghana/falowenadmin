import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';

test('A2 Day 8 uses the newly uploaded Ein Abend zu zweit recording and sung text', () => {
  const song = getReusableSongDraft('A2-3.8');
  assert.equal(song.title, 'Ein Abend zu zweit');
  assert.match(song.lyrics, /\[Verse 1\]\nAm Freitagabend geh’ ich mit Mia aus\./);
  assert.match(song.lyrics, /Für mich bitte Gemüse mit Reis/);
  assert.match(song.lyrics, /Doch plötzlich steht ein Fisch vor mir/);
  assert.match(song.lyrics, /Das ist nicht mein Essen/);
  assert.match(song.lyrics, /\[Final Chorus\]/);
  assert.match(song.lyrics, /\[Outro\]/);
  assert.doesNotMatch(song.lyrics, /Im Restaurant ist heute viel los|Wir bestellen freundlich und sagen danke/);
  const music = getCuratedMusicByAssignment('A2-3.8');
  assert.equal(music.status, 'published');
  assert.equal(music.objectKey, 'music/a2/day-08/Ein Abend zu zweit.mp3');
  assert.equal(music.title, song.title);
  assert.ok(music.audioUrl.includes(music.trackId));
  assert.ok(getReusableMusicQuestions('A2-3.8').questions.length >= 2);
});

test('older saved Day 8 studio lyrics are marked superseded, rather than masking the recording', () => {
  const src = readFileSync('src/pages/MusicStudioPage.jsx', 'utf8');
  assert.match(src, /key === 'A2-3\.8' && text\.includes\('Im Restaurant ist heute viel los\.'\)/);
  assert.match(src, /setLyricsOverrides/);
  assert.match(src, /New approved course lyrics are loaded/);
});
