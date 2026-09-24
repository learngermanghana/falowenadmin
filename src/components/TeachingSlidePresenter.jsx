import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildTeachingPresenterStages,
  clampPresenterIndex,
  getSpeakingQuestionModel,
  isTeachingPresenterV2Slide,
} from "../utils/teachingPresenter.js";
import { splitWarmupQuestionSegments } from "../utils/warmupText.js";
import PresenterStudentPicker from "./PresenterStudentPicker.jsx";
import "./TeachingSlidePresenter.css";

const FALOWEN_BASE_URL = "https://www.falowen.app";
const WARMUP_PREPARATION_MINUTES = 5;

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

function renderWarmupQuestion(question = "", keywords = []) {
  return splitWarmupQuestionSegments(question, keywords).map((segment, index) => (
    segment.highlighted
      ? <mark className="presenter-warmup-keyword" key={segment.text + "-" + index}>{segment.text}</mark>
      : segment.text
  ));
}
function buildB1CorrectionTeacherGuide(questionDe = "", modelAnswerDe = "") {
  const question = String(questionDe || "").trim();
  const answer = String(modelAnswerDe || "").trim();
  const text = `${question} ${answer}`;

  if (/Während wir wanderten/i.test(question)) {
    return [
      "The error is in the main clause, not in the während-clause. während introduces a subordinate clause (Nebensatz), so the conjugated verb is at the end: während wir wanderten.",
      "Because the während-clause comes first, it occupies position 1 of the whole sentence. After the comma, the main clause begins with the conjugated verb: begann es ..., not es begann ....",
      "Board pattern: Während + subject + ... + verb, verb + subject + ....",
      "Correct sentence: Während wir wanderten, begann es zu regnen.",
      "Meaning: While we were hiking, it began to rain. Then ask the learner to make one new sentence with a während-clause first.",
    ];
  }

  if (/Nachdem wir (?:sind )?angekommen/i.test(question)) {
    return [
      "In this past narrative, nachdem marks the earlier completed action. Use Plusquamperfekt for that earlier action: angekommen waren.",
      "The later action stays in Präteritum here: bauten ... auf.",
      "nachdem introduces a subordinate clause, so the finite auxiliary goes to the end: Nachdem wir angekommen waren, ....",
      "sind angekommen = have arrived — Perfekt. waren angekommen = had arrived — Plusquamperfekt.",
      "Correct sentence: Nachdem wir angekommen waren, bauten wir das Zelt auf. Meaning: After we had arrived, we put up the tent.",
    ];
  }

  const guide = [];

  if (/\b(weil|obwohl|wenn|während|nachdem|bevor|dass|ob|damit|indem)\b/i.test(text)) {
    guide.push("This connector introduces a subordinate clause (Nebensatz): the conjugated verb normally goes to the end of that clause.");
    guide.push("If the subordinate clause comes first, it occupies position 1; the following main clause begins with its conjugated verb before the subject.");
  }

  if (/\b(deshalb|trotzdem|daher|darum)\b/i.test(text)) {
    guide.push("deshalb/trotzdem/daher/darum can occupy position 1; the conjugated verb then stays in position 2, before the subject.");
  }

  if (/um .* zu|um\s+zu|damit/i.test(text)) {
    guide.push("Use um ... zu when the subject is the same in both actions; use damit when the subjects are different or when a full subordinate clause is needed.");
  }

  if (/\b(wegen|trotz)\b/i.test(text)) {
    guide.push("In standard/formal German, wegen and trotz are commonly taught with the genitive. Check the article and noun ending as well as the preposition.");
  }

  if (/je .* desto|desto/i.test(text)) {
    guide.push("With je ... desto, the je-clause behaves like a subordinate clause; in the desto-clause, the conjugated verb follows the fronted comparative phrase.");
  }

  if (/\bwie\b|\bwann\b|\bwoher\b|\bob\b/i.test(question) && /wissen|sagen|fragen|erklären/i.test(text)) {
    guide.push("In an indirect question, keep the W-word or ob and place the conjugated verb at the end of the embedded clause.");
  }

  if (/\b(der|die|das|den|dem|deren|dessen)\b/i.test(text) && /wohnung|vermieter|person|partner|jemand|film/i.test(text)) {
    guide.push("For a relative clause, choose the relative pronoun by gender/number and by its grammatical role inside the relative clause; the finite verb goes to the end.");
  }

  if (/\b(muss|müssen|kann|können|soll|sollen|darf|dürfen|möchte|wollen|will)\b/i.test(text)) {
    guide.push("With a modal verb in a main clause, conjugate the modal in position 2 and put the second verb as an infinitive at the end, normally without zu.");
  }

  if (/könnt|würde|hätte|wäre/i.test(text)) {
    guide.push("Konjunktiv II forms such as könnten/würden/hätten/wären make requests, suggestions and hypothetical statements more polite or less direct.");
  }

  if (/\bwie\b/i.test(question) && /ruhiger|persönlicher|schneller|größer|besser|mehr|weniger/i.test(text)) {
    guide.push("For an unequal comparison, use the comparative + als: größer als, besser als, ruhiger als.");
  }

  if (answer) guide.push(`Board model: ${answer}`);
  guide.push("After explaining the correction, ask the learner to make one new sentence with the same rule. This checks understanding instead of memorisation.");

  return [...new Set(guide)].slice(0, 6);
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
  const [timerMode, setTimerMode] = useState("stage");
  const [rosterCount, setRosterCount] = useState(0);
  const [warmupQuestionCount, setWarmupQuestionCount] = useState(4);
  const [warmupMinutes, setWarmupMinutes] = useState(5);
  const [warmupSupportOpen, setWarmupSupportOpen] = useState({});
  const warmupAudioContextRef = useRef(null);
  const stage = stages[stageIndex] || stages[0];
  const warmupPerStudent = stage?.id === "warmup" && stage?.timingMode === "per-student";
  const showPresenterTimer = presenterV2 || warmupPerStudent;
  const availableWarmupQuestions = Array.isArray(stage?.items) ? stage.items.length : 0;
  const visibleWarmupQuestionCount = warmupPerStudent ? Math.min(warmupQuestionCount, availableWarmupQuestions) : availableWarmupQuestions;
  const visibleStageItems = warmupPerStudent ? stage.items.slice(0, visibleWarmupQuestionCount) : stage?.items;
  const largeClassWarmup = warmupPerStudent && rosterCount >= 8;
  const projectedWarmupMinutes = rosterCount * warmupMinutes;
  const enhancedWarmup = warmupPerStudent && Array.isArray(stage?.questionSupport) && stage.questionSupport.length > 0;

  function toggleWarmupSupport(questionIndexValue, supportType) {
    const key = questionIndexValue + ":" + supportType;
    setWarmupSupportOpen((current) => ({ ...current, [key]: !current[key] }));
  }

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

  function setTimerMinutes(minutes, mode = "stage") {
    const seconds = Math.max(0, Number(minutes || 0)) * 60;
    setTimerMode(mode);
    setTimerRemaining(seconds);
    setTimerRunning(false);
  }

  function ensureWarmupAudioContext() {
    if (typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!warmupAudioContextRef.current) warmupAudioContextRef.current = new AudioContextClass();
    const context = warmupAudioContextRef.current;
    if (context.state === "suspended") context.resume().catch(() => {});
    return context;
  }

  function playWarmupTransitionBeep() {
    try {
      const context = ensureWarmupAudioContext();
      if (!context) return;
      [660, 820, 980].forEach((frequency, index) => {
        const start = context.currentTime + (index * 0.2);
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.045, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.16);
      });
    } catch {
      // The visual Presentation state still appears when browser audio is blocked.
    }
  }

  function startWarmupPreparation() {
    if (!warmupPerStudent) return;
    ensureWarmupAudioContext();
    setTimerMode("prepare");
    setTimerRemaining(WARMUP_PREPARATION_MINUTES * 60);
    setTimerRunning(true);
  }

  function resetWarmupStudent() {
    setTimerMode("warmup");
    setTimerRemaining(Math.max(1, Number(warmupMinutes || 5)) * 60);
    setTimerRunning(false);
    setWarmupSupportOpen({});
  }

  function applyCompactWarmup() {
    setWarmupQuestionCount(2);
    setWarmupMinutes(3);
    setTimerMode("warmup");
    setTimerRemaining(3 * 60);
    setTimerRunning(false);
  }

  function restoreStandardWarmup() {
    setWarmupQuestionCount(4);
    setWarmupMinutes(5);
    setTimerMode("warmup");
    setTimerRemaining(5 * 60);
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
    setWarmupSupportOpen({});
    setTimerRunning(false);
    if (stage?.id === "warmup" && stage?.timingMode === "per-student") {
      setWarmupQuestionCount(4);
      setWarmupMinutes(5);
      setTimerMode("warmup");
      setTimerRemaining(5 * 60);
      return;
    }
    setTimerMode("stage");
    setTimerRemaining(stage?.suggestedMinutes ? stage.suggestedMinutes * 60 : 0);
  }, [stage?.id, stage?.suggestedMinutes, stage?.timingMode]);

  useEffect(() => {
    if (!timerRunning || timerRemaining <= 0) return undefined;
    const timer = window.setInterval(() => {
      setTimerRemaining((current) => {
        if (current <= 1) {
          if (timerMode === "prepare" && warmupPerStudent) {
            setTimerMode("warmup");
            return Math.max(1, Number(warmupMinutes || 5)) * 60;
          }
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning, timerRemaining, timerMode, warmupPerStudent, warmupMinutes]);

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
  const activeModel = getSpeakingQuestionModel(stage, activeQuestion);
  const directAnswerMode = stage.requiresQuestionModel || Boolean(activeModel);
  const b1CorrectionGuide = String(slide.course || "").toUpperCase() === "B1" && stage.id === "b1-grammar-check" && activeModel?.modelAnswerDe
    ? buildB1CorrectionTeacherGuide(activeQuestion, activeModel.modelAnswerDe)
    : [];
  const timerExpired = showPresenterTimer && timerRemaining === 0 && !timerRunning;
  const timerPresets = [...new Set([stage.suggestedMinutes, warmupPerStudent ? warmupMinutes : null, 2, 3, 5, 10].filter(Boolean))];

  return (
    <div className="presenter-shell" role="dialog" aria-modal="true" aria-label="Teaching slide presenter">
      <div className="presenter-stage">
        <header className="presenter-topbar">
          <div>
            <span className="presenter-kicker">{stage.kicker}</span>
            <span className="presenter-lesson-label">{slide.course} · {slide.day}</span>
          </div>

          {showPresenterTimer ? (
            <div className="presenter-v2-tools">
              <label className="presenter-stage-jump">
                <span>Jump to</span>
                <select value={stageIndex} onChange={(event) => goTo(Number(event.target.value))}>
                  {stages.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.title}</option>)}
                </select>
              </label>

              <div className={`presenter-timer ${timerExpired ? "presenter-timer-expired" : ""}`}>
                {warmupPerStudent ? <span className="presenter-timer-mode">{timerMode === "prepare" ? "Prepare · 30 sec" : `Speaking · ${warmupMinutes} min`}</span> : null}
                <strong>{formatTimer(timerRemaining)}</strong>
                {warmupPerStudent ? <button type="button" onClick={startWarmupPreparation}>Prepare 30s</button> : null}
                <button type="button" onClick={() => setTimerRunning((current) => !current)} disabled={timerRemaining <= 0}>
                  {timerRunning ? "Pause" : "Start"}
                </button>
                <button type="button" onClick={() => warmupPerStudent ? resetWarmupStudent() : setTimerMinutes(stage.suggestedMinutes || 5)}>{warmupPerStudent ? "Reset for next student" : "Reset"}</button>
                <div className="presenter-timer-presets">
                  {timerPresets.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => {
                        if (warmupPerStudent) {
                          setWarmupMinutes(minutes);
                          setTimerMinutes(minutes, "warmup");
                          return;
                        }
                        setTimerMinutes(minutes);
                      }}
                    >
                      {minutes}m
                    </button>
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

        <PresenterStudentPicker
          slide={slide}
          onRosterCountChange={setRosterCount}
          responseTimerEnabled={!warmupPerStudent}
        />

        <main className={`presenter-content presenter-content-${stage.type}`}>
          {stage.type === "intro" ? (
            <>
              <h1>{stage.title}</h1>
              {stage.topic ? <p className="presenter-topic">{stage.topic}</p> : null}
              {stage.objective ? <p className="presenter-objective">{stage.objective}</p> : null}
              {stage.duration ? <p className="presenter-duration">{stage.duration}</p> : null}
              {stage.studentReference ? (
                <section className={`presenter-student-reference is-${stage.studentReference.status}`}>
                  <div>
                    <span>Student lesson</span>
                    <strong>{stage.studentReference.courseBookLabel} · {stage.studentReference.title}</strong>
                  </div>
                  <div className="presenter-student-reference-status">
                    <strong>{stage.studentReference.statusLabel}</strong>
                    <small>{stage.studentReference.canonicalId}</small>
                  </div>
                  <p>{stage.studentReference.note}</p>
                </section>
              ) : null}
            </>
          ) : stage.type === "foundation" ? (
            <section className={`presenter-foundation presenter-foundation-${String(stage.level || "").toLowerCase()}`}>
              <div className="presenter-foundation-heading">
                <span>{stage.kicker}</span>
                <h1>{stage.title}</h1>
              </div>
              {stage.simpleEnglish ? (
                <article className="presenter-foundation-card presenter-foundation-card-simple">
                  <strong>{stage.simpleEnglishLabel || "Simple English"}</strong>
                  <p>{stage.simpleEnglish}</p>
                </article>
              ) : null}
              {stage.intro ? <p className="presenter-foundation-intro">{stage.intro}</p> : null}
              <div className="presenter-foundation-grid">
                {stage.example ? (
                  <article className="presenter-foundation-card">
                    <strong>{stage.exampleLabel || "Beispiel"}</strong>
                    <p>{stage.example}</p>
                  </article>
                ) : null}
                {stage.tension ? (
                  <article className="presenter-foundation-card presenter-foundation-card-tension">
                    <strong>{stage.tensionLabel || "Abwägung"}</strong>
                    <p>{stage.tension}</p>
                  </article>
                ) : null}
                {stage.question ? (
                  <article className="presenter-foundation-card presenter-foundation-card-question">
                    <strong>{stage.questionLabel || "Leitfrage"}</strong>
                    <p>{stage.question}</p>
                  </article>
                ) : null}
              </div>
              {stage.teacherNote ? (
                <details className="presenter-foundation-teacher-note">
                  <summary>Teacher note (EN)</summary>
                  <p>{stage.teacherNote}</p>
                </details>
              ) : null}
            </section>
          ) : stage.type === "vocabulary" ? (
            <section className="presenter-vocabulary">
              <div className="presenter-vocabulary-heading">
                <h1>{stage.title}</h1>
                <p>Learn the words first, then use them immediately in the lesson.</p>
              </div>
              <div className="presenter-vocabulary-grid">
                {stage.items.map((item, index) => (
                  <article key={`${item.term}-${index}`} className="presenter-vocabulary-card">
                    <span className="presenter-vocabulary-number">{item.number || index + 1}</span>
                    <div>
                      <strong>{item.term}</strong>
                      {item.example ? (
                        <p><span>Beispiel:</span> {item.example}</p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
              {stage.instruction ? (
                <p className="presenter-vocabulary-task"><strong>Sprich:</strong> {stage.instruction}</p>
              ) : null}
            </section>
          ) : stage.type === "question-reveal" ? (
            <section className="presenter-question-reveal">
              <div className="presenter-question-counter">{advancedClassroom ? "Frage" : "Question"} {questionIndex + 1} {advancedClassroom ? "von" : "of"} {stage.items.length}</div>
              <h1>{stage.title}</h1>
              <p className="presenter-question">{activeQuestion}</p>
              <div className="presenter-question-actions">
                <button type="button" onClick={() => setShowQuestionSupport((current) => !current)}>
                  {showQuestionSupport
                    ? (advancedClassroom ? "Modell ausblenden" : directAnswerMode ? "Hide model answer" : "Hide model support")
                    : (advancedClassroom ? "Modell anzeigen" : directAnswerMode ? "Reveal model answer" : "Reveal model support")}
                </button>
                <button type="button" onClick={randomQuestion}>{advancedClassroom ? "Zufallsfrage" : "Random question"}</button>
              </div>
              {showQuestionSupport && directAnswerMode ? (
                <div className="presenter-model-support">
                  <strong>Possible model answer</strong>
                  <p>{activeModel?.modelAnswerDe || "A model answer has not been added for this question yet."}</p>
                  {b1CorrectionGuide.length ? (
                    <div style={{ marginTop: "0.85rem", borderTop: "1px solid #cbd5e1", paddingTop: "0.75rem" }}>
                      <strong>What to explain to students</strong>
                      <ul style={{ margin: "0.45rem 0 0.65rem", paddingLeft: "1.25rem" }}>
                        {b1CorrectionGuide.map((item) => <li key={item} style={{ marginBottom: "0.35rem" }}>{item}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {activeModel?.modelAnswerDe ? (
                    <small>{b1CorrectionGuide.length
                      ? "Teacher guide: explain the rule, point to the corrected word order/form, then ask for one new example."
                      : "Example only — adapt the details to your own experience."}</small>
                  ) : null}
                </div>
              ) : showQuestionSupport && stage.supportItems?.length ? (
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
          ) : stage.type === "bridge" ? (
            <section className="presenter-coursebook-bridge">
              <div className="presenter-coursebook-bridge-heading">
                <span>{stage.kicker}</span>
                <h1>{stage.title}</h1>
                {stage.studentReference ? <p>{stage.studentReference.courseBookLabel} · {stage.studentReference.title}</p> : null}
              </div>
              <div className="presenter-coursebook-bridge-grid">
                {stage.items.map((item) => (
                  <article key={item.label}>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                    {item.url ? <a href={lessonUrl(item.url)} target="_blank" rel="noreferrer">Open in Falowen</a> : null}
                  </article>
                ))}
              </div>
            </section>
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
                <>
                  {stage.timingLabel ? <p className="presenter-duration">{warmupPerStudent ? `${warmupMinutes} min per student · ${visibleWarmupQuestionCount} warm-up question${visibleWarmupQuestionCount === 1 ? "" : "s"}` : stage.timingLabel}</p> : null}
                  {warmupPerStudent ? (
                    <div className="presenter-warmup-controls">
                      <div className="presenter-warmup-question-count" role="group" aria-label="Warm-up questions per student">
                        <span>Questions per student</span>
                        {[1, 2, 3, 4].map((count) => (
                          <button
                            key={count}
                            type="button"
                            className={warmupQuestionCount === count ? "is-active" : ""}
                            aria-pressed={warmupQuestionCount === count}
                            aria-label={`Show ${count} warm-up question${count === 1 ? "" : "s"} per student`}
                            onClick={() => setWarmupQuestionCount(count)}
                          >
                            {count === 4 && availableWarmupQuestions < 4 ? `All (${availableWarmupQuestions})` : count}
                          </button>
                        ))}
                      </div>
                      {largeClassWarmup ? (
                        <div className="presenter-warmup-warning">
                          <strong>{rosterCount} students × {warmupMinutes} min = {projectedWarmupMinutes} min</strong>
                          <span>This could take a large part of the lesson. The teacher remains in control.</span>
                          {warmupMinutes === 5 || warmupQuestionCount !== 2 ? (
                            <button type="button" onClick={applyCompactWarmup}>Use 2 questions / 3 min per student</button>
                          ) : (
                            <button type="button" onClick={restoreStandardWarmup}>Restore 4 questions / 5 min</button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {enhancedWarmup ? (
                    <ol className="presenter-warmup-question-list">
                      {(visibleStageItems || []).map((item, itemIndex) => {
                        const support = stage.questionSupport?.[itemIndex] || {};
                        const hintOpen = Boolean(warmupSupportOpen[itemIndex + ":hint"]);
                        const starterOpen = Boolean(warmupSupportOpen[itemIndex + ":starter"]);
                        const followUpOpen = Boolean(warmupSupportOpen[itemIndex + ":followup"]);
                        const difficultyClass = String(support.difficulty || "Extend").toLowerCase();

                        return (
                          <li key={item} className="presenter-warmup-question-card">
                            <div className="presenter-warmup-question-heading">
                              <span className={"presenter-warmup-difficulty is-" + difficultyClass}>{support.difficulty || "Extend"}</span>
                              <p>{renderWarmupQuestion(item, support.keywords)}</p>
                            </div>
                            <div className="presenter-warmup-support-actions">
                              <button
                                type="button"
                                aria-expanded={hintOpen}
                                onClick={() => toggleWarmupSupport(itemIndex, "hint")}
                              >
                                {hintOpen ? "Hide hint" : "Hint"}
                              </button>
                              <button
                                type="button"
                                aria-expanded={starterOpen}
                                onClick={() => toggleWarmupSupport(itemIndex, "starter")}
                              >
                                {starterOpen ? "Hide starter" : "Answer starter"}
                              </button>
                              <button
                                type="button"
                                aria-expanded={followUpOpen}
                                onClick={() => toggleWarmupSupport(itemIndex, "followup")}
                              >
                                {followUpOpen ? "Hide follow-up" : "Follow-up"}
                              </button>
                            </div>
                            {hintOpen ? (
                              <div className="presenter-warmup-support-line">
                                <strong>Hint (EN)</strong>
                                <span>{support.hintEn}</span>
                              </div>
                            ) : null}
                            {starterOpen ? (
                              <div className="presenter-warmup-support-line">
                                <strong>Start</strong>
                                <span>{support.answerStarterDe}</span>
                              </div>
                            ) : null}
                            {followUpOpen ? (
                              <div className="presenter-warmup-support-line">
                                <strong>Follow-up</strong>
                                <span>{support.followUpDe}</span>
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <ul className="presenter-list">
                      {(visibleStageItems || []).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )}
                </>
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
