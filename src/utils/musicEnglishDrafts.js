import musicEnglishDrafts from '../data/musicEnglishDrafts.json' with { type: 'json' };
import { publishedVideoEnglish } from './musicLyricsVideo.js';

// English is available only for the exact current German songbook lyric lines.
// An edited/replaced song must never inherit stale translations from an older recording.
export function sungMusicDraftLines(lyrics = '') {
  return String(lyrics || '').replace(/\\n/g, '\n').split(/\r?\n/)
    .map(line => line.trim()).filter(line => line && !/^\[.*\]$/.test(line));
}

export function matchingMusicEnglishDraft(assignmentKey, lyrics) {
  if (!assignmentKey || !lyrics) return null;
  const row = musicEnglishDrafts.entries.find(item =>
    String(item.assignmentKey).toUpperCase() === String(assignmentKey).trim().toUpperCase());
  if (!row || !Array.isArray(row.de) || !Array.isArray(row.en)) return null;
  const german = sungMusicDraftLines(lyrics);
  if (!german.length || german.length !== row.de.length || german.length !== row.en.length) return null;
  if (german.some((line, i) => line !== row.de[i] ||
      typeof row.en[i] !== 'string' || !row.en[i].trim())) return null;
  return { text: row.en.join('\n'), source: row.source, count: german.length };
}

// The published R2 translation wins when every sung line matches. Otherwise
// use the course's existing English draft only for its own exact German lyrics.
// This supports A1 Day 11 (A1-7), A1 Day 17 (A1-11), and other course songs
// without enabling stale translations after an audio/transcript replacement.
// The shared slide labels this fallback as not verified against the recording.
export function resolveTeachingSongEnglishTranslation({
  assignmentKey, objectKey, lyrics, publishedEnglish,
} = {}) {
  if (!objectKey || !assignmentKey) return null;
  if (publishedVideoEnglish({objectKey, englishTranslation:publishedEnglish}, objectKey, lyrics)) {
    return publishedEnglish;
  }
  const draft = matchingMusicEnglishDraft(String(assignmentKey).trim().toUpperCase(), lyrics);
  if (!draft) return null;
  const german = sungMusicDraftLines(lyrics);
  const english = draft.text.split('\n');
  return {source:'course-draft', lines:german.map((de,i)=>({de,en:english[i]}))};
}
