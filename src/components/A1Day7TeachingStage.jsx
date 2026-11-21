import { useState } from "react";
import {
  A1_DAY7_PRODUCTS, A1_DAY7_COST_CHOICES, A1_DAY7_PRONOUN_CHOICES,
  A1_DAY7_PREFERENCES, A1_DAY7_COMPARE, A1_DAY7_FAMILY_WRITING,
} from "../data/a1Day7Classroom.js";
import "./A1Day7TeachingStage.css";

function Eyebrow({children}){return <span className="a1-day7-kicker">{children}</span>;}
function Action({expanded,onClick,children}) {
  return <button type="button" className="a1-day7-action" aria-expanded={expanded} onClick={onClick}>
    {children || (expanded?"Antwort verbergen":"Antwort zeigen")}
  </button>;
}
function Intro(){return <section className="a1-day7-page" lang="de">
  <Eyebrow>A1 · Day 7 · Preise und Vorlieben</Eyebrow>
  <h1>Wie viel kostet das?</h1>
  <p className="a1-day7-lead">Heute sprechen wir über Preise, benutzen er/sie/es und sagen, was wir gern oder lieber machen.</p>
  <div className="a1-day7-three">
    <article className="a1-day7-blue"><span aria-hidden="true">🛍️</span><strong>Preise</strong><small>Das Buch kostet 20 Euro.</small></article>
    <article className="a1-day7-teal"><span aria-hidden="true">💬</span><strong>Pronomen</strong><small>Es kostet 20 Euro.</small></article>
    <article className="a1-day7-violet"><span aria-hidden="true">♥</span><strong>Vorlieben</strong><small>Ich trinke lieber Tee.</small></article>
  </div>
  <small className="a1-day7-note">Am Ende bearbeiten die Lernenden die drei Teile des tutorbewerteten Workbooks.</small>
</section>;}

function ProductCards(){return <section className="a1-day7-page" lang="de">
  <Eyebrow>Preise · Alltagswörter</Eyebrow>
  <h1>Was kostet das?</h1>
  <p className="a1-day7-lead">Lies den Gegenstand mit Artikel und Preis. Dies sind Beispielpreise, keine echten Angebote.</p>
  <div className="a1-day7-products">
    {A1_DAY7_PRODUCTS.map(item=><article className={`a1-day7-product a1-day7-${item.tone}`} key={item.noun}>
      <span aria-hidden="true" className="a1-day7-symbol">{item.icon}</span>
      <strong>{item.noun}</strong><span className="a1-day7-price">{item.price.toLocaleString("de-DE")} €</span>
    </article>)}
  </div>
  <small className="a1-day7-note">ein Gegenstand = kostet · mehrere Gegenstände = kosten</small>
</section>;}

function CostRule(){
  const [index,setIndex]=useState(0),[choice,setChoice]=useState(""),[show,setShow]=useState(false);
  const item=A1_DAY7_COST_CHOICES[index];
  return <section className="a1-day7-page" lang="de">
    <Eyebrow>kostet oder kosten? · {index+1}/{A1_DAY7_COST_CHOICES.length}</Eyebrow>
    <h1>Einzahl oder Mehrzahl?</h1><p className="a1-day7-lead">Vervollständige den Satz. Die Lösung kommt erst danach.</p>
    <div className="a1-day7-drill">
      <strong className="a1-day7-big">{item.subject} _____ ... Euro.</strong>
      <div className="a1-day7-choice-row" role="group" aria-label="Verb auswählen">
        {["kostet","kosten"].map(v=><button type="button" key={v} aria-pressed={choice===v}
          className={choice===v?"is-selected":""} onClick={()=>{setChoice(v);setShow(false);}}>{v}</button>)}
      </div>
      <div className="a1-day7-actions"><Action expanded={show} onClick={()=>setShow(v=>!v)}>{show?"Antwort verbergen":"Antwort zeigen"}</Action>
        <button type="button" className="a1-day7-outline" onClick={()=>{setIndex(i=>(i+1)%A1_DAY7_COST_CHOICES.length);setChoice("");setShow(false);}}>Nächstes Beispiel</button></div>
      {show?<div className="a1-day7-answer" role="status"><strong>{item.sentence}</strong><small>{choice?choice===item.answer?"Richtig!":"Prüfe noch einmal Einzahl und Mehrzahl.":""}</small></div>:null}
    </div>
    <div className="a1-day7-rule"><b>1 Sache → kostet</b><b>mehrere Sachen → kosten</b></div>
  </section>;
}

