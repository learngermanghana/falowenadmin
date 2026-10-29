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
  const [recordedPack, setRecordedPack] = useState(null);
  const displayLyrics = recordedPack?.objectKey === objectKey ? recordedPack.lyrics : lyrics;
  useEffect(() => {
    let cancelled = false;
    const record = {id, objectKey, lyrics};
    const revision = edits.current;
    const local = readSongCues(record);
    setCues(local);
    setRecordedPack(null);
    if (!objectKey) return () => { cancelled = true; };
    if (!published.has(objectKey)) published.set(objectKey,
      fetch('https://www.falowen.app/api/music-lyrics?key=' + encodeURIComponent(objectKey), {cache:'no-cache'})
        .then(response => response.ok ? response.json() : null).then(data=>{if(!data)published.delete(objectKey);return data;}).catch(() => {published.delete(objectKey);return null;}));
    published.get(objectKey).then(data => {
      if (cancelled || edits.current !== revision) return;
      const recordedLyrics = typeof data?.lyrics === 'string' ? data.lyrics : lyrics;
      const recording = {...record, lyrics:recordedLyrics};
      const checked = validatePublishedTiming(data, recording);
      if (checked.length) {
        setRecordedPack({objectKey, lyrics:recordedLyrics});
        const saved = readSongCues(recording);
        setCues(saved.length === lyricLines(recordedLyrics).length ? saved : checked);
      }
    });
    return () => { cancelled = true; };
  }, [id, objectKey, lyrics]);
  useEffect(() => {
    function changed(event) {
      if (event.detail === objectKey) setCues(readSongCues({id,objectKey,lyrics:displayLyrics}));
    }
    window.addEventListener('falowen-song-cues-changed', changed);
    return () => window.removeEventListener('falowen-song-cues-changed', changed);
  }, [id,objectKey,displayLyrics]);
  const save = useCallback(next => {
    const checked = validateLyricCues(next, lyricLines(displayLyrics));
    if (checked.length !== next.length) return false;
    edits.current++;
    setCues(checked);
    try {
      localStorage.setItem(`falowen-song-timing:${objectKey}`, JSON.stringify({objectKey,cues:checked}));
      window.dispatchEvent(new CustomEvent('falowen-song-cues-changed', {detail:objectKey}));
      return true;
    } catch { return false; }
  }, [objectKey, displayLyrics]);
  return [cues, save, displayLyrics];
}
