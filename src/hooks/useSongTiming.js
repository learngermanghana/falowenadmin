import { useCallback, useEffect, useRef, useState } from 'react';
import { lyricLines, readSongCues, validateLyricCues } from '../utils/songLyrics.js';
const published = new Map();
export function validatePublishedTiming(data, song) {
  if (!data || data.objectKey !== (song?.objectKey || song?.audioKey)) return [];
  const lines = lyricLines(song?.lyrics);
  const cues = validateLyricCues(data.cues, lines);
  return lines.length && cues.length === lines.length ? cues : [];
}
export default function useSongTiming(song, { alignedTiming } = {}) {
  const id = song?.id || song?.trackId || '';
  const objectKey = song?.objectKey || song?.audioKey || '';
  const lyrics = song?.lyrics || '';
  const [cues, setCues] = useState([]);
  const edits = useRef(0);
  const [recordedPack, setRecordedPack] = useState(null);
  const displayLyrics = recordedPack?.objectKey === objectKey ? recordedPack.lyrics : lyrics;
  useEffect(() => {
    let cancelled = false;
    const bundledLyrics = alignedTiming?.objectKey === objectKey ? alignedTiming?.lyrics : null;
    const record = {id, objectKey, lyrics: bundledLyrics || lyrics};
    const revision = edits.current;
    const local = readSongCues(record);
    const bundled = validatePublishedTiming(alignedTiming, record);
    setCues(local.length ? local : bundled);
    setRecordedPack(bundled.length ? { ...alignedTiming, lyrics: record.lyrics, timingStatus: 'audio-aligned' } : null);
    if (!objectKey) return () => { cancelled = true; };
    if (!published.has(objectKey)) published.set(objectKey,
      fetch('https://www.falowen.app/api/music-lyrics?key=' + encodeURIComponent(objectKey), {cache:'no-cache'})
        .then(response => response.ok ? response.json() : null).then(data=>{if(!data)published.delete(objectKey);return data;}).catch(() => {published.delete(objectKey);return null;}));
    published.get(objectKey).then(data => {
      if (cancelled || edits.current !== revision) return;
      const recordedLyrics = typeof data?.lyrics === 'string' ? data.lyrics : lyrics;
      const recording = {...record, lyrics:recordedLyrics};
      const sameRecording = !data?.recordingSha256 || data.recordingSha256 === alignedTiming?.recordingSha256;
      if (bundledLyrics && bundled.length && sameRecording && data?.objectKey === objectKey &&
          (data?.referenceOnly || data?.transcriptionStatus === 'automatic' || data?.timingStatus === 'estimated')) return;
      const aligned = sameRecording ? validatePublishedTiming(alignedTiming, recording) : [];
      const estimated = data?.timingStatus === 'estimated';
      const publishedCues = estimated && alignedTiming ? [] : validatePublishedTiming(data, recording);
      const checked = publishedCues.length ? publishedCues : aligned;
      // Published text does not require line timing. Show the exact recording's
      // new lyrics even when its cue file is still untimed; never keep an older
      // songwriting draft merely because timestamps have not been added.
      if (data?.objectKey === objectKey && typeof data.lyrics === 'string' &&
          recordedLyrics.trim() && recordedLyrics.length <= 60000) {
        setRecordedPack({objectKey, lyrics:recordedLyrics,
          referenceOnly:data.referenceOnly===true,
          transcriptionStatus:data.transcriptionStatus,
          timingStatus:!publishedCues.length && aligned.length ? 'audio-aligned' : data.timingStatus,
          englishTranslation:data.englishTranslation || (aligned.length ? alignedTiming.englishTranslation : undefined)});
        const saved = readSongCues(recording);
        setCues(saved.length === lyricLines(recordedLyrics).length ? saved : checked);
      }
    });
    return () => { cancelled = true; };
  }, [id, objectKey, lyrics, alignedTiming]);
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
  return [cues, save, displayLyrics,recordedPack?.objectKey===objectKey?recordedPack:null];
}
