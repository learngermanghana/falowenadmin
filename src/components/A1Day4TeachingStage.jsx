import { useEffect, useMemo, useState } from "react";
import { A1_DAY4_NUMBERS, A1_DAY4_QUIZ_ANSWERS } from "../data/a1Day4Classroom.js";
import "./A1Day4TeachingStage.css";

const { basics, teens, tens, compound, hundreds, thousands, finalChallenge } = A1_DAY4_NUMBERS;

function Tile({ label, value, hint, className = "" }) {
  return <div className={"a1-day4-card " + className}>
    <span className="a1-day4-card-value">{value}</span>
    <strong>{label}</strong>
    {hint ? <small>{hint}</small> : null}
  </div>;
}

function NumberReveal({ entries, prefix = "Zahl" }) {
  const [visible, setVisible] = useState({});
  return <div className="a1-day4-reveal-grid">
    {entries.map(([number, word]) => <div className="a1-day4-reveal-card" key={number}>
      <span className="a1-day4-micro">{prefix}</span>
      <strong className="a1-day4-large-number">{number}</strong>
      <button type="button" aria-expanded={Boolean(visible[number])}
        onClick={() => setVisible(current => ({ ...current, [number]: !current[number] }))}>
        {visible[number] ? "Antwort verbergen" : "Antwort zeigen"}
      </button>
      {visible[number] ? <span className="a1-day4-revealed-word" lang="de">{word}</span> :
        <span className="a1-day4-placeholder">Sprich zuerst laut!</span>}
    </div>)}
  </div>;
}

