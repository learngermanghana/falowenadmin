import { useState } from "react";
import InlineReadingTranslations from "./InlineReadingTranslations.jsx";
import PublishedSongLessonStage from "./PublishedSongLessonStage.jsx";
import MusicVideoEmbed from "./MusicVideoEmbed.jsx";
import {
  A1_DAY16_FOOD, A1_DAY16_NEGATION_CHOICES, A1_DAY16_NEGATION_FIXES,
} from "../data/a1Day16NegationClassroom.js";
import "./A1Day16NegationStage.css";

function Panel({ children, className = "" }) {
  return <div className={["a1n-panel", className].filter(Boolean).join(" ")}>{children}</div>;
}
function Reveal({ answer, explanation = "", prompt = "Antwort anzeigen" }) {
  const [visible, setVisible] = useState(false);
  return <div className="a1n-reveal">
    <button type="button" aria-expanded={visible} onClick={() => setVisible(v => !v)}>
      {visible ? "Antwort verbergen" : prompt}
    </button>
    {visible
      ? <div className="a1n-answer" role="status"><strong>{answer}</strong>
          {explanation ? <small>{explanation}</small> : null}</div>
      : <small>Erst selbst sprechen oder antworten. Danach die Lösung zeigen.</small>}
  </div>;
}
function Intro() {
  const [showLecture, setShowLecture] = useState(false);
  return <>
    <h1>Essen und Verneinung</h1>
    <div className="a1n-actions">
      <button type="button" aria-expanded={showLecture} onClick={() => setShowLecture(value => !value)}>
        {showLecture ? "Zurück zum Einstieg" : "Lehrervideo ansehen"}
      </button>
    </div>
    {showLecture ? <MusicVideoEmbed videoId="RriTJiLUXUI" title="Lehrervideo · Essen und Verneinung" variant="lesson" footerLabel="Falowen · A1 Kapitel 9" /> : <>
    <p className="a1n-lead">Heute sagen wir, was wir <b>haben, essen oder nicht mögen</b> – mit <strong>kein, keine, keinen und nicht</strong>.</p>
    <div className="a1n-compare">
      <Panel><span className="a1n-emoji" role="img" aria-label="milk">🥛</span>
        <span className="a1n-kicker">Ja · positiv</span><h2>Ich habe Milch.</h2><small>I have milk.</small></Panel>
      <Panel className="a1n-highlight"><span className="a1n-emoji" role="img" aria-label="no milk">🚫🥛</span>
        <span className="a1n-kicker">Nein · negativ</span><h2>Ich habe keine Milch.</h2><small>I have no milk.</small></Panel>
    </div>
    <div className="a1n-note"><b>Unser Lernziel:</b> Wir wählen die richtige Negation und können eigene kurze Sätze bilden.</div>
    </>}
  </>;
}
function Food() {
  const [revealed, setRevealed] = useState([]);
  return <>
    <h1>Essen · Wörter und Artikel</h1>
    <p className="a1n-lead">Nenne zuerst den Artikel <strong>der, die oder das</strong>. Öffne dann das Beispiel mit der Negation.</p>
    <div className="a1n-vocab">
      {A1_DAY16_FOOD.map(item => <Panel key={item.word} className="a1n-vocab-card">
        <span className="a1n-emoji" role="img" aria-label={item.en}>{item.icon}</span>
        <h2>{item.word}</h2><small>{item.en}</small>
        <button type="button" aria-expanded={revealed.includes(item.word)}
          onClick={() => setRevealed(old => old.includes(item.word) ? old.filter(v => v !== item.word) : [...old, item.word])}>
          {revealed.includes(item.word) ? "Beispiel verbergen" : "Negation zeigen"}
        </button>
        {revealed.includes(item.word) ? <div role="status" className="a1n-answer"><strong>{item.form}</strong><small>{item.example}</small></div> : null}
      </Panel>)}
    </div>
  </>;
}
const pairs = [
  { yes: "Ich habe Milch.", no: "Ich habe keine Milch.", cue: "die Milch · Nomen" },
  { yes: "Ich esse Käse.", no: "Ich esse keinen Käse.", cue: "der Käse · Akkusativ" },
  { yes: "Die Suppe ist warm.", no: "Die Suppe ist nicht warm.", cue: "warm · Adjektiv" },
  { yes: "Ich koche heute.", no: "Ich koche heute nicht.", cue: "koche · Handlung" },
];
function PositiveNegative() {
  const [index, setIndex] = useState(0);
  const pair = pairs[index];
  return <>
    <h1>Positive und negative Sätze</h1>
    <p className="a1n-lead">Höre oder lies den positiven Satz. Sage selbst den negativen Satz.</p>
    <div className="a1n-compare">
      <Panel><span className="a1n-kicker">Positiv</span><h2>{pair.yes}</h2></Panel>
      <Panel className="a1n-highlight"><span className="a1n-kicker">Negativ · erst selbst sagen</span>
        <Reveal key={index} answer={pair.no} explanation={pair.cue}/></Panel>
    </div>
    <div className="a1n-actions"><span>Beispiel {index + 1} / {pairs.length}</span>
      <button type="button" onClick={() => setIndex(i => (i + 1) % pairs.length)}>Nächstes Beispiel</button></div>
  </>;
}
function KeinOrNicht() {
  return <>
    <h1>Wann kein? Wann nicht?</h1>
    <p className="a1n-lead">Die erste Frage ist: <b>Was wird verneint?</b></p>
    <div className="a1n-compare">
      <Panel className="a1n-highlight"><span className="a1n-kicker">Nomen · ohne bestimmten Artikel</span>
        <h2>kein · keine · keinen</h2><p>Ich habe <b>keine Milch</b>.</p><p>Ich esse <b>keinen Käse</b>.</p>
        <small>kein steht beim Nomen und wird wie ein ein-Wort verändert.</small></Panel>
      <Panel><span className="a1n-kicker">Handlung oder Eigenschaft</span><h2>nicht</h2>
        <p>Ich koche heute <b>nicht</b>.</p><p>Die Suppe ist <b>nicht warm</b>.</p>
        <small>Auch bei einem bestimmten Nomen: Ich trinke den Kaffee nicht.</small></Panel>
    </div>
    <Panel><strong>Kurze Regelkontrolle</strong>
      <p>„Das Essen ist ___ kalt.“ Was passt?</p>
      <Reveal answer="nicht" explanation="kalt beschreibt eine Eigenschaft (Adjektiv), deshalb nicht." /></Panel>
  </>;
}
function KeinForms() {
  const [show, setShow] = useState(false);
  const rows = [
    ["Maskulin", "ein", "kein", "einen", "keinen"],
    ["Feminin", "eine", "keine", "eine", "keine"],
    ["Neutrum", "ein", "kein", "ein", "kein"],
    ["Plural", "—", "keine", "—", "keine"],
  ];
  return <>
    <h1>ein → kein · eine → keine</h1>
    <p className="a1n-lead"><b>kein</b> hat im Singular dieselben Endungen wie <b>ein</b>. Vergleiche Nominativ und Akkusativ.</p>
    <div className="a1n-table-wrap"><table className="a1n-table">
      <thead><tr><th>Genus / Zahl</th><th>Nominativ</th><th>Akkusativ</th></tr></thead>
      <tbody>{rows.map(([gender, positiveNom, negativeNom, positiveAcc, negativeAcc]) => <tr key={gender}>
        <th scope="row">{gender}</th><td>{positiveNom} → <b>{show ? negativeNom : "?"}</b></td><td>{positiveAcc} → <b>{show ? negativeAcc : "?"}</b></td></tr>)}</tbody>
    </table></div>
    <div className="a1n-actions"><button type="button" aria-expanded={show} onClick={() => setShow(v => !v)}>
      {show ? "Formen verbergen" : "Formen zeigen"}</button></div>
    <div className="a1n-note"><b>Merke:</b> Im Plural gibt es keinen unbestimmten Artikel: Äpfel → keine Äpfel. Nur Maskulin ändert sich vom Nominativ zum Akkusativ: ein → einen / kein → keinen.</div>
  </>;
}
function CaseComparison() {
  const [selected, setSelected] = useState("");
  return <>
    <h1>Nominativ oder Akkusativ?</h1>
    <p className="a1n-lead">Das Verb entscheidet, ob ein Nomen als <strong>Subjekt</strong> oder als <strong>direktes Objekt</strong> steht.</p>
    <div className="a1n-compare">
      <Panel><span className="a1n-kicker">Nominativ · Wer oder was?</span><span className="a1n-emoji">🍎</span>
        <h2>Das ist kein Apfel.</h2><small>der Apfel → kein Apfel</small></Panel>
      <Panel className="a1n-highlight"><span className="a1n-kicker">Akkusativ · Wen oder was?</span>
        <span className="a1n-emoji">🍎</span><h2>Ich habe keinen Apfel.</h2><small>der Apfel → keinen Apfel</small></Panel>
    </div>
    <Panel><strong>Jetzt du: „Ich trinke ___ Kaffee.“</strong>
      <div className="a1n-actions">{["kein", "keinen", "nicht"].map(option => <button key={option}
        type="button" className={selected === option ? "a1n-picked" : "a1n-secondary"}
        aria-pressed={selected === option} onClick={() => setSelected(option)}>{option}</button>)}</div>
      {selected ? <p role="status" className={selected === "keinen" ? "a1n-correct" : "a1n-error"}>
        {selected === "keinen" ? "Richtig! Ich trinke keinen Kaffee." : "Noch nicht. Kaffee ist maskulines Akkusativobjekt."}
      </p> : null}
    </Panel>
  </>;
}
function Nicht() {
  return <>
    <h1>nicht · Verben und Adjektive</h1>
    <p className="a1n-lead">Mit <b>nicht</b> verneinst du eine Handlung, eine Eigenschaft oder eine bestimmte Aussage.</p>
    <div className="a1n-three">
      <Panel><span className="a1n-emoji">👩‍🍳</span><span className="a1n-kicker">Handlung</span>
        <h2>Ich koche heute nicht.</h2><small>koche wird verneint.</small></Panel>
      <Panel><span className="a1n-emoji">🍲</span><span className="a1n-kicker">Eigenschaft</span>
        <h2>Die Suppe ist nicht warm.</h2><small>warm wird verneint.</small></Panel>
      <Panel><span className="a1n-emoji">☕</span><span className="a1n-kicker">Vorliebe</span>
        <h2>Ich trinke nicht gern Kaffee.</h2><small>nicht gern = I do not like doing it.</small></Panel>
    </div>
    <Panel><p>„Das Brot ist ___ frisch.“</p>
      <Reveal answer="Das Brot ist nicht frisch." explanation="frisch ist ein Adjektiv, deshalb nicht." /></Panel>
  </>;
}
function SentenceBuilder() {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState("");
  const [revealed, setRevealed] = useState(false);
  const item = A1_DAY16_NEGATION_CHOICES[index];
  const correct = choice === item.correct;
  const next = () => { setIndex(i => (i + 1) % A1_DAY16_NEGATION_CHOICES.length); setChoice(""); setRevealed(false); };
  return <>
    <h1>Sätze mit Negation bauen</h1>
    <p className="a1n-lead">Wähle das passende Wort und lies danach den vollständigen deutschen Satz.</p>
    <Panel className="a1n-builder">
      <div className="a1n-actions"><span>Aufgabe {index + 1} / {A1_DAY16_NEGATION_CHOICES.length}</span>
        <span className="a1n-kicker">kein · keine · keinen · nicht</span></div>
      <h2 className="a1n-build-sentence">{item.lead} <span>{choice || "___"}</span> {item.tail}</h2>
      <div className="a1n-actions">{item.options.map(option => <button type="button" key={option}
        className={choice === option ? "a1n-picked" : "a1n-secondary"}
        aria-pressed={choice === option} onClick={() => { setChoice(option); setRevealed(false); }}>{option}</button>)}</div>
      {choice ? <p role="status" className={correct ? "a1n-correct" : "a1n-error"}>
        {correct ? "Richtig! Sage den ganzen Satz laut." : "Noch nicht. Ist es ein Nomen, Verb oder Adjektiv?"}</p> : null}
      <div className="a1n-actions">
        <button type="button" className="a1n-secondary" aria-expanded={revealed}
          onClick={() => setRevealed(v => !v)}>{revealed ? "Regel verbergen" : "Lösung und Regel zeigen"}</button>
        <button type="button" onClick={next}>Nächster Satz</button>
      </div>
      {revealed ? <div role="status" className="a1n-answer"><strong>{item.lead} {item.correct} {item.tail}</strong>
        <small>{item.why}</small></div> : null}
    </Panel>
  </>;
}
function Corrections() {
  const [index, setIndex] = useState(0);
  const item = A1_DAY16_NEGATION_FIXES[index];
  return <>
    <h1>Fehler finden und korrigieren</h1>
    <p className="a1n-lead">Was ist falsch? Korrigiere den Satz zuerst selbst.</p>
    <Panel className="a1n-error-panel">
      <span className="a1n-kicker">Fehler {index + 1} / {A1_DAY16_NEGATION_FIXES.length}</span>
      <h2 className="a1n-wrong-sentence">{item.wrong}</h2>
      <Reveal key={index} answer={item.right} explanation={item.why} prompt="Korrektur zeigen"/>
      <div className="a1n-actions"><button type="button"
        onClick={() => setIndex(i => (i + 1) % A1_DAY16_NEGATION_FIXES.length)}>
        Nächster Fehler</button></div>
    </Panel>
    <div className="a1n-note">Lehrkraft: Nur die Grammatikregel erklären, die im Satz tatsächlich falsch ist.</div>
  </>;
}
function MusicReading({ assignmentKey, courseDay, reading }) {
  const [active, setActive] = useState("music");
  const [openAnswer, setOpenAnswer] = useState([]);
  return <section className="a1n-media">
    <h1>Falowen Music und Lesen</h1>
    <p className="a1n-lead">Zwei unabhängige Übungen auf einer Folie. Wechsle zwischen Hören und Lesen.</p>
    <div role="tablist" aria-label="Hören und Lesen" className="a1n-media-tabs">
      <button id="a1n-music-tab" type="button" role="tab" aria-selected={active === "music"}
        aria-controls="a1n-media-content" className={active === "music" ? "a1n-picked" : "a1n-secondary"}
        onClick={() => setActive("music")}>Musik · Hören</button>
      <button id="a1n-reading-tab" type="button" role="tab" aria-selected={active === "reading"}
        aria-controls="a1n-media-content" className={active === "reading" ? "a1n-picked" : "a1n-secondary"}
        onClick={() => setActive("reading")}>Lesen · Essen und Verneinung</button>
    </div>
    <div id="a1n-media-content" role="tabpanel" aria-labelledby={active === "music" ? "a1n-music-tab" : "a1n-reading-tab"}>
      {active === "music"
        ? <PublishedSongLessonStage assignmentKey={assignmentKey} courseDay={courseDay} compact nextLyricOnly />
        : <Panel className="a1n-reading"><span className="a1n-kicker">Text verstehen</span>
            <h2>{reading?.title || "Lesen"}</h2>
            {reading ? <>
              <div className="a1n-reading-text" lang="de">
                <InlineReadingTranslations text={reading.textDe} level="A1" day={courseDay} assignmentId={assignmentKey} />
              </div>
              <ol className="a1n-reading-questions">
                {reading.checks.map((question, index) => <li key={question}>
                  <p>{question}</p>
                  <button type="button" aria-expanded={openAnswer.includes(index)}
                    onClick={() => setOpenAnswer(old => old.includes(index) ? old.filter(n => n !== index) : [...old, index])}>
                    {openAnswer.includes(index) ? "Antwort verbergen" : "Antwort zeigen"}
                  </button>
                  {openAnswer.includes(index) ? <div className="a1n-answer"><strong>{reading.answers[index]}</strong></div> : null}
                </li>)}
              </ol>
            </> : <p>Der verifizierte Lesetext ist zurzeit nicht verfügbar.</p>}
          </Panel>}
    </div>
  </section>;
}
export default function A1Day16NegationStage({
  step, assignmentKey = "A1-9", courseDay = 16, reading = null,
}) {
  const content = {
    intro: <Intro />,
    food: <Food />,
    "positive-negative": <PositiveNegative />,
    "kein-or-nicht": <KeinOrNicht />,
    "kein-forms": <KeinForms />,
    case: <CaseComparison />,
    nicht: <Nicht />,
    "sentence-builder": <SentenceBuilder />,
    corrections: <Corrections />,
    "music-reading": <MusicReading assignmentKey={assignmentKey} courseDay={courseDay} reading={reading}/>,
  };
  return <section className="a1n" lang="de">{content[step] || null}</section>;
}
