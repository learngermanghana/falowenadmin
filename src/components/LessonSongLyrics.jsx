import { useEffect, useRef, useState } from 'react';
import { activeLyricIndex, lyricLines, songTime, validateLyricCues } from '../utils/songLyrics.js';
import { publishedVideoEnglish } from '../utils/musicLyricsVideo.js';
export default function LessonSongLyrics({ song, cues = [], time = 0, onSeek, follow = true }) {
  const lines = lyricLines(song.lyrics);
  const [showEnglish, setShowEnglish] = useState(true);
  const englishText = publishedVideoEnglish(song, song.objectKey || song.audioKey, song.lyrics);
  const english = englishText ? englishText.split('\n') : [];
  const hasEnglish = english.length === lines.length && lines.length > 0;
  const checked = validateLyricCues(cues, lines);
  const active = checked.length === lines.length && lines.length ? activeLyricIndex(checked, time) : -1;
  const root = useRef(null);
  useEffect(() => {
    const box = root.current;
    const line = box?.querySelector(`[data-line="${active}"]`);
    if (!follow || active < 0 || !line) return;
    const top = line.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (top < 0 || top + line.offsetHeight > box.clientHeight) {
      box.scrollTo({ top: box.scrollTop + top - box.clientHeight / 3, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }, [active, follow]);
  return <>
    {hasEnglish && <label className="lesson-song-english-toggle"><input type="checkbox"
      checked={showEnglish} onChange={event => setShowEnglish(event.target.checked)} /> English translation</label>}
    {hasEnglish && showEnglish && song.englishTranslation?.source === 'course-draft' &&
      <p className="lesson-song-note">English translation of the matching lyric draft · not reviewed against the recording.</p>}
    <div ref={root} className="lesson-song-lyrics" lang="de" aria-label="Liedtext">
    {lines.map((line, i) => <button key={i} type="button" data-line={i}
      className={i === active ? 'is-active' : ''} aria-current={i === active ? 'true' : undefined}
      disabled={!onSeek || !checked[i]} onClick={() => onSeek?.(checked[i].start)}>
      <small>{checked[i] ? songTime(checked[i].start) : String(i + 1).padStart(2, '0')}</small><span className="lesson-song-lyric-text"><span>{line}</span>
        {hasEnglish && showEnglish && <span className="lesson-song-english" lang="en">{english[i]}</span>}</span>
    </button>)}
  </div></>;
}
