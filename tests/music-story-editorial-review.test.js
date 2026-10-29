import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getReusableSongDraft, getReusableSongDrafts } from '../src/data/reusableMusicSongbook.js';
import { revisedMusicStoryLyrics } from '../src/data/musicStoryRevisions.js';
import { canUseNewMusicStoryDraft, isKnownPublishedMusicLesson } from '../src/data/musicPublicationGuard.js';
import { musicStorySections, reviewMusicStory } from '../src/utils/musicStoryReview.js';
import { musicLessonContext } from '../src/utils/musicCourseContext.js';

test('A1 café storyline revision is separate from the approved original', () => {
  const original = getReusableSongDraft('A1-3.5');
  assert.equal(original.title, 'Die Rechnung im Café');
  assert.match(original.lyrics, /Zwei Tees, vier Euro, danke/);
  assert.match(original.lyrics, /Bei Falowen zählen wir zusammen/);
  const revised = revisedMusicStoryLyrics(original.lyrics, original.assignmentKey);
  assert.match(revised, /halb drei/);
  assert.match(revised, /Bus fährt um drei/);
  assert.match(revised, /vier Euro/);
  assert.match(revised, /drei Euro/);
  assert.match(revised, /sieben/);
  assert.match(revised, /mein Geld ist nicht da/);
  assert.match(revised, /Ich bezahle heute für uns/);
  assert.match(revised, /Bus steht noch da/);
  assert.match(revised, /ich bleibe noch bei dir/);
  assert.match(revised, /\[Bridge\]/);
  assert.doesNotMatch(revised, /Bei Falowen/);
  assert.ok(revised.trim().split(/\s+/).length <= 170);
  assert.equal(original.genre, 'German Pop');
  assert.match(getReusableSongDraft('A1-3.5').lyrics, /Zwei Tees, vier Euro, danke/);
});

test('all 84 published-compatible original lyric texts remain intact', () => {
  const originals = ['A1', 'A2', 'B1'].flatMap(level => getReusableSongDrafts(level));
  assert.equal(originals.length, 84);
  for (const song of originals) {
    const outro = musicStorySections(song.lyrics).Outro || '';
    assert.ok(outro, `Outro missing: ${song.assignmentKey}`);
    assert.match(outro, /Falowen/i, `Original audio-aligned outro must stay: ${song.assignmentKey}`);
    assert.ok(song.lyrics.trim().split(/\s+/).length <= 170, `Too long: ${song.assignmentKey}`);
    const revised = revisedMusicStoryLyrics(song.lyrics, song.assignmentKey);
    assert.doesNotMatch(musicStorySections(revised).Outro, /Falowen/i,
      `New-recording draft still has ad ending: ${song.assignmentKey}`);
    assert.ok(revised.trim().split(/\s+/).length <= 170, `Revision too long: ${song.assignmentKey}`);
    assert.equal(getReusableSongDraft(song.assignmentKey).lyrics, song.lyrics,
      `Original altered in memory: ${song.assignmentKey}`);
  }
});

test('publication guard locks verified audio and requires positive confirmation for unlisted days', () => {
  for (const id of ['A1-2', 'A1-14.1', 'A2-7.18', 'B1-8.25', 'B1-9.26']) {
    assert.equal(isKnownPublishedMusicLesson(id), true);
    assert.equal(canUseNewMusicStoryDraft({ assignmentKey: id, confirmedNoAudio: true }), false);
    assert.equal(canUseNewMusicStoryDraft({ assignmentKey: id, confirmedNoAudio: false }), false);
  }
  assert.equal(isKnownPublishedMusicLesson('A1-3.5'), false);
  assert.equal(canUseNewMusicStoryDraft({ assignmentKey: 'A1-3.5', confirmedNoAudio: false }), false);
  assert.equal(canUseNewMusicStoryDraft({ assignmentKey: 'A1-3.5', confirmedNoAudio: true }), true);
  assert.equal(canUseNewMusicStoryDraft({ assignmentKey: '', confirmedNoAudio: true }), false);
});

test('local reviewer flags number chants and ads but recognizes new café arc', () => {
  const original = getReusableSongDraft('A1-3.5');
  const oldReview = reviewMusicStory(original.lyrics);
  assert.match(oldReview.issues.join(' '), /advertisement/i);
  assert.match(oldReview.issues.join(' '), /numbers or prices/i);
  const revised = revisedMusicStoryLyrics(original.lyrics, 'A1-3.5');
  const newReview = reviewMusicStory(revised);
  assert.equal(newReview.issues.length, 0);
  assert.equal(newReview.hasBridge, true);
  assert.equal(newReview.sectionCount, 5);
  assert.equal(newReview.stages.length, 5);
  assert.match(newReview.stages[2].text, /sieben/);
  assert.match(newReview.stages[3].text, /mein Geld ist nicht da/);
  assert.match(newReview.stages[4].text, /Haltestelle/);
});

test('new-recording music generator requests one connected plot', () => {
  const context = musicLessonContext({
    level: 'A1', day: 8, assignmentKey: 'A1-3.5', chapter: '3',
    germanTitle: 'Zahlen und Preise im Café', englishTitle: 'Numbers and prices at the café',
  }, 'german', '', { songStyle: 'story', teacherLyricsProvided: true, rewriteFromLyrics: true });
  assert.match(context, /one coherent five-step adult story/i);
  assert.match(context, /A1 CAFÉ STORY SEED/);
  assert.match(context, /seven euros total/i);
  assert.match(context, /warm repeated refrain/i);
});

test('studio gates story revision and rewriting without changing approved lyrics', () => {
  const page = readFileSync(new URL('../src/pages/MusicStudioPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /reviewMusicStory\(lyrics\)/);
  assert.match(page, /Storyline check · free, no music generation/);
  assert.match(page, /Read the five story moments/);
  assert.match(page, /Mark these lyrics reviewed/);
  assert.match(page, /Before publishing: listen and approve/);
  assert.match(page, /Published audio · lyrics protected/);
  assert.match(page, /Load revised storyline for a NEW recording/);
  assert.match(page, /canUseNewMusicStoryDraft/);
  assert.match(page, /revisedMusicStoryLyrics\(draft\.lyrics, assignmentKey\)/);
  assert.match(page, /readOnly=\{Boolean\(draft\) && !canStartNewRecordingDraft\}/);
  assert.match(page, /source' && canStartNewRecordingDraft/);
  assert.doesNotMatch(page, /setInterval\(/);
});
