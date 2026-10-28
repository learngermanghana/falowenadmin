import { useEffect, useState } from 'react';
import { getReusableSongDraft } from '../data/reusableMusicSongbook.js';
import { getReusableMusicQuestions } from '../data/reusableMusicQuestions.js';
import { getCuratedMusicByAssignment } from '../data/curatedLessonMusic.js';
import './PublishedSongLessonStage.css';

// This is a teacher-led, unscored song activity. The separately graded
// coursebook/Goethe Hören and private A2 Day 18 bank telephone recording
// remain separate and retain their own source, transcript and answer key.
export default function PublishedSongLessonStage({ assignmentKey, onExit = null, compact = false }) {
  const song = getReusableSongDraft(assignmentKey);
  const bank = getReusableMusicQuestions(assignmentKey);
  const recording = getCuratedMusicByAssignment(assignmentKey);
  const [view, setView] = useState('listen');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState(-1);
  const [audioError, setAudioError] = useState('');
  useEffect(() => {
    setView('listen'); setQuestionIndex(0); setSelectedOption(-1); setShowAnswer(false); setAudioError('');
  }, [assignmentKey]);

  if (!song || !bank || !recording) return null;
  const questions = bank.questions;
  const question = questions[questionIndex];
  const musicLink = `https://music.falowen.app/?track=${encodeURIComponent(recording.trackId)}`;
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
        <audio controls preload="none" src={recording.audioUrl} onError={() => setAudioError('Diese Aufnahme konnte nicht geladen werden. Bitte die R2-Datei und den Falowen-Musiklink prüfen.')} aria-label={song.title}/>
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
        <p>Worum geht es in der Geschichte? Wer hat ein Problem? Welche Lösung findet die Person?</p>
        <p>Beim ersten Hören brauchst du den Text nicht. Beim zweiten Hören kannst du mitlesen.</p>
        <button type="button" onClick={()=>setView('lyrics')}>Weiter · Liedtext ansehen</button>
      </div>}
      {view==='lyrics' && <div className="published-song-lesson__section">
        <h3>Liedtext · {song.title}</h3>
        <p>Lies mit und achte auf die wichtigen Ausdrücke aus Kapitel {song.assignmentKey}.</p>
        <div className="published-song-lesson__lyrics" lang="de">{song.lyrics.split(/\n\n+/).map((part,i) => <p key={i}>{part.replace(/^\[[^\]]+\]\n?/,'')}</p>)}</div>
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
        {question.type === 'speaking' && <p className="published-song-lesson__speaking-note">Offene Frage: Antworte in eigenen Worten und beziehe dich auf das Unterrichtsthema.</p>}
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
