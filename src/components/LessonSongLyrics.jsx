import { useCallback, useEffect, useRef, useState } from 'react';
import { activeLyricIndex, lyricLines, songTime, validateLyricCues } from '../utils/songLyrics.js';
import { publishedVideoEnglish } from '../utils/musicLyricsVideo.js';
export default function LessonSongLyrics({ song, audioRef, cues = [], time = 0, onSeek, follow = true, language = "de", label = "Liedtext" }) {
  const lines = lyricLines(song.lyrics);
  const [showEnglish, setShowEnglish] = useState(language === "de");
  const englishText = publishedVideoEnglish(song, song.objectKey || song.audioKey, song.lyrics);
  const english = englishText ? englishText.split('\n') : [];
  const hasEnglish = english.length === lines.length && lines.length > 0;
  const checked = validateLyricCues(cues, lines);
  const active = checked.length === lines.length && lines.length ? activeLyricIndex(checked, time) : -1;
  const [focus, setFocus] = useState(null);
  const closeFocus = useCallback(() => setFocus(null), []);
  const isSwahili = language === 'sw';
  const root = useRef(null);
  function explain() {
    const player = audioRef?.current;
    if (!player) return;
    const index = activeLyricIndex(checked, player.currentTime);
    if (index < 0 || player.ended) return;
    const cue = checked[index];
    const end = cue.end ?? checked[index + 1]?.start ?? player.duration;
    if (!Number.isFinite(end) || end <= cue.start) return;
    player.pause();
    setFocus({player, index, start: cue.start, end});
  }
  useEffect(() => {
    const box = root.current;
    const line = box?.querySelector(`[data-line="${active}"]`);
    if (!follow || active < 0 || !line) return;
    const top = line.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (top < 0 || top + line.offsetHeight > box.clientHeight) {
      box.scrollTo({ top: box.scrollTop + top - box.clientHeight / 3, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }, [active, follow, focus]);
  if (focus) return <FocusedLyric focus={focus} line={lines[focus.index]} english={english[focus.index]}
    language={language} onClose={closeFocus} />;
  return <>
    {audioRef && checked.length === lines.length && checked.length > 0 &&
      <button type="button" className="lesson-song-explain" disabled={!onSeek || active < 0}
        onClick={explain}>{isSwahili ? 'Eleza mstari huu' : 'Diese Zeile erklären'}</button>}
    {hasEnglish && <label className="lesson-song-english-toggle"><input type="checkbox"
      checked={showEnglish} onChange={event => setShowEnglish(event.target.checked)} /> English translation</label>}
    {hasEnglish && showEnglish && song.englishTranslation?.source === 'course-draft' &&
      <p className="lesson-song-note">English translation of the matching lyric draft · not reviewed against the recording.</p>}
    <div ref={root} className="lesson-song-lyrics" lang={language} aria-label={label}>
    {lines.map((line, i) => <button key={i} type="button" data-line={i}
      className={i === active ? 'is-active' : ''} aria-current={i === active ? 'true' : undefined}
      disabled={!onSeek || !checked[i]} onClick={() => onSeek?.(checked[i].start)}>
      <small>{checked[i] ? songTime(checked[i].start) : String(i + 1).padStart(2, '0')}</small><span className="lesson-song-lyric-text"><span>{line}</span>
        {hasEnglish && showEnglish && <span className="lesson-song-english" lang="en">{english[i]}</span>}</span>
    </button>)}
  </div></>;
}

function FocusedLyric({ focus, line, english, language, onClose }) {
  const {player, start, end} = focus;
  const replaying = useRef(false);
  const [playError, setPlayError] = useState(false);
  const sw = language === 'sw';

  useEffect(() => {
    function stopAtEnd() {
      if (!replaying.current || player.currentTime < end) return;
      replaying.current = false;
      player.pause();
      player.currentTime = end;
    }
    let frame;
    function checkFrame() {
      stopAtEnd();
      if (replaying.current && !player.paused) frame = window.requestAnimationFrame?.(checkFrame);
    }
    function onPlay() {
      if (!replaying.current) return onClose();
      window.cancelAnimationFrame?.(frame);
      checkFrame();
    }
    player.addEventListener('play', onPlay);
    player.addEventListener('timeupdate', stopAtEnd);
    return () => {
      window.cancelAnimationFrame?.(frame);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('timeupdate', stopAtEnd);
      if (replaying.current) player.pause();
    };
  }, [player, end, onClose]);

  function play(replay) {
    setPlayError(false);
    replaying.current = replay;
    player.currentTime = replay ? start : end;
    if (!replay && end >= player.duration) {
      player.pause();
      onClose();
      return;
    }
    player.play().then(() => {
      if (!replay) onClose();
    }).catch(() => setPlayError(true));
  }
  return <section className="lesson-song-focused" lang={language}>
    <p className="lesson-song-focused-line">{line}</p>
    {english && <p lang="en">{english}</p>}
    <div>
      <button type="button" onClick={() => play(true)}>{sw ? 'Rudia mstari' : 'Zeile wiederholen'}</button>
      <button type="button" onClick={() => play(false)}>{sw ? 'Endelea na wimbo' : 'Lied fortsetzen'}</button>
    </div>
    {playError && <p role="alert">{sw ? 'Imeshindikana kucheza. Jaribu tena.' : 'Wiedergabe fehlgeschlagen. Bitte erneut versuchen.'}</p>}
  </section>;
}
