import { useState } from 'react';
import './A2ApplicationLab.css';

/** Teacher-led, ungraded grammar transfer. Each course day owns its facts and answer key. */
export default function A2ApplicationLab({ lab, level = "A2" }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([null, null, null]);
  if (!lab || !Array.isArray(lab.tasks) || lab.tasks.length !== 3) return null;

  const task = lab.tasks[index];
  const correctCount = results.filter(result => result === 'correct').length;
  const reviewedCount = results.filter(Boolean).length;
  const selectTask = next => {
    setIndex(Math.max(0, Math.min(lab.tasks.length - 1, next)));
    setRevealed(false);
  };
  const mark = value => setResults(previous => previous.map((result, position) =>
    position === index ? (result === value ? null : value) : result));

  return (
    <section className="a2-application-lab" aria-label={`${level} Tag ${lab.day}: ${lab.title}`}>
      <header className="a2-application-lab__heading">
        <div>
          <span className="a2-application-lab__eyebrow">{level} · TAG {lab.day} · GRAMMATIK ANWENDEN</span>
          <h1>{lab.title}</h1>
          <p>{lab.context}</p>
        </div>
        <span className="a2-application-lab__duration">{level === "B1" ? "6–7" : "5–6"} MIN · PAARARBEIT</span>
      </header>

      <div className="a2-application-lab__facts" role="region" aria-label="Informationen für die drei Aufgaben" tabIndex={0}>
        <table>
          <thead><tr>{lab.columns.map((column, columnIndex) => <th scope="col" key={columnIndex}>{column}</th>)}</tr></thead>
          <tbody>{lab.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>{row.map((cell, columnIndex) => columnIndex === 0
              ? <th scope="row" key={columnIndex}>{cell}</th>
              : <td key={columnIndex}>{cell}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>

      <article className="a2-application-lab__question" aria-label={`Aufgabe ${index + 1} von 3`}>
        <div className="a2-application-lab__meta">
          <strong>AUFGABE {index + 1} VON 3</strong>
          <span>{task.hint}</span>
        </div>
        <div className="a2-application-lab__progress" aria-label={`Fortschritt: ${index + 1} von 3`}>
          {lab.tasks.map((item, position) => (
            <button type="button" key={item.id} aria-label={`Aufgabe ${position + 1}: ${item.label}`}
              aria-current={index === position ? 'step' : undefined}
              className={position === index ? 'is-active' : results[position] ? 'is-done' : ''}
              onClick={() => selectTask(position)} />
          ))}
        </div>
        <h2>{task.label}</h2>
        <p className="a2-application-lab__prompt" lang="de">{task.prompt}</p>
        {revealed ? (
          <div className="a2-application-lab__model" role="status">
            <strong>Musterantwort</strong>
            <p lang="de">{task.answer}</p>
            <small>Prüfpunkt: {task.criterion}</small>
            <div className="a2-application-lab__rating" role="group" aria-label="Lehrkraft-Einschätzung">
              <button type="button" className={results[index] === 'correct' ? 'is-selected' : ''}
                aria-pressed={results[index] === 'correct'} onClick={() => mark('correct')}>✓ Sicher</button>
              <button type="button" className={results[index] === 'review' ? 'is-selected' : ''}
                aria-pressed={results[index] === 'review'} onClick={() => mark('review')}>↻ Noch üben</button>
            </div>
          </div>
        ) : null}
        <div className="a2-application-lab__actions">
          <button type="button" className="a2-application-lab__reveal" aria-expanded={revealed}
            onClick={() => setRevealed(value => !value)}>{revealed ? 'Antwort verbergen' : 'Lösung zeigen'}</button>
          <div className="a2-application-lab__nav">
            <button type="button" aria-label="Vorherige Aufgabe" disabled={index === 0}
              onClick={() => selectTask(index - 1)}>←</button>
            <button type="button" onClick={() => selectTask(index === lab.tasks.length - 1 ? 0 : index + 1)}>
              {index === lab.tasks.length - 1 ? 'Wiederholen' : 'Weiter →'}
            </button>
          </div>
        </div>
      </article>
      <p className="a2-application-lab__footer" role="status">
        Lehrkraft: Erst zuhören, dann die Lösung zeigen. {reviewedCount} von 3 überprüft · {correctCount} sicher. Keine Benotung oder automatische Übertragung.
      </p>
    </section>
  );
}
