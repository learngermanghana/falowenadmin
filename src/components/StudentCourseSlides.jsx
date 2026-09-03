import { useEffect, useMemo, useState } from "react";
import { getSlidesByCourse } from "../data/teachingSlides.js";
import { getUnifiedTopicLabel } from "../data/courseDictionary.js";
import { buildTeachingPresenterStages } from "../utils/teachingPresenter.js";
import "./StudentCourseSlides.css";

const FALOWEN_BASE_URL = "https://www.falowen.app";

function falowenHref(path = "") {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${FALOWEN_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function hashSlideId(slides = []) {
  const raw = decodeURIComponent(String(window.location.hash || ""))
    .replace(/^#/, "")
    .replace(/^print-/, "")
    .trim();
  return slides.some((slide) => slide.id === raw) ? raw : "";
}

function lessonLabel(slide = {}) {
  const day = slide.day || (slide.dayNumber ? `Day ${slide.dayNumber}` : "Lesson");
  return `${day} — ${slide.title || slide.topic || "Lesson"}`;
}

function StageList({ items = [] }) {
  if (!items.length) return null;
  return (
    <ul className="student-slide-list">
      {items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
    </ul>
  );
}

function PracticeBlock({ item, index }) {
  const models = Array.isArray(item.modelItems) ? item.modelItems.filter(Boolean) : [];
  return (
    <article className="student-practice-card">
      <div className="student-practice-heading">
        <h3>{item.title || `Übung ${index + 1}`}</h3>
        {item.minutes ? <span>{item.minutes} min</span> : null}
      </div>
      {item.instruction ? <p className="student-practice-instruction">{item.instruction}</p> : null}
      {Array.isArray(item.prompts) && item.prompts.length ? <StageList items={item.prompts} /> : null}
      {models.length ? (
        <details className="student-model-details">
          <summary>Modell anzeigen</summary>
          <StageList items={models} />
        </details>
      ) : null}
    </article>
  );
}

export default function StudentCourseSlides({ courseId }) {
  const slides = useMemo(() => getSlidesByCourse(courseId), [courseId]);
  const [selectedId, setSelectedId] = useState(() => hashSlideId(slides) || slides[0]?.id || "");

  useEffect(() => {
    const fromHash = hashSlideId(slides);
    setSelectedId((current) => {
      if (fromHash) return fromHash;
      if (slides.some((slide) => slide.id === current)) return current;
      return slides[0]?.id || "";
    });
  }, [slides]);

  useEffect(() => {
    const onHashChange = () => {
      const fromHash = hashSlideId(slides);
      if (fromHash) setSelectedId(fromHash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [slides]);

  if (!slides.length) {
    return (
      <section className="student-slides-shell">
        <div className="student-slides-empty">
          <h1>Keine Lernnotizen gefunden</h1>
          <p>Für {String(courseId || "").toUpperCase()} sind noch keine Student Slides verfügbar.</p>
        </div>
      </section>
    );
  }

  const selectedIndex = Math.max(0, slides.findIndex((slide) => slide.id === selectedId));
  const slide = slides[selectedIndex] || slides[0];
  const topicLabel = getUnifiedTopicLabel(slide.assignmentId, slide.topic);
  const stages = buildTeachingPresenterStages(slide, topicLabel);
  const stage = (id) => stages.find((entry) => entry.id === id) || {};
  const grammar = stage("grammar");
  const phrases = stage("phrases");
  const examples = stage("examples");
  const practice = stage("practice");
  const questions = stage("questions");
  const wrapup = stage("wrapup");
  const advancedPractice = Array.isArray(practice.items)
    ? practice.items.filter((item) => Array.isArray(item.prompts) && item.prompts.length)
    : [];
  const speakingQuestions = Array.isArray(questions.items) ? questions.items : [];
  const workbookHref = falowenHref(slide.workbookConnection?.workbookUrl);
  const grammarHref = falowenHref(slide.workbookConnection?.grammarUrl);

  const chooseSlide = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    const nextSlide = slides[nextIndex];
    setSelectedId(nextSlide.id);
    const nextHash = `#print-${encodeURIComponent(nextSlide.id)}`;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="student-slides-shell">
      <section className="student-slides-toolbar no-print" aria-label="Lesson navigation">
        <div>
          <p className="student-slides-eyebrow">Falowen Review Slides</p>
          <strong>{String(courseId || "").toUpperCase()} · {selectedIndex + 1} / {slides.length}</strong>
        </div>
        <label className="student-lesson-select">
          <span>Lesson</span>
          <select value={slide.id} onChange={(event) => chooseSlide(slides.findIndex((entry) => entry.id === event.target.value))}>
            {slides.map((entry) => <option key={entry.id} value={entry.id}>{lessonLabel(entry)}</option>)}
          </select>
        </label>
      </section>

      <article id={`print-${slide.id}`} className="student-slide-card">
        <header className="student-slide-hero">
          <div className="student-slide-hero-topline">
            <span className="student-slide-level">{slide.course}</span>
            <span className="student-slide-day">{slide.day || `Day ${slide.dayNumber || selectedIndex + 1}`}</span>
          </div>
          <h1>{slide.title}</h1>
          <p className="student-slide-topic">{topicLabel}</p>
        </header>

        <section className="student-slide-section student-slide-objective">
          <p className="student-section-kicker">Heute lernst du</p>
          <p>{slide.objective}</p>
        </section>

        {Array.isArray(grammar.items) && grammar.items.length ? (
          <section className="student-slide-section">
            <p className="student-section-kicker">Neue Grammatik</p>
            <StageList items={grammar.items} />
          </section>
        ) : null}

        {Array.isArray(phrases.items) && phrases.items.length ? (
          <section className="student-slide-section">
            <p className="student-section-kicker">Redemittel</p>
            <StageList items={phrases.items.slice(0, 8)} />
          </section>
        ) : null}

        {Array.isArray(examples.items) && examples.items.length ? (
          <section className="student-slide-section">
            <p className="student-section-kicker">Beispiele</p>
            <details className="student-model-details student-model-details-wide">
              <summary>Beispiele anzeigen</summary>
              <StageList items={examples.items.slice(0, 4)} />
            </details>
          </section>
        ) : null}

        <section className="student-slide-section">
          <p className="student-section-kicker">Übung</p>
          {advancedPractice.length ? (
            <div className="student-practice-grid">
              {advancedPractice.slice(0, 4).map((item, index) => <PracticeBlock key={`${item.title}-${index}`} item={item} index={index} />)}
            </div>
          ) : (
            <>
              <p className="student-section-help">Beantworte die Fragen zuerst selbst. Vergleiche deine Antwort danach mit den Beispielen oben.</p>
              <ol className="student-question-list">
                {speakingQuestions.slice(0, 4).map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
              </ol>
            </>
          )}
        </section>

        {speakingQuestions.length ? (
          <section className="student-slide-section student-speaking-section">
            <p className="student-section-kicker">Sprechen</p>
            <p className="student-section-help">Antworte frei und versuche, die neue Grammatik und mindestens zwei Redemittel zu benutzen.</p>
            <ol className="student-question-list">
              {speakingQuestions.slice(-2).map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
            </ol>
          </section>
        ) : null}

        {(workbookHref || grammarHref) ? (
          <section className="student-slide-section student-workbook-section no-print">
            <p className="student-section-kicker">Weiterlernen in Falowen</p>
            <div className="student-workbook-links">
              {workbookHref ? <a href={workbookHref} target="_blank" rel="noreferrer">Workbook öffnen</a> : null}
              {grammarHref ? <a href={grammarHref} target="_blank" rel="noreferrer">Grammatik öffnen</a> : null}
            </div>
          </section>
        ) : null}

        {wrapup.body ? (
          <section className="student-slide-section student-summary-section">
            <p className="student-section-kicker">Zusammenfassung</p>
            <p>{wrapup.body}</p>
          </section>
        ) : null}
      </article>

      <nav className="student-slide-navigation no-print" aria-label="Previous and next lesson">
        <button type="button" onClick={() => chooseSlide(selectedIndex - 1)} disabled={selectedIndex === 0}>← Vorheriger Tag</button>
        <button type="button" className="student-print-button" onClick={() => window.print()}>Diese Lektion drucken</button>
        <button type="button" onClick={() => chooseSlide(selectedIndex + 1)} disabled={selectedIndex === slides.length - 1}>Nächster Tag →</button>
      </nav>
    </main>
  );
}