function PriceDialogue(){
  const [index,setIndex]=useState(0),[show,setShow]=useState(false);
  const item=A1_DAY7_PRODUCTS[index];
  const question=`Wie viel ${item.plural?"kosten":"kostet"} ${item.noun}?`;
  const answer=`${item.pronoun[0].toUpperCase()+item.pronoun.slice(1)} ${item.plural?"kosten":"kostet"} ${item.price.toLocaleString("de-DE")} Euro.`;
  return <section className="a1-day7-page" lang="de">
    <Eyebrow>Fragen und Antworten · {index+1}/{A1_DAY7_PRODUCTS.length}</Eyebrow>
    <h1>Wie viel kostet das?</h1>
    <div className="a1-day7-dialogue">
      <div className="a1-day7-dialogue-item"><span aria-hidden="true">{item.icon}</span><strong>{item.noun}</strong></div>
      <div className="a1-day7-speech"><span>Frage</span><strong>{question}</strong></div>
      <div className="a1-day7-actions"><Action expanded={show} onClick={()=>setShow(v=>!v)}/>
        <button className="a1-day7-outline" type="button" onClick={()=>{setIndex(i=>(i+1)%A1_DAY7_PRODUCTS.length);setShow(false);}}>Nächster Gegenstand</button></div>
      {show?<div className="a1-day7-answer" role="status"><span>Antwort</span><strong>{answer}</strong></div>:null}
    </div>
    <small className="a1-day7-note">Frage eine Person aus der Klasse. Die Modellantwort erst danach zeigen.</small>
  </section>;
}

function Pronouns(){return <section className="a1-day7-page" lang="de">
  <Eyebrow>Personalpronomen · Preise</Eyebrow><h1>der → er · die → sie · das → es</h1>
  <p className="a1-day7-lead">Statt das Nomen zu wiederholen, benutzen wir ein Pronomen.</p>
  <div className="a1-day7-three">
    <article className="a1-day7-blue"><b>der</b><strong>er</strong><small>der Stuhl → Er kostet 50 Euro.</small></article>
    <article className="a1-day7-teal"><b>die</b><strong>sie</strong><small>die Lampe → Sie kostet 15 Euro.</small></article>
    <article className="a1-day7-violet"><b>das</b><strong>es</strong><small>das Buch → Es kostet 20 Euro.</small></article>
  </div>
  <div className="a1-day7-rule">Plural: <b>die Bücher → sie</b> · Sie kosten 30 Euro.</div>
  <small className="a1-day7-note">„die“ im Singular und im Plural wird zu „sie“. Das Verb zeigt die Zahl: kostet oder kosten.</small>
</section>;}

function PronounQuiz(){
  const [index,setIndex]=useState(0),[answer,setAnswer]=useState(""),[show,setShow]=useState(false);
  const item=A1_DAY7_PRONOUN_CHOICES[index];
  return <section className="a1-day7-page" lang="de">
    <Eyebrow>Pronomen-Quiz · {index+1}/{A1_DAY7_PRONOUN_CHOICES.length}</Eyebrow>
    <h1>Er, sie oder es?</h1><p className="a1-day7-lead">Welches Pronomen ersetzt das Nomen?</p>
    <div className="a1-day7-drill">
      <strong className="a1-day7-big">{item.noun}</strong>
      <div className="a1-day7-choice-row" role="group" aria-label="Pronomen auswählen">
        {["er","sie","es"].map(v=><button type="button" key={v} aria-pressed={answer===v}
          className={answer===v?"is-selected":""} onClick={()=>{setAnswer(v);setShow(false);}}>{v}</button>)}
      </div>
      <div className="a1-day7-actions"><Action expanded={show} onClick={()=>setShow(v=>!v)}/>
        <button className="a1-day7-outline" type="button" onClick={()=>{setIndex(i=>(i+1)%A1_DAY7_PRONOUN_CHOICES.length);setAnswer("");setShow(false);}}>Nächstes Nomen</button></div>
      {show?<div className="a1-day7-answer" role="status"><strong>{item.sentence}</strong><small>{answer===item.answer?"Richtig!":"Das Pronomen ist "+item.answer+"."}</small></div>:null}
    </div>
  </section>;
}

function MagGern(){
  const [shown,setShown]=useState(-1);
  return <section className="a1-day7-page" lang="de">
    <Eyebrow>Vorlieben · mag / gern</Eyebrow><h1>Was magst du? Was machst du gern?</h1>
    <p className="a1-day7-lead">Wähle die passende Regel. Lies zuerst den Satz.</p>
    <div className="a1-day7-preferences">
      {A1_DAY7_PREFERENCES.map((item,i)=><article key={item.label}>
        <small>{item.label}</small><strong>{item.sentence}</strong>
        <button type="button" aria-expanded={shown===i} onClick={()=>setShown(v=>v===i?-1:i)}>
          {shown===i?"Erklärung verbergen":"Warum?"}</button>
        {shown===i?<p role="status">{item.note}</p>:null}
      </article>)}
    </div>
    <div className="a1-day7-rule">Ich <b>mag</b> Pizza. · Ich <b>esse gern</b> Pizza.</div>
  </section>;
}

