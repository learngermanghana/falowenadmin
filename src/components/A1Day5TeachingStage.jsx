import { useState } from "react";
import {
  A1_DAY5_ADJECTIVE_PAIRS,
  A1_DAY5_ARTICLES,
  A1_DAY5_DESCRIPTIONS,
  A1_DAY5_QUESTIONS,
  A1_DAY5_SELF_INTRO,
  A1_DAY5_WORD_ORDER,
} from "../data/a1Day5Classroom.js";
import "./A1Day5TeachingStage.css";

function Tag({ children }) {
  return <span className="a1-day5-tag">{children}</span>;
}
function ArticleTile({ item }) {
  return <article className={`a1-day5-tile a1-day5-tone-${item.color}`}>
    <span className="a1-day5-article">{item.article}</span>
    <strong>{item.noun}</strong>
  </article>;
}
function ArticleQuiz() {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState("");
  const [revealed, setRevealed] = useState(false);
  const card = A1_DAY5_ARTICLES[index];
  return <section className="a1-day5-page" lang="de">
    <Tag>Artikel-Quiz · {index+1} / {A1_DAY5_ARTICLES.length}</Tag>
    <h1>Welcher Artikel passt?</h1>
    <p className="a1-day5-lead">Wähle einen Artikel und sage das ganze Wort.</p>
    <div className="a1-day5-quiz-box">
      <span className="a1-day5-micro">Wort</span>
      <strong className="a1-day5-quiz-word">{card.noun}</strong>
      <div className="a1-day5-choice-group" role="group" aria-label="Artikel wählen">
        {["der","die","das"].map(article=><button type="button" key={article}
          aria-pressed={chosen===article}
          className={chosen===article?"is-selected":""}
          onClick={()=>{setChosen(article);setRevealed(false);}}>{article}</button>)}
      </div>
      <div className="a1-day5-actions">
        <button type="button" disabled={!chosen} onClick={()=>setRevealed(v=>!v)}>
          {revealed?"Antwort verbergen":"Antwort zeigen"}
        </button>
        <button type="button" className="a1-day5-secondary" onClick={()=>{
          setIndex(v=>(v+1)%A1_DAY5_ARTICLES.length);setChosen("");setRevealed(false);
        }}>Nächstes Wort</button>
      </div>
      {revealed?<p className={chosen===card.article?"a1-day5-correct":"a1-day5-review"} role="status">
        {chosen===card.article?"Richtig!":"Noch nicht."} <b>{card.article} {card.noun}</b>
      </p>:null}
    </div>
    <p className="a1-day5-footnote">Dies ist eine Übung. Es wird kein Score gespeichert.</p>
  </section>;
}

function SentenceCards() {
  const [selected, setSelected] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const active = A1_DAY5_DESCRIPTIONS[selected];
  return <section className="a1-day5-page" lang="de">
    <Tag>Satzbau · Adjektive</Tag>
    <h1>Subjekt + ist + Adjektiv</h1>
    <p className="a1-day5-lead">Nach <b>ist</b> bleibt das Adjektiv in der Grundform.</p>
    <div className="a1-day5-pills">
      {A1_DAY5_DESCRIPTIONS.map((item,i)=><button type="button" key={item.subject}
        className={selected===i?"is-selected":""} aria-pressed={selected===i}
        onClick={()=>{setSelected(i);setRevealed(false);}}>{item.subject}</button>)}
    </div>
    <div className="a1-day5-formula">
      <span>{active.subject}</span><b>+</b><span className="a1-day5-ist">ist</span><b>+</b><span>{active.word}</span>
    </div>
    <div className="a1-day5-actions">
      <button type="button" onClick={()=>setRevealed(v=>!v)} aria-expanded={revealed}>
        {revealed?"Satz verbergen":"Ganzen Satz zeigen"}
      </button>
    </div>
    {revealed?<p className="a1-day5-answer" role="status">{active.sentence}</p>:null}
    <div className="a1-day5-rule"><b>Merke:</b> Das Haus ist <strong>klein</strong>. Nicht: <s>Das Haus ist kleines.</s></div>
  </section>;
}

