import fs from "node:fs";

const pickerTarget = new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url);
let source = fs.readFileSync(pickerTarget, "utf8");

function replaceRequired(before, after, label) {
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`Presenter speaking feedback patch anchor changed: ${label}`);
  source = source.replace(before, after);
}

const rubricDefinitionAnchor = [
  'function responseTimeStorageKey(course = "") {',
  '  const level = normalize(course).toUpperCase() || "DEFAULT";',
  '  return `${RESPONSE_TIME_KEY}:${level}`;',
  '}',
].join("\n");

const rubricDefinitionReplacement = [
  rubricDefinitionAnchor,
  "",
  "const SPEAKING_RUBRIC_ITEMS = [",
  '  { key: "language", label: "Language clear" },',
  '  { key: "grammar", label: "Grammar controlled" },',
  '  { key: "task", label: "Task completed" },',
  "];",
  "",
  "function emptySpeakingRubric() {",
  '  return { language: false, grammar: false, task: false };',
  "}",
].join("\n");
replaceRequired(rubricDefinitionAnchor, rubricDefinitionReplacement, "rubric definitions");

const stateAnchor = "  const [responseTimedOut, setResponseTimedOut] = useState(false);";
const stateReplacement = [
  stateAnchor,
  '  const [speakingPhase, setSpeakingPhase] = useState("idle");',
  "  const [speakingRubric, setSpeakingRubric] = useState(() => emptySpeakingRubric());",
  '  const [speakingFeedbackReason, setSpeakingFeedbackReason] = useState("");',
].join("\n");
replaceRequired(stateAnchor, stateReplacement, "speaking flow state");

const courseAnchor = '  const course = normalize(slide?.course).toUpperCase();';
const courseReplacement = [
  courseAnchor,
  '  const structuredSpeakingFlow = course === "A2" || course === "B1";',
].join("\n");
replaceRequired(courseAnchor, courseReplacement, "A2/B1 speaking flow gate");

const timeoutAnchor = [
  "        playResponseTimeoutBeep();",
  "        setResponseDeadline(0);",
  "        setResponseTimedOut(true);",
  "        return false;",
].join("\n");
const timeoutReplacement = [
  "        playResponseTimeoutBeep();",
  "        setResponseDeadline(0);",
  "        setResponseTimedOut(true);",
  "        if (structuredSpeakingFlow) {",
  '          setSpeakingPhase("feedback");',
  '          setSpeakingFeedbackReason("time");',
  "        }",
  "        return false;",
].join("\n");
replaceRequired(timeoutAnchor, timeoutReplacement, "automatic feedback transition on timeout");

replaceRequired(
  "  }, [responseDeadline, lastMarked, responseTimerEnabled]);",
  "  }, [responseDeadline, lastMarked, responseTimerEnabled, structuredSpeakingFlow]);",
  "response deadline dependencies",
);

const clearCurrentAnchor = [
  "    if (!currentKey) {",
  "      setResponseRemaining(0);",
  "      setResponseDeadline(0);",
  "      setResponseTimedOut(false);",
  "    }",
].join("\n");
const clearCurrentReplacement = [
  "    if (!currentKey) {",
  "      setResponseRemaining(0);",
  "      setResponseDeadline(0);",
  "      setResponseTimedOut(false);",
  '      setSpeakingPhase("idle");',
  '      setSpeakingFeedbackReason("");',
  "      setSpeakingRubric(emptySpeakingRubric());",
  "    }",
].join("\n");
replaceRequired(clearCurrentAnchor, clearCurrentReplacement, "clear speaking state without student");

const disableTimerAnchor = [
  "    setResponseRemaining(0);",
  "    setResponseDeadline(0);",
  "    setResponseTimedOut(false);",
  "  }, [responseTimerEnabled]);",
].join("\n");
const disableTimerReplacement = [
  "    setResponseRemaining(0);",
  "    setResponseDeadline(0);",
  "    setResponseTimedOut(false);",
  '    setSpeakingPhase("idle");',
  '    setSpeakingFeedbackReason("");',
  "    setSpeakingRubric(emptySpeakingRubric());",
  "  }, [responseTimerEnabled]);",
].join("\n");
replaceRequired(disableTimerAnchor, disableTimerReplacement, "disable structured speaking flow with timer");

