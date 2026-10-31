import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';

test('A2 Day 10 uses the complete teacher-supplied Traveller song and exact uploaded R2 key',()=>{
  const song=getReusableSongDraft('A2-4.10');
  assert.equal(song.title,'Die Welt entdecken – The Traveller');
  assert.match(song.lyrics,/Morgen fliege ich nach Nigeria,/);
  assert.match(song.lyrics,/ich freue mich, bald bin ich da\./);
  assert.match(song.lyrics,/ich schaue mir die schönen Berge an\./);
  assert.match(song.lyrics,/doch Ghana bleibt mir immer nah\./);
  assert.match(song.lyrics,/Gott segne mein Heimatland\./);
  assert.equal((song.lyrics.match(/\[Chorus\]/g)||[]).length,2);
  assert.doesNotMatch(song.lyrics,/Wir besuchen heute eine neue Stadt/);
  const published=getCuratedMusicByAssignment('A2-4.10');
  assert.equal(published.status,'published');
  assert.equal(published.objectKey,'music/a2/day-10/Die Welt entdecken.mp3');
  assert.equal(published.title,song.title);
  assert.ok(published.audioUrl.includes(published.trackId));
});

test('Day 10 listening questions refer to the current song and old cloud drafts are ignored',()=>{
  const pack=getReusableMusicQuestions('A2-4.10');
  assert.equal(pack.questions[0].answer,'Nach Nigeria.');
  assert.equal(pack.questions[1].answer,'Ghana.');
  const page=readFileSync('src/pages/MusicStudioPage.jsx','utf8');
  assert.ok(page.includes("key === 'A2-4.10'"));
  assert.ok(page.includes("text.includes('Wir besuchen heute eine neue Stadt.')"));
  assert.ok(page.includes('New approved course lyrics are loaded'));
});