function NumberQuiz({ question, questions = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(-1);
  const [revealed, setRevealed] = useState(false);
  const assigned = Boolean(question?.questionDe);
  const sourceIndex = assigned && Number.isInteger(question.sourceIndex) ? question.sourceIndex : currentIndex;
  const index = Math.max(0, Math.min(A1_DAY4_QUIZ_ANSWERS.length - 1, sourceIndex));
  const active = assigned ? question : questions[index];
  const options = A1_DAY4_QUIZ_ANSWERS[index];
  const normalizedAnswer = String(active?.answerDe || "").replace(/[.。]+$/, "").trim().toLocaleLowerCase("de-DE");
  const correctIndex = options.findIndex(option => option.toLocaleLowerCase("de-DE") === normalizedAnswer);

  useEffect(() => {
    setSelected(-1);
    setRevealed(false);
  }, [question?.id, question?.questionDe, currentIndex]);

  const contextLabel = assigned ? "Aktueller Student · Lehrkraft bewertet" :
    "Vorübung · Wähle einen Studenten oben für den individuellen Check";

  return <section className="a1-day4-lesson a1-day4-quiz" lang="de">
    <span className="a1-day4-eyebrow">Zahlen-Quiz · {index + 1} / 10</span>
    <h1>Welche Zahl ist richtig?</h1>
    <p className="a1-day4-lead">{contextLabel}</p>
    <div className="a1-day4-quiz-panel">
      <h2>{active?.questionDe || "Wähle die richtige Antwort."}</h2>
      <div className="a1-day4-choices">
        {options.map((option, i) => <button type="button" key={i}
          className={selected === i ? "is-selected" : ""} aria-pressed={selected === i}
          onClick={() => { setSelected(i); setRevealed(false); }}>
          <span>{String.fromCharCode(65 + i)}</span>{option}
        </button>)}
      </div>
      <div className="a1-day4-buttons">
        <button type="button" disabled={selected < 0} onClick={() => setRevealed(value => !value)}>
          {revealed ? "Antwort verbergen" : "Antwort zeigen"}
        </button>
        {!assigned ? <button type="button" className="a1-day4-secondary" onClick={() =>
          setCurrentIndex(value => (value + 1) % A1_DAY4_QUIZ_ANSWERS.length)}>
          Nächste Frage
        </button> : null}
      </div>
      {revealed ? <p role="status" className={selected === correctIndex ? "a1-day4-correct" : "a1-day4-try-again"}>
        <strong>{selected === correctIndex ? "Richtig!" : "Nicht ganz."}</strong>
        {" Richtige Antwort: "}{active?.answerDe}
        {active?.noteEn ? <small>{active.noteEn}</small> : null}
      </p> : null}
    </div>
    {assigned ? <p className="a1-day4-tip">Die Lehrkraft dokumentiert Correct oder Needs review über die bestehende Studentenauswahl. Die Auswahl hier speichert keine Note.</p> :
      <p className="a1-day4-tip">In der Vorübung werden keine Ergebnisse gespeichert.</p>}
  </section>;
}

export default function A1Day4TeachingStage({ step, question, questions = [] }) {
  const [chosenCompound, setChosenCompound] = useState(1);
  const [showCompound, setShowCompound] = useState(false);
  const [recapIndex, setRecapIndex] = useState(0);
  const [showRecap, setShowRecap] = useState(false);
  const compoundEntry = useMemo(() => compound[chosenCompound], [chosenCompound]);

  useEffect(() => {
    setChosenCompound(1);
    setShowCompound(false);
    setRecapIndex(0);
    setShowRecap(false);
  }, [step]);

  if (step === "quiz") return <NumberQuiz question={question} questions={questions} />;

  if (step === "intro") return <section className="a1-day4-lesson" lang="de">
    <span className="a1-day4-eyebrow">A1 · Day 4</span>
    <h1>Zahlen, Telefonnummern und Adressen</h1>
    <p className="a1-day4-lead">Heute lernen wir Zahlen zu lesen, zu sprechen und zu schreiben.</p>
    <div className="a1-day4-hero">
      {[["1", "eins"], ["10", "zehn"], ["100", "hundert"], ["1000", "tausend"]].map(([value, label]) =>
        <Tile key={value} value={value} label={label} />)}
    </div>
    <div className="a1-day4-objectives">
      <strong>Unsere drei Lernziele</strong>
      <span>Zahlen richtig aussprechen</span>
      <span>Große Zahlen bilden</span>
      <span>Nummern im Alltag verstehen</span>
    </div>
  </section>;

  if (step === "basics") return <section className="a1-day4-lesson" lang="de">
    <span className="a1-day4-eyebrow">Zahlen 0–10</span>
    <h1>Die Zahlen von null bis zehn</h1>
    <p className="a1-day4-lead">Schau auf die Zahl und sprich das deutsche Wort laut.</p>
    <div className="a1-day4-grid a1-day4-basic-grid">
      {basics.map((label, number) => <Tile key={number} value={number} label={label} />)}
    </div>
    <p className="a1-day4-tip">Jetzt du: 7 · 3 · 10 · 0 · 5 — sage die Zahlen ohne abzulesen.</p>
  </section>;

  if (step === "teens") return <section className="a1-day4-lesson" lang="de">
    <span className="a1-day4-eyebrow">Zahlen 11–19</span>
    <h1>Die Zahlen von elf bis neunzehn</h1>
    <p className="a1-day4-lead">Achte besonders auf sechzehn und siebzehn.</p>
    <div className="a1-day4-grid a1-day4-teen-grid">
      {teens.map(([number, word]) => <Tile key={number} value={number} label={word}
        className={number === 16 || number === 17 ? "a1-day4-highlight" : ""} />)}
    </div>
    <div className="a1-day4-rule"><strong>Wichtig</strong>
      <span>16 = <b>sechzehn</b>, nicht sechszehn.</span>
      <span>17 = <b>siebzehn</b>, nicht siebenzehn.</span>
    </div>
  </section>;

  if (step === "tens") return <section className="a1-day4-lesson" lang="de">
    <span className="a1-day4-eyebrow">Die Zehner</span>
    <h1>Zwanzig, dreißig, vierzig …</h1>
    <p className="a1-day4-lead">Lies die Zehnerzahlen. Welche Wörter sind besonders?</p>
    <div className="a1-day4-grid a1-day4-tens-grid">
      {tens.map(([number, word]) => <Tile key={number} value={number} label={word}
        className={[30, 60, 70].includes(number) ? "a1-day4-highlight" : ""} />)}
    </div>
    <p className="a1-day4-tip">Merke: dreißig hat ß. Sechzig und siebzig sind verkürzt.</p>
  </section>;

  if (step === "compound") return <section className="a1-day4-lesson" lang="de">
    <span className="a1-day4-eyebrow">Zahlen 21–99</span>
    <h1>Einer + und + Zehner</h1>
    <p className="a1-day4-lead">Im Deutschen kommt zuerst der Einer, dann und, dann der Zehner.</p>
    <div className="a1-day4-number-tabs" role="group" aria-label="Wähle eine zweistellige Zahl">
      {compound.map(([number], i) => <button type="button" key={number}
        className={chosenCompound === i ? "is-selected" : ""}
        aria-pressed={chosenCompound === i} onClick={() => {setChosenCompound(i);setShowCompound(false);}}>
        {number}
      </button>)}
    </div>
    <div className="a1-day4-formula">
      <span className="a1-day4-formula-number">{compoundEntry[0]}</span>
      <div className="a1-day4-formula-words">
        <Tile label="Einer" value={compoundEntry[1]} />
        <Tile label="Verbindung" value="und" />
        <Tile label="Zehner" value={compoundEntry[2]} />
      </div>
      <button type="button" onClick={() => setShowCompound(v => !v)} aria-expanded={showCompound}>
        {showCompound ? "Antwort verbergen" : "Ganzes Zahlwort zeigen"}
      </button>
      {showCompound ? <strong className="a1-day4-revealed-word">{compoundEntry[1] + "und" + compoundEntry[2]}</strong> : null}
    </div>
    <p className="a1-day4-tip">21 heißt einundzwanzig (nicht einsundzwanzig).</p>
  </section>;

  if (step === "hundreds") return <section className="a1-day4-lesson" lang="de">
    <span className="a1-day4-eyebrow">Die Hunderter</span>
    <h1>Zahlen bis 999</h1>
    <p className="a1-day4-lead">Hunderter + Rest = ein deutsches Zahlwort.</p>
    <NumberReveal entries={hundreds} />
    <div className="a1-day4-rule"><strong>Beispiel</strong>
      <span>222 → zwei + hundert + zweiundzwanzig</span>
    </div>
  </section>;

  if (step === "thousands") return <section className="a1-day4-lesson" lang="de">
    <span className="a1-day4-eyebrow">Die Tausender</span>
    <h1>Tausenderzahlen verstehen</h1>
    <p className="a1-day4-lead">Lies erst die Tausender, dann Hunderter, Zehner und Einer.</p>
    <NumberReveal entries={thousands} />
    <p className="a1-day4-tip">2040 = zweitausendvierzig. Kein und zwischen Tausend und Vierzig.</p>
  </section>;

  if (step === "contact") return <section className="a1-day4-lesson" lang="de">
    <span className="a1-day4-eyebrow">Zahlen im Alltag</span>
    <h1>Telefonnummern und Hausnummern</h1>
    <p className="a1-day4-lead">Telefonnummern kannst du Ziffer für Ziffer sprechen.</p>
    <div className="a1-day4-contact-grid">
      <div className="a1-day4-contact-card">
        <span className="a1-day4-contact-symbol" role="img" aria-label="Telefon">☎</span>
        <span className="a1-day4-micro">Telefonnummer</span>
        <strong>030 555 16</strong>
        <p>null · drei · null · fünf · fünf · fünf · eins · sechs</p>
      </div>
      <div className="a1-day4-contact-card">
        <span className="a1-day4-contact-symbol" role="img" aria-label="Adresse">⌂</span>
        <span className="a1-day4-micro">Adresse</span>
        <strong>Gartenstraße 12</strong>
        <p>Gartenstraße zwölf</p>
      </div>
    </div>
    <p className="a1-day4-tip">Partnerübung: Frage „Wie lautet deine Telefonnummer?“ Verwende für die Übung eine erfundene Nummer, keine private Telefonnummer.</p>
  </section>;

  if (step === "wrapup") {
    const [number, answer] = finalChallenge[recapIndex];
    return <section className="a1-day4-lesson a1-day4-wrapup" lang="de">
      <h2>Abschluss · fünf Zahlen ohne Hilfe</h2>
      <p className="a1-day4-lead">Schreibe die Zahl auf Deutsch und sprich sie laut.</p>
      <div className="a1-day4-final-card">
        <span className="a1-day4-micro">Aufgabe {recapIndex + 1} / {finalChallenge.length}</span>
        <strong className="a1-day4-large-number">{number}</strong>
        <div className="a1-day4-buttons">
          <button type="button" aria-expanded={showRecap} onClick={() => setShowRecap(v => !v)}>
            {showRecap ? "Antwort verbergen" : "Antwort zeigen"}
          </button>
          <button type="button" className="a1-day4-secondary" onClick={() => {
            setRecapIndex(i => (i + 1) % finalChallenge.length); setShowRecap(false);
          }}>Nächste Zahl</button>
        </div>
        {showRecap ? <span className="a1-day4-revealed-word">{answer}</span> : null}
      </div>
    </section>;
  }

  return null;
}
