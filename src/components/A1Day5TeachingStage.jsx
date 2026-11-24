import { useState } from "react";
import {
  A1_DAY5_ADJECTIVE_PAIRS,
  A1_DAY5_ARTICLES,
  A1_DAY5_QUESTIONS,
  A1_DAY5_PERSONAL_INFO,
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
    <h1>Maskulin, feminin oder neutral?</h1>
    <p className="a1-day5-lead">Teil 1 im Workbook · Wähle das Genus und sage das ganze Wort.</p>
    <div className="a1-day5-quiz-box">
      <span className="a1-day5-micro">Wort</span>
      <strong className="a1-day5-quiz-word">{card.article} {card.noun}</strong>
      <div className="a1-day5-choice-group" role="group" aria-label="Genus wählen">
        {["der","die","das"].map(article=><button type="button" key={article}
          aria-pressed={chosen===article}
          className={chosen===article?"is-selected":""}
          onClick={()=>{setChosen(article);setRevealed(false);}}>{{der:"maskulin",die:"feminin",das:"neutral"}[article]}</button>)}
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

function PersonalInformation() {
  const [page,setPage]=useState(0);
  return <section className="a1-day5-page" lang="de">
    <Tag>Persönliche Informationen</Tag>
    <h1>Persönliche Informationen</h1>
    <p className="a1-day5-lead" lang="en">English meaning and German sentence starters. Use the English meaning, then form your own German sentence.</p>
    <div className="a1-day5-pills" role="group" aria-label="Wortliste">
      {[0,1].map(i=><button type="button" key={i} aria-pressed={page===i} className={page===i?"is-selected":""} onClick={()=>setPage(i)}>Wörter {i*5+1}–{i*5+5}</button>)}
    </div>
    <div className="a1-day5-personal-list">
      {A1_DAY5_PERSONAL_INFO.slice(page*5,page*5+5).map(([word,meaning,starter,translation],i)=><article key={word}>
        <span className="a1-day5-index">{page*5+i+1}</span>
        <div><strong>{word}</strong><small lang="en">{meaning}</small></div>
        <div><b>{starter}</b><small lang="en">{translation}</small></div>
      </article>)}
    </div>
    <p className="a1-day5-footnote">Du kannst mit erfundenen persönlichen Angaben üben.</p>
  </section>;
}

function PersonalQuestions() {
  const [index,setIndex]=useState(0);
  const [mode,setMode]=useState("");
  const [word,meaning,starter,,question,answer]=A1_DAY5_PERSONAL_INFO[index];
  function go(next){setIndex(next);setMode("");}
  return <section className="a1-day5-page" lang="de">
    <Tag>Sprechen · Aufgabe {index+1} / {A1_DAY5_PERSONAL_INFO.length}</Tag>
    <h1>Fragen und Antworten</h1>
    <p className="a1-day5-lead" lang="en">Ask your partner and answer in German.</p>
    <progress className="a1-day5-progress" value={index+1} max={A1_DAY5_PERSONAL_INFO.length}/>
    <div className="a1-day5-quiz-box"><strong className="a1-day5-topic">{word}</strong><p lang="en">{meaning}</p></div>
    <div className="a1-day5-dialogue-grid">
      <article><span className="a1-day5-micro">Person A · Frage</span><h2>{question}</h2></article>
      <article><span className="a1-day5-micro">Person B · Antwort</span><h2 aria-live="polite">{mode==="answer"?answer:mode==="hint"?starter:"…"}</h2>{!mode?<p>Antworte auf Deutsch.</p>:null}</article>
    </div>
    <div className="a1-day5-actions">
      <button type="button" className="a1-day5-secondary" aria-pressed={mode==="hint"} onClick={()=>setMode(v=>v==="hint"?"":"hint")}>Satzhilfe</button>
      <button type="button" aria-expanded={mode==="answer"} onClick={()=>setMode(v=>v==="answer"?"":"answer")}>{mode==="answer"?"Antwort verbergen":"Antwort zeigen"}</button>
    </div>
    <div className="a1-day5-actions">
      <button type="button" className="a1-day5-secondary" disabled={index===0} onClick={()=>go(index-1)}>Zurück</button>
      <button type="button" className="a1-day5-secondary" disabled={index===A1_DAY5_PERSONAL_INFO.length-1} onClick={()=>go(index+1)}>Weiter</button>
    </div>
    <p className="a1-day5-footnote">Übe mit erfundenen Angaben, wenn du persönliche Informationen nicht teilen möchtest. Hier wird nichts gespeichert.</p>
  </section>;
}

const workbookWQuestions = [
  ["___ heißt du?", "Wie", "Wie heißt du? – Ich heiße Ama."],
  ["___ ist das Buch?", "Wo", "Wo ist das Buch? – Das Buch ist hier."],
  ["___ kommst du?", "Woher", "Woher kommst du? – Ich komme aus Ghana."],
  ["___ ist dein Lehrer?", "Wer", "Wer ist dein Lehrer? – Herr Müller."],
  ["___ machst du am Wochenende?", "Was", "Was machst du am Wochenende? – Ich höre Musik."],
];

function WQuestionPractice() {
  const [index,setIndex]=useState(0);
  const [chosen,setChosen]=useState("");
  const [shown,setShown]=useState(false);
  const [prompt,correct,model]=workbookWQuestions[index];
  return <section className="a1-day5-page" lang="de">
    <Tag>Teil 4 · W-Fragen</Tag>
    <h1>Wie · Wo · Woher · Wer · Was</h1>
    <p className="a1-day5-lead">W-Wort + Verb + Subjekt. Wähle das Fragewort, sage die ganze Frage und antworte.</p>
    <div className="a1-day5-question-grid">
      {A1_DAY5_QUESTIONS.map(({word,purpose})=><article key={word}><b>{word}</b><small>{purpose}</small></article>)}
    </div>
    <div className="a1-day5-quiz-box">
      <span className="a1-day5-micro">{index+1} / {workbookWQuestions.length}</span>
      <h2>{prompt}</h2>
      <div className="a1-day5-choice-group" role="group" aria-label="Fragewort wählen">
        {A1_DAY5_QUESTIONS.map(({word})=><button type="button" key={word} aria-pressed={chosen===word}
          className={chosen===word?"is-selected":""} onClick={()=>{setChosen(word);setShown(false);}}>{word}</button>)}
      </div>
      <div className="a1-day5-actions">
        <button type="button" disabled={!chosen} aria-expanded={shown} onClick={()=>setShown(v=>!v)}>{shown?"Antwort verbergen":"Antwort zeigen"}</button>
        <button type="button" className="a1-day5-secondary" onClick={()=>{setIndex(v=>(v+1)%workbookWQuestions.length);setChosen("");setShown(false);}}>Nächste Frage</button>
      </div>
      {shown?<p role="status" className={chosen===correct?"a1-day5-correct":"a1-day5-review"}>{chosen===correct?"Richtig!":"Noch nicht."} {model}</p>:null}
    </div>
  </section>;
}

function WordOrder() {
  const [index,setIndex]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [selected,setSelected]=useState([]);
  const current=A1_DAY5_WORD_ORDER[index];
  function go(next){setIndex(next);setSelected([]);setRevealed(false);}
  return <section className="a1-day5-page" lang="de">
    <Tag>Teil 5 · Satzbau · {index+1} / {A1_DAY5_WORD_ORDER.length}</Tag>
    <h1>Bilde einen Satz!</h1>
    <p className="a1-day5-lead">Bilde aus den Wörtern einen vollständigen Satz. Achte auf das Verb, die Großschreibung und das Satzzeichen.</p>
    <p className="a1-day5-micro">{current.kind === "Aussage" ? "Aussage · Statement" : "W-Frage · Question"}</p>
    <div className="a1-day5-scramble" aria-label="Ungeordnete Wörter">
      {current.words.map((word,i)=><button type="button" key={i} disabled={selected.includes(i)} onClick={()=>{setSelected(old=>[...old,i]);setRevealed(false);}}>{word}</button>)}
    </div>
    <span className="a1-day5-micro">Dein Satz</span>
    <div className="a1-day5-sentence-tray" aria-label="Dein Satz">
      {selected.length?selected.map(i=><button type="button" key={i} onClick={()=>{setSelected(old=>old.filter(n=>n!==i));setRevealed(false);}}>{current.words[i]}</button>):<p>Wähle die Wörter oben.</p>}
    </div>
    <div className="a1-day5-actions">
      <button type="button" className="a1-day5-secondary" onClick={()=>{setSelected([]);setRevealed(false);}}>Reset</button>
      <button type="button" aria-expanded={revealed} onClick={()=>setRevealed(v=>!v)}>
        {revealed?"Antwort verbergen":"Antwort zeigen"}
      </button>
      <button type="button" className="a1-day5-secondary" disabled={index===0} onClick={()=>go(index-1)}>Vorheriger Satz</button>
      <button type="button" className="a1-day5-secondary" disabled={index===A1_DAY5_WORD_ORDER.length-1} onClick={()=>go(index+1)}>Nächster Satz</button>
    </div>
    {revealed?<div className="a1-day5-rule" role="status"><b>{current.answer}</b>{current.alternative?<span>Auch richtig: {current.alternative}</span>:null}<span>{current.tip}</span></div>:null}
    <p className="a1-day5-footnote">Aussage: Verb auf Position 2. W-Frage: W-Wort + konjugiertes Verb + Subjekt. Achte auf Großschreibung und Satzzeichen.</p>
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

export default function A1Day5TeachingStage({ step }) {
  if(step==="intro") return <section className="a1-day5-page" lang="de">
    <Tag>A1 · Day 5</Tag>
    <h1>Sich vorstellen, Artikel und W-Fragen</h1>
    <p className="a1-day5-lead">Heute sprechen wir über Personen, Dinge und einfache Fragen.</p>
    <div className="a1-day5-intro-cards">
      <article><span className="a1-day5-icon">der · die · das</span><strong>Artikel</strong><small>der Tisch · das Auto · die Lampe</small></article>
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
      {A1_DAY5_ADJECTIVE_PAIRS.slice(0,5).map(([left,right])=><div className="a1-day5-opposite-row" key={left}>
        <span>{left}</span><b aria-hidden="true">↔</b><span>{right}</span>
      </div>)}
    </div>
    <p className="a1-day5-footnote">Weitere Gegensatzpaare stehen in Teil 2 des Workbooks. Beschreibe Dinge mit passenden Adjektiven.</p>
  </section>;
  if(step==="self-intro") return <PersonalInformation/>;
  if(step==="intro-builder") return <PersonalQuestions/>;
  if(step==="w-questions") return <WQuestionPractice/>;
  if(step==="word-order") return <WordOrder/>;
  if(step==="wrapup") return <Recap/>;
  return null;
}
