import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PresenterControls, { PresenterActions, PresenterStageJump } from "./PresenterControls.jsx";
import PresenterSessionTimer from "./PresenterSessionTimer.jsx";
import PresenterStudentPicker from "./PresenterStudentPicker.jsx";
import PresenterActivityTimer, { usePresenterActivityTimer } from "./PresenterActivityTimer.jsx";
import { SWAHILI_DAY_ONE_ADMIN_LESSON } from "../data/swahiliTeachingSlides.js";
import { SWAHILI_DAY_SIX_ADMIN_LESSON } from "../data/swahiliDaySixTeachingSlides.js";
import "./TeachingSlidePresenter.css";
import "./SwahiliTeachingSlides.css";

const courseRoot = "/teaching-slides/course/SWAHILI";
const lessonRoot = courseRoot + "/swahili-day-1";
const daySixRoot = courseRoot + "/swahili-day-6";
const learnerWorkbook = "https://www.falowen.app/swahili/day-1";
// Keep the shared presenter identity stable across slide navigation, so its
// roster and class clock never reload due to a new object on every render.
const presenterSlide = Object.freeze({
  ...SWAHILI_DAY_ONE_ADMIN_LESSON,
  assignmentId: "SWAHILI-DAY-1",
  workbookConnection: { workbookUrl: learnerWorkbook, subtitle: "Continue Kiswahili Day 1 in your learner workbook." },
});

const daySixPresenterSlide = Object.freeze({
  ...SWAHILI_DAY_SIX_ADMIN_LESSON,
  assignmentId: "SWAHILI-DAY-6",
  workbookConnection: {
    workbookUrl: "https://www.falowen.app/swahili/day-6",
    subtitle: "Continue Kiswahili Day 6 in your learner workbook.",
  },
});

