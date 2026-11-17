import test from 'node:test';
import assert from 'node:assert/strict';
import { SWAHILI_SONG_DRAFTS, getSwahiliSongDraft } from '../src/data/swahiliSongDrafts.js';

test('Swahili lesson music drafts cover A1 gaps and A2–B1 without changing recorded songs', () => {
  assert.equal(SWAHILI_SONG_DRAFTS.length, 73);
  assert.equal(SWAHILI_SONG_DRAFTS.filter(x=>x.level==='A1').length,17);
  assert.equal(SWAHILI_SONG_DRAFTS.filter(x=>x.level==='A2').length,28);
  assert.equal(SWAHILI_SONG_DRAFTS.filter(x=>x.level==='B1').length,28);
  for (const day of [1,5,6]) assert.equal(getSwahiliSongDraft('A1',day),null);
  assert.equal(new Set(SWAHILI_SONG_DRAFTS.map(x=>x.id)).size,73);
  for (const song of SWAHILI_SONG_DRAFTS) {
    assert.equal(song.status,'draft');
    assert.ok(song.topic && song.musicStyle);
    for(const marker of ['[Verse 1]','[Chorus]','[Verse 2]','[Final Chorus]','[Outro]']) assert.ok(song.lyrics.includes(marker),song.id);
    assert.ok(song.lyrics.split('\n').length>=20,song.id);
  }
});
