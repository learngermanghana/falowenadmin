import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MUSIC_PRODUCTION_PROFILES, getMusicProductionProfile } from '../src/utils/musicProductionProfiles.js';
import { buildFalowenMusicPrompt } from '../src/utils/musicGenerationPrompt.js';

test('production profiles are unique, chord-led, and free to inspect', () => {
  const ids = MUSIC_PRODUCTION_PROFILES.map(profile => profile.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['chill-808', 'piano-flute', 'neo-soul', 'afro-soul', 'piano-pop', 'melodic-house', 'anthemic-nostalgia', 'nostalgic-piano-pop', 'fingerstyle-guitar', 'guitar-piano-duet', 'guitar-neo-soul', 'afro-acoustic-guitar']) {
    const profile = getMusicProductionProfile(id);
    assert.equal(profile.id, id);
    assert.match(profile.direction, /progression:/i);
    assert.ok(profile.direction.length > 100);
  }
  assert.equal(getMusicProductionProfile('does-not-exist').id, 'auto');
});

test('chill 808 production permits low end without overwhelming German singing', () => {
  const lyrics = '[Verse 1] Mein Tag beginnt, die Sonne scheint.\n[Chorus] Gemeinsam schaffen wir das!';
  const prompt = buildFalowenMusicPrompt({ brief: 'German learning song', lyrics, productionProfile: 'chill-808', durationSeconds: 150, backingLevel: 'very-soft' });
  assert.match(prompt, /Dm9 – Bbmaj7 – Fmaj9 – Cadd9/);
  assert.match(prompt, /tuned, soft 808 sub-bass/);
  assert.match(prompt, /10–14 dB below the lead voice/);
  assert.match(prompt, /ADULT MUSICAL COMPOSITION/);
  assert.match(prompt, /USER-SUPPLIED LYRICS/);
  assert.ok(prompt.includes(lyrics));
});

test('nostalgic piano and anthem profiles favor developing songs, no forced rhyme', () => {
  for (const id of ['anthemic-nostalgia', 'nostalgic-piano-pop']) {
    const profile = getMusicProductionProfile(id);
    const prompt = buildFalowenMusicPrompt({ brief: profile.direction, productionProfile: id, lyrics: '[Verse 1] Ich denke an dich.\n[Outro] Bis bald.' });
    assert.match(prompt, /resolved final refrain/);
    assert.match(prompt, /complete every sung word/i);
    assert.match(prompt, /piano/i);
    assert.match(prompt, /not a nursery rhyme/);
    assert.doesNotMatch(prompt, /aggressive trap drops or rapid hi-hat rolls/);
  }
});

test('invalid profile does not dispatch a paid music request', () => {
  assert.throws(() => buildFalowenMusicPrompt({ brief: 'nice song', productionProfile: 'mystery' }), /Invalid music production profile/);
});

test('Studio UI applies the selected palette to generation, copy and text exports', () => {
  const page = readFileSync(new URL('../src/pages/MusicStudioPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /id="music-production"/);
  assert.match(page, /MUSIC_PRODUCTION_PROFILES\.map/);
  assert.match(page, /brief: productionBrief/);
  assert.match(page, /musicStyle: productionBrief/);
  assert.match(page, /clipboard\.writeText\(productionBrief\)/);
  assert.match(page, /productionProfile \}\)/);
});

test('guitar styles use mature arrangements and expressive chord motion', () => {
  const ideas = ['fingerstyle-guitar', 'guitar-piano-duet', 'guitar-neo-soul', 'afro-acoustic-guitar'];
  for (const id of ideas) {
    const direction = getMusicProductionProfile(id).direction;
    assert.match(direction, /guitar/i);
    assert.match(direction, /progression:/i);
    assert.match(direction, /chorus/i);
    assert.match(direction, /no nursery|no child|adult|not a children/i);
    const prompt = buildFalowenMusicPrompt({ brief: direction, productionProfile: id, mode: 'song', durationSeconds: 150 });
    assert.match(prompt, /ADULT MUSICAL COMPOSITION/);
    assert.match(prompt, /not a nursery rhyme/);
    assert.match(prompt, /forced end-word rhymes/);
    assert.match(prompt, /harmonic/);
    assert.ok(prompt.length <= 8000);
  }
});

test('instrumental guitar songs contain no voice directions or lyrics', () => {
  const p = getMusicProductionProfile('fingerstyle-guitar');
  const prompt = buildFalowenMusicPrompt({ brief: p.direction, productionProfile: p.id, vocalMode: 'instrumental', mode: 'song' });
  assert.match(prompt, /INSTRUMENTAL ONLY: no singer/);
  assert.match(prompt, /Dadd9 – A\/C# – Bm7 – Gmaj7/);
  assert.doesNotMatch(prompt, /USER-SUPPLIED LYRICS/);
  const page = readFileSync(new URL('../src/pages/MusicStudioPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /lyrics: vocalMode === 'instrumental' \? '' : lyrics/);
  assert.match(page, /instrumentalOnly: vocalMode === 'instrumental'/);
  assert.match(page, /Acoustic guitar song/);
  assert.match(page, /setProductionProfile\(id === 'instrumental' \? 'fingerstyle-guitar'/);
});
