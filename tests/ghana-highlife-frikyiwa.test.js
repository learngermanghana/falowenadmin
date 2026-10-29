import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableSongDraft, getReusableSongDrafts, musicDraftPackageText } from '../src/data/reusableMusicSongbook.js';
import { getStudioCourseCatalog } from '../src/utils/hoerenCourseCatalog.js';
import { suggestLessonMusicDirection } from '../src/utils/musicTopicStyle.js';
import { getMusicProductionProfile } from '../src/utils/musicProductionProfiles.js';
import { buildFalowenMusicPrompt } from '../src/utils/musicGenerationPrompt.js';

const HIGH_LIFE_SONGS = Object.freeze([
  ['A1', 'A1-4', 'Woher kommst du?', '92 BPM', 'Woher kommst du? Welche Sprache sprichst du?'],
  ['A2', 'A2-9.23', 'Mein Weg zur Arbeit', '94 BPM', 'Wie kommst du heute zur Arbeit?'],
  ['B1', 'B1-8.24', 'Weniger kaufen, mehr erleben', '91 BPM', 'Brauche ich das wirklich heute?'],
]);

test('only three deliberately chosen guitar-led course songs are labeled Ghanaian Highlife', () => {
  const all = ['A1', 'A2', 'B1'].flatMap(level => getReusableSongDrafts(level));
  const highlife = all.filter(song => song.genre === 'Ghanaian Highlife');
  assert.equal(highlife.length, HIGH_LIFE_SONGS.length);
  assert.deepEqual(new Set(highlife.map(song => song.assignmentKey)),
    new Set(HIGH_LIFE_SONGS.map(([, id]) => id)));
  assert.equal(all.length, 84, 'Retain the complete songbook');
  assert.equal(getReusableSongDraft('A1-14.1').genre, 'Acoustic Afro-Soul');
});

test('frikyiwa is a three-hit metallic percussion sound in the arrangement, never sung lyrics', () => {
  for (const [level, id, title, bpm, hook] of HIGH_LIFE_SONGS) {
    const song = getReusableSongDraft(id);
    assert.equal(song.title, title);
    assert.equal(song.genre, 'Ghanaian Highlife');
    assert.ok(song.musicStyle.startsWith(song.genre));
    assert.ok(song.musicStyle.includes(bpm));
    assert.match(song.musicStyle, /frikyiwa/i);
    assert.match(song.musicStyle, /three[- ](?:quick|short|hit)/i);
    assert.match(song.musicStyle, /ko-ko-ko/);
    assert.match(song.musicStyle, /syncopat/i);
    assert.match(song.musicStyle, /guitar/i);
    assert.match(song.musicStyle, /not (a )?conga/i);
    assert.match(song.musicStyle, /percussion.*behind.*(singer|vocal)|vocal.*above percussion/i);
    assert.ok(song.lyrics.includes(hook), `The approved German hook changed for ${id}`);
    assert.doesNotMatch(song.lyrics, /frikyiwa|ko-ko-ko/i, `Percussion should not be a sung syllable in ${id}`);
    const lesson = getStudioCourseCatalog(level).find(entry => entry.assignmentKey === id);
    assert.ok(lesson);
    const automaticallyMatched = suggestLessonMusicDirection(lesson, { preferredStyle: song.musicStyle });
    assert.ok(automaticallyMatched.includes(song.musicStyle));
    assert.equal(automaticallyMatched.split(song.musicStyle).length - 1, 1);
    assert.match(musicDraftPackageText(song, lesson), /Genre: Ghanaian Highlife/);
  }
});

test('Ghanaian highlife can also be selected for custom songs with no extra provider request', () => {
  const profile = getMusicProductionProfile('ghana-highlife');
  assert.equal(profile.id, 'ghana-highlife');
  assert.match(profile.direction, /frikyiwa/i);
  assert.match(profile.direction, /three short crisp offbeat taps/i);
  assert.match(profile.direction, /NOT a conga/i);
  assert.match(profile.direction, /Main four-bar progression: Gmaj7 – D\/F# – Em7 – Cadd9/);
  const song = getReusableSongDraft('A1-4');
  const prompt = buildFalowenMusicPrompt({
    brief: song.musicStyle, lyrics: song.lyrics, productionProfile: 'ghana-highlife',
    mode: 'song', durationSeconds: 150, backingLevel: 'very-soft',
  });
  assert.match(prompt, /SELECTED PRODUCTION PALETTE/);
  assert.match(prompt, /three short crisp offbeat taps/);
  assert.match(prompt, /VOICE FIRST/);
  assert.ok(prompt.includes(song.lyrics));
  assert.ok(prompt.length < 8000);
});
