import { useState } from "react";
import { A1_TEIL3_OBJECT_CARDS } from "../data/a1Teil3ObjectCards.js";
import { A1_DAY15_SENTENCE_TASKS, A1_DAY15_REACTIONS, A1_DAY15_MISTAKES, isA1Day15SentenceOrderCorrect } from "../data/a1Day15Classroom.js";
import "./A1Day15ClassroomStage.css";

function Panel({ children, className = "" }) {
  return <div className={"a1d15-panel " + className}>{children}</div>;
}
function Reveal({ answer, note = "", label = "Mögliche Antwort zeigen" }) {
  const [shown, setShown] = useState(false);
  return <div className="a1d15-reveal">
    <button type="button" aria-expanded={shown} onClick={() => setShown(value => !value)}>
      {shown ? "Antwort verbergen" : label}
    </button>
    {shown ? <div role="status" className="a1d15-solution"><strong>{answer}</strong>{note ? <small>{note}</small> : null}</div> :
      <small>Erst laut sprechen, dann die Lösung öffnen.</small>}
  </div>;
}
function SentenceBuilder({ exercises, instruction }) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState([]);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const item = exercises[index];
  const solved = isA1Day15SentenceOrderCorrect(item, chosen);
  const reset = () => { setChosen([]); setChecked(false); setRevealed(false); };
  const moveNext = () => { setIndex(i => (i + 1) % exercises.length); reset(); };
  return <Panel className="a1d15-builder">
    <div className="a1d15-builder-top"><span>Aufgabe {index + 1} / {exercises.length}</span><strong>{instruction}</strong></div>
    <div className="a1d15-word-pool" aria-label="Wörter auswählen">
      {item.words.map((word, i) => <button type="button" key={i} disabled={chosen.includes(i)}
        onClick={() => { setChosen(old => [...old, i]); setChecked(false); setRevealed(false); }}>{word}</button>)}
    </div>
    <div className="a1d15-built" aria-label="Dein Satz">
      {chosen.length ? chosen.map(i => item.words[i]).join(" ") : "Wähle die Wörter in der richtigen Reihenfolge."}
    </div>
    <div className="a1d15-buttons">
      <button type="button" disabled={chosen.length !== item.order.length} onClick={() => setChecked(true)}>Prüfen</button>
      <button type="button" className="a1d15-secondary" onClick={reset}>Neu ordnen</button>
      <button type="button" className="a1d15-secondary" onClick={() => setRevealed(v => !v)} aria-expanded={revealed}>
        {revealed ? "Lösung verbergen" : "Lösung zeigen"}
      </button>
      <button type="button" className="a1d15-secondary" onClick={moveNext}>Nächste Aufgabe</button>
    </div>
    {checked ? <p role="status" className={solved ? "a1d15-right" : "a1d15-wrong"}>
      {solved ? "Richtig! Sage den ganzen Satz laut." : "Versuche es noch einmal. Achte auf Verb und Satzende."}
    </p> : null}
    {revealed ? <div role="status" className="a1d15-solution"><strong>{item.model}</strong></div> : null}
  </Panel>;
}
function ExamMap() {
  return <>
    <h1>Goethe A1 · Sprechen</h1>
    <p className="a1d15-lead">Drei Prüfungsteile. Heute lernen wir, wie man in <strong>Teil 3</strong> höfliche Bitten macht.</p>
    <div className="a1d15-exam-grid">
      <Panel><span className="a1d15-symbol">👋</span><span className="a1d15-eyebrow">Teil 1 · Kurz</span><h2>Sich vorstellen</h2>
        <p>Ich heiße … Ich komme aus …</p><small>Nur ein kurzer Überblick heute.</small></Panel>
      <Panel><span className="a1d15-symbol">💬</span><span className="a1d15-eyebrow">Teil 2 · Kurz</span><h2>Fragen und Antworten</h2>
        <p>Was trinken Sie gern?</p><small>Nur ein kurzer Überblick heute.</small></Panel>
      <Panel className="a1d15-feature"><span className="a1d15-symbol">✋</span><span className="a1d15-eyebrow">Teil 3 · Heute</span>
        <h2>Bitten und reagieren</h2><p>Können Sie mir bitte den Stift geben?</p><small>Bildkarte sehen → Bitte sagen → reagieren</small></Panel>
    </div>
    <div className="a1d15-note"><b>Unser Ziel:</b> Imperativ verstehen und daraus höfliche Bitten für Teil 3 bilden.</div>
  </>;
}
function ImperativeIntro() {
  return <>
    <h1>Was ist ein Imperativ?</h1>
    <p className="a1d15-lead">Mit dem Imperativ sagen wir, was jemand machen soll. Mit <strong>bitte</strong> klingt die Aufforderung höflicher.</p>
    <div className="a1d15-compare">
      <Panel><span className="a1d15-eyebrow">Aussage</span><h2>Sie öffnen die Tür.</h2><small>You open the door.</small></Panel>
      <Panel className="a1d15-feature"><span className="a1d15-eyebrow">Imperativ</span><h2>Öffnen Sie bitte die Tür!</h2><small>Please open the door!</small></Panel>
    </div>
    <Panel><strong>Was verändert sich?</strong><p>Im Imperativ mit <b>Sie</b> steht das Verb am Anfang: <b>Öffnen Sie ...</b></p>
      <p>Jetzt du: Bitte die Lehrkraft, das Buch zu zeigen.</p>
      <Reveal answer="Zeigen Sie bitte das Buch!" note="Verb zuerst + Sie + bitte + der Rest." /></Panel>
  </>;
}
function ImperativeForms() {
  const [shown, setShown] = useState(false);
  const data = [
    ["du", "du kommst", "Komm bitte!", "du gibst", "Gib bitte!"],
    ["ihr", "ihr kommt", "Kommt bitte!", "ihr gebt", "Gebt bitte!"],
    ["Sie", "Sie kommen", "Kommen Sie bitte!", "Sie geben", "Geben Sie bitte!"],
  ];
  return <>
    <h1>Imperativ · du, ihr und Sie</h1>
    <p className="a1d15-lead">Drei Formen kennenlernen. Für die höflichen Bitten in Teil 3 üben wir besonders <strong>Sie</strong>.</p>
    <div className="a1d15-table-scroll">
      <table className="a1d15-table"><thead><tr><th>Person</th><th>kommen</th><th>geben</th></tr></thead>
        <tbody>{data.map(([form, , imperative, , give]) => <tr key={form} className={form === "Sie" ? "a1d15-focus-row" : ""}>
          <th>{form === "Sie" ? "Sie · Fokus" : form}</th>
          <td>{shown ? imperative : "?"}</td><td>{shown ? give : "?"}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="a1d15-buttons"><button type="button" aria-expanded={shown} onClick={() => setShown(v => !v)}>
      {shown ? "Imperativformen verbergen" : "Imperativformen zeigen"}</button></div>
    <div className="a1d15-note"><b>Merke:</b> du: Komm! / Gib! · ihr: Kommt! / Gebt! · Sie: Kommen Sie! / Geben Sie! <br className="a1d15-hidden" /></div>
    <Panel><strong>Teil 3 braucht höfliche Bitten.</strong><p>Sage: „Geben Sie mir bitte den Stift.“</p>
      <small>Geben ist ein unregelmäßiges Verb: du → Gib!; formelles Sie → Geben Sie!</small></Panel>
  </>;
}
function FormalImperative() {
  return <>
    <h1>Imperativ mit Sie</h1><p className="a1d15-lead">Eine höfliche Aufforderung: <b>Verb + Sie + bitte + Objekt.</b></p>
    <div className="a1d15-frame"><strong>Geben</strong><em>Sie</em><span>mir bitte den Stift.</span></div>
    <SentenceBuilder exercises={A1_DAY15_SENTENCE_TASKS.formal} instruction="Baue den Imperativ mit Sie." />
    <div className="a1d15-note"><b>Wichtig:</b> Nicht „Sie geben mir ...“ als Aufforderung, sondern „Geben Sie mir ...“</div>
  </>;
}
function SeparableImperative() {
  return <>
    <h1>Trennbare Verben im Imperativ</h1>
    <p className="a1d15-lead">Bei <b>ausmachen</b> und <b>aufmachen</b> geht das Präfix im Imperativ ans Satzende.</p>
    <div className="a1d15-frame"><strong>Machen</strong><em>Sie</em><span>bitte das Radio</span><strong>aus.</strong></div>
    <div className="a1d15-frame"><strong>Machen</strong><em>Sie</em><span>bitte die Tür</span><strong>auf.</strong></div>
    <SentenceBuilder exercises={A1_DAY15_SENTENCE_TASKS.separable} instruction="Setze auf / aus ans Satzende." />
    <div className="a1d15-note">ausmachen → <b>Machen Sie ... aus.</b> · aufmachen → <b>Machen Sie ... auf.</b></div>
  </>;
}
function KoennenRequests() {
  return <>
    <h1>Höfliche Bitten mit können</h1>
    <p className="a1d15-lead">Wir machen aus dem Imperativ eine höfliche Frage.</p>
    <div className="a1d15-conversion">
      <Panel><span className="a1d15-eyebrow">Imperativ</span><h2>Öffnen Sie bitte die Tür.</h2></Panel>
      <div className="a1d15-arrow" aria-hidden="true">↓</div>
      <Panel className="a1d15-feature"><span className="a1d15-eyebrow">Höfliche Frage</span><h2>Können Sie bitte die Tür öffnen?</h2></Panel>
    </div>
    <div className="a1d15-note"><b>Regel:</b> Können + Sie + bitte + Objekt + <b>Infinitiv am Ende</b>.</div>
    <SentenceBuilder exercises={A1_DAY15_SENTENCE_TASKS.koennen} instruction="Baue eine Bitte mit Können Sie." />
  </>;
}
function KoenntenRequests() {
  return <>
    <h1>Können Sie oder Könnten Sie?</h1>
    <p className="a1d15-lead">Beide Formen passen für eine höfliche Bitte. <strong>Könnten Sie</strong> klingt oft noch etwas höflicher.</p>
    <div className="a1d15-compare">
      <Panel><span className="a1d15-eyebrow">Höflich</span><h2>Können Sie bitte das Fenster öffnen?</h2></Panel>
      <Panel className="a1d15-feature"><span className="a1d15-eyebrow">Besonders höflich</span><h2>Könnten Sie bitte das Fenster öffnen?</h2></Panel>
    </div>
    <div className="a1d15-note"><b>Merke:</b> Könnten Sie ist eine feste höfliche Form. <b>Konnten Sie</b> (ohne Umlaut) ist Vergangenheit. Die ganze Konjunktiv-II-Grammatik lernen wir später.</div>
    <SentenceBuilder exercises={A1_DAY15_SENTENCE_TASKS.koennten} instruction="Baue die besonders höfliche Bitte." />
  </>;
}
function ObjectVocabulary() {
  const cards = A1_TEIL3_OBJECT_CARDS.slice(0, 10);
  const [page, setPage] = useState(0);
  const [revealed, setRevealed] = useState([]);
  const display = cards.slice(page * 5, page * 5 + 5);
  return <>
    <h1>Teil 3 · Gegenstände und Verben</h1>
    <p className="a1d15-lead">Sieh das Bild. Welches Verb passt? Sage zuerst selbst eine höfliche Bitte, dann zeige das Beispiel.</p>
    <div className="a1d15-objects">{display.map(card => <Panel key={card.id} className="a1d15-object">
      <span className="a1d15-object-symbol" role="img" aria-label={card.objectEn}>{card.symbol}</span>
      <h2>{card.objectDe}</h2>
      <button type="button" aria-expanded={revealed.includes(card.id)}
        onClick={() => setRevealed(old => old.includes(card.id) ? old.filter(id => id !== card.id) : [...old, card.id])}>
        {revealed.includes(card.id) ? "Verb verbergen" : "Verb und Beispiel zeigen"}</button>
      {revealed.includes(card.id) ? <div className="a1d15-solution"><b>{card.verb}</b><small>{card.requestDe}</small></div> : null}
    </Panel>)}</div>
    <div className="a1d15-buttons">
      <button type="button" disabled={page === 0} className="a1d15-secondary" onClick={() => setPage(0)}>Bilder 1–5</button>
      <button type="button" disabled={page === 1} onClick={() => setPage(1)}>Bilder 6–10</button>
    </div>
    <div className="a1d15-note">In der nächsten Übung wählt Falowen für jeden Studenten eine eigene Bildkarte. Dort gibt es <b>keine Lösung vor der Antwort</b>.</div>
  </>;
}
function ReactionsAndMistakes() {
  const [index, setIndex] = useState(0);
  const [solution, setSolution] = useState(false);
  const [mistakeIndex, setMistakeIndex] = useState(0);
  const [correction, setCorrection] = useState(false);
  const exchange = A1_DAY15_REACTIONS[index], mistake = A1_DAY15_MISTAKES[mistakeIndex];
  return <>
    <h1>Bitten beantworten</h1>
    <p className="a1d15-lead">In Teil 3 musst du <b>bitten und reagieren</b>. Eine kurze passende Antwort reicht.</p>
    <div className="a1d15-reaction-list"><span>Ja, gern.</span><span>Natürlich.</span><span>Hier, bitte.</span><span>Tut mir leid, das geht leider nicht.</span></div>
    <div className="a1d15-compare">
      <Panel><span className="a1d15-eyebrow">Partnerfrage {index + 1} / {A1_DAY15_REACTIONS.length}</span>
        <h2>{exchange.request}</h2><p>Reagiere zuerst laut.</p>
        <div className="a1d15-buttons"><button type="button" onClick={() => setSolution(v => !v)} aria-expanded={solution}>
          {solution ? "Antwort verbergen" : "Antwort zeigen"}</button>
          <button type="button" className="a1d15-secondary" onClick={() => { setIndex(i => (i + 1) % A1_DAY15_REACTIONS.length); setSolution(false); }}>Nächste Bitte</button></div>
        {solution ? <div className="a1d15-solution"><b>{exchange.response}</b><small>{exchange.tip}</small></div> : null}
      </Panel>
      <Panel><span className="a1d15-eyebrow">Fehler verbessern {mistakeIndex + 1} / {A1_DAY15_MISTAKES.length}</span>
        <h2>{mistake.wrong}</h2><p>Was ist falsch? Sage den richtigen Satz.</p>
        <div className="a1d15-buttons"><button type="button" onClick={() => setCorrection(v => !v)} aria-expanded={correction}>
          {correction ? "Korrektur verbergen" : "Korrektur zeigen"}</button>
          <button type="button" className="a1d15-secondary" onClick={() => { setMistakeIndex(i => (i + 1) % A1_DAY15_MISTAKES.length); setCorrection(false); }}>Nächster Fehler</button></div>
        {correction ? <div className="a1d15-solution"><b>{mistake.right}</b><small>{mistake.why}</small></div> : null}
      </Panel>
    </div>
  </>;
}

export default function A1Day15ClassroomStage({ step }) {
  const content = {
    "exam-map": <ExamMap />,
    "imperative-intro": <ImperativeIntro />,
    "imperative-forms": <ImperativeForms />,
    "formal-imperative": <FormalImperative />,
    "separable-imperative": <SeparableImperative />,
    "koennen-request": <KoennenRequests />,
    "koennten-request": <KoenntenRequests />,
    "objects": <ObjectVocabulary />,
    "reactions": <ReactionsAndMistakes />,
  };
  return <section className="a1d15" lang="de">{content[step] || null}</section>;
}
