import { useEffect, useMemo, useState } from "react";
import { buildTeachingPresenterStages, clampPresenterIndex } from "../utils/teachingPresenter.js";

export default function TeachingSlidePresenter({ slide, topicLabel, onExit }) {
  const stages = useMemo(() => buildTeachingPresenterStages(slide, topicLabel), [slide, topicLabel]);
  const [stageIndex, setStageIndex] = useState(0);
  const stage = stages[stageIndex] || stages[0];

  function goTo(index) {
    setStageIndex(clampPresenterIndex(index, stages.length));
  }

  function next() {
    goTo(stageIndex + 1);
  }

  function previous() {
    goTo(stageIndex - 1);
  }

  async function enterFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    } catch {
      // Fullscreen can be blocked by the browser; presenter mode still works without it.
    }
  }

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

  return (
    <div className="presenter-shell" role="dialog" aria-modal="true" aria-label="Teaching slide presenter">
      <div className="presenter-stage">
        <header className="presenter-topbar">
          <div>
            <span className="presenter-kicker">{stage.kicker}</span>
            <span className="presenter-lesson-label">{slide.course} · {slide.day}</span>
          </div>
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
