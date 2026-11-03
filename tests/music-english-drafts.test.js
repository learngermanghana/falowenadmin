import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const english = JSON.parse(read('src/data/musicEnglishDrafts.json'));
const sources = [
  'musicSongDraftsA1.js',
  'musicSongDraftsA2Part1.js',
  'musicSongDraftsA2Part2.js',
  'musicSongDraftsB1Part1.js',
  'musicSongDraftsB1Part2.js',
];
const songs = sources.flatMap(name => {
  const file = read('src/data/' + name);
  const match = file.match(/Object\.freeze\((\[[\s\S]*\])\);?/);
  assert.ok(match, 'songbook must be parseable: ' + name);
  return JSON.parse(match[1]);
});
const sung = lyrics => String(lyrics || '').replace(/\\n/g, '\n').split(/\r?\n/)
  .map(x => x.trim()).filter(x => x && !/^\[.*\]$/.test(x));

test('A1, A2 and B1 provide complete exact-line English for all 84 studio songs', () => {
  assert.equal(songs.length, 84);
  assert.equal(english.entries.length, 84);
  assert.equal(new Set(english.entries.map(e => e.assignmentKey)).size, 84);
  for (const level of ['A1', 'A2', 'B1']) {
    assert.equal(songs.filter(song => song.assignmentKey.startsWith(level + '-')).length, 28);
  }
  for (const song of songs) {
    const row = english.entries.find(item => item.assignmentKey === song.assignmentKey);
    assert.ok(row, 'Missing English for ' + song.assignmentKey);
    assert.equal(row.title, song.title, 'Stale song title for ' + song.assignmentKey);
    assert.deepEqual(row.de, sung(song.lyrics), 'Stale German lyric alignment for ' + song.assignmentKey);
    assert.equal(row.en.length, row.de.length, 'Incorrect English line count for ' + song.assignmentKey);
    assert.ok(row.en.every(line => typeof line === 'string' && line.trim()),
      'Empty English line for ' + song.assignmentKey);
    assert.ok(['editor', 'machine-draft'].includes(row.source));
  }
});

test('existing editorial work is preserved and machine drafts are identified', () => {
  assert.equal(english.entries.filter(x => x.source === 'editor').length, 44);
  assert.equal(english.entries.filter(x => x.source === 'machine-draft').length, 40);
  const studio = read('src/pages/MusicStudioPage.jsx');
  const video = read('src/components/MusicLyricsVideoStudio.jsx');
  assert.match(studio, /matchingMusicEnglishDraft\(assignmentKey, lyrics\)/);
  assert.match(video, /matchingMusicEnglishDraft\(assignmentKey,lyricText\)/);
  assert.match(studio, /Review meaning before publishing/);
});
