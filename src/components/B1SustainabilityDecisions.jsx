import { useState } from "react";
import "./B1SustainabilityDecisions.css";

const OPTIONS = Object.freeze([
  { id: "avoid", label: "Kauf vermeiden", sub: "Nicht unnötig neu kaufen" },
  { id: "reuse", label: "Länger nutzen", sub: "Reparieren und weiterverwenden" },
  { id: "switch", label: "Anders kaufen", sub: "Eine bessere Alternative wählen" },
  { id: "dispose", label: "Richtig entsorgen", sub: "Zur passenden Sammelstelle bringen" },
]);

/**
 * Teacher-led, unscored B1 practice. One everyday situation at a time;
 * students choose an action before the teacher reveals the explanation.
 */
export default function B1SustainabilityDecisions({ cases = [], onSetMinutes }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [showRecap, setShowRecap] = useState(false);
  const activeCase = cases[currentIndex];
  if (!activeCase) return null;

  const selected = answers[activeCase.id] || "";
  const checked = Boolean(revealed[activeCase.id]);
  const isCorrect = selected === activeCase.correctCategory;
  const completed = cases.filter((c) => revealed[c.id]).length;
  const correctCount = cases.filter((c) => revealed[c.id] && answers[c.id] === c.correctCategory).length;
  const correctCategoryLabel = OPTIONS.find((o) => o.id === activeCase.correctCategory)?.label || "";

  function goTo(index) {
    setCurrentIndex(Math.max(0, Math.min(cases.length - 1, index)));
    setShowRecap(false);
  }

  function reset() {
    setAnswers({});
    setRevealed({});
    setCurrentIndex(0);
    setShowRecap(false);
  }

  return (
    <section className="sustainability-decision" aria-label="Interaktive Argumentkarte Nachhaltigkeit">
      <header className="sustainability-decision-header">
        <div>
          <span className="sustainability-eyebrow">B1 · MITMACH-ENTSCHEIDUNG</span>
          <h1>Was würdest du tun?</h1>
          <p>Sieh dir einen Alltagsfall an und wähle die <strong>passendste Maßnahme</strong>. Danach prüfen wir gemeinsam die Begründung.</p>
        </div>
        <button type="button" className="sustainability-timer-button" onClick={() => onSetMinutes?.(7)}>7 Min. einstellen</button>
      </header>

      <div className="sustainability-decision-progress">
        <span>Fall {currentIndex + 1} von {cases.length}</span>
        <span>{completed}/{cases.length} besprochen</span>
      </div>
      <div className="sustainability-progress-track" aria-hidden="true">
        <div style={{ width: `${Math.round((completed / cases.length) * 100)}%` }} />
      </div>

      {showRecap ? (
        <div className="sustainability-recap" role="status">
          <span aria-hidden="true">✓</span>
          <h2>Gut gemacht!</h2>
          <p>Ihr habt alle vier Arten nachhaltiger Entscheidungen kennengelernt: unnötige Käufe vermeiden, länger nutzen, anders kaufen und richtig entsorgen.</p>
          <strong>{correctCount} von {cases.length} direkt richtig eingeordnet</strong>
          <p className="sustainability-recap-note">Diskutiert kurz: Welche dieser Maßnahmen ist in eurem Alltag besonders realistisch?</p>
          <button type="button" onClick={reset}>Fälle erneut üben</button>
        </div>
      ) : (
        <div className="sustainability-decision-grid">
          <article className="sustainability-situation">
            <span className="sustainability-case-label">ALLTAGSSITUATION {currentIndex + 1}</span>
            <div className="sustainability-situation-icon" aria-hidden="true">{activeCase.icon}</div>
            <h2>{activeCase.title}</h2>
            <p>{activeCase.situation}</p>
            <strong>{activeCase.question}</strong>
          </article>

          <div className="sustainability-choice-panel">
            <div className="sustainability-choice-heading">
              <strong>Wähle eine Maßnahme</strong>
              <span>Eine Antwort auswählen</span>
            </div>
            <div className="sustainability-choice-grid" role="group" aria-label="Nachhaltige Maßnahme auswählen">
              {OPTIONS.map((option, index) => (
                <button
                  type="button"
                  key={option.id}
                  className={`sustainability-choice ${selected === option.id ? "is-selected" : ""} ${checked && option.id === activeCase.correctCategory ? "is-correct" : ""}`}
                  aria-pressed={selected === option.id}
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, [activeCase.id]: option.id }));
                    setRevealed((prev) => ({ ...prev, [activeCase.id]: false }));
                  }}
                >
                  <span className="sustainability-choice-letter">{String.fromCharCode(65 + index)}</span>
                  <span><strong>{option.label}</strong><small>{option.sub}</small></span>
                </button>
              ))}
            </div>

            <div className="sustainability-answer-actions">
              <button
                type="button"
                className="sustainability-primary"
                disabled={!selected || checked}
                onClick={() => setRevealed((prev) => ({ ...prev, [activeCase.id]: true }))}
              >Lösung prüfen</button>
              <button type="button" className="sustainability-secondary" onClick={reset}>Neu starten</button>
            </div>
            {checked ? (
              <div className={`sustainability-feedback ${isCorrect ? "is-correct" : "is-review"}`} role="status">
                <strong>{isCorrect ? "Richtig! Gut entschieden." : "Fast! Schauen wir auf die passende Maßnahme."}</strong>
                <p><b>Beste Wahl: {correctCategoryLabel}.</b> {activeCase.explanation}</p>
                <div className="sustainability-b1-model">
                  <span>B1-MODELLSATZ</span>
                  <p>{activeCase.model}</p>
                </div>
              </div>
            ) : null}

            <nav className="sustainability-case-navigation" aria-label="Alltagsfälle durchgehen">
              <button type="button" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)}>← Zurück</button>
              <span>{currentIndex + 1} / {cases.length}</span>
              {currentIndex < cases.length - 1 ? (
                <button type="button" onClick={() => goTo(currentIndex + 1)} disabled={!checked}>Nächster Fall →</button>
              ) : (
                <button type="button" disabled={!checked} onClick={() => setShowRecap(true)}>Abschluss ansehen →</button>
              )}
            </nav>
          </div>
        </div>
      )}
      <p className="sustainability-decision-note">Hinweis: Mehrere Maßnahmen können sinnvoll sein. Entscheidet, welche im jeweiligen Fall im Vordergrund steht. Unbewertete Unterrichtsübung.</p>
    </section>
  );
}