const courseResetAnchor = [
  "    setResponseRemaining(0);",
  "    setResponseDeadline(0);",
  "    setResponseTimedOut(false);",
  "    responseTimeoutBeepedRef.current = false;",
  "  }, [slide?.course]);",
].join("\n");
const courseResetReplacement = [
  "    setResponseRemaining(0);",
  "    setResponseDeadline(0);",
  "    setResponseTimedOut(false);",
  "    responseTimeoutBeepedRef.current = false;",
  '    setSpeakingPhase("idle");',
  '    setSpeakingFeedbackReason("");',
  "    setSpeakingRubric(emptySpeakingRubric());",
  "  }, [slide?.course]);",
].join("\n");
replaceRequired(courseResetAnchor, courseResetReplacement, "course speaking state reset");

const interactionAnchor = "  const interactionLocked = loadingStudents || syncState === \"restoring\" || hydratedIdentity !== sessionIdentity;";
const interactionReplacement = [
  interactionAnchor,
  "  const speakingRubricCount = SPEAKING_RUBRIC_ITEMS.filter((item) => Boolean(speakingRubric[item.key])).length;",
  "  const speakingFeedbackPrompt = !speakingRubric.task",
  '    ? "Ask for the missing task point before moving on."',
  "    : !speakingRubric.grammar",
  '      ? "Give one focused grammar correction."',
  "      : !speakingRubric.language",
  '        ? "Give one clearer or more natural reformulation."',
  '        : "All three observed — reinforce one strong phrase before the next student.";',
].join("\n");
replaceRequired(interactionAnchor, interactionReplacement, "rubric feedback summary");

const startFunctionAnchor = "  function startResponseTimer(seconds = responseSeconds) {";
const speakingFunctions = [
  "  function toggleSpeakingRubric(key) {",
  "    if (!structuredSpeakingFlow || !SPEAKING_RUBRIC_ITEMS.some((item) => item.key === key)) return;",
  "    setSpeakingRubric((current) => ({ ...current, [key]: !current[key] }));",
  "  }",
  "",
  '  function finishSpeakingTurn(reason = "manual") {',
  "    if (!structuredSpeakingFlow || !current || lastMarked) return;",
  "    stopResponseTimer();",
  '    setSpeakingPhase("feedback");',
  "    setSpeakingFeedbackReason(reason);",
  "  }",
  "",
  "  function continueSpeaking(seconds = 15) {",
  "    if (!structuredSpeakingFlow || !current || lastMarked) return;",
  '    setSpeakingPhase("speaking");',
  '    setSpeakingFeedbackReason("");',
  "    responseTimeoutBeepedRef.current = false;",
  "    extendResponseTimer(seconds);",
  "  }",
  "",
  startFunctionAnchor,
].join("\n");
replaceRequired(startFunctionAnchor, speakingFunctions, "structured speaking controls");

const startBodyAnchor = [
  "    ensureResponseAudioContext();",
  "    responseTimeoutBeepedRef.current = false;",
  "    const safeSeconds = Math.max(1, Number(seconds || defaultResponseSecondsForCourse(slide?.course)));",
].join("\n");
const startBodyReplacement = [
  "    ensureResponseAudioContext();",
  "    responseTimeoutBeepedRef.current = false;",
  "    if (structuredSpeakingFlow) {",
  '      setSpeakingPhase("speaking");',
  '      setSpeakingFeedbackReason("");',
  "      setSpeakingRubric(emptySpeakingRubric());",
  "    }",
  "    const safeSeconds = Math.max(1, Number(seconds || defaultResponseSecondsForCourse(slide?.course)));",
].join("\n");
replaceRequired(startBodyAnchor, startBodyReplacement, "start speaking observation phase");

