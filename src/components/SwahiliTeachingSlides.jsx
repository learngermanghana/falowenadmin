import { SWAHILI_DAY_TWELVE_ADMIN_LESSON, SWAHILI_DAY_THIRTEEN_ADMIN_LESSON } from "../data/swahiliDayTwelveThirteenTeachingSlides.js";
import { SWAHILI_DAY_ELEVEN_ADMIN_LESSON } from "../data/swahiliDayElevenTeachingSlides.js";
import SwahiliRestaurantSong from "./SwahiliRestaurantSong.jsx";
import { SWAHILI_DAY_FIVE_ADMIN_LESSON } from "../data/swahiliDayFiveTeachingSlides.js";
import SwahiliSlideMusic from "./SwahiliSlideMusic.jsx";
import { useEffect, useState } from "react";
import InteractiveLessonOpening from "./InteractiveLessonOpening.jsx";
import { buildSwahiliClassroomStages } from "../utils/swahiliClassroomStages.js";
import { SwahiliClassroomReading, SwahiliClassroomRoleplay } from "./SwahiliClassroomActivities.jsx";
import { swahiliAudioChapters } from "../data/swahiliAudioChapters.js";
import { swahiliB1Day26 } from "../data/swahiliB1Day26.js";
import { swahiliB1Day27 } from "../data/swahiliB1Day27.js";
import { swahiliB1Day28 } from "../data/swahiliB1Day28.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PresenterControls, { PresenterActions, PresenterStageJump } from "./PresenterControls.jsx";
import SwahiliA2LessonStage from "./SwahiliA2LessonStage.jsx";
import PresenterSessionTimer from "./PresenterSessionTimer.jsx";
import PresenterStudentPicker from "./PresenterStudentPicker.jsx";
import PresenterActivityTimer, { usePresenterActivityTimer } from "./PresenterActivityTimer.jsx";
import { SWAHILI_DAY_ONE_ADMIN_LESSON } from "../data/swahiliTeachingSlides.js";
import { SWAHILI_DAY_TWO_ADMIN_LESSON } from "../data/swahiliDayTwoTeachingSlides.js";
import { SWAHILI_DAY_SIX_ADMIN_LESSON } from "../data/swahiliDaySixTeachingSlides.js";
import { SWAHILI_DAY_TEN_ADMIN_LESSON } from "../data/swahiliDayTenTeachingSlides.js";
import "./TeachingSlidePresenter.css";
import "./SwahiliTeachingSlides.css";

import { swahiliCourseRoot as courseRoot, swahiliSlidePacks } from "../data/swahiliSlidePacks.js";
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

const dayFiveWorkbook = "https://www.falowen.app/swahili/day-5";
const dayTwoPresenterSlide = Object.freeze({
  ...SWAHILI_DAY_TWO_ADMIN_LESSON,
  assignmentId: "SWAHILI-DAY-2",
  workbookConnection: { workbookUrl: "https://www.falowen.app/campus/course/swahili/day-2", subtitle: "Continue Kiswahili Day 2 in Campus." },
});
const dayFivePresenterSlide = Object.freeze({
  ...SWAHILI_DAY_FIVE_ADMIN_LESSON,
  assignmentId: "SWAHILI-DAY-5",
  workbookConnection: { workbookUrl: dayFiveWorkbook, subtitle: "Continue Kiswahili Day 5 in your learner workbook." },
});

// Convert the existing B1 teaching content to the A1 Day 10 presentation layout.
// Keep every question and model answer, exposing one question at a time.
const b1Day28Stages = swahiliB1Day28.classroomStages.flatMap(stage => {
  const kicker = stage.kicker || "Kiswahili B1 · Somo la 28";
  if (stage.type === "grammar-check") {
    return stage.items.map((item, index) => ({
      id: `${stage.id}-${index + 1}`,
      type: "question",
      kicker,
      title: stage.title,
      content: item.label ? `Swali ${item.label}` : "",
      prompt: item.prompt,
      answer: item.answer,
    }));
  }
  if (stage.type === "swahili-song") {
    return { ...stage, type: "music", kicker: "Muziki · Music" };
  }
  if (stage.id === "radio-dialogue") {
    return {
      ...stage, type: "radio-questions", kicker: "Kusikiliza · Falowen Radio",
      content: stage.items.join("\n"),
    };
  }
  if (stage.type === "intro") {
    return {
      ...stage, kicker: "Utangulizi · Introduction",
      heading: "Kutunza Mazingira · Kiswahili B1",
      content: stage.objective, english: "Protecting the environment in everyday life.",
    };
  }
  if (stage.type === "workbook") {
    return {
      ...stage, type: "writing",
      content: stage.items.map(item => `${item.label}: ${item.detail}`).join("\n"),
      listeningWorkbookUrl: stage.workbookUrl,
    };
  }
  if (stage.type === "numbered-list") {
    const content = stage.items.join("\n");
    return { ...stage, type: stage.id === "presentation" || stage.id === "writing" || stage.id === "pair-plan" ? "presentation" : "reading-text", content };
  }
  return stage;
});
const b1Day28PresenterSlide = Object.freeze({
  ...swahiliB1Day28,
  stages: b1Day28Stages,
  workbookConnection: {
    workbookUrl: "https://www.falowen.app/campus/course/swahili/b1/day-28",
    subtitle: "Continue B1 Day 28 in Campus.",
  },
});
const dayTenWorkbook = "https://www.falowen.app/campus/course/swahili/day-10";
const dayTenPresenterSlide = Object.freeze({
  ...SWAHILI_DAY_TEN_ADMIN_LESSON,
  assignmentId: "SWAHILI-DAY-10",
  workbookConnection: { workbookUrl: dayTenWorkbook, subtitle: "Continue Kiswahili Day 10 in Campus." },
});

