import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getStudioCourseCatalog } from '../src/utils/hoerenCourseCatalog.js';
import {
  getReusableSongDraft, getReusableSongDrafts, countReusableSongDrafts, musicDraftPackageText,
} from '../src/data/reusableMusicSongbook.js';
import { falowenMusicFileName, falowenMusicSlug } from '../src/utils/musicExportNames.js';

test('reusable songbook has original lyric drafts for every A1, A2 and B1 dictionary lesson', () => {
  assert.equal(countReusableSongDrafts(), 84);
  for (const level of ['A1', 'A2', 'B1']) {
    const lessons = getStudioCourseCatalog(level);
    const drafts = getReusableSongDrafts(level);
    assert.equal(lessons.length, 28, `unexpected ${level} dictionary count`);
    assert.equal(drafts.length, lessons.length, `missing ${level} draft`);
    assert.equal(new Set(drafts.map(d => d.assignmentKey.toUpperCase())).size, drafts.length);
    const keys = new Set(lessons.map(l => l.assignmentKey.toUpperCase()));
    for (const draft of drafts) {
      assert.ok(keys.has(draft.assignmentKey.toUpperCase()), `unknown assignment ${draft.assignmentKey}`);
      assert.ok(draft.title.length > 4 && draft.musicStyle.length > 25);
      assert.match(draft.lyrics, /\[Verse 1\][\s\S]*\[Chorus\][\s\S]*\[Verse 2\][\s\S]*\[Chorus\][\s\S]*\[Outro\]/);
      assert.ok(draft.lyrics.trim().split(/\s+/).length <= 170, `too many words for full song ${draft.assignmentKey}`);
      assert.doesNotMatch(draft.lyrics, /\[\[A\d+\]\]|\[\[B\d+\]\]|\[:\]|\(The head\)/);
      assert.ok(getReusableSongDraft(draft.assignmentKey) === draft);
    }
  }
});

test('health, pharmacy and travel drafts have contextual stories, not disconnected glossaries', () => {
  assert.match(getReusableSongDraft('A1-14.1').lyrics, /Mein Kopf tut weh/);
  assert.match(getReusableSongDraft('A1-14.1').lyrics, /Mia/);
  assert.match(getReusableSongDraft('A2-6.17').lyrics, /Apotheke/);
  assert.match(getReusableSongDraft('B1-9.26').lyrics, /Zug fällt/);
  assert.equal(getReusableSongDraft('C1-1'), null);
});

test('export names automatically combine level, course day and song title', () => {
  const lesson = getStudioCourseCatalog('A1').find(x => x.assignmentKey === 'A1-14.1');
  const draft = getReusableSongDraft(lesson.assignmentKey);
  assert.equal(lesson.day, 22);
  assert.equal(falowenMusicFileName(lesson, draft.title, 'mp3'), 'falowen-a1-day-22-mein-kopf-tut-weh.mp3');
  assert.equal(falowenMusicFileName(lesson, draft.title, 'txt'), 'falowen-a1-day-22-mein-kopf-tut-weh.txt');
  assert.equal(falowenMusicSlug('Körperteile & Grüße'), 'koerperteile-gruesse');
  assert.equal(falowenMusicFileName(null, null), 'falowen-custom-music.mp3');
});

test('download package contains full text and matching music style', () => {
  const lesson = getStudioCourseCatalog('B1').find(x => x.assignmentKey === 'B1-8.24');
  const draft = getReusableSongDraft(lesson.assignmentKey);
  const txt = musicDraftPackageText(draft, lesson);
  assert.match(txt, /MUSIC STYLE/);
  assert.match(txt, /LYRICS/);
  assert.ok(txt.includes(draft.lyrics));
  assert.ok(txt.includes(draft.musicStyle));
  assert.match(txt, /Day: 24/);
});

test('Music Studio preloads originals without a paid network call and retains per-lesson edits', () => {
  const s = readFileSync(new URL('../src/pages/MusicStudioPage.jsx', import.meta.url), 'utf8');
  assert.match(s, /getReusableSongDraft\(lesson\?\.assignmentKey\)/);
  assert.match(s, /Object\.prototype\.hasOwnProperty\.call\(lyricsOverrides, assignmentKey\)/);
  assert.match(s, /brief: effectiveBrief/);
  assert.match(s, /lyricTreatment === 'story-source'/);
  assert.match(s, /falowenMusicFileName\(lesson, trackTitle, 'mp3'\)/);
  assert.match(s, /Download all \{level\} lyrics & music styles/);
  assert.match(s, /Restore original/);
  assert.match(s, /navigator\.clipboard\.writeText\(lyrics\)/);
});
