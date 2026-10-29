// Prompt shaping only: Google mixes the finished MP3, so this is a mixing
// instruction, not an actual post-generation change to independent stems.
import { getMusicProductionProfile } from './musicProductionProfiles.js';

const FULL_DURATIONS = Object.freeze([120, 150, 180]);
const WORD_LIMITS = Object.freeze({ 120: 130, 150: 170, 180: 210 });
const countWords = text => String(text || "").trim().split(/\s+/).filter(Boolean).length;
export function musicLyricLimit(mode = "song", durationSeconds = 150) {
  return mode === "clip" ? 32 : WORD_LIMITS[durationSeconds] || WORD_LIMITS[150];
}
export function buildFalowenMusicPrompt({
  brief = "", context = "", lyrics = "", mode = "song",
  durationSeconds = 150, vocalMode = "voice", backingLevel = "soft", lyricTreatment = "exact", productionProfile = "auto",
} = {}) {
  if (!["clip", "song"].includes(mode)) throw new Error("Choose a 30-second preview or a full song.");
  if (!["voice", "instrumental"].includes(vocalMode)) throw new Error("Choose vocals or instrumental.");
  if (!["soft", "very-soft"].includes(backingLevel)) throw new Error("Invalid backing level.");
  if (!["exact", "story-source"].includes(lyricTreatment)) throw new Error("Invalid lyrics treatment.");
  const production = getMusicProductionProfile(productionProfile);
  if (production.id !== productionProfile) throw new Error("Invalid music production profile.");
  if (mode === "song" && !FULL_DURATIONS.includes(durationSeconds)) throw new Error("Choose a full-song duration of 2, 2½ or 3 minutes.");
  const cleanBrief = String(brief).trim(), cleanLyrics = String(lyrics).trim(), cleanContext = String(context).trim();
  if (!cleanBrief) throw new Error("Add your music direction first.");
  if (vocalMode === "instrumental" && cleanLyrics) throw new Error("Instrumental music cannot use sung lyrics. Choose Vocals to include your text.");
  const limit = musicLyricLimit(mode, durationSeconds), words = countWords(cleanLyrics);
  // Even source notes are bounded before a paid generation to avoid bloated prompts.
  if (words > limit) throw new Error(`Lyrics contain ${words} words; use at most ${limit} for this duration so the final lines have room to finish. Shorten the lyrics or choose a longer song before generating.`);
  const modernLowEnd = production.id === "chill-808" || /\b808\b|sub.?bass|lo-fi hip.hop/i.test(cleanBrief);
  const lowEnd = modernLowEnd
    ? "Allow tuned, soft 808 sub-bass, restrained kick, rim and hi-hats with a comfortable pocket; avoid distorted sub, aggressive trap drops or any bass that masks German speech."
    : "Use controlled warm bass and restrained percussion; avoid booming bass drops.";
  const vocalDirection = vocalMode === "instrumental"
    ? "INSTRUMENTAL ONLY: no singer, spoken words, humming, choir or vocal samples. Keep the piano, flute and other lead instruments balanced."
    : `VOICE FIRST: a single intimate, articulate lead singer must remain clearly audible at every moment, particularly German consonants and English explanations. Mix instruments ${backingLevel === "very-soft" ? "very softly, approximately 10–14 dB below the lead voice" : "softly, approximately 7–10 dB below the lead voice"}. ${lowEnd} Avoid competing instrumental solos during lyrics, layered choirs, heavy reverb and distorted vocals. Piano and flute should answer the singer between phrases, not drown out the voice.`;
  const harmonicDirection = "ADULT MUSICAL COMPOSITION: Make a credible, fully produced contemporary song, not a nursery rhyme, children's chant, vocabulary jingle or repetitive sing-song exercise. Let even beginner German sit in a mature melody with natural adult phrasing. Avoid forced end-word rhymes, over-repeated word drills, toy-like chimes, bouncy preschool melodies, cartoon vocals and primary-school call-and-response. Favor an expressive guitar or piano motif, believable lyrical emotion and intentional progression between sections. Use a deliberate four-bar chord progression, tasteful seventh/ninth/add9 voicings when appropriate, smooth inversions, convincing bass-root motion, melodic tension and release. Honor any specified key, tempo and chord changes in the production direction. Start sparsely, develop an intimate verse, build a distinct chorus, vary the second verse, add a short instrumental/harmonic turnaround or bridge when there is room, then a resolved final refrain. Changes of piano voicing, flute countermelody and rhythm should create real musical growth. Do not invent extra lyrics when the teacher supplies exact lyrics.";
  const arrangement = mode === "clip"
    ? "Create a 30-second preview, not a full song. 0:00–0:04 gentle opening, 0:04–0:22 clear main phrase, 0:22–0:30 finish the phrase, resolve the final chord and allow a short fade. Never stop mid-word or mid-beat."
    : `Create a cohesive, approximately ${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")} song, never a looping excerpt. 0:00–0:08 short instrumental introduction; enter vocals early if present. Keep verses concise, place the final chorus well before the end. Reserve the last 20 seconds for a distinct OUTRO: complete every sung word by about ${Math.floor((durationSeconds - 18) / 60)}:${String((durationSeconds - 18) % 60).padStart(2, "0")}; then finish the melody, resolve to a final sustained chord, let the chord decay naturally and add a smooth 6–10 second fade to silence. Do not abruptly truncate a lyric, chorus, sustained note or instrumental phrase. It is better to omit an extra verse than to cut the ending.`;
  const prompt = [
    cleanBrief,
    production.id !== "auto" && !cleanBrief.includes(production.direction) ? `SELECTED PRODUCTION PALETTE: ${production.direction}` : "",
    cleanContext,
    harmonicDirection,
    "PRODUCTION AND MIXING REQUIREMENTS:",
    vocalDirection,
    "TIMING AND COMPLETE ENDING:",
    arrangement,
    `Keep generated sung lyrics to no more than approximately ${limit} words. If the supplied words are longer than the available melody, do not rush or squeeze syllables; use a shorter arrangement with a complete outro.`,
    cleanLyrics
      ? lyricTreatment === "story-source"
        ? `TEACHER VOCABULARY / OLD LYRICS TO ADAPT INTO A NEW STORY (these are reference material, not fixed lyrics):\n${cleanLyrics}\nExtract suitable vocabulary and simple situations; compose fresh, naturally connected story lyrics at the lesson CEFR level. Do not recite the reference line-by-line or sing control markers such as [[A0]], [[B1]], or [:]. Avoid mechanically repeating parenthesized English glossary translations. Correct awkward German examples while preserving the learning meaning.`
        : `USER-SUPPLIED LYRICS (preserve language and pronunciation; build a full ending rather than cutting the final line):\n${cleanLyrics}`
      : vocalMode === "instrumental"
        ? "Compose instrumental melody and chord movement only. No lyrics, words, spoken dialogue, humming or sampled human vocals."
        : "Write concise original lyrics with a complete last refrain and an explicit [Outro] section.",
  ].filter(Boolean).join("\n\n");
  if (prompt.length > 8000) throw new Error("Your combined music direction and lyrics exceed 8,000 characters. Shorten the music direction or lyrics.");
  return prompt;
}
