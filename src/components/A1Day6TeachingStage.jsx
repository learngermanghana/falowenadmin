import { useState } from "react";
import {
  A1_DAY6_FAMILY, A1_DAY6_POSSESSIVE_QUIZ, A1_DAY6_DISCUSSION_PROMPTS,
  A1_DAY6_LANGUAGES, A1_DAY6_YES_NO_QUESTIONS, A1_DAY6_HOBBIES,
} from "../data/a1Day6Classroom.js";
import "./A1Day6TeachingStage.css";

function Eyebrow({children}) {
  return <span className="a1-day6-eyebrow">{children}</span>;
}
function Reveal({children,answer}) {
  const [open,setOpen]=useState(false);
  return <div className="a1-day6-reveal">
    <button type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
      {open?"Antwort verbergen":children || "Antwort zeigen"}
    </button>
    {open?<p role="status">{answer}</p>:null}
  </div>;
}
function Intro() {
  return <section className="a1-day6-page" lang="de">
    <Eyebrow>A1 · Day 6 · Familie, Sprachen und Hobbys</Eyebrow>
    <h1>Was machst du gern?</h1>
    <p className="a1-day6-lead">Heute sprechen wir über unsere Familie, unsere Sprachen und unsere Freizeit.</p>
    <div className="a1-day6-topics">
      <article className="a1-day6-blue"><b aria-hidden="true">♧</b><strong>Familie</strong><span>Das ist meine Mutter.</span></article>
      <article className="a1-day6-teal"><b aria-hidden="true">◎</b><strong>Sprachen</strong><span>Ich spreche Deutsch.</span></article>
      <article className="a1-day6-violet"><b aria-hidden="true">♫</b><strong>Hobbys</strong><span>Ich lese gern.</span></article>
    </div>
    <small className="a1-day6-note">Heute üben wir gemeinsam. Das Workbook ist eine unbenotete Selbstübung.</small>
  </section>;
}
function Family() {
  return <section className="a1-day6-page" lang="de">
    <Eyebrow>Familie · Wortschatz</Eyebrow>
    <h1>Meine Familie</h1>
    <p className="a1-day6-lead">Lerne die Familienwörter immer mit Artikel.</p>
    <div className="a1-day6-card-grid">
      {A1_DAY6_FAMILY.map(item=><article key={item.noun} className={`a1-day6-family-card a1-day6-${item.tone}`}>
        <small>{item.english}</small><strong>{item.article} {item.noun}</strong>
        <span>{item.example}</span>
      </article>)}
    </div>
    <small className="a1-day6-note">Sage den Satz: Das ist mein Vater. · Das ist meine Mutter.</small>
  </section>;
}
function Possessives() {
  const [index,setIndex]=useState(0);
  const [choice,setChoice]=useState("");
  const [show,setShow]=useState(false);
  const active=A1_DAY6_POSSESSIVE_QUIZ[index];
  const next=()=>{setIndex(i=>(i+1)%A1_DAY6_POSSESSIVE_QUIZ.length);setChoice("");setShow(false);};
  return <section className="a1-day6-page" lang="de">
    <Eyebrow>Mein oder meine? · {index+1}/{A1_DAY6_POSSESSIVE_QUIZ.length}</Eyebrow>
    <h1>Wähle das richtige Wort.</h1>
    <p className="a1-day6-lead">Erst auswählen, dann das Beispiel zeigen.</p>
    <div className="a1-day6-drill">
      <div className="a1-day6-target"><span>___</span> {active.noun}</div>
      <div className="a1-day6-choices" role="group" aria-label="Possessivwort auswählen">
        {["mein","meine"].map(v=><button type="button" key={v}
          aria-pressed={choice===v} className={choice===v?"is-picked":""}
          onClick={()=>{setChoice(v);setShow(false);}}>{v}</button>)}
      </div>
      <div className="a1-day6-buttons">
        <button type="button" disabled={!choice} onClick={()=>setShow(v=>!v)} aria-expanded={show}>
          {show?"Lösung verbergen":"Lösung zeigen"}
        </button>
        <button type="button" className="a1-day6-secondary" onClick={next}>Nächstes Wort</button>
      </div>
      {show?<div role="status" className={choice===active.answer?"a1-day6-feedback a1-day6-good":"a1-day6-feedback a1-day6-try"}>
        {choice===active.answer?"Richtig!":"Noch einmal überlegen."} <strong>{active.example}</strong>
      </div>:null}
    </div>
    <p className="a1-day6-rule">Merke: <b>mein Vater · mein Bruder · meine Mutter · meine Schwester · meine Eltern</b></p>
  </section>;
}
function FamilyWriting() {
  const [opened,setOpened]=useState([]);
  const toggle=i=>setOpened(old=>old.includes(i)?old.filter(x=>x!==i):[...old,i]);
  return <section className="a1-day6-page" lang="de">
    <Eyebrow>Meine Familie · Schreibvorbereitung</Eyebrow>
    <h1>6–8 Sätze über dich</h1>
    <p className="a1-day6-lead">Formuliere eigene Sätze. Die Beispiele kannst du danach öffnen.</p>
    <div className="a1-day6-writing-grid">
      {A1_DAY6_DISCUSSION_PROMPTS.map(([label,sentence],i)=><article key={label}>
        <span className="a1-day6-count">{i+1}</span>
        <div><strong>{label}</strong><p>{opened.includes(i)?sentence:"Dein eigener Satz"}</p></div>
        <button type="button" aria-expanded={opened.includes(i)} onClick={()=>toggle(i)}>
          {opened.includes(i)?"Verbergen":"Beispiel"}
        </button>
      </article>)}
    </div>
    <small className="a1-day6-note">Freiwillige Selbstübung für die Gruppendiskussion, keine benotete Abgabe. Keine Daten werden auf dieser Folie gespeichert.</small>
  </section>;
}
function Languages() {
  const [active,setActive]=useState(0);
  return <section className="a1-day6-page" lang="de">
    <Eyebrow>Sprachen</Eyebrow>
    <h1>Welche Sprachen sprichst du?</h1>
    <p className="a1-day6-lead">Wähle eine Sprache und lies das Beispiel laut.</p>
    <div className="a1-day6-language-grid">
      {A1_DAY6_LANGUAGES.map(([language],i)=><button type="button" key={language}
        aria-pressed={active===i} className={active===i?"is-picked":""} onClick={()=>setActive(i)}>{language}</button>)}
    </div>
    <div className="a1-day6-example" role="status">{A1_DAY6_LANGUAGES[active][1]}</div>
    <small className="a1-day6-note">Antworte mit deinen echten Sprachkenntnissen. Du kannst mehr als eine Sprache nennen.</small>
  </section>;
}
function LittleGerman() {
  const [shown,setShown]=useState(false);
  return <section className="a1-day6-page" lang="de">
    <Eyebrow>Sprachen · ein bisschen</Eyebrow>
    <h1>Ich spreche ein bisschen Deutsch.</h1>
    <div className="a1-day6-formula">
      <span>Ich</span><span>spreche</span><span className="a1-day6-emphasis">ein bisschen</span><span>Deutsch.</span>
    </div>
    <p className="a1-day6-lead">Was bedeutet <b>ein bisschen</b>? Sage die Bedeutung, dann öffne die Erklärung.</p>
    <div className="a1-day6-buttons">
      <button type="button" aria-expanded={shown} onClick={()=>setShown(v=>!v)}>{shown?"Erklärung verbergen":"Erklärung zeigen"}</button>
    </div>
    {shown?<div className="a1-day6-rule" role="status">
      <strong>ein bisschen = a little</strong>
      <span>Richtig: Ich spreche <b>ein bisschen</b> Deutsch.</span>
      <span>Nicht: <s>Ich spreche bisschen Deutsch.</s></span>
    </div>:null}
  </section>;
}
function YesNoRule() {
  return <section className="a1-day6-page" lang="de">
    <Eyebrow>Ja/Nein-Fragen · Satzbau</Eyebrow>
    <h1>Das Verb steht zuerst.</h1>
    <p className="a1-day6-lead">Vergleiche den Aussagesatz mit der Ja/Nein-Frage.</p>
    <div className="a1-day6-example-pair">
      <article><small>Aussage</small><strong>Du spielst Fußball.</strong></article>
      <article><small>Ja/Nein-Frage</small><strong><mark>Spielst</mark> du Fußball?</strong></article>
    </div>
    <div className="a1-day6-formula"><span className="a1-day6-emphasis">Verb</span><b>+</b><span>Subjekt</span><b>+</b><span>Rest?</span></div>
    <p className="a1-day6-rule">Sprichst du Deutsch? · Spielt er Fußball? · Kochst du gern?</p>
    <small className="a1-day6-note">Eine Ja/Nein-Frage beginnt mit dem konjugierten Verb. Nicht mit „du“.</small>
  </section>;
}
function YesNoQuiz() {
  const [index,setIndex]=useState(0);
  const [show,setShow]=useState(false);
  const question=A1_DAY6_YES_NO_QUESTIONS[index];
  return <section className="a1-day6-page" lang="de">
    <Eyebrow>Fragen bilden · {index+1}/{A1_DAY6_YES_NO_QUESTIONS.length}</Eyebrow>
    <h1>Bilde eine Ja/Nein-Frage.</h1>
    <p className="a1-day6-lead">Verändere die Wortstellung. Das Verb kommt zuerst.</p>
    <div className="a1-day6-drill">
      <small>Aussage</small><strong className="a1-day6-statement">{question.statement}</strong>
      <div className="a1-day6-word-tiles">{question.words.map((word,i)=><span key={i}>{word}</span>)}</div>
      <div className="a1-day6-buttons">
        <button type="button" aria-expanded={show} onClick={()=>setShow(v=>!v)}>{show?"Antwort verbergen":"Antwort zeigen"}</button>
        <button type="button" className="a1-day6-secondary" onClick={()=>{setIndex(i=>(i+1)%A1_DAY6_YES_NO_QUESTIONS.length);setShow(false);}}>Nächste Frage</button>
      </div>
      {show?<div className="a1-day6-feedback a1-day6-good" role="status"><strong>{question.answer}</strong><span>{question.explanation}</span></div>:null}
    </div>
  </section>;
}
function Hobbies() {
  const [chosen,setChosen]=useState(-1);
  return <section className="a1-day6-page" lang="de">
    <Eyebrow>Meine Hobbys · gern</Eyebrow>
    <h1>Was machst du gern?</h1>
    <p className="a1-day6-lead">Wähle ein Hobby, bilde einen Satz und zeige dann das Modell.</p>
    <div className="a1-day6-hobbies">
      {A1_DAY6_HOBBIES.map((hobby,i)=><button type="button" key={hobby.noun}
        aria-pressed={chosen===i} className={chosen===i?"is-picked":""} onClick={()=>setChosen(i)}>
        <span aria-hidden="true">{hobby.icon}</span><strong>{hobby.noun}</strong>
      </button>)}
    </div>
    {chosen>=0?<div className="a1-day6-example" role="status">
      <Reveal key={chosen} answer={A1_DAY6_HOBBIES[chosen].sentence}>Beispielsatz zeigen</Reveal>
    </div>:<p className="a1-day6-rule">Verb + <b>gern</b> bedeutet: Du machst die Aktivität mit Freude.</p>}
    <small className="a1-day6-note">Ich lese gern. · Ich spiele gern Fußball. · Ich koche gern.</small>
  </section>;
}
function LiveQuiz({question}) {
  const [open,setOpen]=useState(false);
  return <section className="a1-day6-page a1-day6-live" lang="de">
    <Eyebrow>Live-Quiz · eine Frage pro Student</Eyebrow>
    <h1>Eine Frage für dich!</h1>
    <p className="a1-day6-lead">Wähle zuerst einen Studenten oben und höre die Antwort an.</p>
    {question?<div className="a1-day6-drill">
      <h2>{question.questionDe}</h2>
      <button type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?"Antwort verbergen":"Antwort zeigen"}</button>
      {open?<div className="a1-day6-feedback a1-day6-good" role="status">
        <strong>{question.answerDe}</strong>{question.noteEn?<small>{question.noteEn}</small>:null}
      </div>:null}
    </div>:<div className="a1-day6-drill a1-day6-empty" role="status">
      <strong>Student auswählen</strong><p>Die individuelle Frage erscheint im vorhandenen Teilnahmebereich.</p>
    </div>}
    <small className="a1-day6-note">Correct / Needs review wird nur mit dem bestehenden Teilnahmebereich dokumentiert. Keine automatische Note.</small>
  </section>;
}
function Recap() {
  const [visible,setVisible]=useState(false);
  return <section className="a1-day6-page a1-day6-recap" lang="de">
    <Eyebrow>Abschluss · Selbstübung</Eyebrow>
    <h2>Kannst du das schon?</h2>
    <p>1. Ergänze <b>mein / meine</b>. 2. Bilde eine Ja/Nein-Frage. 3. Sage, was du <b>gern</b> machst.</p>
    <div className="a1-day6-buttons"><button type="button" aria-expanded={visible}
      onClick={()=>setVisible(v=>!v)}>{visible?"Modelle verbergen":"Modelle zeigen"}</button></div>
    {visible?<div className="a1-day6-rule" role="status">
      <span>mein Vater · meine Mutter</span>
      <span>Du spielst Fußball. → Spielst du Fußball?</span>
      <span>Ich lese gern. · Ich spreche ein bisschen Deutsch.</span>
    </div>:null}
  </section>;
}
export default function A1Day6TeachingStage({step,question=null}) {
  if(step==="intro")return <Intro/>;
  if(step==="family")return <Family/>;
  if(step==="possessives")return <Possessives/>;
  if(step==="family-writing")return <FamilyWriting/>;
  if(step==="languages")return <Languages/>;
  if(step==="ein-bisschen")return <LittleGerman/>;
  if(step==="yes-no-rule")return <YesNoRule/>;
  if(step==="yes-no-quiz")return <YesNoQuiz/>;
  if(step==="hobbies")return <Hobbies/>;
  if(step==="live-quiz")return <LiveQuiz key={question?.id||question?.questionDe||"no-student"} question={question}/>;
  if(step==="wrapup")return <Recap/>;
  return null;
}
