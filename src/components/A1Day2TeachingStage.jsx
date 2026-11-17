import { useEffect, useRef, useState } from 'react';
import { A1_DAY2_PRONOUNS, A1_DAY2_QUIZ } from '../data/a1Day2Classroom.js';
import { waitingRoomDiscoveredMusicTrack } from '../utils/waitingRoomDayMusic.js';
import { lyricLines, validateLyricCues } from '../utils/songLyrics.js';
import './A1Day2TeachingStage.css';

const ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DETAILS=[['Ä','A-Umlaut','Äpfel'],['Ö','O-Umlaut','Öl'],['Ü','U-Umlaut','Übung'],['ß','Eszett','Straße']];
const SENTENCES=[
  'Ich heiße Anna.','Du wohnst in Accra.','Er kommt aus Ghana.',
  'Sie heißt Maria.','Das Kind heißt Leo. Es kommt aus Berlin.',
];
const ANSWER_CHECKS=[['Buchstabiere deinen Namen.','Beispiel: F – E – L – I – X.'],['Nenne fünf Personalpronomen.','ich, du, er, sie, es'],['Ich ___ in Accra.','wohne'],['Du ___ aus Ghana.','kommst']];
function BasicCard({children}){return <div className="a1-day2-card">{children}</div>;}
function A1Day2Music({challenge=false}){
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [track,setTrack]=useState(null);
  const [pack,setPack]=useState(null);
  const [audioError,setAudioError]=useState('');
  const [question,setQuestion]=useState(0);
  const [choice,setChoice]=useState(-1);
  const [reveal,setReveal]=useState(false);
  const [time,setTime]=useState(0);
  const [preview,setPreview]=useState(false);
  const audio=useRef(null);
  const previewEnd=useRef(null);
  const previewPending=useRef(false);
  useEffect(()=>{
    const controller=new AbortController();
    async function getSong(){
      try{
        const response=await fetch('/api/attendance-music-library',{cache:'no-store',signal:controller.signal});
        if(!response.ok)throw Error('Die Falowen-Musikbibliothek ist nicht erreichbar.');
        const feed=await response.json();
        if(feed?.ok!==true || !Array.isArray(feed.tracks))throw Error('Keine gültige Musikbibliothek verfügbar.');
        // A1 Day 2 uses only an exact, unambiguous published R2 recording.
        const found=waitingRoomDiscoveredMusicTrack(feed,{level:'A1',day:2,assignmentKey:'A1-0.2'});
        if(!found)throw Error('Für A1 Tag 2 ist keine eindeutige veröffentlichte Aufnahme verfügbar. Bitte den richtigen MP3-Titel im Musikstudio zuordnen.');
        if(controller.signal.aborted)return;
        setTrack(found);
        try{
          const lyricsResponse=await fetch('https://www.falowen.app/api/music-lyrics?key='+encodeURIComponent(found.objectKey),
            {cache:'no-cache',signal:controller.signal});
          if(lyricsResponse.ok){
            const data=await lyricsResponse.json();
            if(!controller.signal.aborted)setPack(data);
          }
        }catch{ /* Full playback remains available even before timed lyrics exist. */ }
      }catch(e){if(!controller.signal.aborted)setError(e.message||'Musik konnte nicht geladen werden.');}
      finally{if(!controller.signal.aborted)setLoading(false);}
    }
    getSong();return()=>controller.abort();
  },[]);
  const matched=pack?.objectKey===track?.objectKey && typeof pack?.lyrics==='string';
  const lines=matched?lyricLines(pack.lyrics):[];
  const checked=matched?validateLyricCues(pack.cues,lines):[];
  // No guessed transcript, estimated timestamps or automatic transcriptions in listening challenges.
  const verified=Boolean(track && lines.length>0 && checked.length===lines.length
    && pack?.referenceOnly!==true && pack?.timingStatus!=='estimated'
    && pack?.transcriptionStatus!=='automatic');
  const questions=[];
  if(verified){
    const appearances=new Map();
    lines.forEach((line,i)=>{
      const key=line.trim().toLocaleLowerCase('de');
      if(!appearances.has(key))appearances.set(key,[]);
      appearances.get(key).push(i);
    });
    for(let i=0;i<lines.length-1;i++){
      const current=lines[i],next=lines[i+1];
      if(current.length<5 || next.length<5 || appearances.get(current.trim().toLocaleLowerCase('de')).length!==1)continue;
      const alternatives=[...new Set(lines.filter((line,k)=>k!==i && k!==i+1 && line!==current && line!==next && line.length>5))].slice(0,12);
      if(alternatives.length<2)continue;
      const correctIndex=questions.length%3;
      const options=alternatives.slice(0,2);
      options.splice(correctIndex,0,next);
      const start=checked[i].start;
      const end=checked[i+1].start;
      if(!(Number.isFinite(start)&&Number.isFinite(end)&&end>start))continue;
      questions.push({current,next,options,correctIndex,start,end});
      if(questions.length===3)break;
    }
  }
  const active=questions[question]||null;
  function stopPreview(){previewEnd.current=null;previewPending.current=false;setPreview(false);}
  function playFull(){
    if(!audio.current)return;
    stopPreview();
    audio.current.currentTime=0;
    const result=audio.current.play();
    if(result?.catch)result.catch(()=>setAudioError('Der Browser konnte die Wiedergabe nicht starten.'));
  }
  function playExcerpt(){
    if(!audio.current||!active)return;
    previewEnd.current=active.end;
    previewPending.current=true;
    audio.current.currentTime=active.start;
    setTime(active.start);
    setPreview(true);
    const result=audio.current.play();
    if(result?.then)result.then(()=>{previewPending.current=false;},()=>{stopPreview();setAudioError('Die Hörprobe konnte nicht starten.');});
    else previewPending.current=false;
  }
  return <section className="a1-day2-music" aria-label={challenge?'Liedtext-Challenge':'Lied anhören'}>
    <h1>{challenge?'Welche Zeile kommt als Nächstes?':'Höre das ganze Lied'}</h1>
    {loading&&<p role="status">Die veröffentlichte Aufnahme wird gesucht…</p>}
    {error&&<p role="status">{error}</p>}
    {track&&<>
      <BasicCard><span className="a1-day2-label">FALOWEN MUSIC · A1 · TAG 2</span><h2>{track.title}</h2>
        <audio ref={audio} src={track.src} controls preload="none" aria-label={'A1 Tag 2 Musik: '+track.title}
          onTimeUpdate={e=>{
            const t=e.currentTarget.currentTime;setTime(t);
            if(previewEnd.current!==null && t>=previewEnd.current){e.currentTarget.pause();stopPreview();}
          }}
          onSeeking={e=>{if(previewEnd.current!==null && (e.currentTarget.currentTime< (active?.start??0) || e.currentTarget.currentTime>=previewEnd.current))stopPreview();}}
          onPlay={()=>{if(!previewPending.current)stopPreview();}}
          onEnded={()=>{stopPreview();setTime(0);}}
          onError={()=>setAudioError('MP3 konnte nicht abgespielt werden. Bitte den R2-Link prüfen.')} />
        <div className="a1-day2-actions"><button type="button" onClick={playFull}>▶ Ganzes Lied abspielen</button>
        <a href={'https://music.falowen.app/?track='+encodeURIComponent(track.id)} target="_blank" rel="noopener noreferrer">In Falowen Music öffnen</a></div>
        {audioError&&<p role="alert">{audioError}</p>}
      </BasicCard>
      {!challenge&&<BasicCard><h3>Hör zu: Welche Wörter hörst du?</h3>
        <div className="a1-day2-chip-row">{['ich','du','er','sie','es','heißen','wohnen','kommen'].map(word=><span key={word}>{word}</span>)}</div>
        <p>Spiele das ganze Lied zuerst ab. Danach folgt die Liedtext-Challenge.</p>
        {!verified&&<p role="status">Für diese Aufnahme gibt es noch keine geprüften Zeilen mit vollständigen Zeitmarken. Der komplette Song kann trotzdem abgespielt werden.</p>}
      </BasicCard>}
      {challenge&&(active? <BasicCard>
        <p className="a1-day2-label">FRAGE {question+1} / {questions.length}</p>
        <p><strong>Höre die Zeile. Wie geht es weiter?</strong></p>
        <button type="button" onClick={playExcerpt}>▶ Ausschnitt abspielen {preview?'(läuft)':''}</button>
        <blockquote lang="de">{active.current}</blockquote>
        <div className="a1-day2-options" role="group" aria-label="Wähle die nächste Liedzeile">
          {active.options.map((option,i)=><button key={i} type="button" aria-pressed={choice===i}
            className={choice===i?'is-selected':''} onClick={()=>{setChoice(i);setReveal(false);}}>
            {String.fromCharCode(65+i)}. {option}</button>)}
        </div>
        <div className="a1-day2-actions">
          <button type="button" disabled={choice<0} onClick={()=>setReveal(v=>!v)}>{reveal?'Antwort verbergen':'Antwort zeigen'}</button>
          <button type="button" onClick={()=>{setQuestion(i=>(i+1)%questions.length);setChoice(-1);setReveal(false);stopPreview();audio.current?.pause();}}>Nächste Frage →</button>
        </div>
        {reveal&&<p role="status"><strong>{choice===active.correctIndex?'Richtig!':'Die richtige Liedzeile:'}</strong> {active.next}</p>}
      </BasicCard> : <BasicCard><h3>Diese Aufnahme hat noch keine verifizierte Liedtext-Challenge.</h3>
        <p>Für „Was kommt als Nächstes?“ brauchen wir exakte, veröffentlichte Lyrics und geprüfte Zeitmarken für genau diese MP3. Keine erfundenen Ausschnitte oder Antworten.</p>
        <a href="https://admin.falowen.app/music-studio" target="_blank" rel="noopener noreferrer">Musikstudio öffnen</a>
      </BasicCard>)}
    </>}
  </section>;
}
export default function A1Day2TeachingStage({step}){
  const [show,setShow]=useState(false);
  const [question,setQuestion]=useState(0);
  const [choice,setChoice]=useState(-1);
  const [verb,setVerb]=useState('heißen');
  useEffect(()=>{setShow(false);setQuestion(0);setChoice(-1);setVerb('heißen');},[step]);
  if(step==='music'||step==='music-challenge')return <A1Day2Music challenge={step==='music-challenge'}/>;
  return <section className="a1-day2-lesson" lang="de">
    {step==='welcome'&&<><h1>Das Alphabet und die Personalpronomen</h1><p>Heute lernen wir:</p>
      <div className="a1-day2-grid">{['Das Alphabet','ich · du · er · sie · es','heißen · wohnen · kommen','Fragen und Antworten'].map(t=><BasicCard key={t}><h2>{t}</h2></BasicCard>)}</div>
      <p>Erst lernen, dann sprechen und zuletzt mit Musik üben.</p></>}
    {step==='alphabet'&&<><h1>Das deutsche Alphabet</h1><p>Sprich jeden Buchstaben nach.</p>
      <div className="a1-day2-letters">{ABC.map(letter=><span key={letter}>{letter}</span>)}</div>
      <p>26 Buchstaben: A bis Z.</p></>}
    {step==='special'&&<><h1>Die besonderen Buchstaben</h1><div className="a1-day2-special">
      {DETAILS.map(([letter,name,example])=><BasicCard key={letter}><strong>{letter}</strong><span>{name}</span><p>{example}</p></BasicCard>)}</div>
      <p>Ä, Ö und Ü sind Umlaute. ß heißt Eszett oder scharfes S.</p></>}
    {step==='spell'&&<><h1>Wie buchstabierst du deinen Namen?</h1><BasicCard><h2>Wie buchstabiert man „Felix“?</h2>
      {show?<p className="a1-day2-biganswer">F – E – L – I – X</p>:<p>Sprich die Buchstaben laut.</p>}
      <button type="button" onClick={()=>setShow(v=>!v)}>{show?'Antwort verbergen':'Antwort zeigen'}</button></BasicCard>
      <p>Jetzt du: Buchstabiere deinen Namen, Accra und Berlin.</p></>}
    {step==='pronouns'&&<><h1>Die Personalpronomen</h1><p>Heute nur die fünf Singularformen.</p>
      <table><thead><tr><th>Deutsch</th><th>English</th></tr></thead><tbody>{A1_DAY2_PRONOUNS.map(p=><tr key={p.de}><th scope="row">{p.de}</th><td>{p.en}</td></tr>)}</tbody></table>
      <p><strong>es</strong>: Das Kind heißt Leo. Es wohnt in Berlin.</p></>}
    {step==='verbs'&&<><h1>Die Verbkonjugation</h1><p>ich: -e · du: -st · er/sie/es: -t</p>
      <div className="a1-day2-verb-switch">{['heißen','wohnen','kommen'].map(v=><button type="button" key={v} className={verb===v?'is-selected':''} aria-pressed={verb===v} onClick={()=>setVerb(v)}>{v}</button>)}</div>
      <table><thead><tr><th>Pronomen</th><th>{verb}</th></tr></thead><tbody>{A1_DAY2_PRONOUNS.map(p=><tr key={p.de}><th scope="row">{p.de}</th><td>{p[verb]}</td></tr>)}</tbody></table>
      <p>Wichtig: <strong>du heißt</strong> (nicht „heißst“). Alle Formen: heißen, wohnen und kommen.</p></>}
    {step==='sentences'&&<><h1>Bilde ganze Sätze!</h1><p>Pronomen + Verb + weitere Informationen.</p>
      <div className="a1-day2-sentences">{SENTENCES.map(t=><BasicCard key={t}><h2>{t}</h2></BasicCard>)}</div></>}
    {step==='practice'&&<><h1>Welches Verb ist richtig?</h1><BasicCard>
      <p className="a1-day2-label">FRAGE {question+1} / {A1_DAY2_QUIZ.length}</p>
      <h2>{A1_DAY2_QUIZ[question].prompt}</h2>
      <div className="a1-day2-options">{A1_DAY2_QUIZ[question].options.map((option,i)=><button type="button" key={i} aria-pressed={choice===i} className={choice===i?'is-selected':''} onClick={()=>setChoice(i)}>{String.fromCharCode(65+i)}. {option}</button>)}</div>
      {choice>=0&&<p role="status">{choice===A1_DAY2_QUIZ[question].answer?'Richtig!':'Versuch es noch einmal.'}</p>}
      <button type="button" onClick={()=>{setQuestion(i=>(i+1)%A1_DAY2_QUIZ.length);setChoice(-1);}}>Nächste Frage →</button>
    </BasicCard></>}
    {step==='partners'&&<><h1>Frag deinen Partner!</h1><BasicCard><div className="a1-day2-dialogue">
      <p><strong>A:</strong> Wie heißt du?<br/><strong>B:</strong> Ich heiße …</p>
      <p><strong>A:</strong> Wo wohnst du?<br/><strong>B:</strong> Ich wohne in …</p>
      <p><strong>A:</strong> Woher kommst du?<br/><strong>B:</strong> Ich komme aus …</p>
    </div></BasicCard><p>Wechselt die Rollen. Stell dann einen Partner vor: <strong>Er heißt … / Sie wohnt …</strong></p></>}
    {step==='recap'&&<><h1>Was hast du heute gelernt?</h1><BasicCard><ol>
      {ANSWER_CHECKS.map(([prompt,answer])=><li key={prompt}><p>{prompt}</p>{show&&<strong>{answer}</strong>}</li>)}
    </ol><button type="button" onClick={()=>setShow(v=>!v)}>{show?'Antworten verbergen':'Antworten zeigen'}</button></BasicCard>
      <p>Gut gemacht! Übe die Namen, Pronomen und drei Verben zu Hause.</p></>}
  </section>;
}
