import { useEffect, useMemo, useState } from "react";
import {
  buildTeachingPresenterStages,
  clampPresenterIndex,
  isTeachingPresenterV2Slide,
} from "../utils/teachingPresenter.js";
import "./TeachingSlidePresenter.css";

const FALOWEN_BASE_URL = "https://www.falowen.app";

function formatTimer(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Number(totalSeconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function lessonUrl(value = "") {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${FALOWEN_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

export default function TeachingSlidePresenter({ slide, topicLabel, onExit }) {
  const stages = useMemo(() => buildTeachingPresenterStages(slide, topicLabel), [slide, topicLabel]);
  const presenterV2 = isTeachingPresenterV2Slide(slide);
  const advancedClassroom = ["B2", "C1"].includes(String(slide.course || "").toUpperCase());
  const [stageIndex, setStageIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestionSupport, setShowQuestionSupport] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const stage = stages[stageIndex] || stages[0];

  function goTo(index) {
    setStageIndex(clampPresenterIndex(index, stages.length));
  }

  function next() {
    if (stage?.type === "question-reveal" && questionIndex < stage.items.length - 1) {
      setQuestionIndex((current) => current + 1);
      setShowQuestionSupport(false);
      return;
    }
    goTo(stageIndex + 1);
  }

  function previous() {
    if (stage?.type === "question-reveal" && questionIndex > 0) {
      setQuestionIndex((current) => current - 1);
      setShowQuestionSupport(false);
      return;
    }
    goTo(stageIndex - 1);
  }

  function setTimerMinutes(minutes) {
    const seconds = Math.max(0, Number(minutes || 0)) * 60;
    setTimerRemaining(seconds);
    setTimerRunning(false);
  }

  function randomQuestion() {
    if (stage?.type !== "question-reveal" || stage.items.length < 2) return;
    let nextIndex = questionIndex;
    while (nextIndex === questionIndex) {
      nextIndex = Math.floor(Math.random() * stage.items.length);
    }
    setQuestionIndex(nextIndex);
    setShowQuestionSupport(false);
  }

  async function enterFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    } catch {
      // Fullscreen can be blocked by the browser; presenter mode still works without it.
    }
  }

  useEffect(() => {
    setQuestionIndex(0);
    setShowQuestionSupport(false);
    setTimerRunning(false);
    setTimerRemaining(stage?.suggestedMinutes ? stage.suggestedMinutes * 60 : 0);
  }, [stage?.id, stage?.suggestedMinutes]);

  useEffect(() => {
    if (!timerRunning || timerRemaining <= 0) return undefined;
    const timer = window.setInterval(() => {
      setTimerRemaining((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning, timerRemaining]);

  useEffect(() => {
    function onKeyDown(event) {
      const tagName = event.target?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) return;
      if (tagName === "BUTTON" && [" ", "Enter"].includes(event.key)) return;

      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        next();
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        previous();
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(stages.length - 1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stageIndex, stages.length, questionIndex, stage?.type, stage?.items?.length]);

  if (!stage) return null;

  const progress = stages.length ? ((stageIndex + 1) / stages.length) * 100 : 0;
  const activeQuestion = stage.type === "question-reveal" ? stage.items[questionIndex] : "";
  const timerExpired = presenterV2 && timerRemaining === 0 && !timerRunning;
  const timerPresets = [...new Set([stage.suggestedMinutes, 2, 5, 10].filter(Boolean))];

  return (
    <div className="presenter-shell" role="dialog" aria-modal="true" aria-label="Teaching slide presenter">
      <div className="presenter-stage">
        <header className="presenter-topbar">
          <div>
            <span className="presenter-kicker">{stage.kicker}</span>
            <span className="presenter-lesson-label">{slide.course} · {slide.day}</span>
          </div>

          {presenterV2 ? (
            <div className="presenter-v2-tools">
              <label className="presenter-stage-jump">
                <span>Jump to</span>
                <select value={stageIndex} onChange={(event) => goTo(Number(event.target.value))}>
                  {stages.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.title}</option>)}
                </select>
              </label>

              <div className={`presenter-timer ${timerExpired ? "presenter-timer-expired" : ""}`}>
                <strong>{formatTimer(timerRemaining)}</strong>
                <button type="button" onClick={() => setTimerRunning((current) => !current)} disabled={timerRemaining <= 0}>
                  {timerRunning ? "Pause" : "Start"}
                </button>
                <button type="button" onClick={() => setTimerMinutes(stage.suggestedMinutes || 5)}>Reset</button>
                <div className="presenter-timer-presets">
                  {timerPresets.map((minutes) => (
                    <button key={minutes} type="button" onClick={() => setTimerMinutes(minutes)}>{minutes}m</button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="presenter-top-actions">
            <button type="button" onClick={enterFullscreen}>Fullscreen</button>
            <button type="button" onClick={onExit}>Exit presenter</button>
          </div>
        </header>

        <main className={`presenter-content presenter-content-${stage.type}`}>
          {stage.type === "intro" ? (
            <>
              <h1>{stage.title}</h1>
              {stage.topic ? <p className="presenter-topic">{stage.topic}</p> : null}
              {stage.objective ? <p className="presenter-objective">{stage.objective}</p> : null}
              {stage.duration ? <p className="presenter-duration">{stage.duration}</p> : null}
            </>
          ) : stage.type === "question-reveal" ? (
            <section className="presenter-question-reveal">
              <div className="presenter-question-counter">{advancedClassroom ? "Frage" : "Question"} {questionIndex + 1} {advancedClassroom ? "von" : "of"} {stage.items.length}</div>
              <h1>{stage.title}</h1>
              <p className="presenter-question">{activeQuestion}</p>
              <div className="presenter-question-actions">
                <button type="button" onClick={() => setShowQuestionSupport((current) => !current)}>
                  {showQuestionSupport
                    ? (advancedClassroom ? "Modell ausblenden" : "Hide model support")
                    : (advancedClassroom ? "Modell anzeigen" : "Reveal model support")}
                </button>
                <button type="button" onClick={randomQuestion}>{advancedClassroom ? "Zufallsfrage" : "Random question"}</button>
              </div>
              {showQuestionSupport && stage.supportItems?.length ? (
                <div className="presenter-model-support">
                  <strong>{advancedClassroom ? "Modellsprache" : "Model language"}</strong>
                  <ul>{stage.supportItems.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ) : null}
            </section>
          ) : stage.type === "flow" ? (
            <>
              <h1>{stage.title}</h1>
              <div className="presenter-flow-grid">
                {stage.items.map((item, itemIndex) => (
                  <article key={`${item.title}-${item.detail || item.instruction || itemIndex}`} className="presenter-flow-card">
                    <div className="presenter-flow-card-main">
                      <strong>{item.title}</strong>
                      {item.instruction ? <p className="presenter-practice-instruction">{item.instruction}</p> : <p>{item.detail}</p>}
                      {Array.isArray(item.prompts) && item.prompts.length ? (
                        <ol className="presenter-practice-prompts">
                          {item.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
                        </ol>
                      ) : null}
                      {Array.isArray(item.modelItems) && item.modelItems.length ? (
                        <details className="presenter-practice-details">
                          <summary>Modell anzeigen</summary>
                          <ul>{item.modelItems.map((model) => <li key={model}>{model}</li>)}</ul>
                        </details>
                      ) : null}
                      {item.teacherNote ? (
                        <details className="presenter-practice-details presenter-teacher-note">
                          <summary>Teacher note (EN)</summary>
                          <p>{item.teacherNote}</p>
                        </details>
                      ) : null}
                    </div>
                    {item.minutes ? <button type="button" onClick={() => setTimerMinutes(item.minutes)}>Set {item.minutes} min</button> : null}
                  </article>
                ))}
              </div>
            </>
          ) : stage.type === "workbook" ? (
            <>
              <h1>{stage.title}</h1>
              <div className="presenter-workbook-list">
                {stage.items.map((item) => (
                  <article key={`${item.label}-${item.detail}`}>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
              <div className="presenter-workbook-actions">
                {stage.grammarUrl ? <a href={lessonUrl(stage.grammarUrl)} target="_blank" rel="noreferrer">Open grammar notes</a> : null}
                {stage.workbookUrl ? <a href={lessonUrl(stage.workbookUrl)} target="_blank" rel="noreferrer">Open workbook</a> : null}
              </div>
            </>
          ) : (
            <>
              <h1>{stage.title}</h1>
              {stage.type === "numbered-list" ? (
                <ol className="presenter-list">
                  {stage.items.map((item) => <li key={item}>{item}</li>)}
                </ol>
              ) : stage.type === "list" ? (
                <ul className="presenter-list">
                  {stage.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p className="presenter-task">{stage.body}</p>
              )}
            </>
          )}
        </main>

        <footer className="presenter-footer">
          <button type="button" onClick={previous} disabled={stageIndex === 0 && questionIndex === 0}>← Previous</button>
          <div className="presenter-progress-wrap" aria-label={`Slide ${stageIndex + 1} of ${stages.length}`}>
            <span>{stageIndex + 1} / {stages.length}</span>
            <div className="presenter-progress-track"><div className="presenter-progress-bar" style={{ width: `${progress}%` }} /></div>
          </div>
          <button type="button" onClick={next} disabled={stageIndex === stages.length - 1 && (stage.type !== "question-reveal" || questionIndex === stage.items.length - 1)}>
            {stage.type === "question-reveal" && questionIndex < stage.items.length - 1
              ? (advancedClassroom ? "Nächste Frage →" : "Next question →")
              : "Next →"}
          </button>
        </footer>
      </div>
    </div>
  );
}