const dayElevenPresenterSlide = Object.freeze({
  ...SWAHILI_DAY_ELEVEN_ADMIN_LESSON,
  assignmentId: "SWAHILI-DAY-11",
  workbookConnection: { workbookUrl: "https://www.falowen.app/campus/course/swahili/day-11", subtitle: "Continue Kiswahili Day 11 in Campus." },
});

const calendarRoutinePresenters = Object.freeze(Object.fromEntries(
  [SWAHILI_DAY_TWELVE_ADMIN_LESSON, SWAHILI_DAY_THIRTEEN_ADMIN_LESSON].map(lesson => [
    lesson.id,
    Object.freeze({
      ...lesson,
      assignmentId: `SWAHILI-DAY-${lesson.dayNumber}`,
      workbookConnection: {
        workbookUrl: `https://www.falowen.app/campus/course/swahili/day-${lesson.dayNumber}`,
        subtitle: `Continue Kiswahili Day ${lesson.dayNumber} in Campus.`,
      },
    }),
  ]),
));

export default function SwahiliTeachingSlides({ slideId, present = false }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const selectedLevel = new URLSearchParams(search).get("level");
  const groups = Object.entries(swahiliSlidePacks);
  const lessonLevel = groups.find(([, lessons]) => lessons.some(entry => entry.id === slideId))?.[0];
  const backToPack = lessonLevel ? courseRoot + "?level=" + lessonLevel : courseRoot;
  const isDayFive = slideId === SWAHILI_DAY_FIVE_ADMIN_LESSON.id;
  const isDayTwo = slideId === SWAHILI_DAY_TWO_ADMIN_LESSON.id;
  const isDaySix = slideId === SWAHILI_DAY_SIX_ADMIN_LESSON.id;
  const isDayTen = slideId === SWAHILI_DAY_TEN_ADMIN_LESSON.id;
  const isB1Day26 = slideId === swahiliB1Day26.id;
  const isB1Day27 = slideId === swahiliB1Day27.id;
  const isB1Day28 = slideId === swahiliB1Day28.id;
  const existingPresenterSlide = isDaySix ? daySixPresenterSlide : presenterSlide;
  const selectedPresenterSlide = calendarRoutinePresenters[slideId] || (isB1Day26 ? swahiliB1Day26 : isB1Day27 ? swahiliB1Day27 : slideId === SWAHILI_DAY_ELEVEN_ADMIN_LESSON.id ? dayElevenPresenterSlide : isB1Day28 ? b1Day28PresenterSlide : isDayTen ? dayTenPresenterSlide : isDayFive ? dayFivePresenterSlide : isDayTwo ? dayTwoPresenterSlide : existingPresenterSlide);
  const lesson = selectedPresenterSlide;
  const selectedWorkbook = selectedPresenterSlide.workbookConnection.workbookUrl;
  const stages = buildSwahiliClassroomStages(lesson);
  const activityTimer = usePresenterActivityTimer(7);
  const [reportOpen, setReportOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [notesVisible, setNotesVisible] = useState(false);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [grammarPage, setGrammarPage] = useState(0);
  const [presenting, setPresenting] = useState(Boolean(slideId) && present);
  const [focusMode, setFocusMode] = useState(false);
  const stage = stages[index] ?? stages[0];
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

  if (slideId && !lessonLevel) {
    return <section className="slides-index"><h1>Lesson not found</h1><Link to={courseRoot}>Back to Swahili</Link></section>;
  }

  if (!slideId) {
    const packs = selectedLevel ? groups.filter(([level]) => level === selectedLevel) : groups;
    return <section className="slides-index">
      <Link to="/teaching-slides?language=swahili">← All Swahili courses</Link>
      <h1>Swahili {selectedLevel} Teaching Slides</h1>
      {!packs.length && <p>No slide pack found.</p>}
      {packs.map(([level, lessons]) => <section key={level}>
        {!selectedLevel && <h2>{level} Teaching Pack</h2>}
        <div className="slide-card-grid">
          {(level === "B1" ? swahiliAudioChapters.B1.map(chapter => lessons.find(entry => entry.id === chapter.assignment_id) || { id: chapter.assignment_id, dayNumber: Number(chapter.assignment_id.split("-").at(-1)), title: chapter.en, unavailable: true }) : lessons).map(entry => {
            const href = courseRoot + "/" + entry.id;
            return <article key={entry.id} className="slide-card slide-card-lesson">
              <div className="slide-card-topline">
                <p className="slide-meta">Kiswahili · {level}</p>
                <span className="slide-day-badge">Day {entry.dayNumber}</span>
              </div>
              <h2>{entry.title}</h2><p>{entry.unavailable ? "Teaching slides not yet available." : entry.objective}</p>
              <div className="slide-card-actions">
                {entry.unavailable ? <span>Not yet built</span> : <><Link to={href}>Open lesson</Link><Link to={href + "?present=1"}>Present</Link></>}
              </div>
            </article>;
          })}
        </div>
      </section>)}
    </section>;
  }

  const grammar = stage.type === "grammar" ? stage.details?.[grammarPage] : null;
  const stageQuestion = grammar?.question || stage.prompt;
  const stageAnswer = grammar?.answer || stage.answer;
  const stageEnglish = grammar?.english || stage.english;
  return (
    <div className={presenting ? `presenter-shell swahili-a2-shell ${focusMode ? "is-presentation-mode" : ""}` : "swahili-a2-inline-shell"}>
    <main className={`presenter-stage swahili-a2-presenter is-a2-classroom-style ${presenting ? "is-presenting" : ""} ${focusMode ? "is-focus-mode" : ""}`} lang="sw">
      {!focusMode && (
        <header className="presenter-topbar swahili-a2-presenter__topbar no-print">
          <div className="swahili-a2-presenter__identity">
            <Link to={backToPack}>← Kiswahili</Link>
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
        slide={selectedPresenterSlide}
        reportOpen={reportOpen}
        onReportClose={() => setReportOpen(false)}
        responseContext={{ question: stageQuestion || stage.title, stageId: `${lesson.id}-${stage.id}${grammar ? `-${grammarPage + 1}` : ""}` }}
      />

      <div className="presenter-content swahili-a2-presenter__content" aria-live="polite">
        <div className="swahili-a2-presenter__meta">
          <span>{stage.kicker}</span>
          <span>{index + 1} / {stages.length}</span>
        </div>
        {stage.type !== "classroom-listening" && <h1>{stage.title}</h1>}
        {stage.type === "grammar" && grammar && (
          <div className="swahili-a2-presenter__grammar-head">
            <span>Sarufi · {grammarPage + 1} / {stage.details.length}</span>
            <div className="swahili-a2-presenter__actions">
              <button type="button" disabled={grammarPage === 0} onClick={() => {setGrammarPage(n => n - 1);setAnswerVisible(false);}}>← Previous rule</button>
              <button type="button" disabled={grammarPage === stage.details.length - 1} onClick={() => {setGrammarPage(n => n + 1);setAnswerVisible(false);}}>Next rule →</button>
            </div>
          </div>
        )}
        {stage.type === "classroom-reading" ? <SwahiliClassroomReading key={`${lesson.id}-${stage.id}`} stage={stage}>{isDaySix ? <SwahiliA2LessonStage stage={{...stage,type:"reading"}} isDaySix={true} /> : null}</SwahiliClassroomReading> : stage.type === "classroom-roleplay" ? <SwahiliClassroomRoleplay stage={stage} /> : stage.type === "classroom-listening" ? <InteractiveLessonOpening key={`${lesson.id}-${stage.id}`} stage={stage} slide={lesson} /> : isDaySix && stage.type === "music" ? <SwahiliRestaurantSong /> : (stage.audio || (isDayFive && stage.type === "day-five")) ? <section className="swahili-a2-presenter__media-stage">
          {stage.audio ? <SwahiliSlideMusic track={stage.audio} questions={stage.questions} /> : <p style={{ whiteSpace: "pre-line" }}>{stage.content}</p>}
        </section> : <SwahiliA2LessonStage stage={stage} grammar={grammar} isDaySix={isDaySix} level={isB1Day26 || isB1Day27 || isB1Day28 ? "B1" : "A1"} />}

        {stage.listeningWorkbookUrl && <a href={stage.listeningWorkbookUrl} target="_blank" rel="noreferrer">Open the related exercise in Campus</a>}
        {stageEnglish && <p className="swahili-a2-presenter__english" lang="en">{stageEnglish}</p>}

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
        <span>{isB1Day26 ? "B1 · Matatizo ya safari" : isB1Day27 || isB1Day28 ? "B1 · Kutunza Mazingira" : isDayTen ? "A1 · Sokoni" : isDayTwo ? "A1 · Salamu" : isDayFive ? "A1 · Day 5 practice" : isDaySix ? "Restaurant lesson · Music and listening" : "Music and recorded Hören will be linked after upload."}</span>
      </footer>}
    </main>
    </div>
  );
}
