import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildTeachingPresenterStages,
  clampPresenterIndex,
  getSpeakingQuestionModel,
  isTeachingPresenterV2Slide,
} from "../utils/teachingPresenter.js";
import { splitWarmupQuestionSegments } from "../utils/warmupText.js";
import { numberedPresenterSentences } from "../utils/presenterSentenceNumbering.js";
import { getA2B1AdminLessonProfileForSlide } from "../data/a2B1LessonProfile.js";
import PresenterStudentPicker from "./PresenterStudentPicker.jsx";
import PresenterSessionTimer from "./PresenterSessionTimer.jsx";
import "./TeachingSlidePresenter.css";

const FALOWEN_BASE_URL = "https://www.falowen.app";
const A2_B1_ACTIVITY_TIMER_PRESETS = [7, 5, 2];
const DEFAULT_ACTIVITY_TIMER_MINUTES = 5;

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

function c2NextStepLabel(value = "") {
  const label = String(value || "");
  if (/Grammar/i.test(label)) return "1. Grammatik";
  if (/Speak/i.test(label)) return "2. Sprechen";
  if (/Write/i.test(label)) return "3. Schreiben";
  if (/Workbook|Submit/i.test(label)) return "4. Workbook / Abgeben";
  return label;
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
  const presenterShellRef = useRef(null);
  const presenterV2 = isTeachingPresenterV2Slide(slide);
  const advancedClassroom = ["B2", "C1"].includes(String(slide.course || "").toUpperCase());
  const lessonContract = useMemo(() => getA2B1AdminLessonProfileForSlide(slide), [slide]);
  const [stageIndex, setStageIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestionSupport, setShowQuestionSupport] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState("activity");
  const [activityTimerMinutes, setActivityTimerMinutes] = useState(DEFAULT_ACTIVITY_TIMER_MINUTES);
  const [rosterCount, setRosterCount] = useState(0);
  const [warmupQuestionCount, setWarmupQuestionCount] = useState(4);
  const [warmupSupportOpen, setWarmupSupportOpen] = useState({});
  const [warmupAnswered, setWarmupAnswered] = useState({});
  const [revealedFlowRole, setRevealedFlowRole] = useState("");
  const [showC2TeacherInfo, setShowC2TeacherInfo] = useState(false);
  const [c2AnalysisStep, setC2AnalysisStep] = useState(0);
  const [c2RubricChecks, setC2RubricChecks] = useState({});
  const [examSolutionUnlocked, setExamSolutionUnlocked] = useState(false);
  const warmupAudioContextRef = useRef(null);
  const contentRef = useRef(null);
  const lastContentSizeRef = useRef({ width: 0, height: 0 });
  const [fitMode, setFitMode] = useState("normal");
  const [contentPage, setContentPage] = useState(0);
  const [contentPageSize, setContentPageSize] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [classTimeState, setClassTimeState] = useState({
    remainingSeconds: 0,
    durationSeconds: 0,
    running: false,
    expired: false,
  });
  const [knowledgeAnswersOpen, setKnowledgeAnswersOpen] = useState({});
  const [activeKnowledgeSentence, setActiveKnowledgeSentence] = useState(0);
  const [knowledgeChecksVisible, setKnowledgeChecksVisible] = useState(false);
  const [vocabChallengeMode, setVocabChallengeMode] = useState(false);
  const [vocabChallengeIndex, setVocabChallengeIndex] = useState(0);
  const [showVocabAnswer, setShowVocabAnswer] = useState(false);
  const [readingModeActive, setReadingModeActive] = useState(false);
  const [readingPhase, setReadingPhase] = useState("idle");
  const [activeReadingAssignment, setActiveReadingAssignment] = useState(null);
  const stage = stages[stageIndex] || stages[0];
  const presenterLevel = String(slide.course || "").trim().toUpperCase();
  const readingEligible = ["A2", "B1"].includes(presenterLevel)
    && stage?.type === "knowledge"
    && Boolean(String(stage?.textDe || "").trim());
  const numberedKnowledgeSentences = useMemo(
    () => numberedPresenterSentences(stage?.textDe || ""),
    [stage?.textDe],
  );
  const a2B1ActivityTimer = ["A2", "B1"].includes(presenterLevel);
  const warmupPerStudent = stage?.id === "warmup" && stage?.timingMode === "per-student";
  const showPresenterTimer = presenterV2 || warmupPerStudent;
  const availableWarmupQuestions = Array.isArray(stage?.items) ? stage.items.length : 0;
  const visibleWarmupQuestionCount = warmupPerStudent ? Math.min(warmupQuestionCount, availableWarmupQuestions) : availableWarmupQuestions;
  const visibleStageItems = warmupPerStudent ? stage.items.slice(0, visibleWarmupQuestionCount) : stage?.items;
  const largeClassWarmup = warmupPerStudent && rosterCount >= 8;
  const enhancedWarmup = warmupPerStudent;
  const warmupHasSupport = Array.isArray(stage?.questionSupport) && stage.questionSupport.length > 0;
  const visibleWarmupAnsweredCount = warmupPerStudent
    ? Array.from({ length: visibleWarmupQuestionCount }, (_, index) => Boolean(warmupAnswered[index])).filter(Boolean).length
    : 0;
  const visibleWarmupMissedCount = Math.max(0, visibleWarmupQuestionCount - visibleWarmupAnsweredCount);

  const pageableItems = Array.isArray(stage?.items) ? stage.items : [];
  const contentPageCount = contentPageSize > 0 ? Math.ceil(pageableItems.length / contentPageSize) : 1;
  const presenterItems = contentPageSize > 0
    ? pageableItems.slice(contentPage * contentPageSize, (contentPage + 1) * contentPageSize)
    : pageableItems;
  const presenterItemOffset = contentPageSize > 0 ? contentPage * contentPageSize : 0;
  const vocabChallenges = Array.isArray(stage?.challengeItems) ? stage.challengeItems : [];
  const activeVocabChallenge = vocabChallenges[vocabChallengeIndex] || vocabChallenges[0] || null;

  function toggleWarmupSupport(questionIndexValue, supportType) {
    const key = questionIndexValue + ":" + supportType;
    setWarmupSupportOpen((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleWarmupAnswered(questionIndexValue) {
    setWarmupAnswered((current) => ({
      ...current,
      [questionIndexValue]: !current[questionIndexValue],
    }));
  }

  function toggleKnowledgeAnswer(questionIndexValue) {
    setKnowledgeAnswersOpen((current) => ({
      ...current,
      [questionIndexValue]: !current[questionIndexValue],
    }));
  }

  function goTo(index) {
    setRevealedFlowRole("");
    setC2AnalysisStep(0);
    setC2RubricChecks({});
    setExamSolutionUnlocked(false);
    setShowC2TeacherInfo(false);
    setStageIndex(clampPresenterIndex(index, stages.length));
  }

  async function exitPresentationView() {
    setFocusMode(false);
    setFitMode("normal");
    setContentPageSize(0);
    setContentPage(0);
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
    } catch {
      // Restoring presenter controls must still work when fullscreen exit is blocked.
    }
  }

  function next() {
    if (stage?.type === "c2-analysis" && c2AnalysisStep < 2) {
      setC2AnalysisStep((current) => Math.min(2, current + 1));
      return;
    }
    if (stage?.type === "question-reveal" && questionIndex < stage.items.length - 1) {
      setQuestionIndex((current) => current + 1);
      setShowQuestionSupport(false);
      return;
    }
    goTo(stageIndex + 1);
  }

  function previous() {
    if (stage?.type === "c2-analysis" && c2AnalysisStep > 0) {
      setC2AnalysisStep((current) => Math.max(0, current - 1));
      return;
    }
    if (stage?.type === "question-reveal" && questionIndex > 0) {
      setQuestionIndex((current) => current - 1);
      setShowQuestionSupport(false);
      return;
    }
    goTo(stageIndex - 1);
  }

  function setTimerMinutes(minutes, mode = "activity") {
    const safeMinutes = Math.max(0, Number(minutes || 0));
    const seconds = safeMinutes * 60;
    if (a2B1ActivityTimer && safeMinutes) setActivityTimerMinutes(safeMinutes);
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

  function playPresenterTimerAlarm() {
    try {
      const context = ensureWarmupAudioContext();
      if (!context) return;
      const startedAt = context.currentTime;
      const alertDurationSeconds = 6;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(920, startedAt);
      gain.gain.setValueAtTime(0.0001, startedAt);
      for (let offset = 0; offset < alertDurationSeconds; offset += 0.72) {
        const pulseStart = startedAt + offset;
        const pulsePeak = Math.min(startedAt + alertDurationSeconds, pulseStart + 0.05);
        const pulseHold = Math.min(startedAt + alertDurationSeconds, pulseStart + 0.34);
        const pulseEnd = Math.min(startedAt + alertDurationSeconds, pulseStart + 0.56);
        gain.gain.setValueAtTime(0.0001, pulseStart);
        gain.gain.exponentialRampToValueAtTime(0.24, pulsePeak);
        gain.gain.setValueAtTime(0.24, pulseHold);
        gain.gain.exponentialRampToValueAtTime(0.0001, pulseEnd);
      }
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startedAt);
      oscillator.stop(startedAt + alertDurationSeconds);
    } catch {
      // The visual timer still reaches Time up when browser audio is blocked.
    }
  }

  function togglePresenterTimer() {
    if (timerRemaining <= 0) return;
    if (!timerRunning) ensureWarmupAudioContext();
    setTimerRunning((current) => !current);
  }

  function startReadingMode() {
    if (!readingEligible) return;
    setReadingModeActive(true);
    setReadingPhase("silent");
    setActiveReadingAssignment(null);
  }

  function shareReadingNow() {
    if (!readingModeActive) return;
    setReadingPhase("share");
  }

  function stopReadingMode() {
    setReadingModeActive(false);
    setReadingPhase("idle");
    setActiveReadingAssignment(null);
    setC2AnalysisStep(0);
    setC2RubricChecks({});
    setExamSolutionUnlocked(false);
    setShowC2TeacherInfo(false);
    setKnowledgeChecksVisible(true);
  }

  function selectKnowledgeSentence(number) {
    setActiveKnowledgeSentence((current) => current === number ? 0 : number);
  }

  function resetPresenterTimer() {
    setTimerMode("activity");
    setTimerRemaining(activityTimerMinutes * 60);
    setTimerRunning(false);
  }

  function resetWarmupStudent() {
    resetPresenterTimer();
    setWarmupSupportOpen({});
    setWarmupAnswered({});
  }

  function applyCompactWarmup() {
    setWarmupQuestionCount(2);
  }

  function restoreStandardWarmup() {
    setWarmupQuestionCount(4);
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

  async function presentFullscreen() {
    setFocusMode(true);
    setFitMode("normal");
    setContentPageSize(0);
    setContentPage(0);
    try {
      if (!document.fullscreenElement) await presenterShellRef.current?.requestFullscreen?.();
    } catch {
      // Presentation view still fills the dynamic viewport when native fullscreen is blocked.
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      if (document.fullscreenElement) return;
      setFocusMode(false);
      setFitMode("normal");
      setContentPageSize(0);
      setContentPage(0);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    setQuestionIndex(0);
    setShowQuestionSupport(false);
    setWarmupSupportOpen({});
    setWarmupAnswered({});
    setTimerRunning(false);
    setFitMode("normal");
    setContentPage(0);
    setContentPageSize(0);
    setKnowledgeAnswersOpen({});
    setActiveKnowledgeSentence(0);
    setKnowledgeChecksVisible(false);
    setVocabChallengeMode(false);
    setVocabChallengeIndex(0);
    setShowVocabAnswer(false);
    setReadingModeActive(false);
    setReadingPhase("idle");
    setActiveReadingAssignment(null);
    if (stage?.id === "warmup" && stage?.timingMode === "per-student") {
      setWarmupQuestionCount(4);
    }
    if (a2B1ActivityTimer) {
      setTimerMode("activity");
      setTimerRemaining(activityTimerMinutes * 60);
      return;
    }
    setTimerMode("stage");
    setTimerRemaining(stage?.suggestedMinutes ? stage.suggestedMinutes * 60 : 0);
  }, [stage?.id, stage?.suggestedMinutes, stage?.timingMode, a2B1ActivityTimer, activityTimerMinutes]);

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

        if (viewportGrew && (fitMode !== "normal" || contentPageSize > 0)) {
          setFitMode("normal");
          setContentPageSize(0);
          setContentPage(0);
          return;
        }

        const overflow = node.scrollHeight > node.clientHeight + 6;
        if (!overflow) return;

        if (fitMode === "normal") {
          setFitMode("compact");
          return;
        }
        if (fitMode === "compact") {
          setFitMode("tight");
          return;
        }

        const paginatableTypes = new Set([
          "knowledge",
          "vocabulary",
          "grammar-check",
          "b1-grammar",
          "b2-grammar",
          "c1-grammar",
          "correction-list",
          "flow",
          "workbook",
        ]);
        const canPaginate = paginatableTypes.has(stage?.type)
          && Array.isArray(stage?.items)
          && stage.items.length > 1;
        if (fitMode === "tight" && canPaginate && contentPageSize === 0) {
          setContentPageSize(Math.max(1, Math.ceil(stage.items.length / 2)));
          setContentPage(0);
        }
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [stage?.id, stage?.type, stage?.items, fitMode, contentPageSize, contentPage]);

  useEffect(() => {
    if (!timerRunning || timerRemaining <= 0) return undefined;
    const timer = window.setInterval(() => {
      setTimerRemaining((current) => current <= 1 ? 0 : current - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning, timerRemaining]);

  useEffect(() => {
    if (!showPresenterTimer || !timerRunning || timerRemaining !== 0) return undefined;
    playPresenterTimerAlarm();

    setTimerRunning(false);
    return undefined;
  }, [
    showPresenterTimer,
    timerRemaining,
    timerRunning,
    warmupPerStudent,
    a2B1ActivityTimer,
    stages.length,
  ]);

  useEffect(() => () => {
    try {
      warmupAudioContextRef.current?.close?.();
    } catch {
      // Nothing to clean up when browser audio is unavailable.
    }
  }, []);

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
  const activeQuestionLevel = stage.type === "question-reveal" && Array.isArray(stage.questionLevels)
    ? String(stage.questionLevels[questionIndex] || "")
    : "";
  const activeModel = getSpeakingQuestionModel(stage, activeQuestion);
  const directAnswerMode = stage.requiresQuestionModel || Boolean(activeModel);
  const b1CorrectionGuide = String(slide.course || "").toUpperCase() === "B1" && stage.id === "b1-grammar-check" && activeModel?.modelAnswerDe
    ? buildB1CorrectionTeacherGuide(activeQuestion, activeModel.modelAnswerDe)
    : [];
  const timerExpired = showPresenterTimer && timerRemaining === 0 && !timerRunning;
  const timerPresets = a2B1ActivityTimer
    ? A2_B1_ACTIVITY_TIMER_PRESETS
    : [...new Set([stage.suggestedMinutes, 2, 3, 5, 10].filter(Boolean))];
  const warmupTimerTotalSeconds = Math.max(1, activityTimerMinutes * 60);
  const warmupTimerRatio = timerRemaining / warmupTimerTotalSeconds;
  const warmupCoachingPrompts = [
    { label: "Think", text: "Decide your main answer before you speak." },
    { label: "Build", text: "Turn it into one complete German sentence." },
    { label: "Add detail", text: "Give one reason, example or extra detail." },
    { label: "Check", text: "Check word order and the polite form." },
    { label: "Say it", text: "Answer clearly and naturally." },
  ];
  const warmupElapsedSeconds = Math.max(0, warmupTimerTotalSeconds - timerRemaining);
  const warmupCoachingIndex = Math.floor(warmupElapsedSeconds / 8) % warmupCoachingPrompts.length;
  const warmupCoachingPrompt = warmupCoachingPrompts[warmupCoachingIndex];
  const warmupBottomCue = timerRemaining <= 0
    ? "Time up · finish this turn"
    : !timerRunning
      ? "Ready"
      : warmupCoachingPrompt.label;
  const warmupBottomProgress = visibleWarmupQuestionCount
    ? `${visibleWarmupAnsweredCount}/${visibleWarmupQuestionCount} answered`
    : "";

  return (
    <div ref={presenterShellRef} className={`presenter-shell ${focusMode ? "is-presentation-mode" : ""}`} role="dialog" aria-modal="true" aria-label="Teaching slide presenter">
      <div className={`presenter-stage ${focusMode ? "is-focus-mode" : ""} ${focusMode && showPresenterTimer ? "presenter-has-focus-stage-timer" : ""} ${stage?.examMode ? "is-c2-exam-mode" : ""} ${String(stage.title || "").length > 58 ? "presenter-title-long" : String(stage.title || "").length > 38 ? "presenter-title-medium" : ""}`}>
        {focusMode && showPresenterTimer ? (
          <div
            className={`presenter-focus-stage-timer ${timerExpired ? "is-expired" : ""}`}
            aria-label="Active stage timer"
          >
            <span>{a2B1ActivityTimer ? "Activity timer" : (stage?.title || "Stage")}</span>
            <strong>{formatTimer(timerRemaining)}</strong>
            <div className="presenter-focus-stage-timer-actions">
              {a2B1ActivityTimer ? timerPresets.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={activityTimerMinutes === minutes ? "is-active" : ""}
                  aria-pressed={activityTimerMinutes === minutes}
                  onClick={() => setTimerMinutes(minutes, "activity")}
                >
                  {minutes}m
                </button>
              )) : null}
              <button type="button" onClick={togglePresenterTimer} disabled={timerRemaining <= 0}>
                {timerRunning ? "Pause" : "Start"}
              </button>
              <button type="button" onClick={resetPresenterTimer}>Reset</button>
            </div>
          </div>
        ) : null}
        {focusMode && classTimeState.durationSeconds > 0 ? (
          <div className={`presenter-focus-time ${classTimeState.expired ? "is-expired" : ""}`} aria-label="Class time remaining">
            <strong>{formatTimer(classTimeState.remainingSeconds)}</strong>
            <span>{classTimeState.expired ? "Time up" : "left"}</span>
          </div>
        ) : null}
        {focusMode && warmupPerStudent && a2B1ActivityTimer ? (
          <div
            className={`presenter-warmup-bottom-timer ${timerRemaining <= 20 && timerRunning ? "is-ending" : ""} ${timerExpired ? "is-expired" : ""}`}
            aria-live="polite"
            aria-label="Warm-up time remaining"
          >
            <span className="presenter-warmup-bottom-label">Warm-up</span>
            <strong>{formatTimer(timerRemaining)}</strong>
            <span className="presenter-warmup-bottom-cue">{warmupBottomCue}</span>
            <span className="presenter-warmup-bottom-progress">{warmupBottomProgress}</span>
          </div>
        ) : null}
        {focusMode ? (
          <div className="presenter-focus-dock" aria-label="Focus mode controls">
            <button type="button" onClick={previous} disabled={stageIndex === 0 && questionIndex === 0} aria-label="Previous slide">←</button>
            <span>{stageIndex + 1}/{stages.length}</span>
            <button type="button" className="presenter-restore-control" onClick={exitPresentationView} aria-label="Restore presenter controls">Restore</button>
            <button
              type="button"
              onClick={next}
              disabled={stageIndex === stages.length - 1 && (stage.type !== "question-reveal" || questionIndex === stage.items.length - 1)}
              aria-label="Next slide"
            >
              Next slide →
            </button>
          </div>
        ) : null}
        <header className="presenter-topbar">
          <div>
            <span className="presenter-kicker">{stage.kicker}</span>
            <span className="presenter-lesson-label">{slide.course} · {slide.day}</span>
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

          {showPresenterTimer ? (
            <div className="presenter-v2-tools">
              <label className="presenter-stage-jump">
                <span>Jump to</span>
                <select value={stageIndex} onChange={(event) => goTo(Number(event.target.value))}>
                  {stages.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.title}</option>)}
                </select>
              </label>

              <div className={`presenter-timer ${timerExpired ? "presenter-timer-expired" : ""}`}>
                {a2B1ActivityTimer ? <span className="presenter-timer-mode">Activity timer</span> : null}
                <strong>{formatTimer(timerRemaining)}</strong>
                <div className="presenter-timer-presets" role="group" aria-label="Activity timer duration">
                  {timerPresets.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      className={a2B1ActivityTimer && activityTimerMinutes === minutes ? "is-active" : ""}
                      aria-pressed={a2B1ActivityTimer ? activityTimerMinutes === minutes : undefined}
                      onClick={() => setTimerMinutes(minutes, a2B1ActivityTimer ? "activity" : "stage")}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
                <button type="button" onClick={togglePresenterTimer} disabled={timerRemaining <= 0}>
                  {timerRunning ? "Pause" : "Start"}
                </button>
                <button type="button" onClick={resetPresenterTimer}>Reset</button>
              </div>
            </div>
          ) : null}

        </header>

        <PresenterStudentPicker
          slide={slide}
          onRosterCountChange={setRosterCount}
          responseTimerEnabled={!warmupPerStudent}
          readingShare={readingEligible ? {
            active: readingModeActive,
            phase: readingPhase,
            text: stage.textDe,
            level: presenterLevel,
            stageId: stage.id,
            signature: `${slide.assignmentId || slide.id || "lesson"}:${stage.id}`,
          } : null}
          onReadingAssignmentChange={setActiveReadingAssignment}
        />

        <main ref={contentRef} className={`presenter-content presenter-content-${stage.type} presenter-stage-${stage.id} presenter-fit-${fitMode}`}>
          {contentPageCount > 1 ? (
            <div className="presenter-content-pager" aria-label="Slide content pages">
              <span>{contentPage + 1}/{contentPageCount}</span>
              <button type="button" onClick={() => setContentPage((page) => Math.max(0, page - 1))} disabled={contentPage === 0}>Previous</button>
              <button type="button" onClick={() => setContentPage((page) => Math.min(contentPageCount - 1, page + 1))} disabled={contentPage >= contentPageCount - 1}>Next</button>
            </div>
          ) : null}
          {!focusMode && stage.teacherPurpose && presenterLevel === "C2" ? (
            <details
              className="presenter-c2-teacher-info"
              open={showC2TeacherInfo}
              onToggle={(event) => setShowC2TeacherInfo(event.currentTarget.open)}
            >
              <summary>Lehrerinfo</summary>
              <div className="presenter-c2-teacher-info-grid">
                <p><strong>Schülerfokus</strong><span>{stage.teacherPurpose.student}</span></p>
                <p><strong>Lehrerfokus</strong><span>{stage.teacherPurpose.teacher}</span></p>
                {stage.id === "intro" && slide.teacherSupport?.lessonObjectiveEn ? (
                  <p><strong>Teacher objective</strong><span>{slide.teacherSupport.lessonObjectiveEn}</span></p>
                ) : null}
                {stage.application?.teacherHint ? (
                  <p><strong>Hinweis zur Aufgabe</strong><span>{stage.application.teacherHint}</span></p>
                ) : null}
                {stage.id === "intro" && stage.studentReference ? (
                  <p><strong>Curriculum</strong><span>{stage.studentReference.courseBookLabel} · {stage.studentReference.title} · {stage.studentReference.statusLabel}</span></p>
                ) : null}
              </div>
            </details>
          ) : !focusMode && stage.teacherPurpose ? (
            <aside className="presenter-teacher-purpose" aria-label="Teacher purpose">
              <div>
                <strong>Student</strong>
                <span>{stage.teacherPurpose.student}</span>
              </div>
              <div>
                <strong>Teacher</strong>
                <span>{stage.teacherPurpose.teacher}</span>
              </div>
            </aside>
          ) : null}
          {stage.type === "intro" ? (
            <>
              {stage.skillTarget ? (
                <div className="presenter-c2-skill-target">
                  <span>{stage.progressionLabel || "C2-Fokus"}</span>
                  <strong>Heute trainieren wir: {stage.skillTarget}</strong>
                </div>
              ) : null}
              <h1>{stage.title}</h1>
              {stage.topic ? <p className="presenter-topic">{stage.topic}</p> : null}
              {stage.objective ? <p className="presenter-objective">{stage.objective}</p> : null}
              {stage.duration ? <p className="presenter-duration">{stage.duration}</p> : null}
              {stage.studentReference && presenterLevel !== "C2" ? (
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
              {lessonContract && presenterLevel !== "C2" ? (
                <section className="presenter-workbook-contract" aria-label="Workbook lesson contract">
                  <div className="presenter-workbook-contract-heading">
                    <span>Workbook contract</span>
                    <strong>{lessonContract.assignmentKey}</strong>
                  </div>
                  <div className="presenter-workbook-contract-grid">
                    <p><b>Submit</b><span>{lessonContract.teacherContract.submission}</span></p>
                    <p><b>Sprechen</b><span>{lessonContract.teacherContract.speaking}</span></p>
                    <p><b>Schreiben</b><span>{lessonContract.teacherContract.writing}</span></p>
                    <p><b>Teil 4</b><span>{lessonContract.teacherContract.part4}</span></p>
                  </div>
                </section>
              ) : null}
            </>
          ) : stage.type === "grammar-check" ? (
            <section className="presenter-grammar-check">
              <div className="presenter-grammar-check-heading">
                <span>{stage.kicker}</span>
                <h1>{stage.title}</h1>
                {stage.instruction ? <p>{stage.instruction}</p> : null}
              </div>
              <div className="presenter-grammar-check-grid">
                {presenterItems.map((item, index) => (
                  <article key={item.id || index} className="presenter-grammar-check-card">
                    <span className="presenter-grammar-check-label">{item.label || String(index + 1)}</span>
                    <p className="presenter-grammar-check-prompt">{item.prompt}</p>
                    {item.example ? <blockquote>{item.example}</blockquote> : null}
                    {item.answer ? (
                      <details>
                        <summary>Teacher answer anzeigen</summary>
                        <div className="presenter-grammar-check-answer">
                          <strong>{item.answerLabel || "Teacher key"}</strong>
                          <p>{item.answer}</p>
                          {item.note ? <small>{item.note}</small> : null}
                        </div>
                      </details>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : stage.type === "b2-grammar" ? (
            <section className="presenter-b2-grammar">
              <div className="presenter-b2-grammar-heading">
                <span>{stage.kicker}</span>
                <h1>{stage.title}</h1>
                <p>German first. Use the short English note only to confirm the logical function of the structure.</p>
              </div>
              <div className="presenter-b2-grammar-rules">
                {presenterItems.map((item, index) => (
                  <article key={item + index}>
                    <span>{index + 1}</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
              {stage.supportEn ? (
                <aside className="presenter-b2-grammar-support">
                  <strong>Brief English support</strong>
                  <p>{stage.supportEn}</p>
                </aside>
              ) : null}
              {stage.attentionEn ? (
                <aside className="presenter-b2-grammar-attention">
                  <strong>Watch out</strong>
                  <p>{stage.attentionEn}</p>
                </aside>
              ) : null}
              {Array.isArray(stage.modelItems) && stage.modelItems.length ? (
                <details className="presenter-advanced-models">
                  <summary>2 Modellsätze anzeigen</summary>
                  <ul>{stage.modelItems.map((item) => <li key={item}>{item}</li>)}</ul>
                </details>
              ) : null}
            </section>
          ) : stage.type === "c1-grammar" ? (
            <section className="presenter-c1-grammar">
              <div className="presenter-c1-grammar-heading">
                <span>{stage.kicker}</span>
                <h1>{stage.title}</h1>
                <p>Deutsch bleibt die Hauptsprache. Die englische Notiz klärt nur die Funktion der schwierigen Struktur.</p>
              </div>
              <div className="presenter-c1-grammar-rules">
                {presenterItems.map((item, index) => (
                  <article key={item + index}>
                    <span>{index + 1}</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
              {stage.supportEn ? (
                <aside className="presenter-c1-grammar-support">
                  <strong>Brief English support</strong>
                  <p>{stage.supportEn}</p>
                </aside>
              ) : null}
              {stage.attentionDe ? (
                <aside className="presenter-c1-grammar-attention">
                  <strong>Achtung</strong>
                  <p>{stage.attentionDe}</p>
                </aside>
              ) : null}
              {Array.isArray(stage.modelItems) && stage.modelItems.length ? (
                <details className="presenter-advanced-models">
                  <summary>2 Modellsätze anzeigen</summary>
                  <ul>{stage.modelItems.map((item) => <li key={item}>{item}</li>)}</ul>
                </details>
              ) : null}
            </section>
          ) : stage.type === "c2-grammar" ? (
            <section className="presenter-c2-grammar">
              <div className="presenter-c2-grammar-heading">
                <span>{stage.kicker}</span>
                <h1>{stage.title}</h1>
                <p className="presenter-c2-grammar-skill">
                  <strong>Heute trainieren wir:</strong> {stage.skillTarget || "Die Zielstruktur kontrolliert und funktional einsetzen."}
                </p>
              </div>
              <div className="presenter-c2-grammar-rules">
                {presenterItems.map((item, index) => (
                  <article key={item + index}>
                    <span>{index + 1}</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
              {stage.application ? (
                <article className="presenter-c2-grammar-application">
                  <span className="presenter-c2-grammar-application-label">AUFTRAG</span>
                  <h2>{stage.application.title || "Jetzt anwenden"}</h2>
                  <p className="presenter-c2-grammar-application-intro">{stage.application.instruction}</p>
                  {stage.application.prompt ? (
                    <div className="presenter-c2-grammar-prompt">
                      <span>AUSGANGSSATZ</span>
                      <blockquote>{stage.application.prompt}</blockquote>
                    </div>
                  ) : null}
                  <div className="presenter-c2-grammar-task">
                    <strong>Deine Aufgabe</strong>
                    <p>{stage.application.task}</p>
                  </div>
                  {stage.application.answer ? (
                    stage.examMode && !examSolutionUnlocked ? (
                      <button
                        type="button"
                        className="presenter-c2-exam-unlock"
                        onClick={() => setExamSolutionUnlocked(true)}
                      >
                        Antwort abgeschlossen · Musterlösung freigeben
                      </button>
                    ) : (
                      <details className="presenter-advanced-models presenter-c2-solution">
                        <summary>Musterlösung nach der Antwort</summary>
                        <p>{stage.application.answer}</p>
                      </details>
                    )
                  ) : null}
                </article>
              ) : null}
              {Array.isArray(stage.modelItems) && stage.modelItems.length ? (
                <details className="presenter-advanced-models">
                  <summary>Modellsätze vergleichen</summary>
                  <ul>{stage.modelItems.slice(0, 2).map((item) => <li key={item}>{item}</li>)}</ul>
                </details>
              ) : null}
            </section>
          ) : stage.type === "b1-grammar" ? (
            <section className="presenter-b1-grammar">
              <div className="presenter-b1-grammar-heading">
                <span>{stage.kicker}</span>
                <h1>{stage.title}</h1>
                <p>Short English support for the rule. Keep the German examples as the main language.</p>
              </div>
              <div className="presenter-b1-grammar-grid">
                {presenterItems.map((item, index) => (
                  <article key={(item.label || "rule") + index} className="presenter-b1-grammar-card">
                    <strong>{item.label || `Rule ${index + 1}`}</strong>
                    <p>{item.supportEn}</p>
                    {item.attentionEn ? (
                      <small><b>Watch out:</b> {item.attentionEn}</small>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : stage.type === "knowledge" ? (
            <section className="presenter-knowledge">
              <div className="presenter-knowledge-heading">
                <span>{stage.kicker || "Wissensimpuls"}</span>
                <h1>{stage.title}</h1>
                {stage.instruction ? <p>{stage.instruction}</p> : null}
              </div>
              {readingEligible ? (
                <div className="presenter-reading-mode-controls">
                  <button type="button" onClick={startReadingMode}>
                    {readingModeActive ? "Restart reading mode" : "Start reading mode"}
                  </button>
                  {readingModeActive && readingPhase === "silent" ? (
                    <button type="button" className="is-secondary" onClick={shareReadingNow}>Share reading</button>
                  ) : null}
                  {readingModeActive ? (
                    <button type="button" className="is-secondary" onClick={stopReadingMode}>End reading mode</button>
                  ) : null}
                  <span>
                    Use the Activity timer for silent reading, then share the text when you are ready.
                  </span>
                </div>
              ) : null}

              {readingModeActive && readingPhase === "share" ? (
                activeReadingAssignment ? (
                  <article className="presenter-reading-current">
                    <div className="presenter-reading-current-roles">
                      <span><b>Reader</b> {activeReadingAssignment.reader?.name}</span>
                      {activeReadingAssignment.listener ? (
                        <span><b>Listener check</b> {activeReadingAssignment.listener.name}</span>
                      ) : null}
                    </div>
                    <strong>{activeReadingAssignment.chunk?.label}</strong>
                    <p>{activeReadingAssignment.chunk?.text}</p>
                    {activeReadingAssignment.listener ? (
                      <aside>
                        <b>After the reader:</b> {activeReadingAssignment.listenerQuestion}
                      </aside>
                    ) : null}
                    <details>
                      <summary>Show full text</summary>
                      <p className="presenter-knowledge-numbered-text is-compact">
                        {numberedKnowledgeSentences.map(({ number, text }) => (
                          <span
                            key={`${number}-${text}`}
                            className={`presenter-knowledge-inline-sentence${activeKnowledgeSentence === number ? " is-active" : ""}`}
                      >
                            <button
                              type="button"
                              className="presenter-knowledge-inline-number"
                              aria-pressed={activeKnowledgeSentence === number}
                              aria-label={`Highlight sentence ${number}`}
                              onClick={() => selectKnowledgeSentence(number)}
                            >
                              {number}.
                            </button>{" "}{text}
                      </span>
                        ))}
                      </p>
                    </details>
                  </article>
                ) : (
                  <article className="presenter-knowledge-text"><p>Preparing fair reading assignments…</p></article>
                )
              ) : (
                <article className="presenter-knowledge-text">
                  <p className="presenter-knowledge-numbered-text" aria-label="Numbered Wissensimpuls sentences">
                    {numberedKnowledgeSentences.map(({ number, text }) => (
                      <span
                        key={`${number}-${text}`}
                        className={`presenter-knowledge-inline-sentence${activeKnowledgeSentence === number ? " is-active" : ""}`}
                      >
                        <button
                          type="button"
                          className="presenter-knowledge-inline-number"
                          aria-pressed={activeKnowledgeSentence === number}
                          aria-label={`Highlight sentence ${number}`}
                          onClick={() => selectKnowledgeSentence(number)}
                        >
                          {number}.
                        </button>{" "}{text}
                      </span>
                    ))}
                  </p>
                </article>
              )}
              {!knowledgeChecksVisible ? (
                <button
                  type="button"
                  className="presenter-knowledge-checks-reveal"
                  onClick={() => setKnowledgeChecksVisible(true)}
                >
                  Kurz prüfen anzeigen
                </button>
              ) : (
              <div className="presenter-knowledge-checks">
                <strong>Kurz prüfen · mündlich</strong>
                <ol>
                  {presenterItems.map((item, index) => {
                    const questionIndexValue = presenterItemOffset + index;
                    const answer = stage.answerItems?.[questionIndexValue] || "";
                    const answerOpen = Boolean(knowledgeAnswersOpen[questionIndexValue]);
                    return (
                      <li key={item} className="presenter-knowledge-check">
                        <div className="presenter-knowledge-question-row">
                          <span>{item}</span>
                          {answer ? (
                            <button
                              type="button"
                              onClick={() => toggleKnowledgeAnswer(questionIndexValue)}
                              aria-expanded={answerOpen}
                            >
                              {answerOpen ? "Lehrerantwort ausblenden" : "Lehrerantwort anzeigen"}
                            </button>
                          ) : null}
                        </div>
                        {answerOpen && answer ? (
                          <div className="presenter-knowledge-answer">
                            <strong>Lehrerantwort</strong>
                            <span>{answer}</span>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </div>
              )}
            </section>
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
              {!vocabChallengeMode ? (
                <>
                  <div className="presenter-vocabulary-heading">
                    <h1>{stage.title}</h1>
                    <p>Wörter zuerst sehen, dann direkt im Satz erkennen.</p>
                  </div>
                  <div className="presenter-vocabulary-grid">
                    {presenterItems.map((item, index) => (
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
                  {vocabChallenges.length ? (
                    <button
                      type="button"
                      className="presenter-vocabulary-challenge-start"
                      onClick={() => {
                        setVocabChallengeMode(true);
                        setVocabChallengeIndex(0);
                        setShowVocabAnswer(false);
                      }}
                    >
                      Welches Wort passt? starten
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="presenter-vocabulary-challenge">
                  <div className="presenter-vocabulary-challenge-heading">
                    <span>{presenterLevel === "C2"
                      ? "Präzisions- & Registercheck"
                      : (["A2", "B1"].includes(presenterLevel) ? "Redemittel-Check" : "Wortschatz-Check")} · {vocabChallengeIndex + 1}/{vocabChallenges.length}</span>
                    <h1>{presenterLevel === "A2"
                      ? "Welche Formulierung passt?"
                      : (presenterLevel === "B1"
                        ? "Welche Formulierung passt zur Funktion?"
                        : (presenterLevel === "C2" ? "Welche Kollokation ist hier am präzisesten?" : "Welches Wort passt?"))}</h1>
                    <p>{presenterLevel === "A2"
                      ? "Lies die Situation. Der Schüler wählt die passende Formulierung und ergänzt sie danach mündlich."
                      : (presenterLevel === "B1"
                        ? "Lies die kommunikative Funktion. Der Schüler wählt das passende Redemittel, begründet die Wahl und bildet danach einen eigenen Satz."
                        : (presenterLevel === "C2"
                          ? "Lies den Satz mit der Lücke. Der Student wählt die präziseste Kollokation und begründet kurz, warum sie in diesem Register passt."
                          : "Wählt den Ausdruck, der am besten zum Beispiel oder in die Lücke passt."))}</p>
                  </div>
                  {activeVocabChallenge ? (
                    <article className="presenter-vocabulary-cloze-card">
                      {activeVocabChallenge.promptLabel ? (
                        <strong className="presenter-vocabulary-prompt-label">{activeVocabChallenge.promptLabel}</strong>
                      ) : null}
                      <p className="presenter-vocabulary-cloze-sentence">{activeVocabChallenge.sentence}</p>
                      <div className="presenter-vocabulary-options" role="list" aria-label="Drei Wortschatzoptionen">
                        {(activeVocabChallenge.options || []).map((option, optionIndex) => (
                          <span key={option} role="listitem">
                            {["A2", "B1"].includes(presenterLevel) ? `${String.fromCharCode(65 + optionIndex)}. ${option}` : option}
                          </span>
                        ))}
                      </div>
                      {showVocabAnswer ? (
                        <div className="presenter-vocabulary-answer">
                          <strong>Passende Formulierung</strong>
                          <span>{activeVocabChallenge.answer}</span>
                          {activeVocabChallenge.followUp ? <p>{activeVocabChallenge.followUp}</p> : null}
                          {activeVocabChallenge.modelExample ? (
                            <small>Beispiel danach: {activeVocabChallenge.modelExample}</small>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  ) : null}
                  <div className="presenter-vocabulary-challenge-actions">
                    <button
                      type="button"
                      onClick={() => setVocabChallengeMode(false)}
                    >
                      Wortliste
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVocabAnswer((current) => !current)}
                    >
                      {showVocabAnswer ? "Antwort ausblenden" : "Antwort anzeigen"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVocabChallengeIndex((current) => Math.max(0, current - 1));
                        setShowVocabAnswer(false);
                      }}
                      disabled={vocabChallengeIndex === 0}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVocabChallengeIndex((current) => Math.min(vocabChallenges.length - 1, current + 1));
                        setShowVocabAnswer(false);
                      }}
                      disabled={vocabChallengeIndex >= vocabChallenges.length - 1}
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : stage.type === "question-reveal" ? (
            <section className="presenter-question-reveal">
              <div className="presenter-question-counter">
                {advancedClassroom ? "Frage" : "Question"} {questionIndex + 1} {advancedClassroom ? "von" : "of"} {stage.items.length}
                {activeQuestionLevel ? <span className="presenter-question-level">{activeQuestionLevel}</span> : null}
              </div>
              <h1>{stage.title}</h1>
              {stage.instruction ? <p className="presenter-question-instruction">{stage.instruction}</p> : null}
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
          ) : stage.type === "correction-list" ? (
            <section className="presenter-corrections">
              <div className="presenter-corrections-heading">
                <span>{stage.kicker}</span>
                <h1>{stage.title}</h1>
              </div>
              <div className="presenter-corrections-grid">
                {presenterItems.map((item, index) => (
                  <article key={item.id || index} className="presenter-correction-card">
                    <div className="presenter-correction-line is-wrong">
                      <strong>Wrong</strong>
                      <p>{item.wrong}</p>
                    </div>
                    <div className="presenter-correction-line is-correct">
                      <strong>Correct</strong>
                      <p>{item.correct}</p>
                    </div>
                    <div className="presenter-correction-line is-why">
                      <strong>Why</strong>
                      <p>{item.why}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : stage.type === "c2-analysis" ? (
            <section className={`presenter-c2-analysis${stage.examMode ? " is-exam-mode" : ""}`}>
              <div className="presenter-c2-analysis-heading">
                <span>{stage.kicker}</span>
                <h1>{stage.title}</h1>
                {stage.instruction ? <p>{stage.instruction}</p> : null}
              </div>
              <div className="presenter-c2-analysis-steps">
                <article className="presenter-c2-analysis-step is-case">
                  <span>FALL</span>
                  <p>{String(stage.casePrompt || "").replace(/^Fall:\s*/i, "")}</p>
                </article>
                {c2AnalysisStep >= 1 ? (
                  <article className="presenter-c2-analysis-step is-check">
                    <span>PRÜFE</span>
                    <p>{stage.checkPrompt}</p>
                  </article>
                ) : null}
                {c2AnalysisStep >= 2 ? (
                  <article className="presenter-c2-analysis-step is-decide">
                    <span>ENTSCHEIDE</span>
                    <p>{stage.decisionPrompt}</p>
                  </article>
                ) : null}
              </div>
              {c2AnalysisStep < 2 ? (
                <button
                  type="button"
                  className="presenter-c2-analysis-next"
                  onClick={() => setC2AnalysisStep((current) => Math.min(2, current + 1))}
                >
                  {c2AnalysisStep === 0 ? "Prüfkriterien zeigen →" : "Entscheidung zeigen →"}
                </button>
              ) : (
                <div className="presenter-c2-rubric" aria-label="C2 response rubric">
                  <strong>Kurzfeedback</strong>
                  <div>
                    {(stage.rubric || ["Logik", "Evidenz", "Sprache / Register"]).map((label) => (
                      <label key={label}>
                        <input
                          type="checkbox"
                          checked={Boolean(c2RubricChecks[label])}
                          onChange={() => setC2RubricChecks((current) => ({ ...current, [label]: !current[label] }))}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ) : stage.type === "flow" ? (
            <>
              <div className="presenter-practice-heading">
                <div>
                  <h1>{stage.title}</h1>
                  {stage.weekFamily ? <p>{`Week ${stage.weekNumber} · ${stage.weekFamily}`}</p> : null}
                </div>
                {stage.variantLabel ? <span className={`presenter-practice-variant-badge is-${stage.variant || "standard"}`}>{stage.variantLabel}</span> : null}
              </div>
              <div className={`presenter-flow-grid ${stage.variant ? `is-${stage.variant}` : ""}`}>
                {presenterItems.map((item, itemIndex) => (
                  <article key={`${item.title}-${item.detail || item.instruction || itemIndex}`} className={`presenter-flow-card ${stage.variant ? `is-${stage.variant}` : ""}`}>
                    <div className="presenter-flow-card-main">
                      <strong>{item.title}</strong>
                      {item.instruction ? <p className="presenter-practice-instruction">{item.instruction}</p> : <p>{item.detail}</p>}
                      {Array.isArray(item.jumbles) && item.jumbles.length ? (
                        <div className="presenter-jumble-list">
                          {item.jumbles.map((jumble, jumbleIndex) => (
                            <article className="presenter-jumble-card" key={jumble.id || jumbleIndex}>
                              <span className="presenter-jumble-label">Satz {jumbleIndex + 1} · ordne die Wörter</span>
                              <div className="presenter-jumble-words">
                                {jumble.words.map((word, wordIndex) => (
                                  <span key={`${word}-${wordIndex}`}>{word}</span>
                                ))}
                              </div>
                              <details className="presenter-practice-details">
                                <summary>Lösung anzeigen</summary>
                                <p>{jumble.answer}</p>
                              </details>
                            </article>
                          ))}
                        </div>
                      ) : null}
                      {Array.isArray(item.roleCards) && item.roleCards.length ? (
                        <div className="presenter-role-gap">
                          <div className="presenter-role-gap-actions" role="group" aria-label="Private role cards">
                            {item.roleCards.map((card) => (
                              <button
                                key={card.id}
                                type="button"
                                className={revealedFlowRole === card.id ? "is-active" : ""}
                                onClick={() => setRevealedFlowRole((current) => current === card.id ? "" : card.id)}
                              >
                                {revealedFlowRole === card.id ? `Hide Role ${card.id}` : `Show Role ${card.id}`}
                              </button>
                            ))}
                          </div>
                          <div className="presenter-role-gap-teacher-flow">
                            <strong>Teacher flow</strong>
                            <ol>
                              <li>Choose two students: Partner A and Partner B.</li>
                              <li>Show Role A only. Partner B looks away. Then hide it.</li>
                              <li>Show Role B only. Partner A looks away. Then hide it.</li>
                              <li>Close both cards. The partners ask each other for the missing information and complete the shared task from memory.</li>
                              <li>Listen for the language targets listed below; do not let either student read the other role card.</li>
                            </ol>
                          </div>
                          {item.roleCards.map((card) => (
                            revealedFlowRole === card.id ? (
                              <article className="presenter-role-gap-card" key={card.id}>
                                <span>Private card</span>
                                <strong>{card.title}</strong>
                                <p>{card.content}</p>
                                {card.task ? <p className="presenter-role-gap-task">{card.task}</p> : null}
                              </article>
                            ) : null
                          ))}
                        </div>
                      ) : null}
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
          ) : stage.type === "summary" ? (
            <section className={`presenter-lesson-summary${presenterLevel === "C2" ? " is-c2" : ""}`}>
              <div className="presenter-lesson-summary-heading">
                <span>{stage.kicker}</span>
                <h1>{stage.title}</h1>
                {stage.subtitle ? <p>{stage.subtitle}</p> : null}
              </div>
              <div className="presenter-lesson-summary-grid">
                {stage.items.map((item) => (
                  <article key={item.label}>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
              {Array.isArray(stage.nextSteps) && stage.nextSteps.length ? (
                <div className="presenter-lesson-summary-next">
                  <strong>{presenterLevel === "C2" ? "Weiter in Falowen" : "Continue in Falowen"}</strong>
                  <div>
                    {stage.nextSteps.map((item) => (
                      item.url
                        ? <a key={item.label} href={lessonUrl(item.url)} target="_blank" rel="noreferrer">{presenterLevel === "C2" ? c2NextStepLabel(item.label) : item.label}</a>
                        : <span key={item.label}>{presenterLevel === "C2" ? c2NextStepLabel(item.label) : item.label}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
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
                {presenterItems.map((item) => (
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
                  {stage.timingLabel ? <p className="presenter-duration">{warmupPerStudent ? `${visibleWarmupQuestionCount} warm-up question${visibleWarmupQuestionCount === 1 ? "" : "s"} · choose 7, 5 or 2 min on the Activity timer` : stage.timingLabel}</p> : null}
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
                        <span className="presenter-warmup-coverage" aria-live="polite">
                          Covered {visibleWarmupAnsweredCount}/{visibleWarmupQuestionCount}
                          {visibleWarmupMissedCount > 0 ? ` · ${visibleWarmupMissedCount} still to answer` : " · all covered"}
                        </span>
                      </div>
                      {largeClassWarmup ? (
                        <div className="presenter-warmup-warning">
                          <strong>{rosterCount} students in this class</strong>
                          <span>Use fewer questions if needed and choose 7, 5 or 2 minutes on the Activity timer to control the pace.</span>
                          {warmupQuestionCount !== 2 ? (
                            <button type="button" onClick={applyCompactWarmup}>Use 2 questions</button>
                          ) : (
                            <button type="button" onClick={restoreStandardWarmup}>Restore 4 questions</button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {enhancedWarmup ? (
                    <>
                    <ol className="presenter-warmup-question-list">
                      {(visibleStageItems || []).map((item, itemIndex) => {
                        const support = stage.questionSupport?.[itemIndex] || null;
                        const hasSupport = warmupHasSupport && Boolean(support);
                        const hintOpen = hasSupport && Boolean(warmupSupportOpen[itemIndex + ":hint"]);
                        const starterOpen = hasSupport && Boolean(warmupSupportOpen[itemIndex + ":starter"]);
                        const followUpOpen = hasSupport && Boolean(warmupSupportOpen[itemIndex + ":followup"]);
                        const difficultyClass = hasSupport ? String(support.difficulty || "Extend").toLowerCase() : "";

                        return (
                          <li key={item} className={`presenter-warmup-question-card ${warmupAnswered[itemIndex] ? "is-answered" : ""}`}>
                            <div className="presenter-warmup-question-heading">
                              {hasSupport ? (
                                <span className={"presenter-warmup-difficulty is-" + difficultyClass}>{support.difficulty || "Extend"}</span>
                              ) : null}
                              <p>{hasSupport ? renderWarmupQuestion(item, support.keywords) : item}</p>
                              <label className="presenter-warmup-answer-check">
                                <input
                                  type="checkbox"
                                  checked={Boolean(warmupAnswered[itemIndex])}
                                  onChange={() => toggleWarmupAnswered(itemIndex)}
                                  aria-label={`Mark warm-up question ${itemIndex + 1} as answered`}
                                />
                                <span>{warmupAnswered[itemIndex] ? "Answered" : "Tick when answered"}</span>
                              </label>
                            </div>
                            {hasSupport ? (
                              <>
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
                              </>
                            ) : null}
                          </li>
                        );
                      })}
                    </ol>
                    {warmupPerStudent && a2B1ActivityTimer ? (
                      <section
                        className={`presenter-warmup-coaching-card ${timerRunning ? "is-running" : ""} ${timerExpired ? "is-expired" : ""}`}
                        aria-live="polite"
                        aria-label="Warm-up coaching prompt"
                      >
                        <span>{timerExpired ? "Time" : warmupCoachingPrompt.label}</span>
                        <strong>{timerExpired ? "Finish the answer you are giving." : warmupCoachingPrompt.text}</strong>
                        <small>{timerRunning ? "This prompt changes automatically while the Activity timer runs." : "Start the Activity timer to rotate speaking prompts."}</small>
                      </section>
                    ) : null}
                    </>
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
            {stage.type === "c2-analysis" && c2AnalysisStep < 2
              ? (c2AnalysisStep === 0 ? "Prüfen →" : "Entscheiden →")
              : stage.type === "question-reveal" && questionIndex < stage.items.length - 1
                ? (advancedClassroom ? "Nächste Frage →" : "Next question →")
                : "Next →"}
          </button>
        </footer>
      </div>
    </div>
  );
}