const markAnchor = [
  "    setLastMarked(status);",
  "    setDirtyVersion((version) => version + 1);",
].join("\n");
const markReplacement = [
  "    setLastMarked(status);",
  "    if (structuredSpeakingFlow) {",
  '      setSpeakingPhase("done");',
  '      setSpeakingFeedbackReason("");',
  "    }",
  "    setDirtyVersion((version) => version + 1);",
].join("\n");
replaceRequired(markAnchor, markReplacement, "finish speaking flow after recorded feedback");

const resetAnchor = [
  "    setResponseRemaining(0);",
  "    setResponseDeadline(0);",
  "    setResponseTimedOut(false);",
  '    setCurrentKey("");',
].join("\n");
const resetReplacement = [
  "    setResponseRemaining(0);",
  "    setResponseDeadline(0);",
  "    setResponseTimedOut(false);",
  '    setSpeakingPhase("idle");',
  '    setSpeakingFeedbackReason("");',
  "    setSpeakingRubric(emptySpeakingRubric());",
  '    setCurrentKey("");',
].join("\n");
replaceRequired(resetAnchor, resetReplacement, "lesson participation reset");

replaceRequired(
  "        {current && responseTimerEnabled ? (",
  '        {current && responseTimerEnabled && (!structuredSpeakingFlow || speakingPhase === "speaking") ? (',
  "hide countdown during feedback phase",
);

const actionsAnchor = [
  "        {current ? (",
  '          <div className="presenter-student-actions" role="group" aria-label="Record student response">',
].join("\n");

const speakingPanel = [
  "        {current && structuredSpeakingFlow && responseTimerEnabled ? (",
  '          <section className={`presenter-speaking-flow is-${speakingPhase}`} aria-label="Speaking observation and feedback">',
  '            <div className="presenter-speaking-flow-heading">',
  '              <span>{speakingPhase === "speaking" ? "Speaking now" : speakingPhase === "feedback" ? "Teacher feedback" : speakingPhase === "done" ? "Feedback recorded" : "Speaking"}</span>',
  '              <strong>{speakingPhase === "feedback" && speakingFeedbackReason === "time" ? "Time is up" : current.name}</strong>',
  "            </div>",
  '            {(speakingPhase === "speaking" || speakingPhase === "feedback") ? (',
  '              <div className="presenter-speaking-rubric" role="group" aria-label="Live speaking observations">',
  "                {SPEAKING_RUBRIC_ITEMS.map((item) => (",
  "                  <button",
  "                    key={item.key}",
  '                    type="button"',
  '                    className={speakingRubric[item.key] ? "is-observed" : ""}',
  "                    aria-pressed={Boolean(speakingRubric[item.key])}",
  "                    onClick={() => toggleSpeakingRubric(item.key)}",
  "                  >",
  '                    <span>{speakingRubric[item.key] ? "✓" : "○"}</span>',
  "                    {item.label}",
  "                  </button>",
  "                ))}",
  "              </div>",
  "            ) : null}",
  '            {speakingPhase === "speaking" ? (',
  '              <div className="presenter-speaking-flow-actions">',
  '                <small>Observe without interrupting. Tick what the student demonstrates.</small>',
  '                <button type="button" className="presenter-finish-speaking" onClick={() => finishSpeakingTurn("manual")}>Finish speaking → feedback</button>',
  "              </div>",
  '            ) : speakingPhase === "feedback" ? (',
  '              <div className="presenter-speaking-feedback">',
  "                <div>",
  "                  <strong>{speakingRubricCount}/3 observed</strong>",
  "                  <span>{speakingFeedbackPrompt}</span>",
  "                </div>",
  '                <div className="presenter-speaking-flow-actions">',
  '                  {speakingFeedbackReason === "time" ? <button type="button" onClick={() => continueSpeaking(15)}>Give +15s</button> : null}',
  "                  <small>Then record Correct or Needs help below.</small>",
  "                </div>",
  "              </div>",
  '            ) : speakingPhase === "done" ? (',
  '              <p className="presenter-speaking-done">Feedback recorded. Move to the next student when ready.</p>',
  "            ) : null}",
  "          </section>",
  "        ) : null}",
  "",
  "        {current ? (",
  '          <div className="presenter-student-actions" role="group" aria-label="Record student response">',
].join("\n");
replaceRequired(actionsAnchor, speakingPanel, "speaking feedback UI");

