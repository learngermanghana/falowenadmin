import { useState } from "react";
import MusicVideoEmbed from "./MusicVideoEmbed.jsx";
import PublishedSongLessonStage from "./PublishedSongLessonStage.jsx";
import { musicTimestamp, musicMomentUrl } from "../utils/musicTeaching.js";
import "./MusicTeachingStages.css";

/** The listening video takes the place of a warm-up, without adding a slide. */
export function MusicVideoStage({ music }) {
  const [readingOpen, setReadingOpen] = useState(false);
  // A2 Day 18's approved R2 song replaces the old YouTube music-video stage.
  // Its quiz must match the newly generated song, not the legacy Amir lyrics.
  if (music?.assignmentKey === 'A2-7.18' && music?.audioUrl) {
    return <PublishedSongLessonStage assignmentKey="A2-7.18" />;
  }
  // These already-uploaded A2 recordings are discovered dynamically by
  // Falowen Music; no verified fixed MP3 or timeline is pinned to this app.
  // The library understands ?level=A2&day=N and lists the real recording.
  if (music?.musicLibraryUrl && !music?.youtubeId) {
    return (
      <section className="music-teaching-video" aria-label="Musik im Unterricht">
        <header className="music-teaching-heading">
          <span>{music.level} · TAG {music.day} · MUSIK HÖREN</span>
          <h1>{music.title}</h1>
          <p>Hört das veröffentlichte Lied und besprecht: <strong>{music.introQuestion}</strong></p>
        </header>
        <div className="music-teaching-next-step">
          <a href={music.musicLibraryUrl} target="_blank" rel="noopener noreferrer">
            ♫ Falowen Music · A2 Day {music.day} öffnen
          </a>
          <p>Die veröffentlichte Aufnahme, ihr Liedtext und ihre Zeitmarken bleiben unverändert.</p>
          <p><strong>Nach dem Lied:</strong> {music.nextStep}</p>
        </div>
      </section>
    );
  }
  const hasInSlideReading = Boolean(
    music.readingOnVideoSlide && music.readingSections?.length && music.questions?.length,
  );

  return (
    <section className="music-teaching-video" aria-label="Musik im Unterricht">
      <header className="music-teaching-heading">
        <span>{music.level || "B1"} · MUSIK HÖREN</span>
        <h1>{music.title}</h1>
        <p>Hört das Lied und überlegt: <strong>{music.introQuestion}</strong></p>
      </header>
      {hasInSlideReading && (
        <div className="music-video-lesson-tabs" role="group" aria-label="Musikvideo und Liedtext">
          <button type="button" className={!readingOpen ? "is-selected" : ""} aria-pressed={!readingOpen}
            onClick={() => setReadingOpen(false)}>▶ Musikvideo ansehen</button>
          <button type="button" className={readingOpen ? "is-selected" : ""} aria-pressed={readingOpen}
            onClick={() => setReadingOpen(true)}>Liedtext &amp; 5 Fragen</button>
        </div>
      )}
      {readingOpen && hasInSlideReading ? (
        <MusicReadingStage music={music} embedded />
      ) : (
        <>
          <MusicVideoEmbed videoId={music.youtubeId} title={music.title} variant="lesson" />
          <div className="music-teaching-next-step">
            <strong>Nach dem Lied:</strong> {hasInSlideReading
              ? "Öffne „Liedtext & 5 Fragen“, besprecht die Antworten und geht dann zur Hörübung."
              : music.nextStep || "Weiter zu „Liedtext lesen & verstehen“. Die Grammatik- und Sprechaufgaben folgen später wie gewohnt."}
          </div>
        </>
      )}
      {readingOpen && hasInSlideReading && (
        <div className="music-teaching-next-step"><strong>Danach:</strong> {music.nextStep}</div>
      )}
    </section>
  );
}

/** Unscored B1 inference questions tied to actual lyric evidence and timestamps. */
export function MusicReadingStage({ music, embedded = false }) {
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
      {!embedded && <header className="music-teaching-heading">
        <span>{music.level || "B1"} · LESEN &amp; VERSTEHEN</span>
        <h1>Liedtext lesen &amp; verstehen</h1>
        <p>Lest die Textstellen und zieht Schlussfolgerungen. Nicht nur einzelne Wörter wiederholen.</p>
      </header>}
      <div className="music-reading-columns">
        <div className="music-reading-passages" lang="de">
          <div className="music-reading-passages-heading">
            <strong>Ausgewählte Textstellen</strong>
            <small>Aus „{music.title}“</small>
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
