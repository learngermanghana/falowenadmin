import { hasCompleteSongTiming, lyricLines } from '../utils/songLyrics.js';
import { recordedEvidenceRange, recordedSongQuestions } from '../utils/recordedLessonMusic.js';
import { threeVerifiedHeardLyricQuestions } from '../utils/nextLyricQuestions.js';
import { useEffect, useRef, useState } from 'react';
import { getReusableSongDraft } from '../data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../data/reusableMusicQuestions.js';
import { getCuratedMusicByAssignment } from '../data/curatedLessonMusic.js';
import { getA1PresenterRecording } from '../data/a1PresenterMusicStage.js';
import { waitingRoomDiscoveredMusicTrack } from '../utils/waitingRoomDayMusic.js';
import './PublishedSongLessonStage.css';
import './LessonSongStage.css';
import LessonSongLyrics from './LessonSongLyrics.jsx';
import SongTimingEditor from './SongTimingEditor.jsx';
import useSongTiming from '../hooks/useSongTiming.js';
import classroomSongTiming from '../data/a1ClassroomSongTiming.js';
import day25AlignedTiming from '../data/a2Day25SongTiming.js';
import { resolveTeachingSongEnglishTranslation } from '../utils/musicEnglishDrafts.js';

// This is a teacher-led, unscored song activity. The separately graded
// coursebook/Goethe Hören and private A2 Day 18 bank telephone recording
// remain separate and retain their own source, transcript and answer key.
export default function PublishedSongLessonStage({ assignmentKey, courseDay, onExit = null, compact = false, nextLyricOnly = false }) {
  const song = getReusableSongDraft(assignmentKey);
  const bank = getReusableMusicQuestions(assignmentKey);
  const approvedRecording = getCuratedMusicByAssignment(assignmentKey) || getA1PresenterRecording(assignmentKey, courseDay);
  const resolveByDiscovery = approvedRecording?.discover === true;
  const [publishedTrack, setPublishedTrack] = useState(null);
  const [discoveryError, setDiscoveryError] = useState('');
  useEffect(() => {
    if (!resolveByDiscovery) { setPublishedTrack(null); setDiscoveryError(''); return undefined; }
    const controller = new AbortController();
    setPublishedTrack(null);
    setDiscoveryError('');
    // Resolve the exact published R2 object and reversible ID for any approved
    // discovery-based A1 lesson (including Days 13 and 15). Never guess a filename.
    fetch('/api/attendance-music-library', { signal: controller.signal, cache:'no-store' })
      .then(response => { if (!response.ok) throw new Error('Falowen Music ist nicht erreichbar.'); return response.json(); })
      .then(data => {
        if (controller.signal.aborted) return;
        if (data?.ok !== true || !Array.isArray(data.tracks)) throw new Error('Die Musikbibliothek hat keine gültige Aufnahmeliste zurückgegeben.');
        const track = waitingRoomDiscoveredMusicTrack(data, {
          level:approvedRecording.level, day:approvedRecording.day, assignmentKey,
        });
        if (!track) throw new Error(`Keine eindeutige ${approvedRecording.level}-Day-${approvedRecording.day}-Aufnahme gefunden. Bitte den Musikordner prüfen.`);
        setPublishedTrack(track);
      }).catch(error => { if (!controller.signal.aborted) setDiscoveryError(error?.message || 'Das Lied konnte nicht gefunden werden.'); });
    return () => controller.abort();
  }, [assignmentKey, resolveByDiscovery, approvedRecording?.level, approvedRecording?.day]);
  const recording = resolveByDiscovery
    ? { ...approvedRecording,
        trackId:publishedTrack?.id || '', objectKey:publishedTrack?.objectKey || '',
        audioUrl:publishedTrack?.src || '',
        title:publishedTrack?.title || approvedRecording.title,
      }
    : approvedRecording;
  const audio = useRef(null);
  const previewStart = useRef(null);
  const previewEnd = useRef(null);
  const [time, setTime] = useState(0);
  const [follow, setFollow] = useState(true);
  const timedSong = song && recording ? {...song, id:recording.trackId, objectKey:recording.objectKey} : null;
  const [cues, saveCues, recordedLyrics, recordingMetadata] = useSongTiming(timedSong, {
    alignedTiming: assignmentKey === 'A2-9.25' ? day25AlignedTiming : classroomSongTiming[assignmentKey],
  });
  const englishTranslation = timedSong ? resolveTeachingSongEnglishTranslation({
    assignmentKey, objectKey:recording.objectKey, lyrics:recordedLyrics,
    publishedEnglish:recordingMetadata?.englishTranslation,
  }) : null;
  const displaySong = timedSong ? {...timedSong, lyrics:recordedLyrics, englishTranslation} : null;
  const [view, setView] = useState('listen');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState(-1);
  const [audioError, setAudioError] = useState('');
  const [teacherLineIndex, setTeacherLineIndex] = useState(0);
  const [teacherClipStart, setTeacherClipStart] = useState(0);
  const [teacherSelectedAnswer, setTeacherSelectedAnswer] = useState(-1);
  useEffect(() => {
    setView('listen'); setQuestionIndex(0); setSelectedOption(-1); setShowAnswer(false); setAudioError(''); setTime(0);
    setTeacherLineIndex(0); setTeacherClipStart(0); setTeacherSelectedAnswer(-1);
  }, [assignmentKey]);

  const updatePlayback = player => {
    const end = previewEnd.current;
    if (end !== null && player.currentTime >= end) {
      player.pause();
      player.currentTime = end;
      previewStart.current = null;
      previewEnd.current = null;
    }
    setTime(player.currentTime);
  };

  useEffect(() => {
    const player = audio.current;
    if (!player || !window.requestAnimationFrame) return undefined;
    let frame;
    const tick = () => {
      if (player.paused) return;
      if (previewEnd.current !== null && player.currentTime >= previewEnd.current) updatePlayback(player);
      if (!player.paused) frame = window.requestAnimationFrame(tick);
    };
    const start = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(tick);
    };
    player.addEventListener('playing', start);
    return () => {
      player.removeEventListener('playing', start);
      window.cancelAnimationFrame(frame);
    };
  }, [recording?.audioUrl]);

  if (!song || !bank || !recording) return null;
  const bundledTiming = classroomSongTiming[assignmentKey];
  const quizPack = bundledTiming && recording.objectKey === bundledTiming.objectKey &&
    recordedLyrics === bundledTiming.lyrics && recordingMetadata?.timingStatus === 'audio-aligned'
    ? bundledTiming : recordingMetadata && {
        ...recordingMetadata, objectKey: recording.objectKey, lyrics: recordedLyrics, cues,
      };
  const heardLyricDuration = assignmentKey === 'A1-14.1' ? {minSeconds: 10, maxSeconds: 15, targetSeconds: 12} : undefined;
  const verifiedNextQuestions = nextLyricOnly ? threeVerifiedHeardLyricQuestions(quizPack, recording, heardLyricDuration) : [];
  // Hard-coded Day 3 estimates may describe an older recording. Only a
  // verified cue sequence for the exact audio can set an MCQ answer.
  const questions = nextLyricOnly
    ? verifiedNextQuestions
    : recordedLyrics !== song.lyrics
      ? recordedSongQuestions({objectKey:recording.objectKey,lyrics:recordedLyrics},recording.day,recording.level)
      : bank.questions;
  const synchronized=hasCompleteSongTiming(cues,recordedLyrics);
  // No automatic answer when the precise recording lacks reviewed lyric timings.
  // Teacher can choose a passage from the available text and listen to a bounded excerpt.
  const teacherLyricLines = lyricLines(recordedLyrics).filter(line => line.trim().length >= 8);
  const teacherChallenge = nextLyricOnly && !questions.length && teacherLyricLines.length >= 3 && !!recording.audioUrl;
  const teacherOptions = teacherChallenge ? [0,1,2].map(offset => teacherLyricLines[(teacherLineIndex+offset)%teacherLyricLines.length]) : [];
  const question = questions[Math.min(questionIndex, questions.length - 1)];
  const evidenceRange = question?.previewRange || (question?.evidence
    ? recordedEvidenceRange(recordedLyrics, cues, question.evidence) : null);
  const cancelPreview = () => { previewStart.current=null; previewEnd.current=null; };
  const stopExcerpt = () => {
    if (previewEnd.current !== null) audio.current?.pause();
    cancelPreview();
  };
  const openView = next => {
    stopExcerpt();
    setView(next);
    setQuestionIndex(0);
    setSelectedOption(-1);
    setShowAnswer(false);
    setTeacherSelectedAnswer(-1);
  };
  const playLinePreview = range => {
    if (!audio.current || !range) return;
    previewStart.current=range.start;
    previewEnd.current=range.end;
    audio.current.currentTime=range.start;
    setTime(range.start);
    const playback=audio.current.play();
    playback?.catch(cancelPreview);
  };
  const playTeacherPreview = () => {
    const player = audio.current;
    if (!player) return;
    const start = Math.max(0, Math.min(teacherClipStart, Math.max(0, (player.duration || 0)-12)));
    playLinePreview({start, end: start + 12});
  };
  const musicLink = recording.trackId
    ? `https://music.falowen.app/?track=${encodeURIComponent(recording.trackId)}`
    : `https://music.falowen.app/?level=${encodeURIComponent(recording.level)}&day=${encodeURIComponent(recording.day)}`;
  const listenPrompt = recording.introQuestion || (recording.level === 'A1'
    ? 'Welche Wörter hörst du? Wer ist im Lied?'
    : 'Worum geht es in der Geschichte? Wer hat ein Problem? Welche Lösung findet die Person?');
  return (
    <section className={`published-song-lesson${compact ? ' published-song-lesson--compact' : ''}`}
      data-published-song={song.assignmentKey} aria-label={`Falowen Music for ${song.title}`}>
      <div className="published-song-lesson__head">
        <div><span>FALOWEN MUSIC · {recording.level} · DAY {recording.day}</span>
          <h2>{recording.title}</h2><p>Hören · Liedtext verstehen · Sprechen</p>
        </div>
        {onExit && <button type="button" onClick={onExit} className="published-song-lesson__exit">← Zurück zu den Folien</button>}
      </div>
      <div className="published-song-lesson__player">
        <div><strong>♫ Lied anhören</strong><small>Das Lernlied aus Cloudflare R2 · Keine Goethe-Hörprüfung</small></div>
        {recording.audioUrl
          ? <audio key={recording.objectKey} ref={audio} onTimeUpdate={e=>updatePlayback(e.currentTarget)} onSeeking={e=>{
              const position=e.currentTarget.currentTime;
              if (previewEnd.current !== null && (position < previewStart.current - 0.05 || position > previewEnd.current)) cancelPreview();
            }} onSeeked={e=>setTime(e.currentTarget.currentTime)} onEnded={()=>{cancelPreview();setTime(-1);}} controls preload="none" src={recording.audioUrl} onError={() => setAudioError('Diese Aufnahme konnte nicht geladen werden. Bitte die R2-Datei und den Falowen-Musiklink prüfen.')} aria-label={song.title}/>
          : <p role="status">{discoveryError || `Die ${recording.level}-Day-${recording.day}-Aufnahme wird in Falowen Music gesucht…`}</p>}
        <a href={musicLink} target="_blank" rel="noopener noreferrer">In Falowen Music öffnen</a>
        {audioError && <p className="published-song-lesson__error" role="alert">{audioError}</p>}
      </div>
      {recordingMetadata?.transcriptionStatus==='automatic'
        ? <p role="status">AUTOMATISCHER TRANSKRIPTENTWURF · Wörter und Zeitmarken stammen aus der Aufnahme. Erkennungsfehler sind möglich; bitte beim Hören prüfen. Fragen dazu sind unbewertete Lese-/Sprechübungen.</p>
        : recordingMetadata?.timingStatus==='audio-aligned'
          ? <p role="status">An die Aufnahme angepasste Zeitmarken · Kurze Gesangsrufe können leicht abweichen.</p>
          : recordingMetadata?.timingStatus==='estimated'
          ? <p role="status">{assignmentKey === 'A2-9.25' && !synchronized
            ? 'Automatisches Mitlesen wartet auf geprüfte Zeitmarken. Die Lehrkraft kann die Zeilen unten markieren.'
            : 'Geschätzte veröffentlichte Zeitmarken · Bitte die Zeilengrenzen beim Hören prüfen.'}</p>
          : null}
      <div className="published-song-lesson__tabs" role="group" aria-label="Musik-Lernschritte">
        <button type="button" aria-pressed={view==='listen'} className={view==='listen'?'is-active':''} onClick={()=>openView('listen')}>1 · Hören</button>
        <button type="button" aria-pressed={view==='lyrics'} className={view==='lyrics'?'is-active':''} onClick={()=>openView('lyrics')}>2 · Liedtext</button>
        <button type="button" aria-pressed={view==='questions'} className={view==='questions'?'is-active':''} onClick={()=>openView('questions')}>3 · Fragen</button>
      </div>
      {view==='listen' && <div className="published-song-lesson__section">
        <h3>Höre zuerst zu.</h3>
        <p>{listenPrompt}</p>
        <p>Beim ersten Hören brauchst du den Text nicht. Beim zweiten Hören kannst du mitlesen.</p>
        <button type="button" onClick={()=>openView('lyrics')}>Weiter · Liedtext ansehen</button>
      </div>}
      {view==='lyrics' && <div className="published-song-lesson__section">
        {recordedLyrics === song.lyrics && !recordingMetadata && <p role="status">KURSENTWURF · Dieser Text und seine Übungsfragen sind noch nicht gegen die ausgewählte Aufnahme geprüft.</p>}
        <h3>Liedtext · {song.title}</h3>
        <p>Lies mit und achte auf die wichtigen Ausdrücke aus Kapitel {song.assignmentKey}.</p>
        <label className="published-song-lesson__follow"><input type="checkbox" disabled={!synchronized} checked={synchronized && follow} onChange={e=>setFollow(e.target.checked)}/> Mitlesen folgen</label>
        {!synchronized && recordingMetadata?.timingStatus !== 'estimated' && <p role="status">Zeitmarken fehlen für diese Aufnahme. Mitlesen wird nach der Veröffentlichung der passenden Zeitmarken verfügbar.</p>}
          <LessonSongLyrics song={displaySong} cues={cues} time={time} onSeek={seconds=>{if(audio.current){cancelPreview();audio.current.currentTime=seconds;setTime(seconds);}}} follow={follow}/>
        <SongTimingEditor song={displaySong} audio={audio} cues={cues} onSave={saveCues}/>

        <button type="button" onClick={()=>openView('questions')}>Weiter · Fragen beantworten</button>
      </div>}
      {view==='questions' && (!question ? <div className="published-song-lesson__section" role="status">
        <h3>Welche Liedzeile hast du gehört?</h3>
        {recording.audioUrl
          ? <p>Spiele einen Ausschnitt ab und frage, welche Zeile die Klasse tatsächlich gehört hat.</p>
          : <p>{discoveryError || 'Die Aufnahme wird geladen.'}</p>}
        {teacherChallenge ? <div className="published-song-lesson__quiz">
          <p>Lehrkraft-Übung: Wähle den Liedausschnitt und prüfe den Text mit dem Originalaudio. Ohne geprüfte Zeitmarken wird keine Antwort automatisch als richtig bewertet.</p>
          <label>Startzeit in Sekunden (0 bis Liedende)
            <input type="number" min="0" max={Math.max(0,Math.floor((audio.current?.duration||0)-12))} value={teacherClipStart}
              onChange={event=>{setTeacherClipStart(Math.max(0,Number(event.target.value)||0));setTeacherSelectedAnswer(-1);setSelectedOption(-1);}} />
          </label>
          <button type="button" className="published-song-lesson__line-preview" onClick={playTeacherPreview}>▶ 12 Sekunden abspielen</button>
          <p>Welche Liedzeile hast du gehört? Wähle A, B oder C.</p>
          <div className="published-song-lesson__options" role="group" aria-label="Liedzeile auswählen">
            {teacherOptions.map((line,i)=><button type="button" key={line+'-'+i} aria-pressed={selectedOption===i}
              className={selectedOption===i?'is-selected':''} onClick={()=>setSelectedOption(i)}><strong>{String.fromCharCode(65+i)}.</strong> {line}</button>)}
          </div>
          <div className="published-song-lesson__quiznav">
            <button type="button" onClick={()=>{setTeacherLineIndex(i=>(i+1)%teacherLyricLines.length);setSelectedOption(-1);setTeacherSelectedAnswer(-1);}}>Andere drei Liedzeilen →</button>
            <button type="button" disabled={selectedOption<0} onClick={()=>setTeacherSelectedAnswer(selectedOption)}>Antwort für Lehrkraft markieren</button>
          </div>
          {teacherSelectedAnswer>=0 && <p role="status">Lehrkraft-Auswahl: {teacherOptions[teacherSelectedAnswer]}. Bitte mit dem tatsächlich gesungenen Ausschnitt vergleichen; diese Antwort ist nicht automatisch verifiziert.</p>}
        </div> : recording.audioUrl && <p>Keine sichere Hörfrage: Prüfe die Liedzeilen und Zeitmarken der genauen Aufnahme. Eine richtige Antwort muss hörbar sein.</p>}
      </div> : <div className="published-song-lesson__section published-song-lesson__quiz">
        <div className="published-song-lesson__quizmeta"><strong>FRAGE {questionIndex+1} / {questions.length}</strong><span>{nextLyricOnly?'WAS HAST DU GEHÖRT?':question.type==='speaking'?'SPRECHEN':'HÖRVERSTEHEN'}</span></div>
        <h3 lang="de">{question.prompt}</h3>
        {nextLyricOnly && <p lang="en">Listen to the short clip. Which lyric did you hear?</p>}
        {nextLyricOnly && <p lang="de">{assignmentKey === "A1-14.1" ? "Spiele einen 10–15 Sekunden langen Ausschnitt ab. Welche der drei Zeilen hast du wirklich gehört?" : "Spiele etwa zehn Sekunden ab. Welche der drei Zeilen war im Ausschnitt zu hören?"}</p>}
        {evidenceRange && <button type="button" className="published-song-lesson__line-preview"
          onClick={()=>playLinePreview(evidenceRange)}>▶ Ausschnitt abspielen</button>}
        {question.type==='speaking'
          ? <p>Sprich mit deinem Partner. {question.teacherNote}</p>
          : <p>Wähle die Zeile, die du im Ausschnitt gehört hast. Die Musterlösung wird erst nach deiner Antwort gezeigt.</p>}
        {Array.isArray(question.options) && <div className="published-song-lesson__options" role="group" aria-label="Antwortmöglichkeiten">
          {question.options.map((option,i)=><button key={option} type="button"
            aria-pressed={selectedOption === i}
            className={selectedOption === i ? 'is-selected' : ''}
            onClick={()=>{setSelectedOption(i);setShowAnswer(false);}}>
            <strong>{String.fromCharCode(65+i)}.</strong> {option}
            {question.optionEnglish?.[i] && <small lang="en">{question.optionEnglish[i]}</small>}
          </button>)}
        </div>}
        {question.type === 'speaking' && <div className="published-song-lesson__speaking-note">
          {question.sentenceStarters?.length > 0 && <><strong>Satzanfänge</strong><ul>{question.sentenceStarters.map(line => <li key={line}>{line}</li>)}</ul></>}
          {question.possibleAnswers?.length > 0 && <><strong>Mögliche Antworten</strong>{question.possibleAnswers.map(line => <p key={line}>{line}</p>)}</>}
          <p>{question.possibleAnswers?.length ? 'Wähle ein Beispiel und passe es an. Eigene Antworten sind auch richtig.' : 'Offene Frage: Antworte in eigenen Worten und beziehe dich auf das Unterrichtsthema.'}</p>
        </div>}
        <button type="button" disabled={Array.isArray(question.options) && selectedOption < 0}
          onClick={()=>setShowAnswer(value=>!value)} aria-pressed={showAnswer}>
          {showAnswer?'Musterlösung verbergen':'Musterlösung für Lehrkraft zeigen'}
        </button>
        {showAnswer && <div role="status" className="published-song-lesson__answer">
          <strong>{question.type==='speaking'?'Lehrerhinweis':Array.isArray(question.options) ? (selectedOption === question.correctIndex ? 'Richtig!' : 'Noch einmal hören · Richtige Antwort') : 'Musterlösung'}</strong>
          <p>{question.type==='speaking'?question.teacherNote:question.answer}</p>
          {question.continuationRange && <button type="button" className="published-song-lesson__line-preview"
            onClick={()=>playLinePreview(question.continuationRange)}>▶ Weiterhören · Nächste Zeilen</button>}
          {question.evidence && <details><summary>Textbeleg</summary><blockquote>{question.evidence}</blockquote></details>}
        </div>}
        <div className="published-song-lesson__quiznav">
          <button type="button" onClick={()=>{stopExcerpt();setQuestionIndex(i=>Math.max(0,i-1));setShowAnswer(false);setSelectedOption(-1)}} disabled={questionIndex===0}>← Vorherige</button>
          {questionIndex===questions.length-1
            ? <button type="button" onClick={()=>openView('listen')}>Wiederholen</button>
            : <button type="button" onClick={()=>{stopExcerpt();setQuestionIndex(i=>Math.min(questions.length-1,i+1));setShowAnswer(false);setSelectedOption(-1)}}>Nächste Frage →</button>}
        </div>
      </div>)}
      <p className="published-song-lesson__note">Liedfragen sind unbewertete Unterrichtsübungen und beziehen sich auf den gespeicherten Liedtext. Bei abweichenden Audios die Antworten vor der Stunde prüfen.</p>
    </section>
  );
}
