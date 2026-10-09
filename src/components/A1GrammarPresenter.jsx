import { useEffect, useMemo, useRef, useState } from "react";
import { buildTeacherSlideSupport } from "../data/teacherSlideSupport.js";
import { getA1GrammarChecks } from "../data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../data/a1PresenterUnderstandingChecks.js";
import { buildA1CheckCoaching } from "../data/a1CheckCoaching.js";
import { getA1LearningPath } from "../data/a1LearningPath.js";
import { buildA1SlideReviewChecks } from "../data/a1SlideReview.js";
import { getA1Days1To5QuickChecks, getA1Days1To5ApplicationChecks } from "../data/a1Days1To5Understanding.js";
import { getA1Days6To10QuickChecks, getA1Days6To10ApplicationChecks } from "../data/a1Days6To10Understanding.js";
import { getA1Days11To15QuickChecks, getA1Days11To15ApplicationChecks } from "../data/a1Days11To15Understanding.js";
import PresenterStudentPicker from "./PresenterStudentPicker.jsx";
import PresenterSessionTimer from "./PresenterSessionTimer.jsx";
import {
  A1_ACTIVITY_TIMER_PRESETS,
  DEFAULT_A1_ACTIVITY_MINUTES,
  a1ActivityDeadline,
  a1ActivitySecondsLeft,
} from "../utils/a1PresenterActivityTimer.js";
import "./TeachingSlidePresenter.css";

const FALOWEN_BASE_URL = "https://www.falowen.app";
const A1_GRAMMAR_CHECK_FLOW_VERSION = 3;

