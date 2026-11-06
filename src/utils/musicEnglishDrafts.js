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
    item.assignmentKey === String(assignmentKey).trim());
  if (!row || !Array.isArray(row.de) || !Array.isArray(row.en)) return null;
  const german = sungMusicDraftLines(lyrics);
  if (!german.length || german.length !== row.de.length || german.length !== row.en.length) return null;
  if (german.some((line, i) => line !== row.de[i] ||
      typeof row.en[i] !== 'string' || !row.en[i].trim())) return null;
  return { text: row.en.join('\n'), source: row.source, count: german.length };
}

// A1 Day 11's 44-line course translation can serve the teaching slide even when
// its published R2 lyrics sidecar has German but no English. Never attach a draft
// to a different transcript, and always prefer exact published translations.
export function resolveTeachingSongEnglishTranslation({
  assignmentKey, objectKey, lyrics, publishedEnglish,
} = {}) {
  if (publishedVideoEnglish({objectKey, englishTranslation:publishedEnglish}, objectKey, lyrics)) {
    return publishedEnglish;
  }
  if (String(assignmentKey || '').trim().toUpperCase() !== 'A1-7') return null;
  const draft = matchingMusicEnglishDraft('A1-7', lyrics);
  if (!draft) return null;
  const german = sungMusicDraftLines(lyrics);
  const english = draft.text.split('\n');
  return {source:'course-draft', lines:german.map((de,i)=>({de,en:english[i]}))};
}