replaceRequired(
  '<button type="button" className="is-correct" onClick={() => markCurrent("correct")} disabled={interactionLocked || Boolean(lastMarked) || (hasQuestionMode && !currentQuestion)}>Correct</button>',
  '<button type="button" className="is-correct" onClick={() => markCurrent("correct")} disabled={interactionLocked || Boolean(lastMarked) || (hasQuestionMode && !currentQuestion) || (structuredSpeakingFlow && speakingPhase === "speaking")}>Correct</button>',
  "hold Correct until feedback phase",
);
replaceRequired(
  '<button type="button" className="is-help" onClick={() => markCurrent("needsHelp")} disabled={interactionLocked || Boolean(lastMarked) || (hasQuestionMode && !currentQuestion)}>Needs help</button>',
  '<button type="button" className="is-help" onClick={() => markCurrent("needsHelp")} disabled={interactionLocked || Boolean(lastMarked) || (hasQuestionMode && !currentQuestion) || (structuredSpeakingFlow && speakingPhase === "speaking")}>Needs help</button>',
  "hold Needs help until feedback phase",
);

fs.writeFileSync(pickerTarget, source, "utf8");

const cssTarget = new URL("../src/components/PresenterStudentPicker.css", import.meta.url);
let css = fs.readFileSync(cssTarget, "utf8");
const cssMarker = "/* presenter-structured-speaking-feedback */";
if (!css.includes(cssMarker)) {
  css += `
${cssMarker}
.presenter-speaking-flow {
  flex: 1 0 100%;
  display: grid;
  gap: 0.65rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
}

.presenter-speaking-flow.is-speaking {
  border-color: #93c5fd;
  background: #eff6ff;
}

.presenter-speaking-flow.is-feedback {
  border-color: #fbbf24;
  background: #fffbeb;
}

.presenter-speaking-flow.is-done {
  border-color: #86efac;
  background: #f0fdf4;
}

.presenter-speaking-flow-heading,
.presenter-speaking-feedback > div:first-child {
  display: flex;
  gap: 0.45rem 0.75rem;
  align-items: baseline;
  flex-wrap: wrap;
}

.presenter-speaking-flow-heading span {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #475569;
}

.presenter-speaking-flow-heading strong {
  font-size: 1rem;
  color: #0f172a;
}

.presenter-speaking-rubric {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.presenter-speaking-rubric button {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  min-height: 36px;
  padding: 0.42rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #fff;
  color: #334155;
  font-weight: 750;
  cursor: pointer;
}

.presenter-speaking-rubric button.is-observed {
  border-color: #16a34a;
  background: #dcfce7;
  color: #166534;
}

.presenter-speaking-flow-actions {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.presenter-speaking-flow-actions small,
.presenter-speaking-feedback span,
.presenter-speaking-done {
  color: #475569;
}

.presenter-speaking-flow-actions button,
.presenter-finish-speaking {
  min-height: 34px;
  padding: 0.4rem 0.7rem;
  border: 1px solid #94a3b8;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font-weight: 800;
  cursor: pointer;
}

.presenter-finish-speaking {
  border-color: #1d4ed8 !important;
  background: #1d4ed8 !important;
  color: #fff !important;
}

.presenter-speaking-feedback {
  display: grid;
  gap: 0.55rem;
}

.presenter-speaking-feedback > div:first-child strong {
  color: #92400e;
}

.presenter-speaking-done {
  margin: 0;
  font-weight: 750;
}

@media (max-width: 700px) {
  .presenter-speaking-rubric button {
    flex: 1 1 calc(50% - 0.45rem);
    justify-content: center;
  }

  .presenter-speaking-flow-actions {
    align-items: stretch;
  }

  .presenter-speaking-flow-actions button,
  .presenter-finish-speaking {
    width: 100%;
  }
}
`;
}

fs.writeFileSync(cssTarget, css, "utf8");

console.log("A2/B1 presenter now uses Speak → Feedback → Next student with a live three-point teacher rubric.");
