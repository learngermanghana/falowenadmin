import { useCallback, useEffect, useRef, useState } from 'react';
import { lyricLines, readSongCues, validateLyricCues } from '../utils/songLyrics.js';
const published = new Map();
export function validatePublishedTiming(data, song) {
  if (data?.objectKey !== (song?.objectKey || song?.audioKey)) return [];
  const lines = lyricLines(song?.lyrics);
  const cues = validateLyricCues(data.cues, lines);
  return lines.length && cues.length === lines.length ? cues : [];
}
export default function useSongTiming(song) {
  const id = song?.id || song?.trackId || '';
  const objectKey = song?.objectKey || song?.audioKey || '';
  const lyrics = song?.lyrics || '';
  const [cues, setCues] = useState([]);
  const edits = useRef(0);
  useEffect(() => {
    let cancelled = false;
    const record = {id, objectKey, lyrics};
    const revision = edits.current;
    const local = readSongCues(record);
    setCues(local);
    if (!objectKey || !lyrics) return () => { cancelled = true; };
    if (!published.has(objectKey)) published.set(objectKey,
      fetch('https://www.falowen.app/api/music-lyrics?key=' + encodeURIComponent(objectKey), {cache:'no-cache'})
        .then(response => response.ok ? response.json() : null).catch(() => null));
    published.get(objectKey).then(data => {
      if (cancelled || edits.current !== revision) return;
      const checked = validatePublishedTiming(data, record);
      // A complete teacher edit on this device takes precedence over publication.
      if (checked.length && local.length !== lyricLines(lyrics).length) setCues(checked);
    });
    function changed(event) { if (event.detail === objectKey) setCues(readSongCues(record)); }
    window.addEventListener('falowen-song-cues-changed', changed);
    return () => { cancelled = true; window.removeEventListener('falowen-song-cues-changed', changed); };
  }, [id, objectKey, lyrics]);
  const save = useCallback(next => {
    const checked = validateLyricCues(next, lyricLines(lyrics));
    if (checked.length !== next.length) return false;
    edits.current++;
    setCues(checked);
    try {
      localStorage.setItem(`falowen-song-timing:${objectKey}`, JSON.stringify({objectKey,cues:checked}));
      window.dispatchEvent(new CustomEvent('falowen-song-cues-changed', {detail:objectKey}));
      return true;
    } catch { return false; }
  }, [id, objectKey, lyrics]);
  return [cues, save];
}
