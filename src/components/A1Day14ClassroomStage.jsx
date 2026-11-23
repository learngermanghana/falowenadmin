import { useState } from "react";
import {
  A1_DAY14_TRAIN_WORDS,
  A1_DAY14_HOTEL_WORDS,
  A1_DAY14_MODALS,
  A1_DAY14_CONJUGATIONS,
  A1_DAY14_BUILD,
  A1_DAY14_CORRECTIONS,
  A1_DAY14_QUESTIONS,
  A1_DAY14_HOTEL_DIALOGUE,
} from "../data/a1Day14Classroom.js";
import "./A1Day14ClassroomStage.css";

function Panel({ children, className = "" }) {
  return <div className={"a1day14-panel " + className}>{children}</div>;
}

function ShowAnswer({ answer, tip = "" }) {
  const [visible, setVisible] = useState(false);
  return <div className="a1day14-reveal">
    <button type="button" aria-expanded={visible} onClick={() => setVisible(value => !value)}>
      {visible ? "Lösung verbergen" : "Lösung zeigen"}
    </button>
    {visible
      ? <div className="a1day14-answer" role="status"><strong>{answer}</strong>{tip ? <p>{tip}</p> : null}</div>
      : <small>Erst selbst sprechen. Die Lehrkraft zeigt die Lösung danach.</small>}
  </div>;
}

function Practice({ exercises, instruction }) {
  const [index, setIndex] = useState(0);
  const [used, setUsed] = useState([]);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const item = exercises[index];
  const sentence = used.map(i => item.words[i]).join(" ");
  const correct = used.length === item.words.length &&
    used.every((selectedIndex, position) => item.words[selectedIndex] === item.answer[position]);
  const next = () => {
    setIndex(value => (value + 1) % exercises.length);
    setUsed([]);
    setChecked(false);
    setRevealed(false);
  };
  return <Panel>
    <div className="a1day14-practice-head">
      <span>Aufgabe {index + 1} von {exercises.length}</span>
      <strong>{instruction}</strong>
    </div>
    <div className="a1day14-word-pool" aria-label="Wörter auswählen">
      {item.words.map((word, i) => <button key={i} type="button" disabled={used.includes(i)}
        onClick={() => { setUsed(current => [...current, i]); setChecked(false); setRevealed(false); }}>
        {word}
      </button>)}
    </div>
    <div className="a1day14-sentence" aria-label="Dein Satz">
      {sentence || "Tippe die Wörter in der richtigen Reihenfolge an."}
    </div>
    <div className="a1day14-actions">
      <button type="button" disabled={used.length !== item.words.length}
        onClick={() => setChecked(true)}>Prüfen</button>
      <button type="button" className="a1day14-light" onClick={() => {setUsed([]); setChecked(false); setRevealed(false);}}>Neu ordnen</button>
      <button type="button" className="a1day14-light" aria-expanded={revealed}
        onClick={() => setRevealed(value => !value)}>Lösung {revealed ? "verbergen" : "zeigen"}</button>
      <button type="button" className="a1day14-light" onClick={next}>Nächste Aufgabe</button>
    </div>
    {checked ? <p role="status" className={correct ? "a1day14-success" : "a1day14-feedback"}>
      {correct ? "Richtig! Du hast den ganzen Satz gebaut." : "Noch nicht richtig. Prüfe die Wortstellung und versuche es erneut."}
    </p> : null}
    {revealed ? <div className="a1day14-answer" role="status"><strong>{item.model}</strong></div> : null}
  </Panel>;
}

function Vocabulary({ entries, headline }) {
  const [open, setOpen] = useState([]);
  return <>
    <h1>{headline}</h1>
    <p className="a1day14-lead">Sieh das Bildzeichen. Sage zuerst ein Verb oder einen eigenen Satz. Dann Beispiel öffnen.</p>
    <div className="a1day14-vocab-grid">
      {entries.map((entry, i) => <div key={entry.word} className="a1day14-vocab-card">
        <span className="a1day14-picture" role="img" aria-label={entry.en}>{entry.icon}</span>
        <strong>{entry.word}</strong><small>{entry.en}</small>
        <button type="button" aria-expanded={open.includes(i)}
          onClick={() => setOpen(old => old.includes(i) ? old.filter(n => n !== i) : [...old, i])}>
          {open.includes(i) ? "Beispiel verbergen" : "Beispiel zeigen"}
        </button>
        {open.includes(i) ? <p lang="de" className="a1day14-example">{entry.model}</p> : null}
      </div>)}
    </div>
  </>;
}

