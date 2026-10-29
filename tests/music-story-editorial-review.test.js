import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getReusableSongDraft, getReusableSongDrafts } from '../src/data/reusableMusicSongbook.js';
import { musicStorySections, reviewMusicStory } from '../src/utils/musicStoryReview.js';
import { musicLessonContext } from '../src/utils/musicCourseContext.js';

const oldCafe = `[Verse 1]
Im Café sind wir zu zweit.
Zwei Tees stehen auf dem Tisch.
Die Uhr zeigt halb drei.
Die Rechnung kommt jetzt auch.

[Chorus]
Zwei Tees, vier Euro, danke.
Wie spät ist es? Halb drei.
Wir rechnen und wir lachen.

[Verse 2]
Mia kauft noch ein Stück Kuchen.
Das kostet drei Euro.
Wir zahlen sieben Euro.
Dann gehen wir nach Hause.

[Chorus]
Zwei Tees, vier Euro, danke.
Wie spät ist es? Halb drei.
Wir rechnen und wir lachen.

[Outro]
Ich kenne Zeit und Preise.
Bis morgen im Café!
Bei Falowen zählen wir zusammen.`;

test('Café A1 song now has urgency, a problem, support and meaningful outcome', () => {
  const song = getReusableSongDraft('A1-3.5');
  assert.equal(song.title, 'Die Rechnung im Café');
  assert.match(song.lyrics, /halb drei/);
  assert.match(song.lyrics, /Bus fährt um drei/);
  assert.match(song.lyrics, /vier Euro/);
  assert.match(song.lyrics, /drei Euro/);
  assert.match(song.lyrics, /sieben/);
  assert.match(song.lyrics, /mein Geld ist nicht da/);
  assert.match(song.lyrics, /Ich bezahle heute für uns/);
  assert.match(song.lyrics, /Bus steht noch da/);
  assert.match(song.lyrics, /ich bleibe noch bei dir/);
  assert.match(song.lyrics, /\[Bridge\]/);
  assert.doesNotMatch(song.lyrics, /Bei Falowen/);
  assert.ok(song.lyrics.trim().split(/\s+/).length <= 170);
  assert.equal(song.genre, 'German Pop');
});

test('all 84 endings stay in the story instead of marketing Falowen', () => {
  const songs = ['A1', 'A2', 'B1'].flatMap(level => getReusableSongDrafts(level));
  assert.equal(songs.length, 84);
  for (const song of songs) {
    const ending = musicStorySections(song.lyrics).Outro || '';
    assert.ok(ending, `Outro missing: ${song.assignmentKey}`);
    assert.doesNotMatch(ending, /Falowen/i, `Advertising ending: ${song.assignmentKey}`);
    assert.ok(song.lyrics.trim().split(/\s+/).length <= 170, `Song too long: ${song.assignmentKey}`);
  }
});

test('local reviewer detects an unmotivated price chant and branded outro', () => {
  const oldReview = reviewMusicStory(oldCafe);
  assert.match(oldReview.issues.join(' '), /advertisement/i);
  assert.match(oldReview.issues.join(' '), /numbers or prices/i);
  const newReview = reviewMusicStory(getReusableSongDraft('A1-3.5').lyrics);
  assert.equal(newReview.issues.length, 0);
  assert.equal(newReview.hasBridge, true);
  assert.equal(newReview.sectionCount, 5);
  assert.equal(newReview.stages.length, 5);
  assert.match(newReview.stages[2].text, /sieben/);
  assert.match(newReview.stages[3].text, /mein Geld ist nicht da/);
  assert.match(newReview.stages[4].text, /Haltestelle/);
});

test('music generator receives a five-step real-life plot request when rewriting café lyrics', () => {
  const context = musicLessonContext({
    level: 'A1', day: 8, assignmentKey: 'A1-3.5', chapter: '3',
    germanTitle: 'Zahlen und Preise im Café', englishTitle: 'Numbers and prices at the café',
  }, 'german', '', { songStyle: 'story', teacherLyricsProvided: true, rewriteFromLyrics: true });
  assert.match(context, /one coherent five-step adult story/i);
  assert.match(context, /A1 CAFÉ STORY SEED/);
  assert.match(context, /seven euros total/i);
  assert.match(context, /warm repeated refrain/i);
  assert.doesNotMatch(context, /STORYTELLING SONG — NOT A VOCABULARY LIST:[\s\S]*Vocabulary quiz/i);
});

test('Studio offers optional human review and an audio publishing checklist', () => {
  const page = readFileSync(new URL('../src/pages/MusicStudioPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /reviewMusicStory\(lyrics\)/);
  assert.match(page, /Storyline check · free, no music generation/);
  assert.match(page, /Read the five story moments/);
  assert.match(page, /Mark these lyrics reviewed/);
  assert.match(page, /reviewedLyrics\[reviewKey\] === lyrics/);
  assert.match(page, /Before publishing: listen and approve/);
  assert.match(page, /verify fresh timing after recording any revised lyrics/);
  assert.doesNotMatch(page, /setInterval\(/);
});
