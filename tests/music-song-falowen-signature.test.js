import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDrafts } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions, formatReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { musicLyricLimit } from '../src/utils/musicGenerationPrompt.js';

test('every A1–B1 original song includes Falowen once, naturally at the end', () => {
  const all = ['A1', 'A2', 'B1'].flatMap(level => getReusableSongDrafts(level));
  assert.equal(all.length, 84);
  for (const song of all) {
    const mentions = song.lyrics.match(/Falowen/g) || [];
    assert.equal(mentions.length, 1, song.assignmentKey);
    const parts = song.lyrics.split('[Outro]');
    assert.equal(parts.length, 2, song.assignmentKey);
    const lastLine = parts[1].trim().split('\n').at(-1);
    assert.match(lastLine, /^(?:Bei|Mit) Falowen /, song.assignmentKey);
    assert.ok(lastLine.trim().split(/\s+/).length <= 14, song.assignmentKey);
    assert.ok(song.lyrics.trim().split(/\s+/).length <= musicLyricLimit('song',120),
      `too many lyric words for minimum 2 minute song ${song.assignmentKey}`);
  }
});

test('each saved question bank remains aligned with the unmodified verse text', () => {
  for (const song of ['A1', 'A2', 'B1'].flatMap(level => getReusableSongDrafts(level))) {
    const bank = getReusableMusicQuestions(song.assignmentKey);
    assert.ok(bank, song.assignmentKey);
    assert.equal(bank.questions.length, 3);
    for (const question of bank.questions.slice(0, 2)) {
      assert.ok(song.lyrics.includes(question.evidence), `lost question evidence ${song.assignmentKey}`);
      assert.ok(!question.evidence.includes('Falowen'), `brand inserted in listening evidence ${song.assignmentKey}`);
    }
    const studentText = formatReusableMusicQuestions(song.assignmentKey);
    assert.doesNotMatch(studentText, /Erwartete Antwort:|Textbeleg:/);
  }
});
