import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SWAHILI_DAY_ONE_ADMIN_LESSON } from "../data/swahiliTeachingSlides.js";
import "./SwahiliTeachingSlides.css";

const courseRoot = "/teaching-slides/course/SWAHILI";
const lessonRoot = courseRoot + "/swahili-day-1";

export default function SwahiliTeachingSlides({ slideId, present = false }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [notesVisible, setNotesVisible] = useState(false);
  const [presenting, setPresenting] = useState(present);
  const lesson = SWAHILI_DAY_ONE_ADMIN_LESSON;
  const stages = lesson.stages;
  const current = stages[index];

  // React Router reuses this component when navigating between the course
  // index and its lesson. Reflect the new route, not just the initial prop.
  useEffect(() => {
    setPresenting(Boolean(slideId) && present);
    setIndex(0);
    setNotesVisible(false);
  }, [slideId, present]);

  useEffect(() => {
    if (!presenting) return undefined;
    const onKeyDown = (event) => {
      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        // Arrow keys and PageDown should advance even if a presenter button
        // retains focus. Space must keep its native button activation behavior.
        if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
        if (event.key === " " && event.target instanceof HTMLElement && (event.target.closest("button, a, [role='button']") || event.target.isContentEditable)) return;
        event.preventDefault();
        setIndex((value) => Math.min(stages.length - 1, value + 1));
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        setIndex((value) => Math.max(0, value - 1));
      } else if (event.key === "Home") {
        event.preventDefault();
        setIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setIndex(stages.length - 1);
      } else if (event.key === "Escape") setPresenting(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [presenting, stages.length]);

  if (slideId && slideId !== lesson.id) {
    return <section className="slides-index"><h1>Lesson not found</h1><Link to={courseRoot}>Back to Swahili</Link></section>;
  }

  if (!slideId) {
    return (
      <section className="slides-index swahili-admin-slides">
        <div className="swahili-admin-slides__crumb"><Link to="/teaching-slides?language=swahili">← All languages</Link></div>
        <p className="slide-meta">Kiswahili · Beginner</p>
        <h1>Swahili teaching slides</h1>
        <p>Only the approved Day 1 alphabet and pronunciation lesson is available. Later lessons can be added when teaching material is ready.</p>
        <div className="slide-card-grid">
          <article className="slide-card slide-card-lesson">
            <p className="slide-meta">Day 1 · {stages.length} presentation slides</p>
            <h2>{lesson.title}</h2>
            <p>{lesson.objective}</p>
            <div className="slide-card-actions">
              <Link to={lessonRoot}>Open lesson</Link>
              <Link to={lessonRoot + "?present=1"}>Present</Link>
            </div>
          </article>
        </div>
      </section>
    );
  }

  return (
    <main className={"swahili-admin-slides " + (presenting ? "swahili-admin-slides--presenting" : "")} lang="sw">
      {!presenting && (
        <div className="swahili-admin-slides__crumb">
          <Link to={courseRoot}>← Swahili lessons</Link>
          <span>Day 1 · {stages.length} slides</span>
        </div>
      )}
      <div className="swahili-admin-slides__stage" aria-live="polite" aria-label="Swahili teacher slide">
        <div className="swahili-admin-slides__stageTop">
          <span>FALOWEN · KISWAHILI</span>
          <span>{index + 1} / {stages.length}</span>
        </div>
        <h1>{current.title}</h1>
        <div className="swahili-admin-slides__content">{current.content}</div>
        <p className="swahili-admin-slides__english">{current.english}</p>
      </div>
      <div className="swahili-admin-slides__controls no-print">
        <button type="button" disabled={index === 0} onClick={() => setIndex(i => Math.max(0, i - 1))}>← Previous</button>
        <button type="button" disabled={index === stages.length - 1} onClick={() => setIndex(i => Math.min(stages.length - 1, i + 1))}>Next →</button>
        <button type="button" onClick={() => setPresenting(value => !value)}>{presenting ? "Exit presenter" : "Start presenter"}</button>
        <button type="button" onClick={() => setNotesVisible(value => !value)} aria-expanded={notesVisible}>{notesVisible ? "Hide teacher notes" : "Teacher notes"}</button>
        {!presenting && <button type="button" onClick={() => window.print()}>Print</button>}
        {presenting && <button type="button" onClick={() => navigate(courseRoot)}>All Swahili lessons</button>}
      </div>
      {notesVisible && <aside className="swahili-admin-slides__notes"><strong>Teacher notes</strong><p>{current.notes}</p></aside>}
      {!presenting && <p className="swahili-admin-slides__footer"><a href="https://www.falowen.app/swahili/day-1" target="_blank" rel="noreferrer">Open learner workbook</a> · Audio and music will be added when supplied.</p>}
    </main>
  );
}
