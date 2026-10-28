import { useEffect, useRef, useState } from 'react';
import { prepareLessonSong } from '../services/lessonSongService.js';
import { lyricLines, readSongCues, validateLyricCues, songTime } from '../utils/songLyrics.js';
import LessonSongLyrics from './LessonSongLyrics.jsx';
import './LessonSongStage.css';

export default function LessonSongStage({ song, mode = 'listen' }) {
  const audio = useRef(null);
  const request = useRef(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [time, setTime] = useState(0);
  const [cues, setCues] = useState(() => readSongCues(song));
  const [question, setQuestion] = useState(0);
  const [selected, setSelected] = useState(-1);
  const [reveal, setReveal] = useState(false);
  const [follow, setFollow] = useState(true);
  const lines = lyricLines(song.lyrics);
  const item = (mode === 'speak' ? song.speaking : song.questions)[question];
  useEffect(() => () => { request.current?.abort(); }, []);
  async function load() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError('');
    try { const next = await prepareLessonSong(song, { signal: controller.signal }); if (!controller.signal.aborted) { setUrl(next); setTime(0); } }
    catch (e) { if (!controller.signal.aborted) setError(e.message); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function saveCues(next) {
    setCues(next);
    try { localStorage.setItem(`falowen-song-cues:${song.id}`, JSON.stringify({ objectKey: song.objectKey, cues: next })); }
    catch { setError('Zeitmarken konnten nicht auf diesem Gerät gespeichert werden. Bitte exportieren.'); }
  }
  function markNext() {
    const raw = audio.current?.currentTime;
    const start = Number.isFinite(raw) ? Math.round(raw * 100) / 100 : NaN;
    if (!Number.isFinite(start) || cues.length >= lines.length) return;
    if (cues.length && start <= cues[cues.length - 1].start) { setError('Die nächste Zeile muss nach der vorherigen Zeitmarke beginnen.'); return; }
    setError(''); saveCues([...cues, { start: Math.round(start * 100) / 100, text: lines[cues.length] }]);
  }
  async function importCues(event) {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 100000) throw new Error();
      const data = JSON.parse(await file.text());
      const checked = validateLyricCues(data.cues, lines);
      if (data.objectKey !== song.objectKey || !checked.length) throw new Error();
      saveCues(checked); setError('');
    } catch { setError('Diese Zeitmarken passen nicht zu diesem Liedtext und dieser Aufnahme.'); }
    event.target.value = '';
  }
  function exportCues() {
    const blob = new Blob([JSON.stringify({ trackId: song.id, objectKey: song.objectKey, cues }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob), link = document.createElement('a'); link.href = href; link.download = `${song.id}-lyrics-timing.json`; link.click(); URL.revokeObjectURL(href);
  }
  function changeQuestion(next) { setQuestion(next); setReveal(false); setSelected(-1); }
  const evidenceIndex = item?.evidence ? lines.findIndex(line => lyricLines(item.evidence.replaceAll(' / ', '\n')).includes(line)) : -1;
  function seek(seconds) { if (audio.current) { audio.current.currentTime = seconds; setTime(seconds); } }
  return <section className="lesson-song-stage">
    <header><span>A1 · DAY 22 · KAPITEL 14.1</span><h1>{mode === 'listen' ? song.title : mode === 'questions' ? 'Das Lied verstehen' : 'Jetzt seid ihr dran'}</h1>
      <p>{mode === 'listen' ? 'Hört das Lied und lest mit. Welche Körperteile hört ihr?' : mode === 'questions' ? 'Antwortet zuerst. Zeigt danach die Lösung und die Textstelle.' : 'Sprecht zu zweit. Tauscht danach die Rollen.'}</p></header>
    <div className="lesson-song-controls">
      {!url ? <button type="button" onClick={load} disabled={busy}>{busy ? 'Lied wird geladen…' : '▶ Lied laden'}</button> : <>
        <audio ref={audio} src={url} controls preload="metadata" aria-label={song.title} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onSeeked={e => setTime(e.currentTarget.currentTime)} onError={() => setError('Die Aufnahme konnte nicht geladen werden. Bitte den Audiolink erneuern.')} />
        <button type="button" disabled={busy} onClick={load}>Audiolink erneuern</button>
      </>}
      {error && <p role="alert">{error}</p>}
    </div>
    <div className={`lesson-song-columns ${mode === 'listen' ? 'is-listen' : ''}`}>
      <div><div className="lesson-song-panel-heading"><strong>Liedtext</strong><label><input type="checkbox" checked={follow} onChange={e => setFollow(e.target.checked)} /> Mitlesen folgen</label></div>
        <LessonSongLyrics song={song} cues={cues} time={time} onSeek={url ? seek : undefined} follow={follow} />
        <p className="lesson-song-note">{cues.length === lines.length ? 'Zeilen mit Zeitmarken springen zur passenden Stelle im Lied.' : cues.length ? `${cues.length}/${lines.length} Zeilen synchronisiert. Weitere Zeitmarken können unten ergänzt werden.` : 'Der vollständige gespeicherte Liedtext ist sichtbar. Für die genaue Hervorhebung zuerst Zeitmarken zur Aufnahme setzen oder importieren.'}</p>
      </div>
      <div className="lesson-song-question">
        {mode === 'listen' ? <><span>HÖRAUFTRAG</span><h2>Wie geht es der Person?</h2><p>Hört zuerst die ganze Geschichte. Achtet auf Kopf, Bauch und Mias Hilfe.</p><div className="lesson-song-word-list"><b>der Kopf</b><b>der Bauch</b><b>das Fieber</b><b>die Hilfe</b></div><p>Danach: die Fragen zum Lied. Diese Übung wird nicht benotet.</p></> : <>
          <span>{mode === 'speak' ? 'SPRECHIMPULS' : 'FRAGE'} {question + 1} / {mode === 'speak' ? song.speaking.length : song.questions.length}</span><h2>{item.prompt}</h2>
          {item.options?.map((option, i) => <button type="button" key={option} className={`lesson-song-option ${selected === i ? 'is-selected' : ''}`} aria-pressed={selected === i} onClick={() => { setSelected(i); setReveal(false); }}>{String.fromCharCode(65 + i)} · {option}</button>)}
          <button type="button" disabled={mode === 'questions' && item.options?.length > 0 && selected < 0} onClick={() => setReveal(!reveal)}>{reveal ? 'Lösung verbergen' : mode === 'speak' ? 'Beispiel zeigen' : 'Lösung zeigen'}</button>
          {reveal && <aside className="lesson-song-answer"><strong>{mode === 'speak' ? item.model : `${item.options && selected === item.correctIndex ? 'Richtig! ' : ''}${item.answer}`}</strong>{item.evidence && <blockquote>{item.evidence}</blockquote>}<p>{item.explanation || item.teacherNote}</p>{evidenceIndex >= 0 && cues[evidenceIndex] && url && <button type="button" onClick={() => { seek(cues[evidenceIndex].start); audio.current?.play().catch(() => {}); }}>Textstelle ab {songTime(cues[evidenceIndex].start)} anhören</button>}</aside>}
          <nav aria-label="Fragen im Lied"><button type="button" disabled={question === 0} onClick={() => changeQuestion(question - 1)}>← Zurück</button><button type="button" disabled={question === (mode === 'speak' ? song.speaking : song.questions).length - 1} onClick={() => changeQuestion(question + 1)}>Weiter →</button></nav>
        </>}
      </div>
    </div>
    {mode === 'listen' && <details className="lesson-song-sync"><summary>Lehrkraft · Liedtext mit der Aufnahme synchronisieren</summary><p>Spiele die fertige Aufnahme. Klicke bei jedem Zeilenanfang auf „Zeile markieren“. Die Zeiten werden auf diesem Gerät gespeichert; exportiere sie für andere Geräte.</p>
      <strong>Nächste Zeile: {lines[cues.length] || 'Alle Zeilen sind markiert.'}</strong><div className="lesson-song-sync-actions">
        <button type="button" disabled={!url || cues.length === lines.length} onClick={markNext}>Zeile markieren · {songTime(time)}</button>
        <button type="button" disabled={!cues.length} onClick={() => saveCues(cues.slice(0, -1))}>Letzte Markierung zurück</button>
        <button type="button" disabled={!cues.length} onClick={exportCues}>Zeitmarken exportieren</button>
        <label>Zeitmarken importieren <input type="file" accept="application/json,.json" onChange={importCues} /></label>
      </div></details>}
  </section>;
}
