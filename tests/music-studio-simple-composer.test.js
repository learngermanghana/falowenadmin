import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/MusicStudioPage.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/pages/MusicStudioPage.css', import.meta.url), 'utf8');

test('primary music composer has Prompt and Saved Lyrics choices and one full-song action', () => {
  assert.match(page, /aria-label="Music creation modes"/);
  assert.match(page, />Prompt<\/button>/);
  assert.match(page, />Saved Lyrics<\/button>/);
  assert.match(page, /onSubmit=\{event => generate\(event, 'simple'\)\}/);
  assert.match(page, /className="music-simple-action"/);
  assert.match(page, /'✦ Generate music'/);
  assert.match(page, /const generationMode = simple \? 'song' : mode/);
  assert.match(page, /mode: 'song', durationSeconds: 150/);
  assert.match(styles, /\.music-create-tabs/);
  assert.match(styles, /\.music-simple-action \.music-generate/);
});

test('freeform prompts do not silently include lesson lyrics', () => {
  assert.match(page, /const usingLessonLyrics = simple \? composerTab === 'saved'/);
  assert.match(page, /brief: shortPrompt, lyrics: usingLessonLyrics \? lyrics : ''/);
  assert.match(page, /composerTab === 'prompt' \|\| Boolean\(lyrics.trim\(\)\)/);
});

test('saved lyrics remain editable and load from the existing lesson library', () => {
  assert.match(page, /id="music-saved-level"/);
  assert.match(page, /id="music-saved-day"/);
  assert.match(page, /id="music-saved-lesson"/);
  assert.match(page, /id="music-create-lyrics"/);
  assert.match(page, /loadSavedMusicLyrics\(assignmentKey\)/);
  assert.match(page, /onClick=\{\(\) => overwriteLyrics\(\)\}/);
});

test('advanced controls and video editor remain available but collapsed', () => {
  assert.match(page, /<details className="music-simple-extra">/);
  assert.match(page, /<summary>Advanced music controls<\/summary>/);
  assert.match(page, /<summary>Lyrics Video Studio<\/summary>/);
  assert.match(page, /<MusicLyricsVideoStudio/);
});

test('Music Generator and Lyrics Video Studio are visible, top-level workspaces', () => {
  assert.match(page, /id="music-generator-tab"/);
  assert.match(page, /id="music-video-tab"/);
  assert.match(page, /id="music-generator-panel" role="tabpanel"/);
  assert.match(page, /id="music-video-panel" role="tabpanel"/);
  assert.match(page, /onClick=\{\(\) => setStudioTab\('video'\)\}/);
  assert.match(page, /onClick=\{\(\) => setStudioTab\('generator'\)\}/);
  assert.doesNotMatch(page, /<summary>Lyrics Video Studio<\/summary>/);
});