function Conjugation() {
  const [hidden, setHidden] = useState(true);
  return <>
    <h1>Vier Modalverben konjugieren</h1>
    <p className="a1day14-lead">Welche Form passt zu ich, du, er/sie, wir und Sie?</p>
    <div className="a1day14-table-wrap">
      <table className="a1day14-table">
        <thead><tr>{["Person", "können", "möchten", "wollen", "müssen"].map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{A1_DAY14_CONJUGATIONS.map(row => <tr key={row[0]}>
          <th>{row[0]}</th>{row.slice(1).map((value, i) => <td key={i}>{hidden ? "?" : value}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <div className="a1day14-actions"><button type="button" onClick={() => setHidden(v => !v)}>
      {hidden ? "Formen zeigen" : "Formen verbergen"}
    </button></div>
    <Panel><strong>Ergänze mündlich</strong><p>Du ___ in Hamburg umsteigen. / Er ___ Wasser trinken. / Wir ___ nach Berlin fahren.</p>
      <ShowAnswer answer="Du musst ... / Er möchte ... / Wir wollen ..." tip="Conjugate the modal; the main action stays in infinitive." /></Panel>
  </>;
}

function MeaningCards() {
  const [revealed, setRevealed] = useState([]);
  return <>
    <h1>Können · möchten · wollen · müssen</h1>
    <p className="a1day14-lead">Welche Bedeutung passt zur Situation? Sage den Satz zuerst selbst.</p>
    <div className="a1day14-modal-grid">
      {A1_DAY14_MODALS.map((modal, i) => <Panel key={modal.word}>
        <span className="a1day14-picture" role="img" aria-label={modal.word}>{modal.icon}</span>
        <h2>{modal.word}</h2><p>{modal.meaning}</p><small>{modal.situation}</small>
        <button type="button" aria-expanded={revealed.includes(i)}
          onClick={() => setRevealed(old => old.includes(i) ? old.filter(x => x !== i) : [...old, i])}>
          {revealed.includes(i) ? "Satz verbergen" : "Satz zeigen"}
        </button>
        {revealed.includes(i) ? <p lang="de" className="a1day14-example">{modal.example}</p> : null}
      </Panel>)}
    </div>
    <p className="a1day14-tip"><b>Höflich:</b> Ich möchte ein Zimmer buchen. <b>Direkter:</b> Ich will ein Zimmer buchen.</p>
  </>;
}

function SentenceFrame() {
  return <>
    <h1>Modalverb + trennbares Verb</h1>
    <p className="a1day14-lead">Was passiert mit einsteigen, aussteigen und umsteigen?</p>
    <Panel>
      <span className="a1day14-overline">Vorher · Trennbares Verb</span>
      <div className="a1day14-frame">
        <span>Ich</span><strong>steige</strong><span>in den Zug</span><em>ein.</em>
      </div>
      <div className="a1day14-arrow" aria-hidden="true">↓ + möchte</div>
      <span className="a1day14-overline">Jetzt · Modalverb + Infinitiv</span>
      <div className="a1day14-frame">
        <span>Ich</span><strong>möchte</strong><span>in den Zug</span><em>einsteigen.</em>
      </div>
    </Panel>
    <div className="a1day14-note"><b>Regel:</b> Das Modalverb steht auf Position 2. Das zweite Verb steht als ganzer Infinitiv am Satzende.</div>
    <Panel><strong>Jetzt du: Ändere den Satz.</strong><p>Ich steige in Hamburg um. → Ich muss ...</p>
      <ShowAnswer answer="Ich muss in Hamburg umsteigen." tip="After müssen, the separable verb is not split." /></Panel>
  </>;
}

function Corrections() {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [wrong, correct, explanation] = A1_DAY14_CORRECTIONS[index];
  return <Panel>
    <span className="a1day14-overline">Fehler finden · {index + 1} / {A1_DAY14_CORRECTIONS.length}</span>
    <h2>{wrong}</h2>
    <p>Was ist falsch? Sage den ganzen richtigen Satz.</p>
    <div className="a1day14-actions">
      <button type="button" aria-expanded={show} onClick={() => setShow(x => !x)}>
        {show ? "Lösung verbergen" : "Lösung zeigen"}
      </button>
      <button type="button" className="a1day14-light" onClick={() => {setIndex(i => (i + 1) % A1_DAY14_CORRECTIONS.length);setShow(false);}}>Nächster Fehler</button>
    </div>
    {show ? <div className="a1day14-answer"><strong>{correct}</strong><p>{explanation}</p></div> : null}
  </Panel>;
}

function QuestionPractice() {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [statement, question] = A1_DAY14_QUESTIONS[index];
  return <>
    <h1>Fragen und Antworten bilden</h1>
    <p className="a1day14-lead">Mach aus der Aussage eine Ja-/Nein-Frage oder eine passende W-Frage.</p>
    <Panel><span className="a1day14-overline">Aufgabe {index + 1} / {A1_DAY14_QUESTIONS.length}</span>
      <h2>{statement}</h2>
      <p>Sage jetzt die passende Frage und antworte in einem ganzen Satz.</p>
      <div className="a1day14-actions">
        <button type="button" aria-expanded={show} onClick={() => setShow(x => !x)}>
          {show ? "Frage verbergen" : "Mögliche Frage zeigen"}
        </button>
        <button type="button" className="a1day14-light"
          onClick={() => {setIndex(i => (i + 1) % A1_DAY14_QUESTIONS.length);setShow(false);}}>Nächste Aufgabe</button>
      </div>
      {show ? <div className="a1day14-answer" role="status"><strong>{question}</strong></div> : null}
    </Panel>
    <div className="a1day14-note">Ja/Nein: <b>Kannst du ...?</b> · W-Frage: <b>Was möchtest du ...?</b> Das zweite Verb bleibt am Ende.</div>
  </>;
}

function HotelDialogue() {
  const [visible, setVisible] = useState(false);
  return <>
    <h1>Im Hotel: Ein Zimmer reservieren</h1>
    <p className="a1day14-lead">Rollenspiel: Eine Person ist Gast, die andere arbeitet an der Rezeption.</p>
    <div className="a1day14-dialogue">
      {A1_DAY14_HOTEL_DIALOGUE.map(([speaker, prompt, answer], i) => <Panel key={i}>
        <span className="a1day14-overline">{speaker}</span>
        <p lang="de">{prompt}</p>
        {visible ? <strong className="a1day14-example">{prompt.includes("___")
          ? prompt.replace("___", answer) : answer}</strong> : null}
      </Panel>)}
    </div>
    <div className="a1day14-actions"><button type="button" aria-expanded={visible}
      onClick={() => setVisible(v => !v)}>{visible ? "Antworten verbergen" : "Mögliche Antworten zeigen"}</button></div>
    <p className="a1day14-tip">Jetzt tauscht ihr die Rollen. Frage auch: Haben Sie ein Zimmer frei?</p>
  </>;
}

function ExitChallenge({ workbookUrl = "" }) {
  const [show, setShow] = useState(false);
  return <>
    <h1>Deine Reise nach Deutschland</h1>
    <p className="a1day14-lead">Ohne Vorlage: Sage fünf vollständige Sätze. Danach reservierst du ein Hotelzimmer.</p>
    <div className="a1day14-final-grid">
      {[
        ["🚆", "1 · können", "Was kannst du auf deiner Reise machen?"],
        ["🛏️", "2 · möchten", "Welches Hotelzimmer möchtest du buchen?"],
        ["🧳", "3 · wollen", "Wohin willst du fahren?"],
        ["🔁", "4 · müssen", "Wo musst du umsteigen?"],
        ["🎫", "5 · Trennbares Verb", "Wann steigst du ein oder aus?"],
      ].map(([icon, verb, instruction]) => <Panel key={verb}>
        <span className="a1day14-picture" aria-hidden="true">{icon}</span>
        <strong>{verb}</strong><p>{instruction}</p>
      </Panel>)}
    </div>
    <Panel>
      <h2>Mini-Dialog · Hotelreservierung</h2>
      <p>Gast: Begrüße die Rezeption und sage, welches Zimmer du buchen möchtest.</p>
      <p>Rezeption: Frage nach der Zahl der Nächte.</p>
      <p>Gast: Antworte und bedanke dich.</p>
      <div className="a1day14-actions"><button type="button" aria-expanded={show} onClick={() => setShow(v => !v)}>
        {show ? "Beispiele verbergen" : "Beispiele zeigen · nach dem Versuch"}
      </button></div>
      {show ? <div className="a1day14-answer" role="status">
        <p>Ich kann Deutsch sprechen. Ich möchte ein Einzelzimmer buchen. Ich will nach Berlin fahren. Ich muss in Hamburg umsteigen. Ich steige um neun Uhr ein.</p>
        <p><b>Gast:</b> Guten Tag, ich möchte ein Einzelzimmer buchen. <b>Rezeption:</b> Für wie viele Nächte? <b>Gast:</b> Für zwei Nächte, bitte. Vielen Dank!</p>
      </div> : null}
    </Panel>
    <p className="a1day14-tip">Selbstkontrolle: Modalverb auf Position 2 · trennbares Verb als Infinitiv am Ende · passende Reise- und Hotelwörter.</p>
    {workbookUrl ? <a className="a1day14-workbook-link" href={workbookUrl} target="_blank" rel="noreferrer">
      Vorhandenes Day-14-Workbook öffnen
    </a> : null}
  </>;
}

export default function A1Day14ClassroomStage({ step, workbookUrl = "" }) {
  return <section className="a1day14" lang="de">
    {step === "review" ? <>
      <h1>Aussagesätze bilden</h1>
      <p className="a1day14-lead">Wiederholung vom letzten Kapitel: Das konjugierte Verb steht an Position 2.</p>
      <div className="a1day14-frame"><span>Ich</span><strong>fahre</strong><span>morgen nach Berlin.</span></div>
      <Practice key="review" exercises={A1_DAY14_BUILD.review} instruction="Baue eine ganze Aussage." />
    </> : null}
    {step === "separable" ? <>
      <h1>Trennbare Verben</h1>
      <p className="a1day14-lead">Erinnerst du dich? einsteigen · aussteigen · umsteigen</p>
      <div className="a1day14-frame"><span>Ich</span><strong>steige</strong><span>in den Zug</span><em>ein.</em></div>
      <Practice key="separable" exercises={A1_DAY14_BUILD.separable} instruction="Das Präfix gehört ans Ende." />
    </> : null}
    {step === "train" ? <Vocabulary entries={A1_DAY14_TRAIN_WORDS} headline="Am Bahnhof" /> : null}
    {step === "hotel" ? <>
      <Vocabulary entries={A1_DAY14_HOTEL_WORDS} headline="Im Hotel" />
      <p className="a1day14-tip"><b>Merke:</b> übernachten und reservieren sind nicht trennbar. einsteigen, aussteigen und umsteigen sind trennbar.</p>
    </> : null}
    {step === "meanings" ? <MeaningCards /> : null}
    {step === "conjugation" ? <Conjugation /> : null}
    {step === "sentence-frame" ? <SentenceFrame /> : null}
    {step === "train-build" ? <>
      <h1>Mit dem Zug fahren</h1>
      <p className="a1day14-lead">Kombiniere Modalverben und trennbare Verben zu einem ganzen Satz.</p>
      <Practice key="train-build" exercises={A1_DAY14_BUILD["train-build"]} instruction="Baue den Satz mit dem Infinitiv am Ende." />
      <Corrections />
    </> : null}
    {step === "reservation" ? <HotelDialogue /> : null}
    {step === "questions" ? <><QuestionPractice /><Corrections /></> : null}
    {step === "exit" ? <ExitChallenge workbookUrl={workbookUrl} /> : null}
  </section>;
}
