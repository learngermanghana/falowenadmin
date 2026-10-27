import { useState } from "react";
import MusicVideoEmbed from "./MusicVideoEmbed.jsx";
import { musicTimestamp, musicMomentUrl } from "../utils/musicTeaching.js";
import "./MusicTeachingStages.css";

/** The listening video takes the place of a warm-up, without adding a slide. */
export function MusicVideoStage({ music }) {
  return (
    <section className="music-teaching-video" aria-label="Musik im Unterricht">
      <header className="music-teaching-heading">
        <span>{music.level || "B1"} · MUSIK HÖREN</span>
        <h1>{music.title}</h1>
        <p>Hört das Lied und überlegt: <strong>{music.introQuestion}</strong></p>
      </header>
      <MusicVideoEmbed videoId={music.youtubeId} title={music.title} variant="lesson" />
      <div className="music-teaching-next-step">
        <strong>Nach dem Lied:</strong> {music.nextStep || "Weiter zu „Liedtext lesen & verstehen“. Die Grammatik- und Sprechaufgaben folgen später wie gewohnt."}
      </div>
    </section>
  );
}

/** Unscored B1 inference questions tied to actual lyric evidence and timestamps. */
export function MusicReadingStage({ music }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(-1);
  const [revealed, setRevealed] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const questions = Array.isArray(music.questions) ? music.questions : [];
  const sections = Array.isArray(music.readingSections) ? music.readingSections : [];
  const current = questions[index];

  if (!current) return null;

  const changeQuestion = (next) => {
    setIndex(Math.max(0, Math.min(questions.length - 1, next)));
    setSelected(-1);
    setRevealed(false);
    setHintOpen(false);
  };

  const atTime = musicMomentUrl(music.youtubeId, current.timestamp);

  return (
    <section className="music-teaching-reading" aria-label="Liedtext lesen und verstehen">
      <header className="music-teaching-heading">
        <span>B1 · LESEN & VERSTEHEN</span>
        <h1>Liedtext lesen & verstehen</h1>
        <p>Lest die Textstellen und zieht Schlussfolgerungen. Nicht nur einzelne Wörter wiederholen.</p>
      </header>
      <div className="music-reading-columns">
        <div className="music-reading-passages" lang="de">
          <div className="music-reading-passages-heading">
            <strong>Ausgewählte Textstellen</strong>
            <small>Aus „Weniger ist mehr“</small>
          </div>
          {sections.map((section, number) => (
            <article key={section.label} className="music-reading-passage">
              <span>{String(number + 1).padStart(2, "0")} · {section.label}</span>
              <p>{section.lines.join("\n")}</p>
            </article>
          ))}
        </div>
        <div className="music-reading-question">
          <div className="music-reading-question-heading">
            <span>FRAGE {index + 1} VON {questions.length}</span>
            <span>Unbewertete Übung</span>
          </div>
          <h2 lang="de">{current.prompt}</h2>
          <div className="music-reading-options" role="group" aria-label={current.prompt}>
            {current.options.map((option, n) => (
              <button
                type="button"
                key={option}
                className={selected === n ? "is-selected" : ""}
                aria-pressed={selected === n}
                onClick={() => { setSelected(n); setRevealed(false); }}
              >
                <span>{String.fromCharCode(65 + n)}</span>{option}
              </button>
            ))}
          </div>
          <div className="music-reading-actions">
            <button type="button" onClick={() => setRevealed((value) => !value)} disabled={selected < 0}>
              {revealed ? "Lösung verbergen" : "Lösung zeigen"}
            </button>
            <button type="button" className="is-secondary" onClick={() => setHintOpen((value) => !value)}>
              {hintOpen ? "Hinweis verbergen" : "Hinweis"}
            </button>
          </div>
          {hintOpen && <aside className="music-reading-hint"><strong>Lehrerhinweis:</strong> {current.hint}</aside>}
          {revealed && (
            <div className="music-reading-reveal" role="status">
              <strong>{selected === current.correctIndex ? "Richtig!" : "Musterlösung"} {current.answer}</strong>
              <p>{current.explanation}</p>
              <blockquote lang="de">{current.evidence}</blockquote>
              <div className="music-reading-timestamp">
                <span>Textstelle im Lied: <strong>{musicTimestamp(current.timestamp)}</strong></span>
                {atTime && <a href={atTime} target="_blank" rel="noopener noreferrer">Im YouTube-Video ab {musicTimestamp(current.timestamp)} anhören ↗</a>}
              </div>
            </div>
          )}
          <div className="music-reading-pagination">
            <button type="button" onClick={() => changeQuestion(index - 1)} disabled={index === 0}>← Zurück</button>
            <span>{index + 1} / {questions.length}</span>
            <button type="button" onClick={() => changeQuestion(index + 1)} disabled={index === questions.length - 1}>Nächste Frage →</button>
          </div>
        </div>
      </div>
    </section>
  );
}
