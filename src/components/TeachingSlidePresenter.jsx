import { useEffect, useMemo, useState } from "react";
import { buildTeachingPresenterStages, clampPresenterIndex } from "../utils/teachingPresenter.js";

function formatTimer(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Number(totalSeconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function TeachingSlidePresenter({ slide, topicLabel, onExit }) {
  const stages = useMemo(() => buildTeachingPresenterStages(slide, topicLabel), [slide, topicLabel]);
  const [stageIndex, setStageIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [modelRevealed, setModelRevealed] = useState(false);
  const stage = stages[stageIndex] || stages[0];
  const presenter2 = stages.some((item) => item.type === "question-reveal");

  function goTo(index) {
    setStageIndex(clampPresenterIndex(index, stages.length));
  }

  function next() {
    goTo(stageIndex + 1);
  }

  function previous() {
    goTo(stageIndex - 1);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(Math.max(0, Number(stage?.suggestedMinutes || 0)) * 60);
  }

  function adjustTimer(minutes) {
    setTimerRunning(false);
    setTimerSeconds((current) => Math.max(0, current + (minutes * 60)));
  }

  function nextQuestion() {
    const count = stage?.items?.length || 0;
    if (!count) return;
    setQuestionIndex((current) => (current + 1) % count);
    setModelRevealed(false);
  }

  function previousQuestion() {
    const count = stage?.items?.length || 0;
    if (!count) return;
    setQuestionIndex((current) => (current - 1 + count) % count);
    setModelRevealed(false);
  }

  function randomQuestion() {
    const count = stage?.items?.length || 0;
    if (count <= 1) return;
    setQuestionIndex((current) => {
      let candidate = current;
      while (candidate === current) candidate = Math.floor(Math.random() * count);
      return candidate;
    });
    setModelRevealed(false);
  }

  async function enterFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    } catch {
      // Fullscreen can be blocked by the browser; presenter mode still works without it.
    }
  }

  useEffect(() => {
    setTimerSeconds(Math.max(0, Number(stage?.suggestedMinutes || 0)) * 60);
    setTimerRunning(false);
    setQuestionIndex(0);
    setModelRevealed(false);
  }, [stage?.id, stage?.suggestedMinutes]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = window.setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    function onKeyDown(event) {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) return;
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
  }, [stageIndex, stages.length]);

  if (!stage) return null;

  const progress = stages.length ? ((stageIndex + 1) / stages.length) * 100 : 0;
  const currentQuestion = stage.type === "question-reveal" ? stage.items?.[questionIndex] : "";
  const modelItems = Array.isArray(stage.modelItems) ? stage.modelItems : [];
  const currentModel = modelItems.length ? modelItems[questionIndex % modelItems.length] : "";

  return (
    <div className="presenter-shell" role="dialog" aria-modal="true" aria-label="Teaching slide presenter">
      <div className="presenter-stage">
        <header className="presenter-topbar">
          <div>
            <span className="presenter-kicker">{stage.kicker}</span>
            <span className="presenter-lesson-label">{slide.course} · {slide.day}</span>
          </div>

          {presenter2 ? (
            <div className={`presenter-timer ${timerSeconds === 0 ? "presenter-timer-finished" : ""}`} aria-label="Classroom activity timer">
              <strong>{formatTimer(timerSeconds)}</strong>
              <div className="presenter-timer-actions">
                <button type="button" onClick={() => adjustTimer(-1)} aria-label="Remove one minute">−1m</button>
                <button type="button" onClick={() => setTimerRunning((current) => !current)} disabled={timerSeconds === 0}>
                  {timerRunning ? "Pause" : "Start"}
                </button>
                <button type="button" onClick={resetTimer}>Reset</button>
                <button type="button" onClick={() => adjustTimer(1)} aria-label="Add one minute">+1m</button>
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
            <div className="presenter-question-mode">
              <div className="presenter-question-heading">
                <div>
                  <span className="presenter-question-count">Question {questionIndex + 1} of {stage.items.length}</span>
                  <h1>{stage.title}</h1>
                </div>
                <button type="button" className="presenter-random-button" onClick={randomQuestion} disabled={stage.items.length <= 1}>Random question</button>
              </div>

              <p className="presenter-question-card">{currentQuestion}</p>

              {modelRevealed && currentModel ? (
                <div className="presenter-model-answer">
                  <span>Model language</span>
                  <p>{currentModel}</p>
                </div>
              ) : null}

              <div className="presenter-question-actions">
                <button type="button" onClick={previousQuestion}>← Question</button>
                <button type="button" onClick={() => setModelRevealed((current) => !current)} disabled={!currentModel}>
                  {modelRevealed ? "Hide model" : "Reveal model"}
                </button>
                <button type="button" onClick={nextQuestion}>Next question →</button>
              </div>
            </div>
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
          <button type="button" onClick={previous} disabled={stageIndex === 0}>← Previous</button>
          <div className="presenter-progress-wrap" aria-label={`Slide ${stageIndex + 1} of ${stages.length}`}>
            <span>{stageIndex + 1} / {stages.length}</span>
            <div className="presenter-progress-track"><div className="presenter-progress-bar" style={{ width: `${progress}%` }} /></div>
          </div>
          <button type="button" onClick={next} disabled={stageIndex === stages.length - 1}>Next →</button>
        </footer>
      </div>
    </div>
  );
}
