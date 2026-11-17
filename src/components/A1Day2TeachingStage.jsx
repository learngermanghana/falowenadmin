import { useEffect, useState } from 'react';
import { A1_DAY2_PRONOUNS, A1_DAY2_QUIZ } from '../data/a1Day2Classroom.js';
import PublishedSongLessonStage from './PublishedSongLessonStage.jsx';
import './A1Day2TeachingStage.css';

const ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DETAILS=[['Ä','A-Umlaut','Äpfel'],['Ö','O-Umlaut','Öl'],['Ü','U-Umlaut','Übung'],['ß','Eszett','Straße']];
const SENTENCES=[
  'Ich heiße Anna.','Du wohnst in Accra.','Er kommt aus Ghana.',
  'Sie heißt Maria.','Das Kind heißt Leo. Es kommt aus Berlin.',
];
const ANSWER_CHECKS=[['Buchstabiere deinen Namen.','Beispiel: F – E – L – I – X.'],['Nenne fünf Personalpronomen.','ich, du, er, sie, es'],['Ich ___ in Accra.','wohne'],['Du ___ aus Ghana.','kommst']];
function BasicCard({children}){return <div className="a1-day2-card">{children}</div>;}
export default function A1Day2TeachingStage({step}){
  const [show,setShow]=useState(false);
  const [question,setQuestion]=useState(0);
  const [choice,setChoice]=useState(-1);
  const [verb,setVerb]=useState('heißen');
  useEffect(()=>{setShow(false);setQuestion(0);setChoice(-1);setVerb('heißen');},[step]);
  if(step==='music')return <PublishedSongLessonStage assignmentKey="A1-0.2" courseDay={2} compact nextLyricOnly />;
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