function lessonUrl(value = "") {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${FALOWEN_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function formatFocusTime(totalSeconds = 0) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function a1TeacherPurpose(stage = {}) {
  const id = String(stage?.id || "");

  if (id === "intro") return stage.examReadiness
    ? {
        student: "Ablauf und Ziel der A1-Sprechprüfung verstehen.",
        teacher: "Kurz orientieren: Heute wird Prüfungsbereitschaft geprüft; Grammatik nur korrigieren, wenn sie die Sprechaufgabe blockiert.",
      }
    : {
        student: "Lernziel und Ablauf verstehen.",
        teacher: "Kurz orientieren; die Grammatik wird auf der Falowen-Grammatikseite erklärt.",
      };
  if (id === "quick-check") return {
    student: "Die eben gelernte Regel kurz erinnern.",
    teacher: "Nur prüfen, nicht neu erklären. Bei Unsicherheit Needs review markieren.",
  };
  if (id === "grammar-check") return {
    student: stage.examReadiness
      ? "Einen Readiness-Check selbstständig bearbeiten: sprechen oder Prüfungswissen anwenden."
      : "Eine Grammatikfrage selbstständig beantworten.",
    teacher: stage.examReadiness
      ? "Bei Performance-Prompts Aufgaben­erfüllung und Verständlichkeit bewerten; bei Wissensfragen die Antwort mit dem Teacher Guide abgleichen."
      : "Erst vollständig antworten lassen; danach Correct oder Needs review markieren.",
  };
  if (id === "mistake-fix") return {
    student: "Einen typischen Grammatikfehler korrigieren.",
    teacher: "Nur die Zielregel korrigieren; keine neue Nebenregel hinzufügen.",
  };
  if (id === "mistakes") return {
    student: "Typische Fehler erkennen.",
    teacher: "Kurz scannen und nur Fehler hervorheben, die in der Klasse tatsächlich auftreten.",
  };
  if (id === "sentence-build") return {
    student: stage.lessonReviewMode ? "Eine kurze Verständnis- oder Korrekturaufgabe lösen." : "Einen eigenen einfachen Satz mit der Zielgrammatik bilden.",
    teacher: stage.lessonReviewMode ? "Nur die heutige Regel prüfen; kurze richtige Antworten genügen." : "Grammatik vor Wortschatz bewerten; ein einfacher korrekter Satz reicht.",
  };
  if (id === "workbook" || id === "mock") return {
    student: id === "mock" ? "Die Prüfungsteile möglichst ohne Hilfe durchführen." : "Prüfe dein Verständnis mit der passenden Falowen-Aufgabe.",
    teacher: id === "mock" ? "Hilfen reduzieren und Prüfungsbereitschaft beobachten." : (stage.reviewLabel || "Zur passenden Falowen-Aufgabe wechseln."),
  };
  if (id === "exit-check") return stage.examReadiness
    ? {
        student: "Einen frischen Readiness-Check ohne Hilfe beantworten.",
        teacher: "Nicht vorsagen; je nach Aufgabentyp entweder die konkrete Antwort oder die selbstständige Sprechleistung prüfen.",
      }
    : {
        student: "Eine frische Aufgabe ohne Hilfe lösen.",
        teacher: "Nicht vorsagen; damit entscheiden, ob die Grammatik sitzt.",
      };
  if (id === "exam-map") return {
    student: "Die drei Teile der A1-Sprechprüfung verstehen.",
    teacher: "Nur das Format klären; noch keine lange Sprachproduktion verlangen.",
  };
  if (id === "teil-1" || id === "teil-3") return {
    student: "Das Prüfungsformat an einem kurzen Beispiel sehen.",
    teacher: "Ein Modell zeigen und danach sofort zur Anwendung wechseln.",
  };
  if (id === "readiness") return {
    student: "Verstehen, was für die Prüfung schon sicher sein muss.",
    teacher: "Anhand der Kriterien entscheiden, was noch Needs review ist.",
  };
  return {
    student: "Die aktuelle Aufgabe bearbeiten.",
    teacher: "Auf das eine Lernziel der Folie fokussieren.",
  };
}


function stageList(slide, topicLabel) {
  const isSpeakingReadiness = String(slide?.assignmentId || "").trim().toUpperCase() === "A1-5.9";
  const support = buildTeacherSlideSupport(slide);
  const grammarChecks = getA1GrammarChecks(slide.assignmentId, slide);
  const checks = getA1PresenterUnderstandingChecks(
    slide.assignmentId,
    grammarChecks,
    { slide, support },
  );
  const mainChecks = checks.slice(0, Math.max(1, checks.length - 1));
  const exitChecks = checks.slice(Math.max(1, checks.length - 1));
  const workbookParts = Array.isArray(slide.workbookConnection?.parts) ? slide.workbookConnection.parts : [];
  const practicePrompts = Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [];
  const hasWorkbookPlan = workbookParts.length > 0;
  const learningPath = getA1LearningPath(slide);
  const transferItems = hasWorkbookPlan
    ? workbookParts.map((part) => ({ label: part.label, detail: part.detailEn }))
    : practicePrompts.slice(0, 4).map((question, index) => ({ label: `Übung ${index + 1}`, detail: question }));

  if (isSpeakingReadiness) {
    const flow = Array.isArray(slide.interactionFlow) ? slide.interactionFlow : [];
    return [
      {
        id: "intro",
        type: "intro",
        kicker: "A1 · Day 19",
        title: slide.title || "Goethe A1 Speaking Readiness",
        topic: topicLabel || slide.topic || "",
        objective: slide.objective || "",
        duration: slide.estimatedDuration || "60 minutes",
        examReadiness: true,
      },
      {
        id: "exam-map",
        type: "list",
        kicker: "Prüfungsformat",
        title: "Die drei Teile der A1-Sprechprüfung",
        items: [
          "Teil 1 · Sich vorstellen: Name, Alter, Land, Wohnort, Sprachen, Beruf/Studium und Hobby; danach Buchstabieren und Zahlen.",
          "Teil 2 · Fragen stellen und antworten: Aus einem Thema oder Schlüsselwort eine passende Frage machen und die Partnerfrage beantworten.",
          "Teil 3 · Bitten formulieren und reagieren: Eine höfliche Bitte machen und natürlich auf die Bitte des Partners reagieren.",
        ],
      },
      {
        id: "teil-1",
        type: "list",
        kicker: "Teil 1",
        title: "Sich vorstellen · 30–45 Sekunden",
        items: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe.slice(0, 1) : [],
      },
      {
        id: "grammar-check",
        type: "check",
        kicker: "Teil 1–3 · Live-Check",
        title: "Prüfungsbereitschaft · ein Check pro Student",
        items: mainChecks,
      },
      {
        id: "teil-3",
        type: "list",
        kicker: "Teil 3",
        title: "Bitten und reagieren",
        items: (Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : []).slice(4, 6),
      },
      {
        id: "mock",
        type: "workbook",
        kicker: "Mini-Prüfung",
        title: "Teil 1 → Teil 2 → Teil 3 · ohne Hilfe",
        items: flow.slice(2, 6).map((item) => ({ label: item.phase, detail: item.detailEn })),
        workbookUrl: slide.workbookConnection?.workbookUrl || "",
      },
      {
        id: "readiness",
        type: "list",
        kicker: "Readiness",
        title: "Is the student ready for the exam?",
        items: [
          "Task completion: answers or forms exactly what the task asks for.",
          "Question formation: forms a clear W-question or yes/no question that is correct enough for A1.",
          "Answer relevance: answers the actual question instead of giving a memorized answer about the topic.",
          "Fluency: responds without a long pause and continues after a small mistake.",
          "Clarity: pronunciation and sentence structure are clear enough for A1.",
          "Interaction: listens, makes polite requests, and responds appropriately to the partner.",
        ],
      },
      {
        id: "exit-check",
        type: "check",
        kicker: "Abschluss",
        title: "Fresh Prompt · ohne Hilfe",
        items: exitChecks,
        exitCheck: true,
      },
    ]
      .filter((stage) => stage.type === "intro" || (Array.isArray(stage.items) && stage.items.length > 0))
      .map((stage) => ({ ...stage, examReadiness: true }));
  }

  const quickChecks = getA1Days1To5QuickChecks(slide.assignmentId)
    || getA1Days6To10QuickChecks(slide.assignmentId)
    || getA1Days11To15QuickChecks(slide.assignmentId)
    || grammarChecks.slice(0, 2);
  const correctionChecks = mainChecks
    .filter((item) => /mistake|correct|avoid this/i.test(String(item?.questionDe || "")))
    .slice(0, 2);
  const modelExamples = Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [];
  const curatedApplicationChecks = getA1Days1To5ApplicationChecks(slide.assignmentId)
    || getA1Days6To10ApplicationChecks(slide.assignmentId)
    || getA1Days11To15ApplicationChecks(slide.assignmentId);
  const sentenceBuildChecks = curatedApplicationChecks || modelExamples.slice(0, 2).map((example, index) => ({
    questionDe: index === 0
      ? `Change one detail but keep the grammar correct: “${example}”`
      : `Make a new sentence with the same grammar pattern: “${example}”`,
    answerDe: `Accept a new A1 sentence that keeps the same target grammar as: ${example}`,
    noteEn: "Check the grammar pattern first; vocabulary can stay simple.",
  }));
  const mistakeItems = Array.isArray(support.commonMistakesEn) ? support.commonMistakesEn : [];

  return [
    {
      id: "intro",
      type: "intro",
      kicker: `${slide.course || "A1"}${slide.day ? ` · ${slide.day}` : ""}`,
      title: slide.title || "A1 grammar check",
      topic: topicLabel || slide.topic || "",
      objective: slide.objective || "",
      duration: slide.estimatedDuration || "",
      grammarDiagnostic: true,
    },
    {
      id: "quick-check",
      type: "check",
      kicker: "Quick check",
      title: "Do you remember the grammar rule?",
      items: quickChecks,
    },
    {
      id: "grammar-check",
      type: "check",
      kicker: "Verständnis prüfen",
      title: "One understanding question per student",
      items: mainChecks,
    },
    {
      id: "mistake-fix",
      type: "check",
      kicker: "Wrong → Correct",
      title: "Fix the grammar mistake",
      items: correctionChecks,
    },
    {
      id: "mistakes",
      type: "list",
      kicker: "Teacher scan",
      title: "Common mistakes to watch",
      items: mistakeItems,
    },
    {
      id: "sentence-build",
      type: "check",
      kicker: curatedApplicationChecks ? "Anwenden" : "Build one sentence",
      title: curatedApplicationChecks ? "Two short lesson applications" : "Use the grammar correctly",
      items: sentenceBuildChecks,
      lessonReviewMode: Boolean(curatedApplicationChecks),
    },
    {
      id: "workbook",
      type: "workbook",
      kicker: "Falowen · next task",
      title: learningPath?.label || (hasWorkbookPlan ? "Now practise it in Falowen" : "Now apply it"),
      items: transferItems,
      activityKind: learningPath?.kind || "review",
      activityInstruction: learningPath?.instruction || "",
      reviewLabel: learningPath?.reviewLabel || "",
      reviewChecks: buildA1SlideReviewChecks(mainChecks, 2),
      reviewTitle: learningPath?.kind === "tutor-marked"
        ? "Vor der Abgabe · prüfe diese zwei Punkte"
        : "Verständnis-Check · prüfe diese zwei Punkte",
      actionLabel: learningPath?.actionLabel || "Open Course Book activity",
      grammarUrl: slide.workbookConnection?.grammarUrl || "",
      workbookUrl: slide.workbookConnection?.workbookUrl || "",
    },
    {
      id: "exit-check",
      type: "check",
      kicker: "Exit check",
      title: "One fresh grammar check · no help",
      items: exitChecks,
      exitCheck: true,
    },
  ].filter((stage) => {
    if (stage.type === "intro") return true;
    return Array.isArray(stage.items) && stage.items.length > 0;
  });
}

export default function A1GrammarPresenter({
  slide,
  topicLabel,
  onExit,
  nextLessonHref = "",
  nextLessonLabel = "",
  lessonBlockPosition = 1,
  lessonBlockTotal = 1,
}) {
  const stages = useMemo(() => stageList(slide, topicLabel), [slide, topicLabel]);
  const presenterShellRef = useRef(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [participationQuestion, setParticipationQuestion] = useState(null);
  const contentRef = useRef(null);
  const lastContentSizeRef = useRef({ width: 0, height: 0 });
  const [fitMode, setFitMode] = useState("normal");
  const [focusMode, setFocusMode] = useState(false);
  const [activityTimerMinutes, setActivityTimerMinutes] = useState(DEFAULT_A1_ACTIVITY_MINUTES);
  const [activityRemainingSeconds, setActivityRemainingSeconds] = useState(DEFAULT_A1_ACTIVITY_MINUTES * 60);
  const [activityDeadlineMs, setActivityDeadlineMs] = useState(0);
  const activitySoundRef = useRef(null);
  const activityAlarmPlayedRef = useRef(false);
  const activityTimerRunning = activityDeadlineMs > 0;
  const activityTimerExpired = !activityTimerRunning && activityRemainingSeconds === 0;
  const [classTimeState, setClassTimeState] = useState({
    remainingSeconds: 0,
    durationSeconds: 0,
    running: false,
    expired: false,
  });
  const stage = stages[stageIndex] || stages[0];
  const teacherPurpose = a1TeacherPurpose(stage);

  const checkMode = stage?.type === "check";
  const participationCheckMode = stage?.id === "grammar-check";
  const manualCheckMode = checkMode && !participationCheckMode;
  const activeCheck = participationCheckMode
    ? participationQuestion
    : checkMode
      ? stage.items[itemIndex]
      : null;
  const activeExamPerformance = Boolean(stage?.examReadiness && activeCheck?.responseMode === "performance");
  const activeCoaching = stage?.examReadiness ? null : buildA1CheckCoaching(activeCheck, slide);
  // Do not give hints during the scored one-question-per-student diagnostic
  // or the final unaided exit check. Teacher checks appear after reveal only.
  const canShowHint = Boolean(activeCoaching && !participationCheckMode && !stage?.exitCheck);
  const progress = stages.length ? ((stageIndex + 1) / stages.length) * 100 : 0;

  function resetQuestionState() {
    setItemIndex(0);
    setShowAnswer(false);
    setShowHint(false);
    setParticipationQuestion(null);
  }

  function goTo(index) {
    const last = Math.max(0, stages.length - 1);
    setStageIndex(Math.min(last, Math.max(0, index)));
    resetQuestionState();
  }

  function next() {
    if (manualCheckMode && itemIndex < stage.items.length - 1) {
      setItemIndex((current) => current + 1);
      setShowAnswer(false);
      setShowHint(false);
      return;
    }
    goTo(stageIndex + 1);
  }

  function previous() {
    if (manualCheckMode && itemIndex > 0) {
      setItemIndex((current) => current - 1);
      setShowAnswer(false);
      setShowHint(false);
      return;
    }
    goTo(stageIndex - 1);
  }

  // Independent of PresenterSessionTimer: never start, stop or reset the class clock.
  function setActivityMinutes(minutes) {
    if (!A1_ACTIVITY_TIMER_PRESETS.includes(minutes)) return;
    setActivityTimerMinutes(minutes);
    setActivityRemainingSeconds(minutes * 60);
    setActivityDeadlineMs(0);
    activityAlarmPlayedRef.current = false;
  }

  function resetActivityTimer() {
    setActivityRemainingSeconds(activityTimerMinutes * 60);
    setActivityDeadlineMs(0);
    activityAlarmPlayedRef.current = false;
  }

  function primeActivitySound() {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      if (!activitySoundRef.current) activitySoundRef.current = new AudioContextClass();
      if (activitySoundRef.current.state === "suspended") {
        activitySoundRef.current.resume().catch(() => {});
      }
    } catch {
      // Timers remain usable when the browser blocks audio.
    }
  }

  function playActivityTimeUp() {
    const context = activitySoundRef.current;
    if (!context || context.state !== "running") return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 740;
      const start = context.currentTime;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.42);
    } catch {
      // Visual time-up indication still works without sound.
    }
  }

  function toggleActivityTimer() {
    if (activityTimerRunning) {
      setActivityRemainingSeconds(a1ActivitySecondsLeft(activityDeadlineMs));
      setActivityDeadlineMs(0);
    } else if (activityRemainingSeconds > 0) {
      primeActivitySound();
      setActivityDeadlineMs(a1ActivityDeadline(activityRemainingSeconds));
    }
  }

  useEffect(() => {
    // The next activity begins ready to start, never already counting down.
    setActivityDeadlineMs(0);
    setActivityRemainingSeconds(activityTimerMinutes * 60);
    activityAlarmPlayedRef.current = false;
  }, [stage?.id, slide?.assignmentId]);

  useEffect(() => {
    if (!activityDeadlineMs) return undefined;
    const update = () => {
      const secondsLeft = a1ActivitySecondsLeft(activityDeadlineMs);
      setActivityRemainingSeconds(secondsLeft);
      if (secondsLeft === 0) {
        setActivityDeadlineMs(0);
        if (!activityAlarmPlayedRef.current) {
          activityAlarmPlayedRef.current = true;
          playActivityTimeUp();
        }
      }
    };
    const timer = window.setInterval(update, 250);
    update();
    return () => window.clearInterval(timer);
  }, [activityDeadlineMs]);

  useEffect(() => () => {
    try {
      activitySoundRef.current?.close?.().catch?.(() => {});
    } catch {
      // Browsers may not expose an AudioContext close method.
    }
  }, []);

  async function presentFullscreen() {
    setFitMode("normal");
    setFocusMode(true);
    try {
      if (!document.fullscreenElement) await presenterShellRef.current?.requestFullscreen?.();
    } catch {
      // Presentation view still fills the dynamic viewport when native fullscreen is blocked.
    }
  }

  async function exitPresentationView() {
    setFitMode("normal");
    setFocusMode(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
    } catch {
      // Restoring presenter controls must still work when fullscreen exit is blocked.
    }
  }

  useEffect(() => {
    setShowAnswer(false);
  }, [participationQuestion?.id]);

  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) setFocusMode(false);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    let frame = 0;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const currentSize = { width: node.clientWidth, height: node.clientHeight };
        const previousSize = lastContentSizeRef.current;
        const viewportGrew = currentSize.width > previousSize.width + 8
          || currentSize.height > previousSize.height + 8;
        lastContentSizeRef.current = currentSize;

        if (viewportGrew && fitMode !== "normal") {
          setFitMode("normal");
          return;
        }

        const overflow = node.scrollHeight > node.clientHeight + 6;
        if (!overflow) return;
        if (fitMode === "normal") {
          setFitMode("compact");
          return;
        }
        if (fitMode === "compact") setFitMode("tight");
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [stage?.id, stage?.type, stage?.title, stage?.items, fitMode, focusMode]);

  useEffect(() => {
    function onKeyDown(event) {
      const tagName = event.target?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tagName)) return;
      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        if (participationCheckMode) return;
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
  }, [stageIndex, itemIndex, stage?.id, stages.length, manualCheckMode, participationCheckMode]);

  if (!stage) return null;

  const atStart = stageIndex === 0 && (!manualCheckMode || itemIndex === 0);
  const atEnd = stageIndex === stages.length - 1 && (!manualCheckMode || itemIndex === stage.items.length - 1);

  return (
    <div ref={presenterShellRef} className={`presenter-shell ${focusMode ? "is-presentation-mode" : ""}`} role="dialog" aria-modal="true" aria-label="A1 teaching presenter">
      <div className={`presenter-stage ${focusMode ? "is-focus-mode" : ""} ${focusMode ? "presenter-has-focus-stage-timer presenter-a1-stacked-controls" : ""} ${String(stage.title || "").length > 58 ? "presenter-title-long" : String(stage.title || "").length > 38 ? "presenter-title-medium" : ""}`}>
        {focusMode ? (
          <div className={`presenter-focus-stage-timer ${activityTimerExpired ? "is-expired" : ""}`} aria-label="A1 activity timer">
            <span>Activity timer</span>
            <strong>{formatFocusTime(activityRemainingSeconds)}</strong>
            <div className="presenter-focus-stage-timer-actions">
              {A1_ACTIVITY_TIMER_PRESETS.map((minutes) => (
                <button key={minutes} type="button" className={activityTimerMinutes === minutes ? "is-active" : ""}
                  aria-pressed={activityTimerMinutes === minutes} onClick={() => setActivityMinutes(minutes)}>
                  {minutes}m
                </button>
              ))}
              <button type="button" onClick={toggleActivityTimer} disabled={activityRemainingSeconds <= 0}>
                {activityTimerRunning ? "Pause" : "Start"}
              </button>
              <button type="button" onClick={resetActivityTimer}>Reset</button>
            </div>
          </div>
        ) : null}
        {focusMode && classTimeState.durationSeconds > 0 ? (
          <div className={`presenter-focus-time ${classTimeState.expired ? "is-expired" : ""}`} aria-label="Class time remaining">
            <strong>{formatFocusTime(classTimeState.remainingSeconds)}</strong>
            <span>{classTimeState.expired ? "Time up" : "left"}</span>
          </div>
        ) : null}
        {focusMode ? (
          <div className="presenter-focus-dock" aria-label="Presentation controls">
            <button type="button" onClick={previous} disabled={atStart} aria-label="Previous slide">←</button>
            <span>{stageIndex + 1}/{stages.length}</span>
            <button type="button" className="presenter-restore-control" onClick={exitPresentationView} aria-label="Restore presenter controls">Restore</button>
            <button type="button" onClick={next} disabled={atEnd} aria-label="Next slide">Next slide →</button>
          </div>
        ) : null}
        <header className="presenter-topbar">
          <div>
            <span className="presenter-kicker">{stage.kicker}</span>
            <span className="presenter-lesson-label">
              {stage.examReadiness ? "A1 · Exam-readiness" : "A1 · Grammar check"}
              {lessonBlockTotal > 1 ? ` · Day ${slide.dayNumber} · Block ${lessonBlockPosition}/${lessonBlockTotal}` : ""}
            </span>
          </div>

          <PresenterSessionTimer
            slide={slide}
            stage={stage}
            onTimeStateChange={setClassTimeState}
            toolbarActions={(
              <>
                <button type="button" className="presenter-session-present" onClick={presentFullscreen}>Present full screen</button>
                <button type="button" className="presenter-session-exit" onClick={onExit}>Exit presenter</button>
              </>
            )}
          />

          <div className="presenter-v2-tools">
            <label className="presenter-stage-jump">
              <span>Jump to</span>
              <select value={stageIndex} onChange={(event) => goTo(Number(event.target.value))}>
                {stages.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.title}</option>)}
              </select>
            </label>
            <div className={`presenter-timer ${activityTimerExpired ? "presenter-timer-expired" : ""}`} role="group" aria-label="A1 activity timer controls">
              <span className="presenter-timer-mode">Activity timer</span>
              <strong>{formatFocusTime(activityRemainingSeconds)}</strong>
              <div className="presenter-timer-presets" role="group" aria-label="Activity timer duration">
                {A1_ACTIVITY_TIMER_PRESETS.map((minutes) => (
                  <button key={minutes} type="button" className={activityTimerMinutes === minutes ? "is-active" : ""}
                    aria-pressed={activityTimerMinutes === minutes} onClick={() => setActivityMinutes(minutes)}>
                    {minutes}m
                  </button>
                ))}
              </div>
              <button type="button" onClick={toggleActivityTimer} disabled={activityRemainingSeconds <= 0}>
                {activityTimerRunning ? "Pause" : "Start"}
              </button>
              <button type="button" onClick={resetActivityTimer}>Reset</button>
            </div>
          </div>

        </header>

        <div className="presenter-participation-dock" aria-label="Class participation controls">
          <PresenterStudentPicker
            slide={slide}
            questions={participationCheckMode ? stage.items : []}
            questionContext={participationCheckMode ? stage.id : "class-participation"}
            onQuestionChange={(question) => {
              setParticipationQuestion(question);
              setShowAnswer(false);
              setShowHint(false);
            }}
            renderQuestionExternally={participationCheckMode}
          />
        </div>

        <main ref={contentRef} className={`presenter-content presenter-content-${stage.type} presenter-fit-${fitMode}`}>
          {!focusMode && teacherPurpose ? (
            <aside className="presenter-teacher-purpose" aria-label="Teacher purpose">
              <div>
                <strong>Student</strong>
                <span>{teacherPurpose.student}</span>
              </div>
              <div>
                <strong>Teacher</strong>
                <span>{teacherPurpose.teacher}</span>
              </div>
            </aside>
          ) : null}
          {stage.type === "intro" ? (
            <>
              <h1>{stage.title}</h1>
              {stage.topic ? <p className="presenter-topic">{stage.topic}</p> : null}
              {stage.objective ? <p className="presenter-objective">{stage.objective}</p> : null}
              {stage.duration ? <p className="presenter-duration">{stage.duration}</p> : null}
              <div className="presenter-model-support" style={{ marginTop: 24 }}>
                <strong>{stage.examReadiness ? "A1 speaking readiness method" : "A1 grammar-check method"}</strong>
                <p>{stage.examReadiness
                  ? "Warm-up diagnosis → exam map → Teil 1 → live performance/knowledge checks → mini mock exam → readiness decision → fresh exit check."
                  : "Grammar notes first → check understanding → correct the target rule → one short application → tutor-marked assignment or self-practice → unaided exit check."}</p>
                <small>{stage.examReadiness
                  ? "Use grammar only when it blocks the speaking task. During the mock exam, reduce teacher help and judge whether the student can perform independently."
                  : "Use the grammar page to teach. Presenter should not reteach the lesson: it checks whether each learner can recognize, correct and apply the grammar. Record only Correct or Needs review."}</small>
              </div>
            </>
          ) : stage.type === "check" ? (
            <section className="presenter-question-reveal">
              <div className="presenter-question-counter">
                {participationCheckMode
                  ? activeCheck
                    ? stage.examReadiness
                      ? `${activeExamPerformance ? "Performance" : "Knowledge"} check ${activeCheck.poolPosition} of ${activeCheck.poolSize} · one check per student`
                      : `Student question ${activeCheck.poolPosition} of ${activeCheck.poolSize} · one question per student`
                    : stage.examReadiness
                      ? "Exam-readiness live check · one mixed check per student"
                      : "Class understanding check · one question per student"
                  : `Aufgabe ${itemIndex + 1} von ${stage.items.length}`}
              </div>
              <h1>{stage.title}</h1>
              {participationCheckMode && !activeCheck ? (
                <div className="presenter-model-support">
                  <strong>Pick the first student above</strong>
                  <p>{stage.examReadiness
                    ? "Falowen assigns a different unused readiness check to each learner. Some checks require an A1 speaking performance; others check exam strategy or factual readiness knowledge."
                    : "Falowen assigns a different unused understanding question to each learner. For 10 students, the class receives 10 distinct lesson questions before any generated extension is needed."}</p>
                  <small>{stage.examReadiness
                    ? "Follow the selected check type: Performance = judge task fulfilment and understandable A1 language. Knowledge = compare the response with the supplied factual Teacher Guide."
                    : "Record Correct, Needs review, Skip or Absent, then click Next student → above to test another learner."}</small>
                </div>
              ) : (
                <>
                  <p className="presenter-question">{activeCheck?.questionDe}</p>
                  <div className="presenter-question-actions">
                    {canShowHint && !showAnswer ? (
                      <button type="button" aria-expanded={showHint} onClick={() => setShowHint((current) => !current)}>
                        {showHint ? "A1-Lernhilfe ausblenden" : "A1-Lernhilfe · vor der Antwort"}
                      </button>
                    ) : null}
                    <button type="button" onClick={() => {
                      setShowAnswer((current) => !current);
                      setShowHint(false);
                    }} disabled={!activeCheck}>
                      {showAnswer ? "Antwort ausblenden" : "Antwort anzeigen"}
                    </button>
                  </div>
                  {showHint && canShowHint && !showAnswer ? (
                    <aside className="presenter-a1-check-hint">
                      <strong>Lernhilfe · ein kleiner Schritt</strong>
                      <p>{activeCoaching.hintDe}</p>
                      <small>Keine fertige Antwort. Antworte selbst in einfachem Deutsch.</small>
                    </aside>
                  ) : null}
                  {showAnswer ? (
                    <div className="presenter-model-support">
                      <strong>{activeCoaching?.flexibleAnswer ? "Mögliche Antwort / teacher guide" : "Richtige Antwort / teacher guide"}</strong>
                      <p>{activeCheck?.answerDe}</p>
                      {participationCheckMode ? (
                        <small>{stage.examReadiness
                          ? activeExamPerformance
                            ? "Performance check: use the model only as a reference. Accept another understandable A1 response that fulfils the speaking task."
                            : "Knowledge check: compare the student's answer with this Teacher Guide. Do not mark an unrelated answer Correct just because the German is understandable."
                          : "Accept a short correct explanation or a suitable simple German example. Record the result, then use Next student → above for another distinct question."}</small>
                      ) : null}
                      {activeCheck?.noteEn ? <small>{activeCheck.noteEn}</small> : null}
                      {activeCoaching ? (
                        <aside className="presenter-a1-check-feedback">
                          <strong>Lehrerfeedback · nach der Antwort</strong>
                          <p>{activeCoaching.feedbackQuestionDe}</p>
                          <p><b>Prüfe:</b> {activeCoaching.checkDe}</p>
                          {activeCoaching.lessonGrammarEn || activeCoaching.lessonPitfallEn ? (
                            <details>
                              <summary>Grammatik und mögliche Fehler dieser Lektion</summary>
                              {activeCoaching.lessonGrammarEn ? (
                                <p><b>Grammatikziel (falls relevant):</b> {activeCoaching.lessonGrammarEn}</p>
                              ) : null}
                              {activeCoaching.lessonPitfallEn ? (
                                <p><b>Nur wenn tatsächlich gehört:</b> {activeCoaching.lessonPitfallEn}</p>
                              ) : null}
                            </details>
                          ) : null}
                          <p><b>Zweiter Versuch:</b> {activeCoaching.retryDe}</p>
                          <small>Vergleiche die echte Antwort mit der Aufgabe. Eigene richtige A1-Antworten gelten auch. Keine automatische Bewertung.</small>
                        </aside>
                      ) : null}
                    </div>
                  ) : (
                    <div className="presenter-model-support presenter-teacher-instruction" style={{ opacity: 0.8 }}>
                      <strong>{stage.exitCheck ? "Exit rule" : "Teacher instruction"}</strong>
                      <p>{stage.exitCheck
                        ? (stage.examReadiness
                          ? activeExamPerformance
                            ? "The student completes the fresh performance prompt first. Do not help; judge task fulfilment before revealing the guide."
                            : "The student answers the factual readiness question first. Do not help; compare the answer with the Teacher Guide before marking."
                          : "The student answers first. Reveal only after the answer is complete.")
                        : (stage.examReadiness
                          ? activeExamPerformance
                            ? "Let the selected student complete the speaking performance first. Judge task fulfilment and clarity, then record Correct or Needs review."
                            : "This is a knowledge/strategy check. Listen to the answer, then compare it with the Teacher Guide before recording Correct or Needs review."
                          : "Let the selected student answer first. Record Correct or Needs review above, then click Next student → to check another learner.")}</p>
                    </div>
                  )}
                </>
              )}
            </section>
          ) : stage.type === "workbook" ? (
            <>
              <h1>{stage.title}</h1>
              {stage.activityInstruction ? (
                <div className="presenter-a1-learning-route" data-a1-learning-mode={stage.activityKind}>
                  <strong>{stage.activityKind === "self-practice" ? "Self-practice · no marking" :
                    stage.activityKind === "tutor-marked" ? "Tutor-marked · submit for review" :
                    "Check the learner-page instructions"}
                  </strong>
                  <p>{stage.activityInstruction}</p>
                  {stage.reviewLabel ? <small>{stage.reviewLabel}</small> : null}
                </div>
              ) : null}
              <div className="presenter-workbook-list">
                {stage.items.map((item) => (
                  <article key={`${item.label}-${item.detail}`}>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
              {stage.reviewChecks?.length ? (
                <section className="presenter-a1-review-checks" aria-label="Lesson-specific understanding review">
                  <h2>{stage.reviewTitle}</h2>
                  <p>Versuche zuerst selbst zu antworten. Die Lehrkraft kann die Lösung danach öffnen.</p>
                  <div className="presenter-a1-review-checks-grid">
                    {stage.reviewChecks.map((item) => (
                      <details key={item.questionDe} className="presenter-a1-review-check">
                        <summary>{item.questionDe}</summary>
                        <p><b>Richtige Antwort:</b> {item.answerDe}</p>
                        {item.noteEn ? <small><b>Erklärung:</b> {item.noteEn}</small> : null}
                      </details>
                    ))}
                  </div>
                </section>
              ) : null}
              <div className="presenter-workbook-actions">
                {stage.grammarUrl ? <a href={lessonUrl(stage.grammarUrl)} target="_blank" rel="noreferrer">Open grammar notes</a> : null}
                {stage.workbookUrl ? <a href={lessonUrl(stage.workbookUrl)} target="_blank" rel="noreferrer">{stage.actionLabel || "Open workbook"}</a> : null}
              </div>
            </>
          ) : (
            <>
              <h1>{stage.title}</h1>
              <ul className="presenter-list">
                {stage.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </>
          )}
        </main>

        <footer className="presenter-footer">
          <button type="button" onClick={previous} disabled={atStart}>← Previous</button>
          <div className="presenter-progress-wrap" aria-label={`Stage ${stageIndex + 1} of ${stages.length}`}>
            <span>{stageIndex + 1} / {stages.length}</span>
            <div className="presenter-progress-track"><div className="presenter-progress-bar" style={{ width: `${progress}%` }} /></div>
          </div>
          <button
            type="button"
            onClick={next}
            disabled={atEnd}
            title={participationCheckMode
              ? (stage.examReadiness
                ? "This leaves the exam-readiness live check. Use Next student above to test the rest of the class."
                : "This leaves the class understanding check. Use Next student above to test the rest of the class.")
              : ""}
          >
            {participationCheckMode
              ? "Continue lesson →"
              : manualCheckMode && itemIndex < stage.items.length - 1
                ? "Nächste Aufgabe →"
                : "Next →"}
          </button>
          {nextLessonHref ? (
            <a
              className="presenter-next-lesson"
              href={nextLessonHref}
              title={nextLessonLabel || "Open next lesson in Presenter Mode"}
            >
              Next lesson{nextLessonLabel ? ` · ${nextLessonLabel}` : ""} →
            </a>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
