import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { resolveTeachingSongEnglishTranslation } from '../src/utils/musicEnglishDrafts.js';
import { publishedVideoEnglish, videoLyricLines } from '../src/utils/musicLyricsVideo.js';

const assignmentKey = 'A1-7';
const objectKey = 'music/a1/day-11/Mein Tag – Von morgens bis.mp3';
const song = getReusableSongDraft(assignmentKey);
const resolve = (lyrics, publishedEnglish) =>
  resolveTeachingSongEnglishTranslation({assignmentKey, objectKey, lyrics, publishedEnglish});

test('A1 Day 11 slide receives all 44 English lines from the exact matching course song', () => {
  const translation = resolve(song.lyrics);
  assert.equal(translation?.source, 'course-draft');
  assert.equal(translation.lines.length, 44);
  assert.deepEqual(translation.lines.map(({de}) => de), videoLyricLines(song.lyrics));
  assert.equal(translation.lines[0].en, "I get up at seven o'clock,");
  assert.equal(translation.lines.at(-1).en, 'And a new day begins.');
  assert.equal(publishedVideoEnglish(
    {objectKey, englishTranslation:translation}, objectKey, song.lyrics,
  ).split('\n').length, 44);
});

test('published exact recording English takes precedence over course draft', () => {
  const lines = videoLyricLines(song.lyrics);
  const publishedEnglish = {source:'recording', lines:lines.map((de,i) => ({de,en:'Reviewed '+(i+1)}))};
  assert.strictEqual(resolve(song.lyrics, publishedEnglish), publishedEnglish);
});

test('different recorded German and other lesson IDs never receive old Day 11 English', () => {
  assert.equal(resolve(song.lyrics.replace('Um sieben Uhr stehe ich auf,', 'Um sechs Uhr stehe ich auf,')), null);
  assert.equal(resolve(song.lyrics + '\nEine neue gesungene Zeile.'), null);
  assert.equal(resolveTeachingSongEnglishTranslation({
    assignmentKey:'A1-8', objectKey, lyrics:song.lyrics,
  }), null);
  assert.equal(resolveTeachingSongEnglishTranslation({
    assignmentKey:'A1-7', objectKey, lyrics:'', publishedEnglish:{source:'recording',lines:[]},
  }), null);
});

test('the A1 slide player passes verified or fallback English to the shared lyric renderer', () => {
  const player = readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx', import.meta.url), 'utf8');
  assert.match(player, /resolveTeachingSongEnglishTranslation\(\{/);
  assert.match(player, /publishedEnglish:recordingMetadata\?\.englishTranslation/);
  assert.match(player, /<LessonSongLyrics song=\{displaySong\}/);
  const renderer = readFileSync(new URL('../src/components/LessonSongLyrics.jsx', import.meta.url), 'utf8');
  assert.match(renderer, /English translation/);
  assert.match(renderer, /hasEnglish && showEnglish/);
});
