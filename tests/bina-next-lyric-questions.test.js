import assert from 'node:assert/strict';
import test from 'node:test';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';
import classroomSongTiming from '../src/data/a1ClassroomSongTiming.js';
import { threeVerifiedNextLyricQuestions } from '../src/utils/nextLyricQuestions.js';

test('Bina excerpts end at the displayed line and replay its immediate successor', () => {
  const pack = classroomSongTiming['A1-0.2'];
  const recording = getCuratedMusicByAssignment('A1-0.2');
  assert.equal(recording.objectKey, pack.objectKey);
  const questions = threeVerifiedNextLyricQuestions(pack, recording);
  assert.equal(questions.length, 3);
  assert.equal(questions[0].evidence, 'Ich möchte einen Deutschkurs machen.');
  assert.equal(questions[0].answer, 'Die Frau sagt freundlich: „Guten Tag!');
  for (const {evidence, answer, options, correctIndex, previewRange, continuationRange} of questions) {
    const line = pack.cues.findIndex(cue => cue.text === evidence);
    assert.equal(pack.cues[line + 1].text, answer);
    assert.ok(previewRange.end <= pack.cues[line].end);\n    assert.ok(previewRange.end < pack.cues[line + 1].start);\n    assert.ok(previewRange.end - previewRange.start >= 4.5);\n    assert.ok(previewRange.end - previewRange.start <= 7.5);
    assert.equal(continuationRange.start, pack.cues[line + 1].start);
    assert.equal(continuationRange.end, pack.cues[line + 1].end);
    assert.equal(new Set(options).size, 3);
    assert.equal(options[correctIndex], answer);
    assert.ok(options.filter(option => option !== answer).every(option =>
      !pack.cues.some(cue => cue.text === option && cue.start >= previewRange.start && cue.start < previewRange.end)));
  }
});