export default function SwahiliTeachingSlides({ slideId, present = false }) {
  const isDaySix = slideId === SWAHILI_DAY_SIX_ADMIN_LESSON.id;
  const lesson = isDaySix ? SWAHILI_DAY_SIX_ADMIN_LESSON : SWAHILI_DAY_ONE_ADMIN_LESSON;
  const selectedPresenterSlide = isDaySix ? daySixPresenterSlide : presenterSlide;
  const selectedWorkbook = isDaySix ? "https://www.falowen.app/swahili/day-6" : learnerWorkbook;
  const stages = lesson.stages;
  const activityTimer = usePresenterActivityTimer(7);
  const [reportOpen, setReportOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [notesVisible, setNotesVisible] = useState(false);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [grammarPage, setGrammarPage] = useState(0);
  const [presenting, setPresenting] = useState(Boolean(slideId) && present);
  const [focusMode, setFocusMode] = useState(false);
  const stage = stages[index];
  const atStart = index === 0;
  const atEnd = index === stages.length - 1;

  // React Router reuses the course component across index, lesson and
  // ?present=1 navigations. Reset the lesson, not just the initial state.
  useEffect(() => {
    setPresenting(Boolean(slideId) && present);
    setIndex(0);
    setNotesVisible(false);
    setAnswerVisible(false);
    setGrammarPage(0);
    setFocusMode(false);
    setReportOpen(false);
  }, [slideId, present]);

  const goTo = (position) => {
    setIndex(Math.max(0, Math.min(stages.length - 1, position)));
    setNotesVisible(false);
    setAnswerVisible(false);
    setGrammarPage(0);
  };

  useEffect(() => {
    if (!slideId || !presenting) return undefined;
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, summary, [contenteditable="true"]')) return;
      if (event.key === " " && target instanceof HTMLElement && target.closest('button, a, [role="button"]')) return;
      const actions = {
        ArrowRight: () => goTo(index + 1), PageDown: () => goTo(index + 1), " ": () => goTo(index + 1),
        ArrowLeft: () => goTo(index - 1), PageUp: () => goTo(index - 1),
        Home: () => goTo(0), End: () => goTo(stages.length - 1),
        Escape: () => { setFocusMode(false); setPresenting(false); },
      };
      if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [slideId, presenting, index, stages.length]);

  if (slideId && slideId !== SWAHILI_DAY_ONE_ADMIN_LESSON.id && slideId !== SWAHILI_DAY_SIX_ADMIN_LESSON.id) {
    return <section className="slides-index"><h1>Lesson not found</h1><Link to={courseRoot}>Back to Swahili</Link></section>;
  }

  if (!slideId) {
    return (
      <section className="slides-index swahili-admin-slides">
        <div className="swahili-admin-slides__crumb"><Link to="/teaching-slides?language=swahili">← All languages</Link></div>
        <p className="slide-meta">Kiswahili · Beginner</p>
        <h1>Swahili teaching slides</h1>
        <p>Uses the same nine-part classroom flow as Falowen A2. Day 1 and A1 Lesson 6 (Mgahawani) use the shared Falowen classroom presenter. Day 6 includes the existing Falowen Radio link; song audio is pending.</p>
        <div className="slide-card-grid">
          <article className="slide-card slide-card-lesson">
            <p className="slide-meta">Day 1 · {stages.length} classroom stages</p>
            <h2>{lesson.title}</h2>
            <p>{lesson.objective}</p>
            <div className="slide-card-actions">
              <Link to={lessonRoot}>Open lesson</Link>
              <Link to={lessonRoot + "?present=1"}>Present</Link>
            </div>
          </article>
          <article className="slide-card slide-card-lesson">
            <p className="slide-meta">A1 · Day 6 · {SWAHILI_DAY_SIX_ADMIN_LESSON.stages.length} classroom stages</p>
            <h2>{SWAHILI_DAY_SIX_ADMIN_LESSON.title}</h2>
            <p>{SWAHILI_DAY_SIX_ADMIN_LESSON.objective}</p>
            <div className="slide-card-actions">
              <Link to={daySixRoot}>Open lesson</Link>
              <Link to={daySixRoot + "?present=1"}>Present</Link>
            </div>
          </article>
        </div>
      </section>
    );
  }

  const grammar = stage.type === "grammar" ? stage.details?.[grammarPage] : null;
  const stageQuestion = grammar?.question || stage.prompt;
  const stageAnswer = grammar?.answer || stage.answer;
  const stageEnglish = grammar?.english || stage.english;
  return (
    <div className={presenting ? `presenter-shell swahili-a2-shell ${focusMode ? "is-presentation-mode" : ""}` : "swahili-a2-inline-shell"}>
    <main className={`presenter-stage swahili-a2-presenter ${presenting ? "is-presenting" : ""} ${focusMode ? "is-focus-mode" : ""}`} lang="sw">
      {!focusMode && (
        <header className="presenter-topbar swahili-a2-presenter__topbar no-print">
          <div className="swahili-a2-presenter__identity">
            <Link to={courseRoot}>← Kiswahili</Link>
            <strong>{lesson.title}</strong>
            <span>{lesson.day}</span>
          </div>
          <PresenterSessionTimer
            slide={selectedPresenterSlide}
            stage={stage}
            toolbarActions={
              <PresenterActions
                onPresent={() => { setPresenting(true); setFocusMode(true); }}
                onExit={() => { setPresenting(false); setFocusMode(false); }}
                onReport={() => setReportOpen(true)}
              />
            }
          />
          <div className="presenter-v2-tools">
            <PresenterStageJump stages={stages} index={index} onChange={goTo} />
            <PresenterActivityTimer
              remaining={activityTimer.remaining}
              running={activityTimer.running}
              minutes={activityTimer.minutes}
              onDurationChange={activityTimer.chooseDuration}
              onToggle={activityTimer.toggle}
              onReset={activityTimer.reset}
              expired={activityTimer.remaining === 0}
            />
            <div className="swahili-a2-presenter__actions">
              <button type="button" onClick={() => setPresenting(p => !p)}>{presenting ? "Exit presenter" : "Start presenter"}</button>
              <button type="button" onClick={() => setFocusMode(true)}>Focus</button>
              <button type="button" onClick={() => setNotesVisible(v => !v)} aria-expanded={notesVisible}>Teacher notes</button>
            </div>
          </div>
        </header>
      )}

      <PresenterStudentPicker
        slide={presenterSlide}
        reportOpen={reportOpen}
        onReportClose={() => setReportOpen(false)}
        responseContext={{ question: stageQuestion || stage.title, stageId: `${lesson.id}-${stage.id}${grammar ? `-${grammarPage + 1}` : ""}` }}
      />

      <div className="presenter-content swahili-a2-presenter__content" aria-live="polite">
        <div className="swahili-a2-presenter__meta">
          <span>{stage.kicker}</span>
          <span>{index + 1} / {stages.length}</span>
        </div>
        <h1>{stage.title}</h1>
        {stage.type === "music" || stage.type === "listening" ? (
          <div className="swahili-a2-presenter__audio">
            <div className="swahili-a2-presenter__audio-icon" aria-hidden="true">{stage.type === "music" ? "♫" : "◉"}</div>
            <strong>{stage.type === "music" ? "Song lyrics · Teacher-led practice" : stage.radioUrl ? "Falowen Radio · Listening" : "Teacher-led listening"}</strong>
            <p>{stage.type === "music" ? "The lyrics are available. An approved song recording has not been linked yet." : stage.radioUrl ? "Open the lesson's published Falowen Radio episode, then discuss the classroom dialogue." : "The teacher reads the existing words aloud. A recorded track will be added later."}</p>
            {stage.radioUrl && <a className="swahili-a2-presenter__radio-link" href={stage.radioUrl} target="_blank" rel="noreferrer">Open Falowen Radio on YouTube</a>}
            <p className="swahili-a2-presenter__model">{stage.content}</p>
          </div>
        ) : stage.type === "grammar" && grammar ? (
          <div className="swahili-a2-presenter__grammar">
            <div className="swahili-a2-presenter__grammar-head">
              <span>Grammar {grammarPage + 1} / {stage.details.length}</span>
              <div className="swahili-a2-presenter__actions">
                <button type="button" disabled={grammarPage === 0} onClick={() => {setGrammarPage(n => n - 1);setAnswerVisible(false);}}>←</button>
                <button type="button" disabled={grammarPage === stage.details.length - 1} onClick={() => {setGrammarPage(n => n + 1);setAnswerVisible(false);}}>→</button>
              </div>
            </div>
            <h2>{grammar.title}</h2>
            <p className="swahili-a2-presenter__model">{grammar.body}</p>
            {grammar.rule && <p className="swahili-a2-presenter__grammar-rule"><strong>Rule:</strong> {grammar.rule}</p>}
          </div>
        ) : (
          <p className="swahili-a2-presenter__model">{stage.content}</p>
        )}

        <p className="swahili-a2-presenter__english" lang="en">{stageEnglish}</p>

        {stageQuestion && (
          <section className="swahili-a2-presenter__question" aria-label="Classroom question">
            <span>Classroom question</span>
            <h2>{stageQuestion}</h2>
            {stageAnswer && (
              <>
                <button type="button" onClick={() => setAnswerVisible(v => !v)} aria-expanded={answerVisible}>
                  {answerVisible ? "Hide answer" : "Show answer"}
                </button>
                {answerVisible && <p className="swahili-a2-presenter__answer">{stageAnswer}</p>}
              </>
            )}
          </section>
        )}

        {notesVisible && <aside className="swahili-a2-presenter__notes"><strong>Teacher notes</strong><p>{stage.notes}</p></aside>}
      </div>

      <PresenterControls
        focus={focusMode}
        index={index}
        total={stages.length}
        atStart={atStart}
        atEnd={atEnd}
        onPrevious={() => goTo(index - 1)}
        onNext={() => goTo(index + 1)}
        onRestore={() => setFocusMode(false)}
        onReport={() => setReportOpen(true)}
        nextLabel="Next stage →"
      />
      {!focusMode && <footer className="swahili-a2-presenter__foot no-print">
        <a href={selectedWorkbook} target="_blank" rel="noreferrer">Open {lesson.day} learner workbook</a>
        <span>{isDaySix ? "Restaurant lesson · Falowen Radio available · Song audio pending" : "Music and recorded Hören will be linked after upload."}</span>
      </footer>}
    </main>
    </div>
  );
}