function IntroBuilder() {
  const [revealed, setRevealed] = useState([]);
  const toggle=(i)=>setRevealed(old=>old.includes(i)?old.filter(x=>x!==i):[...old,i]);
  return <section className="a1-day5-page" lang="de">
    <Tag>Meine Vorstellung</Tag>
    <h1>Stell dich in 6–8 Sätzen vor</h1>
    <p className="a1-day5-lead">Sprich mit deinen eigenen Informationen. Öffne das Beispiel erst danach.</p>
    <div className="a1-day5-builder">
      {A1_DAY5_SELF_INTRO.map(([label,sentence],i)=><article key={label} className="a1-day5-builder-item">
        <span className="a1-day5-index">{i+1}</span>
        <div><strong>{label}</strong><p>{revealed.includes(i)?sentence:"Formuliere deinen eigenen Satz."}</p></div>
        <button type="button" aria-expanded={revealed.includes(i)} onClick={()=>toggle(i)}>
          {revealed.includes(i)?"Verbergen":"Beispiel"}
        </button>
      </article>)}
    </div>
    <p className="a1-day5-footnote">Nur mündlich üben – persönliche Daten werden hier nicht gespeichert.</p>
  </section>;
}

function WordOrder() {
  const [index,setIndex]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const current=A1_DAY5_WORD_ORDER[index];
  return <section className="a1-day5-page" lang="de">
    <Tag>Fragesätze · {index+1} / {A1_DAY5_WORD_ORDER.length}</Tag>
    <h1>Ordne die Wörter</h1>
    <p className="a1-day5-lead">Bilde eine richtige W-Frage.</p>
    <div className="a1-day5-scramble" aria-label="Ungeordnete Wörter">
      {current.words.map((word,i)=><span key={i}>{word}</span>)}
    </div>
    <div className="a1-day5-actions">
      <button type="button" aria-expanded={revealed} onClick={()=>setRevealed(v=>!v)}>
        {revealed?"Antwort verbergen":"Antwort zeigen"}
      </button>
      <button type="button" className="a1-day5-secondary" onClick={()=>{
        setIndex(v=>(v+1)%A1_DAY5_WORD_ORDER.length);setRevealed(false);
      }}>Nächste Frage</button>
    </div>
    {revealed?<div className="a1-day5-rule" role="status"><b>{current.answer}</b><span>{current.tip}</span></div>:null}
    <p className="a1-day5-footnote">In einer W-Frage steht das konjugierte Verb direkt nach dem Fragewort.</p>
  </section>;
}

function LiveCheck({ question }) {
  const [revealed,setRevealed]=useState(false);
  const questionId=question?.id||question?.questionDe||"";
  // A new student must not inherit the previous student's exposed answer.
  return <section className="a1-day5-page a1-day5-live" lang="de">
    <Tag>Live-Quiz · eine Frage pro Student</Tag>
    <h1>Was kannst du schon?</h1>
    <p className="a1-day5-lead">Wähle einen Studenten oben. Die Antwort wird erst nach dem Versuch gezeigt.</p>
    {question?<div key={questionId} className="a1-day5-quiz-box">
      <h2>{question.questionDe}</h2>
      <button type="button" onClick={()=>setRevealed(v=>!v)}>
        {revealed?"Antwort verbergen":"Antwort zeigen"}
      </button>
      {revealed?<div className="a1-day5-answer" role="status">
        <strong>{question.answerDe}</strong>
        {question.noteEn?<p>{question.noteEn}</p>:null}
      </div>:null}
    </div>:<div className="a1-day5-empty" role="status">
      <strong>Student auswählen</strong>
      <p>Die erste Frage erscheint nach der Auswahl im bestehenden Teilnahmebereich.</p>
    </div>}
    <p className="a1-day5-footnote">Correct / Needs review wird ausschließlich im bestehenden Teilnahmebereich erfasst. Keine automatische Bewertung.</p>
  </section>;
}

function Recap() {
  const [shown,setShown]=useState(false);
  return <section className="a1-day5-page a1-day5-recap" lang="de">
    <Tag>Abschluss · Selbstübung</Tag>
    <h2>Was habe ich gelernt?</h2>
    <p>Stell dich in sechs Sätzen vor, nenne drei Nomen mit Artikel und beschreibe zwei Dinge mit <b>ist + Adjektiv</b>.</p>
    <div className="a1-day5-actions">
      <button type="button" onClick={()=>setShown(v=>!v)} aria-expanded={shown}>
        {shown?"Beispiele verbergen":"Beispiele zeigen"}
      </button>
    </div>
    {shown?<div className="a1-day5-rule"><span>der Tisch · die Lampe · das Auto</span>
      <span>Der Tisch ist groß. Das Haus ist klein.</span>
      <span>Wie heißt du? Wo wohnst du? Woher kommst du?</span>
    </div>:null}
  </section>;
}

