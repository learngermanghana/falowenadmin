import { useEffect, useRef, useState } from 'react';
import { prepareLessonSong } from '../services/lessonSongService.js';
import { lyricLines, songTime, hasCompleteSongTiming } from '../utils/songLyrics.js';
import useSongTiming from '../hooks/useSongTiming.js';
import SongTimingEditor from './SongTimingEditor.jsx';
import LessonSongLyrics from './LessonSongLyrics.jsx';
import './LessonSongStage.css';

export default function LessonSongStage({ song, mode = 'listen' }) {
  const audio = useRef(null);
  const request = useRef(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [time, setTime] = useState(0);
  const [cues, persistCues, recordedLyrics] = useSongTiming(song);
  const displaySong = {...song, lyrics:recordedLyrics};
  const [question, setQuestion] = useState(0);
  const [selected, setSelected] = useState(-1);
  const [reveal, setReveal] = useState(false);
  const [follow, setFollow] = useState(true);
  // "all" keeps the 3 activities on ONE projector slide with no navigation
  // out of the stage; separate legacy modes remain available unchanged.
  const [step, setStep] = useState('listen');
  const activeMode = mode === 'all' ? step : mode;
  const lines = lyricLines(recordedLyrics);
  const synchronized=hasCompleteSongTiming(cues,recordedLyrics);
  const item = (activeMode === 'speak' ? song.speaking : song.questions)[question];
  useEffect(() => () => { request.current?.abort(); }, []);
  async function load() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError('');
    try { const next = await prepareLessonSong(song, { signal: controller.signal }); if (!controller.signal.aborted) { setUrl(next); setTime(0); } }
    catch (e) { if (!controller.signal.aborted) setError(e.message); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function changeQuestion(next) { setQuestion(next); setReveal(false); setSelected(-1); }
  function chooseStep(next) { setStep(next); changeQuestion(0); }
  const evidenceIndex = item?.evidence ? lines.findIndex(line => lyricLines(item.evidence.replaceAll(' / ', '\n')).includes(line)) : -1;
  function seek(seconds) { if (audio.current) { audio.current.currentTime = seconds; setTime(seconds); } }
  return <section className="lesson-song-stage">
    <header><span>A1 · DAY 22 · KAPITEL 14.1</span><h1>{activeMode === 'listen' ? song.title : activeMode === 'questions' ? 'Das Lied verstehen' : 'Jetzt seid ihr dran'}</h1>
      <p>{activeMode === 'listen' ? 'Hört das Lied und lest mit. Welche Körperteile hört ihr?' : activeMode === 'questions' ? 'Antwortet zuerst. Zeigt danach die Lösung und die Textstelle.' : 'Sprecht zu zweit. Tauscht danach die Rollen.'}</p></header>
    {mode === 'all' && <div className="lesson-song-single-slide-tabs" role="group" aria-label="Falowen Musikübung">
      <button type="button" aria-pressed={step === 'listen'} className={step === 'listen' ? 'is-active' : ''} onClick={() => chooseStep('listen')}>1 · Hören</button>
      <button type="button" aria-pressed={step === 'questions'} className={step === 'questions' ? 'is-active' : ''} onClick={() => chooseStep('questions')}>2 · Fragen</button>
      <button type="button" aria-pressed={step === 'speak'} className={step === 'speak' ? 'is-active' : ''} onClick={() => chooseStep('speak')}>3 · Sprechen</button>
    </div>}
    <div className="lesson-song-controls">
      {!url ? <button type="button" onClick={load} disabled={busy}>{busy ? 'Lied wird geladen…' : '▶ Lied laden'}</button> : <>
        <audio ref={audio} src={url} controls preload="metadata" aria-label={song.title} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onSeeked={e => setTime(e.currentTarget.currentTime)} onError={() => setError('Die Aufnahme konnte nicht geladen werden. Bitte den Audiolink erneuern.')} />
        <button type="button" disabled={busy} onClick={load}>Audiolink erneuern</button>
      </>}
      {error && <p role="alert">{error}</p>}
    </div>
    <div className={`lesson-song-columns ${activeMode === 'listen' ? 'is-listen' : ''}`}>
      <div><div className="lesson-song-panel-heading"><strong>Liedtext</strong><label><input type="checkbox" disabled={!synchronized} checked={synchronized && follow} onChange={e => setFollow(e.target.checked)} /> Mitlesen folgen</label></div>
        <LessonSongLyrics song={displaySong} cues={cues} time={time} onSeek={url ? seek : undefined} follow={follow} />
        <p className="lesson-song-note">{cues.length === lines.length ? 'Zeilen mit Zeitmarken springen zur passenden Stelle im Lied.' : cues.length ? `${cues.length}/${lines.length} Zeilen synchronisiert. Weitere Zeitmarken können unten ergänzt werden.` : 'Der vollständige gespeicherte Liedtext ist sichtbar. Für die genaue Hervorhebung zuerst Zeitmarken zur Aufnahme setzen oder importieren.'}</p>
      </div>
      <div className="lesson-song-question">
        {activeMode === 'listen' ? <><span>HÖRAUFTRAG</span><h2>Wie geht es der Person?</h2><p>Hört zuerst die ganze Geschichte. Achtet auf Kopf, Bauch und Mias Hilfe.</p><div className="lesson-song-word-list"><b>der Kopf</b><b>der Bauch</b><b>das Fieber</b><b>die Hilfe</b></div><p>Danach: die Fragen zum Lied. Diese Übung wird nicht benotet.</p></> : <>
          <span>{activeMode === 'speak' ? 'SPRECHIMPULS' : 'FRAGE'} {question + 1} / {activeMode === 'speak' ? song.speaking.length : song.questions.length}</span><h2>{item.prompt}</h2>
          {item.options?.map((option, i) => <button type="button" key={option} className={`lesson-song-option ${selected === i ? 'is-selected' : ''}`} aria-pressed={selected === i} onClick={() => { setSelected(i); setReveal(false); }}>{String.fromCharCode(65 + i)} · {option}</button>)}
          <button type="button" disabled={activeMode === 'questions' && item.options?.length > 0 && selected < 0} onClick={() => setReveal(!reveal)}>{reveal ? 'Lösung verbergen' : activeMode === 'speak' ? 'Beispiel zeigen' : 'Lösung zeigen'}</button>
          {reveal && <aside className="lesson-song-answer"><strong>{activeMode === 'speak' ? item.model : `${item.options && selected === item.correctIndex ? 'Richtig! ' : ''}${item.answer}`}</strong>{item.evidence && <blockquote>{item.evidence}</blockquote>}<p>{item.explanation || item.teacherNote}</p>{evidenceIndex >= 0 && cues[evidenceIndex] && url && <button type="button" onClick={() => { seek(cues[evidenceIndex].start); audio.current?.play().catch(() => {}); }}>Textstelle ab {songTime(cues[evidenceIndex].start)} anhören</button>}</aside>}
          <nav aria-label="Fragen im Lied"><button type="button" disabled={question === 0} onClick={() => changeQuestion(question - 1)}>← Zurück</button><button type="button" disabled={question === (activeMode === 'speak' ? song.speaking : song.questions).length - 1} onClick={() => changeQuestion(question + 1)}>Weiter →</button></nav>
        </>}
      </div>
    </div>
    {activeMode === 'listen' && <SongTimingEditor song={displaySong} audio={audio} cues={cues} onSave={persistCues}/>}
  </section>;
}
