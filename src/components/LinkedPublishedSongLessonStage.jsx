import { useEffect, useRef, useState } from 'react';
import LessonSongLyrics from './LessonSongLyrics.jsx';
import { recordedSongQuestions, selectRecordedLessonTrack, verifiedRecordedLyrics } from '../utils/recordedLessonMusic.js';
import './PublishedSongLessonStage.css';
import './LessonSongStage.css';

// Identical lesson shell and controls to the approved A2 Day 18 player.
// The real public MP3 and its recorded lyrics are resolved by objectKey;
// never embed the music website inside the slide or use draft lyrics.
export default function LinkedPublishedSongLessonStage({ music }) {
  const day = Number(music?.day);
  const [loaded, setLoaded] = useState({loading:true,track:null,pack:null,error:''});
  const [view,setView] = useState('listen');
  const [time,setTime] = useState(0);
  const [follow,setFollow] = useState(true);
  const [questionIndex,setQuestionIndex] = useState(0);
  const [selectedOption,setSelectedOption] = useState(-1);
  const [showAnswer,setShowAnswer] = useState(false);
  const [audioError,setAudioError] = useState('');
  const audio = useRef(null);
  const assignmentKey = 'A2-7.'+day;

  useEffect(()=>{
    if (music?.level!=='A2' || ![19,20].includes(day)) return undefined;
    const controller=new AbortController();
    setLoaded({loading:true,track:null,pack:null,error:''});
    setView('listen');setQuestionIndex(0);setSelectedOption(-1);setShowAnswer(false);setAudioError('');setTime(0);
    (async ()=>{
      try {
        // Existing read-only, same-origin Vercel rewrite. No new function,
        // R2 listing loop, private credentials, or generated audio.
        const response=await fetch('/api/attendance-music-library', {signal:controller.signal});
        if (!response.ok) throw Error('Die Musikbibliothek ist nicht erreichbar.');
        const data=await response.json();
        const track=selectRecordedLessonTrack(data,{day,assignmentKey});
        if (!track) throw Error('Keine eindeutige veröffentlichte Aufnahme für A2 Tag '+day+' gefunden.');
        if (!controller.signal.aborted) setLoaded({loading:false,track,pack:null,error:''});
        // Music lyrics/timings only for this EXACT recording, never the
        // unrelated songbook draft or another Day 19/20 MP3.
        let pack=null;
        try {
          const lyricsResponse=await fetch(
            'https://www.falowen.app/api/music-lyrics?key='+encodeURIComponent(track.objectKey),
            {signal:controller.signal});
          if (lyricsResponse.ok) pack=verifiedRecordedLyrics(await lyricsResponse.json(),track);
        } catch (error) { if (controller.signal.aborted) return; }
        if (!pack) {
          try {
            const response=await fetch('https://music.falowen.app/music/timings.json',
              {signal:controller.signal});
            if (response.ok) {
              const collection=await response.json();
              const entry=(Array.isArray(collection?.recordings)?collection.recordings:[])
                .find(row=>row.objectKey===track.objectKey);
              pack=verifiedRecordedLyrics(entry,track);
            }
          } catch(error) { if (controller.signal.aborted) return; }
        }
        if (!controller.signal.aborted) setLoaded({loading:false,track,pack,error:''});
      } catch(error) {
        if (!controller.signal.aborted) setLoaded({loading:false,track:null,pack:null,
          error:error?.message || 'Das Lied konnte nicht geladen werden.'});
      }
    })();
    return ()=>controller.abort();
  },[day,music?.level,assignmentKey]);

  if (music?.level!=='A2' || ![19,20].includes(day)) return null;
  const {track,pack,loading,error}=loaded;
  const questions=recordedSongQuestions(pack,day);
  const question=questions[questionIndex];
  const musicLink=track ? 'https://music.falowen.app/?track='+encodeURIComponent(track.id) : music.musicLibraryUrl;
  const song=pack && track ? {id:track.id,objectKey:track.objectKey,lyrics:pack.lyrics} : null;
  const changeTab=next=>{setView(next);setQuestionIndex(0);setShowAnswer(false);setSelectedOption(-1);};
  return (
    <section className="published-song-lesson published-song-lesson--linked" data-published-song={assignmentKey}
      aria-label={'Falowen Music A2 Day '+day}>
      <header className="published-song-lesson__head">
        <div><span>FALOWEN MUSIC · A2 · DAY {day}</span>
          <h2>{track?.title || music.title}</h2><p>Hören · Liedtext verstehen · Sprechen</p></div>
      </header>
      <div className="published-song-lesson__player">
        <div><strong>♫ Lied anhören</strong>
          <small>Das veröffentlichte Lernlied aus Cloudflare R2 · Keine Goethe-Hörprüfung</small></div>
        {loading && <p role="status">Veröffentlichte Aufnahme wird geladen…</p>}
        {track && <audio key={track.objectKey} ref={audio} controls preload="none"
          src={track.src} aria-label={track.title}
          onTimeUpdate={e=>setTime(e.currentTarget.currentTime)}
          onSeeked={e=>setTime(e.currentTarget.currentTime)}
          onEnded={()=>setTime(-1)}
          onError={()=>setAudioError('Die veröffentlichte MP3-Datei konnte nicht abgespielt werden.')} />}
        <a href={musicLink} target="_blank" rel="noopener noreferrer">In Falowen Music öffnen</a>
        {error && <p className="published-song-lesson__error" role="alert">{error}</p>}
        {audioError && <p className="published-song-lesson__error" role="alert">{audioError}</p>}
      </div>

      <div className="published-song-lesson__tabs" role="group" aria-label="Musik-Lernschritte">
        <button type="button" className={view==='listen'?'is-active':''}
          aria-pressed={view==='listen'} onClick={()=>changeTab('listen')}>1 · Hören</button>
        <button type="button" className={view==='lyrics'?'is-active':''}
          aria-pressed={view==='lyrics'} onClick={()=>changeTab('lyrics')}>2 · Liedtext</button>
        <button type="button" className={view==='questions'?'is-active':''}
          aria-pressed={view==='questions'} onClick={()=>changeTab('questions')}>3 · Fragen</button>
      </div>

      {view==='listen' && <div className="published-song-lesson__section">
        <h3>Höre zuerst zu.</h3><p>{music.introQuestion}</p>
        <p>Beim ersten Hören brauchst du den Text nicht. Beim zweiten Hören kannst du mitlesen.</p>
        <button type="button" onClick={()=>changeTab('lyrics')}>Weiter · Liedtext ansehen</button>
      </div>}

      {view==='lyrics' && <div className="published-song-lesson__section">
        <h3>Liedtext · {track?.title || music.title}</h3>
        {song ? <>
          <p>Lies mit und achte auf die Ausdrücke, die du im Lied hörst.</p>
          <label><input type="checkbox" checked={follow} onChange={e=>setFollow(e.target.checked)}/> Mitlesen folgen</label>
          <LessonSongLyrics song={song} cues={pack.cues} time={time}
            onSeek={seconds=>{if(audio.current){audio.current.currentTime=seconds;setTime(seconds);}}}
            follow={follow}/>
        </> : <p role="status">{loading ? 'Der Liedtext wird geladen…' :
          'Für genau diese veröffentlichte MP3 ist noch kein geprüfter Liedtext mit Zeitmarken hinterlegt. Bitte die passende .lyrics.json neben dem MP3 in R2 veröffentlichen; ein anderer Liedtext wird nicht eingeblendet.'}</p>}
        <button type="button" disabled={!song} onClick={()=>changeTab('questions')}>Weiter · Fragen beantworten</button>
      </div>}

      {view==='questions' && <div className="published-song-lesson__section published-song-lesson__quiz">
        {question ? <>
          <div className="published-song-lesson__quizmeta">
            <strong>FRAGE {questionIndex+1} / {questions.length}</strong>
            <span>{question.type==='speaking'?'SPRECHEN':'HÖRVERSTEHEN'}</span>
          </div>
          <h3 lang="de">{question.prompt}</h3>
          {question.type==='speaking' ? <p>Sprich mit deinem Partner. Antworte in ganzen Sätzen.</p>
            : <p>Antworte mit Informationen aus der veröffentlichten Aufnahme. Die Lösung wird erst nach der Auswahl gezeigt.</p>}
          {Array.isArray(question.options) && <div className="published-song-lesson__options" role="group" aria-label="Antwortmöglichkeiten">
            {question.options.map((option,i)=><button key={i} type="button"
              aria-pressed={selectedOption===i} className={selectedOption===i?'is-selected':''}
              onClick={()=>{setSelectedOption(i);setShowAnswer(false);}}>
              <strong>{String.fromCharCode(65+i)}.</strong> {option}
            </button>)}
          </div>}
          <button type="button" disabled={Array.isArray(question.options)&&selectedOption<0}
            aria-pressed={showAnswer} onClick={()=>setShowAnswer(v=>!v)}>
            {showAnswer?'Musterlösung verbergen':'Musterlösung für Lehrkraft zeigen'}
          </button>
          {showAnswer && <div role="status" className="published-song-lesson__answer">
            <strong>{question.type==='speaking'?'Lehrerhinweis':selectedOption===question.correctIndex?'Richtig!':'Noch einmal hören · Richtige Antwort'}</strong>
            <p>{question.answer}</p>
            {question.evidence && <details><summary>Textbeleg</summary><blockquote>{question.evidence}</blockquote></details>}
          </div>}
          <div className="published-song-lesson__quiznav">
            <button type="button" disabled={questionIndex===0}
              onClick={()=>{setQuestionIndex(i=>Math.max(0,i-1));setSelectedOption(-1);setShowAnswer(false);}}>← Vorherige</button>
            <button type="button" onClick={()=>{
              if(questionIndex===questions.length-1) changeTab('listen');
              else {setQuestionIndex(i=>i+1);setSelectedOption(-1);setShowAnswer(false);}
            }}>{questionIndex===questions.length-1?'Wiederholen':'Nächste Frage →'}</button>
          </div>
        </> : <p role="status">{loading ? 'Fragen werden geladen…' :
          'Die Multiple-Choice-Fragen werden aus dem geprüften Liedtext dieser Aufnahme geladen. Bitte die passenden Zeitmarken zur veröffentlichten MP3 hinterlegen.'}</p>}
      </div>}
      <p className="published-song-lesson__note">Musikfragen sind unbewertete Unterrichtsübungen. MP3, Liedtext und Zeitmarken werden nicht verändert. Das separate Hören-Gespräch bleibt auf der nächsten Folie.</p>
    </section>
  );
}