function Lieber(){
  const [index,setIndex]=useState(0),[show,setShow]=useState(false);
  const item=A1_DAY7_COMPARE[index];
  return <section className="a1-day7-page" lang="de">
    <Eyebrow>Vergleichen · lieber</Eyebrow><h1>Was machst du lieber?</h1>
    <div className="a1-day7-compare">
      <article><span>gern</span><strong>{item.a}</strong></article>
      <article><span>lieber</span><strong>{item.b}</strong></article>
    </div>
    <p className="a1-day7-lead">{item.question}</p>
    <div className="a1-day7-actions"><Action expanded={show} onClick={()=>setShow(v=>!v)}/>
      <button type="button" className="a1-day7-outline" onClick={()=>{setIndex(i=>(i+1)%A1_DAY7_COMPARE.length);setShow(false);}}>Nächster Vergleich</button></div>
    {show?<div role="status" className="a1-day7-answer"><strong>{item.answer}</strong></div>:null}
    <small className="a1-day7-note">gern = ich mache es gern · lieber = ich bevorzuge es.</small>
  </section>;
}

function FamilyWriting(){
  const [opened,setOpened]=useState([]);
  const toggle=i=>setOpened(v=>v.includes(i)?v.filter(x=>x!==i):[...v,i]);
  return <section className="a1-day7-page" lang="de">
    <Eyebrow>Workbook Teil 2 · Schreiben</Eyebrow><h1>Beschreibe deine Familie.</h1>
    <p className="a1-day7-lead">Bereite den kurzen Text vor. Die fünf Punkte gehören zur echten Schreibaufgabe.</p>
    <div className="a1-day7-writing-grid">
      {A1_DAY7_FAMILY_WRITING.map((item,i)=><article key={item.label}>
        <span className="a1-day7-counter">{i+1}</span><div><strong>{item.label}</strong>
          <p>{opened.includes(i)?item.example:"Formuliere einen eigenen Satz."}</p></div>
        <button type="button" aria-expanded={opened.includes(i)} onClick={()=>toggle(i)}>
          {opened.includes(i)?"Verbergen":"Beispiel"}</button>
      </article>)}
    </div>
    <small className="a1-day7-note">Dies ist nur die Unterrichtsvorbereitung. Die benotete Abgabe erfolgt ausschließlich im bestehenden Falowen Workbook.</small>
  </section>;
}

function LiveQuiz({question}){
  const [show,setShow]=useState(false);
  return <section className="a1-day7-page a1-day7-live" lang="de">
    <Eyebrow>Live-Quiz · eine Frage pro Student</Eyebrow><h1>Was weißt du schon?</h1>
    <p className="a1-day7-lead">Wähle oben einen Studenten. Höre zuerst die Antwort.</p>
    {question?<div className="a1-day7-drill"><h2>{question.questionDe}</h2>
      <Action expanded={show} onClick={()=>setShow(v=>!v)}/>
      {show?<div className="a1-day7-answer" role="status"><strong>{question.answerDe}</strong>
        {question.noteEn?<small>{question.noteEn}</small>:null}</div>:null}
    </div>:<div className="a1-day7-drill a1-day7-empty" role="status">
      <strong>Student auswählen</strong><p>Die individuelle Frage erscheint nach der Auswahl im bestehenden Teilnahmebereich.</p>
    </div>}
    <small className="a1-day7-note">Correct / Needs review wird nur über die bestehenden Teilnahme- und Ergebnisfunktionen erfasst. Keine automatische Workbook-Bewertung.</small>
  </section>;
}

function Recap(){
  const [show,setShow]=useState(false);
  return <section className="a1-day7-page a1-day7-recap" lang="de">
    <Eyebrow>Abschluss · Workbook</Eyebrow><h2>Bereit für die drei Teile?</h2>
    <p>1. Wie viel <b>kostet/kosten</b> das? 2. Ersetze das Nomen mit <b>er/sie/es</b>. 3. Sage, was du <b>gern/lieber</b> machst.</p>
    <Action expanded={show} onClick={()=>setShow(v=>!v)}>{show?"Beispiele verbergen":"Beispiele zeigen"}</Action>
    {show?<div className="a1-day7-rule" role="status">
      <span>Das Buch kostet 20 Euro. Es kostet 20 Euro.</span>
      <span>Die Äpfel kosten 5 Euro. Sie kosten 5 Euro.</span>
      <span>Ich lese gern, aber ich reise lieber.</span></div>:null}
  </section>;
}
export default function A1Day7TeachingStage({step,question=null}){
  if(step==="intro")return <Intro/>;
  if(step==="products")return <ProductCards/>;
  if(step==="cost-rule")return <CostRule/>;
  if(step==="price-dialogue")return <PriceDialogue/>;
  if(step==="pronouns")return <Pronouns/>;
  if(step==="pronoun-quiz")return <PronounQuiz/>;
  if(step==="mag-gern")return <MagGern/>;
  if(step==="lieber")return <Lieber/>;
  if(step==="family-writing")return <FamilyWriting/>;
  if(step==="live-quiz")return <LiveQuiz key={question?.id||question?.questionDe||"no-student"} question={question}/>;
  if(step==="wrapup")return <Recap/>;
  return null;
}
