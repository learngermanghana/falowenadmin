import assert from 'node:assert/strict';
import test from 'node:test';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { BINA_NEXT_LYRIC_QUESTIONS, BINA_RECORDING_KEY } from '../src/utils/nextLyricQuestions.js';
import { lyricLines } from '../src/utils/songLyrics.js';

test('Bina has three multi-line previews and separate answer continuations', () => {
  assert.equal(getCuratedMusicByAssignment('A1-0.2').objectKey, BINA_RECORDING_KEY);
  const lines = lyricLines(getReusableSongDraft('A1-0.2').lyrics);
  assert.equal(BINA_NEXT_LYRIC_QUESTIONS.length, 3);
  for (const { evidence, answer, options, correctIndex, previewRange, continuationRange } of BINA_NEXT_LYRIC_QUESTIONS) {
    const line = lines.indexOf(evidence);
    assert.ok(line >= 0, evidence);
    assert.equal(lines[line + 1], answer);
    assert.equal(new Set(options).size, 3);
    assert.equal(options[correctIndex], answer);
    assert.ok(previewRange.start >= 0 && previewRange.end - previewRange.start >= 7);
    assert.ok(continuationRange.start >= previewRange.end);
    assert.ok(continuationRange.end - continuationRange.start >= 6);
  }
});
