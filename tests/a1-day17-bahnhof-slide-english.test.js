import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDraft, getReusableSongDrafts } from '../src/data/reusableMusicSongbook.js';
import { resolveTeachingSongEnglishTranslation } from '../src/utils/musicEnglishDrafts.js';
import { publishedVideoEnglish, videoLyricLines } from '../src/utils/musicLyricsVideo.js';

const key = 'music/a1/day-17/Wo ist der Bahnhof_.mp3';
const song = getReusableSongDraft('A1-11');

test('A1 Day 17 Wo ist der Bahnhof teaching slide has complete aligned English', () => {
  assert.equal(song.title, 'Wo ist der Bahnhof?');
  const translated = resolveTeachingSongEnglishTranslation({
    assignmentKey:'A1-11', objectKey:key, lyrics:song.lyrics,
  });
  assert.equal(translated?.source, 'course-draft');
  assert.equal(translated.lines.length, 44);
  assert.deepEqual(translated.lines.map(line=>line.de), videoLyricLines(song.lyrics));
  assert.equal(translated.lines[0].en, "I'm in a new city today,");
  assert.equal(translated.lines.at(-1).en, 'How nice that I can now find the way!');
  assert.equal(translated.lines.filter(line => line.de === 'Links ist der Park, rechts ist die Bank,').length, 2);
  assert.ok(translated.lines.filter(line => line.de === 'Links ist der Park, rechts ist die Bank,')
    .every(line => line.en.includes('bank')));
  assert.equal(publishedVideoEnglish({objectKey:key,englishTranslation:translated},key,song.lyrics)
    .split('\n').length,44);
});

test('all existing A1/A2/B1 course song translations can be used by the teaching slide when German matches', () => {
  const songs = ['A1','A2','B1'].flatMap(getReusableSongDrafts);
  assert.equal(songs.length,84);
  for (const courseSong of songs) {
    const english = resolveTeachingSongEnglishTranslation({
      assignmentKey:courseSong.assignmentKey,
      objectKey:'music/test/'+courseSong.assignmentKey+'.mp3',
      lyrics:courseSong.lyrics,
    });
    assert.equal(english?.lines?.length,videoLyricLines(courseSong.lyrics).length,
      'Missing line-matched English for '+courseSong.assignmentKey);
    assert.ok(english.lines.every((line,i)=>line.de===videoLyricLines(courseSong.lyrics)[i] && line.en.trim()));
  }
});

test('published reviewed translation wins; stale/edited German and unknown MP3 cannot inherit English', () => {
  const german=videoLyricLines(song.lyrics);
  const reviewed={source:'recording',lines:german.map((de,i)=>({de,en:'Reviewed '+i}))};
  assert.strictEqual(resolveTeachingSongEnglishTranslation({
    assignmentKey:'A1-11',objectKey:key,lyrics:song.lyrics,publishedEnglish:reviewed,
  }),reviewed);
  assert.equal(resolveTeachingSongEnglishTranslation({
    assignmentKey:'A1-11',objectKey:key,lyrics:song.lyrics.replace('Ich bin heute', 'Ich war heute'),
  }),null);
  assert.equal(resolveTeachingSongEnglishTranslation({
    assignmentKey:'A1-11',objectKey:'',lyrics:song.lyrics,
  }),null);
  assert.equal(resolveTeachingSongEnglishTranslation({
    assignmentKey:'A1-7',objectKey:key,lyrics:song.lyrics,
  }),null);
});
