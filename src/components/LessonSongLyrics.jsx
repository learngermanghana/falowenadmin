import { useEffect, useRef } from 'react';
import { activeLyricIndex, lyricLines, songTime } from '../utils/songLyrics.js';
export default function LessonSongLyrics({ song, cues = [], time = 0, onSeek, follow = true }) {
  const active = cues.length === lyricLines(song.lyrics).length ? activeLyricIndex(cues, time) : -1;
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
  return <div ref={root} className="lesson-song-lyrics" lang="de" aria-label="Liedtext">
    {lyricLines(song.lyrics).map((line, i) => <button key={i} type="button" data-line={i}
      className={i === active ? 'is-active' : ''} aria-current={i === active ? 'true' : undefined}
      disabled={!onSeek || !cues[i]} onClick={() => onSeek?.(cues[i].start)}>
      <small>{cues[i] ? songTime(cues[i].start) : String(i + 1).padStart(2, '0')}</small><span>{line}</span>
    </button>)}
  </div>;
}
