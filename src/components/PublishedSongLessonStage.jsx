import { hasCompleteSongTiming } from '../utils/songLyrics.js';
import { recordedSongQuestions } from '../utils/recordedLessonMusic.js';
import { useEffect, useRef, useState } from 'react';
import { getReusableSongDraft } from '../data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../data/reusableMusicQuestions.js';
import { getCuratedMusicByAssignment } from '../data/curatedLessonMusic.js';
import './PublishedSongLessonStage.css';
import './LessonSongStage.css';
import LessonSongLyrics from './LessonSongLyrics.jsx';
import SongTimingEditor from './SongTimingEditor.jsx';
import useSongTiming from '../hooks/useSongTiming.js';

// This is a teacher-led, unscored song activity. The separately graded
// coursebook/Goethe Hören and private A2 Day 18 bank telephone recording
// remain separate and retain their own source, transcript and answer key.
export default function PublishedSongLessonStage({ assignmentKey, onExit = null, compact = false }) {
  const song = getReusableSongDraft(assignmentKey);
  const bank = getReusableMusicQuestions(assignmentKey);
  const recording = getCuratedMusicByAssignment(assignmentKey);
  const audio = useRef(null);
  const [time, setTime] = useState(0);
  const [follow, setFollow] = useState(true);
  const timedSong = song && recording ? {...song, id:recording.trackId, objectKey:recording.objectKey} : null;
  const [cues, saveCues, recordedLyrics] = useSongTiming(timedSong);
  const displaySong = timedSong ? {...timedSong, lyrics:recordedLyrics} : null;
  const [view, setView] = useState('listen');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState(-1);
  const [audioError, setAudioError] = useState('');
  useEffect(() => {
    setView('listen'); setQuestionIndex(0); setSelectedOption(-1); setShowAnswer(false); setAudioError(''); setTime(0);
  }, [assignmentKey]);

  if (!song || !bank || !recording) return null;
  const questions = recordedLyrics !== song.lyrics ? recordedSongQuestions({lyrics:recordedLyrics},recording.day,recording.level) : bank.questions;
  const synchronized=hasCompleteSongTiming(cues,recordedLyrics);
  const question = questions[questionIndex];
  const musicLink = `https://music.falowen.app/?track=${encodeURIComponent(recording.trackId)}`;
  const listenPrompt = recording.introQuestion || (recording.level === 'A1'
    ? 'Welche Wörter hörst du? Wer ist im Lied?'
    : 'Worum geht es in der Geschichte? Wer hat ein Problem? Welche Lösung findet die Person?');
  return (
    <section className={`published-song-lesson${compact ? ' published-song-lesson--compact' : ''}`}
      data-published-song={song.assignmentKey} aria-label={`Falowen Music for ${song.title}`}>
      <div className="published-song-lesson__head">
        <div><span>FALOWEN MUSIC · {recording.level} · DAY {recording.day}</span>
          <h2>{song.title}</h2><p>Hören · Liedtext verstehen · Sprechen</p>
        </div>
        {onExit && <button type="button" onClick={onExit} className="published-song-lesson__exit">← Zurück zu den Folien</button>}
      </div>
      <div className="published-song-lesson__player">
        <div><strong>♫ Lied anhören</strong><small>Das Lernlied aus Cloudflare R2 · Keine Goethe-Hörprüfung</small></div>
        <audio key={recording.objectKey} ref={audio} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onSeeked={e=>setTime(e.currentTarget.currentTime)} onEnded={()=>setTime(-1)} controls preload="none" src={recording.audioUrl} onError={() => setAudioError('Diese Aufnahme konnte nicht geladen werden. Bitte die R2-Datei und den Falowen-Musiklink prüfen.')} aria-label={song.title}/>
        <a href={musicLink} target="_blank" rel="noopener noreferrer">In Falowen Music öffnen</a>
        {audioError && <p className="published-song-lesson__error" role="alert">{audioError}</p>}
      </div>
      <div className="published-song-lesson__tabs" role="group" aria-label="Musik-Lernschritte">
        <button type="button" aria-pressed={view==='listen'} className={view==='listen'?'is-active':''} onClick={()=>setView('listen')}>1 · Hören</button>
        <button type="button" aria-pressed={view==='lyrics'} className={view==='lyrics'?'is-active':''} onClick={()=>setView('lyrics')}>2 · Liedtext</button>
        <button type="button" aria-pressed={view==='questions'} className={view==='questions'?'is-active':''} onClick={()=>setView('questions')}>3 · Fragen</button>
      </div>
      {view==='listen' && <div className="published-song-lesson__section">
        <h3>Höre zuerst zu.</h3>
        <p>{listenPrompt}</p>
        <p>Beim ersten Hören brauchst du den Text nicht. Beim zweiten Hören kannst du mitlesen.</p>
        <button type="button" onClick={()=>setView('lyrics')}>Weiter · Liedtext ansehen</button>
      </div>}
      {view==='lyrics' && <div className="published-song-lesson__section">
        <h3>Liedtext · {song.title}</h3>
        <p>Lies mit und achte auf die wichtigen Ausdrücke aus Kapitel {song.assignmentKey}.</p>
        <label><input type="checkbox" disabled={!synchronized} checked={synchronized && follow} onChange={e=>setFollow(e.target.checked)}/> Mitlesen folgen</label>
        {!synchronized && <p role="status">Zeitmarken fehlen für diese Aufnahme. Mitlesen wird nach der Veröffentlichung der passenden Zeitmarken verfügbar.</p>}
        <LessonSongLyrics song={displaySong} cues={cues} time={time} onSeek={seconds=>{if(audio.current){audio.current.currentTime=seconds;setTime(seconds);}}} follow={follow}/>
        <SongTimingEditor song={displaySong} audio={audio} cues={cues} onSave={saveCues}/>

        <button type="button" onClick={()=>{setView('questions');setQuestionIndex(0);setSelectedOption(-1);setShowAnswer(false);}}>Weiter · Fragen beantworten</button>
      </div>}
      {view==='questions' && <div className="published-song-lesson__section published-song-lesson__quiz">
        <div className="published-song-lesson__quizmeta"><strong>FRAGE {questionIndex+1} / {questions.length}</strong><span>{question.type==='speaking'?'SPRECHEN':'HÖRVERSTEHEN'}</span></div>
        <h3 lang="de">{question.prompt}</h3>
        {question.type==='speaking'
          ? <p>Sprich mit deinem Partner. {question.teacherNote}</p>
          : <p>Antworte mit Informationen aus dem Lied. Die Musterlösung wird erst nach deiner Antwort gezeigt.</p>}
        {Array.isArray(question.options) && <div className="published-song-lesson__options" role="group" aria-label="Antwortmöglichkeiten">
          {question.options.map((option,i)=><button key={option} type="button"
            aria-pressed={selectedOption === i}
            className={selectedOption === i ? 'is-selected' : ''}
            onClick={()=>{setSelectedOption(i);setShowAnswer(false);}}>
            <strong>{String.fromCharCode(65+i)}.</strong> {option}
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
          {question.evidence && <details><summary>Textbeleg</summary><blockquote>{question.evidence}</blockquote></details>}
        </div>}
        <div className="published-song-lesson__quiznav">
          <button type="button" onClick={()=>{setQuestionIndex(i=>Math.max(0,i-1));setShowAnswer(false);setSelectedOption(-1)}} disabled={questionIndex===0}>← Vorherige</button>
          {questionIndex===questions.length-1
            ? <button type="button" onClick={()=>{setView('listen');setShowAnswer(false);setSelectedOption(-1)}}>Wiederholen</button>
            : <button type="button" onClick={()=>{setQuestionIndex(i=>Math.min(questions.length-1,i+1));setShowAnswer(false);setSelectedOption(-1)}}>Nächste Frage →</button>}
        </div>
      </div>}
      <p className="published-song-lesson__note">Liedfragen sind unbewertete Unterrichtsübungen und beziehen sich auf den gespeicherten Liedtext. Bei abweichenden Audios die Antworten vor der Stunde prüfen.</p>
    </section>
  );
}
