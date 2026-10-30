import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getA1PresenterMusicStage } from '../src/data/a1PresenterMusicStage.js';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';

test('Day 4 has one approved A1 music slide with original R2 audio and song questions', () => {
  const stage = getA1PresenterMusicStage('A1-2');
  assert.equal(stage?.id, 'music-lesson');
  assert.equal(stage?.type, 'published-music');
  assert.match(stage.title, /Meine Nummer, meine Adresse/);
  assert.equal(stage.items.length, 1);
  assert.equal(getCuratedMusicByAssignment('A1-2').objectKey, 'music/a1/day-04/Meine Nummer, meine Adresse.mp3');
  assert.match(getCuratedMusicByAssignment('A1-2').introQuestion, /Wie alt ist Ben/);
  const song = getReusableSongDraft('A1-2');
  assert.match(song.lyrics, /Ich heiße Ben/);
  assert.match(song.lyrics, /Blumenstraße/);
  assert.deepEqual(getReusableMusicQuestions('A1-2').questions.map(question => question.type), ['listening', 'listening', 'speaking']);
});

test('only published A1 lesson songs qualify for the standard stage', () => {
  assert.equal(getA1PresenterMusicStage('A1-2.3'), null, 'planned Day 6 cannot play');
  assert.equal(getA1PresenterMusicStage('A2-7.18'), null, 'A2 owns its music stage');
  assert.equal(getA1PresenterMusicStage('A1-14.1'), null, 'existing A1 Day 22 retains its dedicated finale');
  assert.equal(getA1PresenterMusicStage('A1-999'), null);
});

test('A1 presenter places the song directly after Common mistakes without modifying marking stages', () => {
  const src = readFileSync(new URL('../src/components/A1GrammarPresenter.jsx', import.meta.url), 'utf8');
  const mistakes = src.indexOf('id: "mistakes"');
  const song = src.indexOf('...(a1SongStage ? [a1SongStage] : [])');
  const speaking = src.indexOf('id: "mini-mission"');
  assert.ok(mistakes > 0 && mistakes < song && song < speaking);
  assert.match(src, /getA1PresenterMusicStage\(slide\.assignmentId\)/);
  assert.match(src, /stage\.type === "published-music"/);
  assert.match(src, /<PublishedSongLessonStage assignmentKey=\{slide\.assignmentId\} compact/);
  assert.match(src, /focusMode && !isMusicStage/);
  assert.match(src, /\{!isMusicStage \? <details className="presenter-a1-activity-disclosure">/);
  assert.match(src, /id: "exit-check"/);
});

test('shared song player uses A1-specific listening prompts and keeps answers teacher-reveal only', () => {
  const src = readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx', import.meta.url), 'utf8');
  assert.match(src, /recording\.introQuestion/);
  assert.match(src, /recording\.level === 'A1'/);
  assert.match(src, /view==='listen'/);
  assert.match(src, /view==='lyrics'/);
  assert.match(src, /view==='questions'/);
  assert.match(src, /Musterlösung für Lehrkraft zeigen/);
  assert.match(src, /Keine Goethe-Hörprüfung/);
});
