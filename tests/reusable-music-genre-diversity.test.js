import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDrafts, getReusableSongDraft, musicDraftPackageText } from '../src/data/reusableMusicSongbook.js';
import { getStudioCourseCatalog } from '../src/utils/hoerenCourseCatalog.js';
import { suggestLessonMusicDirection } from '../src/utils/musicTopicStyle.js';
import { readFileSync } from 'node:fs';

test('84 original lesson songs provide a diverse genre library, not mostly acoustic', () => {
  const all = ['A1','A2','B1'].flatMap(level => getReusableSongDrafts(level));
  assert.equal(all.length, 84);
  const genres = new Set(all.map(song => song.genre));
  assert.ok(genres.size >= 18, `Only ${genres.size} genres found`);
  const acoustic = all.filter(song => /acoustic/i.test(song.musicStyle));
  assert.ok(acoustic.length <= 20, `Too many acoustic arrangements: ${acoustic.length}/84`);
  for (const level of ['A1','A2','B1']) {
    const songs = getReusableSongDrafts(level);
    assert.equal(songs.length, 28);
    assert.ok(new Set(songs.map(song => song.genre)).size >= 12,
      `Not enough distinct genres for ${level}`);
    assert.ok(songs.every(song => song.musicStyle.startsWith(song.genre)),
      `Missing explicit song genre for ${level}`);
  }
  for (const label of ['Afrobeat','German Pop','Soft R&B','Piano Ballad','Lo-fi Hip-Hop',
    'Reggae Pop','Jazz-Pop','Soft Funk','Synth-Pop','Afro-Soul']) {
    assert.ok(genres.has(label), `Missing genre: ${label}`);
  }
});

test('selected song genre overrides generic acoustic topic direction without mixing two genres', () => {
  for (const level of ['A1','A2','B1']) {
    const lessons = getStudioCourseCatalog(level);
    const songs = getReusableSongDrafts(level);
    for (const song of songs) {
      const lesson = lessons.find(row => row.assignmentKey === song.assignmentKey);
      assert.ok(lesson, song.assignmentKey);
      const direction = suggestLessonMusicDirection(lesson,{preferredStyle:song.musicStyle});
      assert.ok(direction.includes(song.musicStyle), song.assignmentKey);
      const count = direction.split(song.musicStyle).length-1;
      assert.equal(count,1, `Duplicated style for ${song.assignmentKey}`);
      assert.match(direction, /complete final cadence and gentle fade/);
      assert.match(direction, /lead voice/);
      assert.ok(direction.length < 1900, `Too-long generation direction ${song.assignmentKey}`);
    }
  }
});

test('genres remain readable in songbook exports while the original lyrics are unchanged', () => {
  const draft = getReusableSongDraft('A1-14.1');
  assert.equal(draft.genre, 'Acoustic Afro-Soul');
  assert.match(draft.lyrics, /Mein Kopf tut weh/);
  const text = musicDraftPackageText(draft, getStudioCourseCatalog('A1').find(x => x.assignmentKey === 'A1-14.1'));
  assert.match(text, /Genre: Acoustic Afro-Soul/);
  assert.ok(text.includes(draft.lyrics));
  assert.match(text, /MUSIC STYLE/);
});

test('Music Studio uses the actual draft style as preferred, not the generic acoustic fallback', () => {
  const source = readFileSync(new URL('../src/pages/MusicStudioPage.jsx',import.meta.url),'utf8');
  assert.match(source, /preferredStyle: draft\?\.musicStyle \|\| ''/);
  assert.match(source, /draft\?\.genre \|\| getMusicTopicStyle\(lesson\)\.label/);
  assert.doesNotMatch(source, /For this particular story use:/);
  assert.match(source, /styleMode === 'auto'/);
});