export default function A1Day5TeachingStage({ step, question=null }) {
  if(step==="intro") return <section className="a1-day5-page" lang="de">
    <Tag>A1 · Day 5</Tag>
    <h1>Sich vorstellen, Artikel und W-Fragen</h1>
    <p className="a1-day5-lead">Heute sprechen wir über Personen, Dinge und einfache Fragen.</p>
    <div className="a1-day5-intro-cards">
      <article><span className="a1-day5-icon">der · die · das</span><strong>Artikel</strong><small>der Tisch · die Lampe · das Auto</small></article>
      <article><span className="a1-day5-icon">ist + groß</span><strong>Adjektive</strong><small>Das Haus ist groß.</small></article>
      <article><span className="a1-day5-icon">Wie?</span><strong>W-Fragen</strong><small>Wie heißt du?</small></article>
    </div>
    <p className="a1-day5-footnote">Wir üben gemeinsam. Das Workbook bleibt ein unbenotetes Selbstlernangebot.</p>
  </section>;

  if(step==="articles") return <section className="a1-day5-page" lang="de">
    <Tag>Artikel</Tag>
    <h1>der · die · das</h1>
    <p className="a1-day5-lead">Lerne jedes Nomen zusammen mit seinem Artikel.</p>
    <div className="a1-day5-article-grid">{A1_DAY5_ARTICLES.map(item=><ArticleTile item={item} key={item.noun}/>)}</div>
    <p className="a1-day5-footnote">Blau: der · Türkis: die · Violett: das</p>
  </section>;
  if(step==="article-quiz") return <ArticleQuiz/>;
  if(step==="adjectives") return <section className="a1-day5-page" lang="de">
    <Tag>Adjektive</Tag>
    <h1>Gegensätze verstehen</h1>
    <p className="a1-day5-lead">Sprich die beiden Wörter laut. Was bedeuten sie?</p>
    <div className="a1-day5-opposites">
      {A1_DAY5_ADJECTIVE_PAIRS.map(([left,right],i)=><div className="a1-day5-opposite-row" key={left}>
        <span>{left}</span><b aria-hidden="true">↔</b><span>{right}</span>
      </div>)}
    </div>
    <p className="a1-day5-footnote">Beschreibe Dinge freundlich und sachlich mit passenden Adjektiven.</p>
  </section>;
  if(step==="ist-adjective") return <SentenceCards/>;
  if(step==="self-intro") return <section className="a1-day5-page" lang="de">
    <Tag>Sich vorstellen</Tag>
    <h1>Hallo, ich heiße Lara.</h1>
    <p className="a1-day5-lead">Höre zu und lies die sechs Beispielsätze.</p>
    <div className="a1-day5-person-card"><span className="a1-day5-avatar" aria-hidden="true">●</span>
      <div className="a1-day5-sentences">
        {A1_DAY5_SELF_INTRO.map(([label,sentence],i)=><p key={label}><b>{i+1}.</b> {sentence}</p>)}
      </div>
    </div>
    <p className="a1-day5-footnote">Das ist eine erfundene Beispielperson, keine Studentin.</p>
  </section>;
  if(step==="intro-builder") return <IntroBuilder/>;
  if(step==="w-questions") return <section className="a1-day5-page" lang="de">
    <Tag>W-Fragen</Tag>
    <h1>Wie · Wo · Woher · Wer · Was</h1>
    <p className="a1-day5-lead">Jedes Fragewort hat eine Aufgabe.</p>
    <div className="a1-day5-question-grid">
      {A1_DAY5_QUESTIONS.map(({word,purpose,question:prompt,answer})=><article key={word}>
        <b>{word}</b><small>{purpose}</small><strong>{prompt}</strong>
        <details><summary>Antwort zeigen</summary><p>{answer}</p></details>
      </article>)}
    </div>
  </section>;
  if(step==="word-order") return <WordOrder/>;
  if(step==="live-quiz") return <LiveCheck key={question?.id||question?.questionDe||"no-student"} question={question}/>;
  if(step==="wrapup") return <Recap/>;
  return null;
}
