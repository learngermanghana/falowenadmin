// Snapshot of explicitly approved, published lesson audio from
// falowenexamtrainer/web/public/music/catalog.json (2026-10-28).
// This is NOT an exhaustive inventory of manually exported R2/MP3 tracks.
// Unlisted songs are treated as UNKNOWN, never automatically as unpublished.
const APPROVED_AUDIO_KEYS = Object.freeze([
  'A1-2',      // A1 Day 04 · Welche Nummer hast du?
  'A1-14.1',   // A1 Day 22 · Mein Kopf tut weh
  'A2-7.18',   // A2 Day 18 · Die Karte funktioniert nicht
]);

export function isKnownPublishedMusicLesson(assignmentKey) {
  return APPROVED_AUDIO_KEYS.includes(String(assignmentKey || '').trim().toUpperCase());
}

export function canUseNewMusicStoryDraft({ assignmentKey = '', confirmedNoAudio = false } = {}) {
  // Fail closed for known published songs. An unlisted song may still have
  // manually uploaded MP3s, so an affirmative human confirmation is essential.
  return Boolean(assignmentKey && confirmedNoAudio && !isKnownPublishedMusicLesson(assignmentKey));
}
