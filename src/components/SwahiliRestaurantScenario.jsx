import { useState } from "react";

// Same interaction rhythm as the German A2 scenario challenge:
// situation -> per-step oral response -> model reveal -> next task.
// No database writes, scores or new student assignment.
export default function SwahiliRestaurantScenario({ scenarios = [] }) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const current = scenarios[scenarioIndex];
  if (!current) return null;
  const steps = current.steps || [];
  const activeStep = steps[stepIndex];

  const pickScenario = (nextIndex) => {
    setScenarioIndex(nextIndex);
    setStepIndex(0);
    setRevealed(false);
    setFinished(false);
  };
  const nextScenario = () => {
    if (scenarios.length < 2) return;
    // Avoid repeating the current scenario, like the existing A2 teacher challenge.
    const offset = Math.floor(Math.random() * (scenarios.length - 1)) + 1;
    pickScenario((scenarioIndex + offset) % scenarios.length);
  };
  const advance = () => {
    setRevealed(false);
    if (stepIndex < steps.length - 1) {
      setStepIndex(index => index + 1);
    } else {
      setFinished(true);
    }
  };

  return <section className="presenter-career-challenge swahili-restaurant-challenge" aria-label="Teacher-led restaurant scenario challenge">
    <div className="presenter-career-challenge-heading">
      <span className="presenter-kicker">Mazoezi ya kuzungumza · Speaking challenge</span>
      <p>Use: <strong>Naomba · Sitaki · Tafadhali · Jumla ni shilingi ngapi?</strong></p>
    </div>
    <div className="swahili-restaurant-challenge__selectors" role="group" aria-label="Choose restaurant situation">
      {scenarios.map((scenario,index)=>
        <button key={scenario.id} type="button"
          className={scenarioIndex===index ? "is-selected" : ""}
          aria-pressed={scenarioIndex===index}
          onClick={() => pickScenario(index)}>
          {index+1}. {scenario.label}
        </button>
      )}
    </div>

    <div className="presenter-career-hero">
      <span className="presenter-career-emoji" role="img" aria-label="Restaurant">{current.icon || "🍽️"}</span>
      <div>
        <span className="presenter-career-eyebrow">HALI HALISI · YOUR RESTAURANT SITUATION</span>
        <h2>{current.label}</h2>
        <p>{current.context}</p>
      </div>
    </div>

    <div className="presenter-career-roadmap" aria-label="Scenario task progress">
      {steps.map((step,index)=>
        <div key={step.id} className={`presenter-career-milestone ${index === stepIndex && !finished ? "is-current" : ""} ${index < stepIndex || finished ? "is-complete" : ""}`}>
          <span>{index < stepIndex || finished ? "✓" : index+1}</span>
          <strong>{step.action}</strong>
        </div>
      )}
    </div>

    {finished ? <div className="presenter-career-completion" role="status">
      <h2>Hongera! · Well done</h2>
      <p>You've completed the restaurant conversation. Choose another situation for the next student.</p>
    </div> : activeStep ? <div className="presenter-career-question" aria-live="polite">
      <span className="presenter-career-eyebrow">TASK {stepIndex+1} OF {steps.length} · SPEAK ALOUD</span>
      <h2>{activeStep.question}</h2>
      {revealed ? <div className="presenter-career-model" role="status">
        <span>Mfano wa jibu · Model answer</span>
        <strong lang="sw">{activeStep.answer}</strong>
        <small>Other correct ways of expressing the request are welcome.</small>
      </div> : <p className="presenter-career-waiting">Pick a student and let them speak before showing the model answer.</p>}
    </div> : null}

    <div className="presenter-career-controls">
      <button type="button" className="presenter-career-new" onClick={nextScenario} disabled={scenarios.length<2}>↻ New situation</button>
      {!finished && activeStep && <>
        <button type="button" className="presenter-career-reveal" aria-expanded={revealed}
          onClick={() => setRevealed(v=>!v)}>{revealed ? "Hide model answer" : "Show model answer"}</button>
        <button type="button" className="presenter-career-next" onClick={advance}>{stepIndex === steps.length-1 ? "Finish scenario ✓" : "Next step →"}</button>
      </>}
    </div>
    <p className="presenter-career-teacher-note">Teacher-led, ungraded oral practice. Use the existing student picker and activity timer. The workbook assignment is separate.</p>
  </section>;
}
