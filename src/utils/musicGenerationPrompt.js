// Prompt shaping only: Google mixes the finished MP3, so this is a mixing
// instruction, not an actual post-generation change to independent stems.
const FULL_DURATIONS = Object.freeze([120, 150, 180]);
const WORD_LIMITS = Object.freeze({ 120: 130, 150: 170, 180: 210 });
const countWords = text => String(text || "").trim().split(/\s+/).filter(Boolean).length;
export function musicLyricLimit(mode = "song", durationSeconds = 150) {
  return mode === "clip" ? 32 : WORD_LIMITS[durationSeconds] || WORD_LIMITS[150];
}
export function buildFalowenMusicPrompt({
  brief = "", context = "", lyrics = "", mode = "song",
  durationSeconds = 150, vocalMode = "voice", backingLevel = "soft",
} = {}) {
  if (!["clip", "song"].includes(mode)) throw new Error("Choose a 30-second preview or a full song.");
  if (!["voice", "instrumental"].includes(vocalMode)) throw new Error("Choose vocals or instrumental.");
  if (!["soft", "very-soft"].includes(backingLevel)) throw new Error("Invalid backing level.");
  if (mode === "song" && !FULL_DURATIONS.includes(durationSeconds)) throw new Error("Choose a full-song duration of 2, 2½ or 3 minutes.");
  const cleanBrief = String(brief).trim(), cleanLyrics = String(lyrics).trim(), cleanContext = String(context).trim();
  if (!cleanBrief) throw new Error("Add your music direction first.");
  if (vocalMode === "instrumental" && cleanLyrics) throw new Error("Instrumental music cannot use sung lyrics. Choose Vocals to include your text.");
  const limit = musicLyricLimit(mode, durationSeconds), words = countWords(cleanLyrics);
  if (words > limit) throw new Error(`Lyrics contain ${words} words; use at most ${limit} for this duration so the final lines have room to finish. Shorten the lyrics or choose a longer song before generating.`);
  const vocalDirection = vocalMode === "instrumental"
    ? "INSTRUMENTAL ONLY: no singer, spoken words, humming, choir or vocal samples. Keep the arrangement gentle and uncluttered."
    : `VOICE FIRST: a single intimate, articulate lead singer must remain clearly audible at every moment, particularly German consonants and English explanations. Mix instruments ${backingLevel === "very-soft" ? "very softly, approximately 10–14 dB below the lead voice" : "softly, approximately 7–10 dB below the lead voice"}. Avoid loud drums, bass drops, layered choirs, competing lead instruments, heavy reverb, distorted or compressed vocals. Duck the accompaniment further whenever words are sung. The lyrics and melody take priority over instrumental solos.`;
  const arrangement = mode === "clip"
    ? "Create a 30-second preview, not a full song. 0:00–0:04 gentle opening, 0:04–0:22 clear main phrase, 0:22–0:30 finish the phrase, resolve the final chord and allow a short fade. Never stop mid-word or mid-beat."
    : `Create a cohesive, approximately ${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")} song, never a looping excerpt. 0:00–0:08 short instrumental introduction; enter vocals early if present. Keep verses concise, place the final chorus well before the end. Reserve the last 20 seconds for a distinct OUTRO: complete every sung word by about ${Math.floor((durationSeconds - 18) / 60)}:${String((durationSeconds - 18) % 60).padStart(2, "0")}; then finish the melody, resolve to a final sustained chord, let the chord decay naturally and add a smooth 6–10 second fade to silence. Do not abruptly truncate a lyric, chorus, sustained note or instrumental phrase. It is better to omit an extra verse than to cut the ending.`;
  const prompt = [
    cleanBrief,
    cleanContext,
    "PRODUCTION AND MIXING REQUIREMENTS:",
    vocalDirection,
    "TIMING AND COMPLETE ENDING:",
    arrangement,
    `Keep generated sung lyrics to no more than approximately ${limit} words. If the supplied words are longer than the available melody, do not rush or squeeze syllables; use a shorter arrangement with a complete outro.`,
    cleanLyrics ? `USER-SUPPLIED LYRICS (preserve language and pronunciation; build a full ending rather than cutting the final line):\n${cleanLyrics}` : "Write concise original lyrics with a complete last refrain and an explicit [Outro] section, unless instrumental-only.",
  ].filter(Boolean).join("\n\n");
  if (prompt.length > 8000) throw new Error("Your combined music direction and lyrics exceed 8,000 characters. Shorten the music direction or lyrics.");
  return prompt;
}
