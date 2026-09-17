import fs from "node:fs";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`${label} anchor changed; update patchPresenterSessionAndResponseTimers.mjs`);
  return source.replace(before, after);
}

const teachingTarget = new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url);
let teachingSource = fs.readFileSync(teachingTarget, "utf8");
teachingSource = replaceOnce(
  teachingSource,
  'import "./TeachingSlidePresenter.css";',
  'import PresenterSessionTimer from "./PresenterSessionTimer.jsx";\nimport "./TeachingSlidePresenter.css";',
  "TeachingSlidePresenter session timer import",
);
teachingSource = replaceOnce(
  teachingSource,
  '          {presenterV2 ? (',
  '          <PresenterSessionTimer slide={slide} />\n\n          {presenterV2 ? (',
  "TeachingSlidePresenter session timer placement",
);
fs.writeFileSync(teachingTarget, teachingSource);

const a1Target = new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url);
let a1Source = fs.readFileSync(a1Target, "utf8");
a1Source = replaceOnce(
  a1Source,
  'import PresenterStudentPicker from "./PresenterStudentPicker.jsx";\nimport "./TeachingSlidePresenter.css";',
  'import PresenterStudentPicker from "./PresenterStudentPicker.jsx";\nimport PresenterSessionTimer from "./PresenterSessionTimer.jsx";\nimport "./TeachingSlidePresenter.css";',
  "A1 presenter session timer import",
);
a1Source = replaceOnce(
  a1Source,
  '          <div className="presenter-v2-tools">',
  '          <PresenterSessionTimer slide={slide} />\n\n          <div className="presenter-v2-tools">',
  "A1 presenter session timer placement",
);
fs.writeFileSync(a1Target, a1Source);

const pickerTarget = new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url);
let pickerSource = fs.readFileSync(pickerTarget, "utf8");

pickerSource = replaceOnce(
  pickerSource,
  'const LAST_CLASS_KEY = "falowen:presenter:last-class";',
  [
    'const LAST_CLASS_KEY = "falowen:presenter:last-class";',
    'const RESPONSE_TIME_KEY = "falowen:presenter:response-seconds";',
    'const DEFAULT_RESPONSE_SECONDS = 30;',
    'const RESPONSE_TIME_PRESETS = [15, 30, 45, 60];',
    '',
    'function formatResponseTime(totalSeconds = 0) {',
    '  const safe = Math.max(0, Math.floor(Number(totalSeconds || 0)));',
    '  return `0:${String(safe).padStart(2, "0")}`;',
    '}',
  ].join("\n"),
  "student response timer constants",
);

pickerSource = replaceOnce(
  pickerSource,
  '  const [lastMarked, setLastMarked] = useState("");\n  const [saveState, setSaveState] = useState("idle");',
  [
    '  const [lastMarked, setLastMarked] = useState("");',
    '  const [responseSeconds, setResponseSeconds] = useState(() => {',
    '    const saved = Number(safeStorageGet(RESPONSE_TIME_KEY, String(DEFAULT_RESPONSE_SECONDS)));',
    '    return RESPONSE_TIME_PRESETS.includes(saved) ? saved : DEFAULT_RESPONSE_SECONDS;',
    '  });',
    '  const [responseRemaining, setResponseRemaining] = useState(0);',
    '  const [responseDeadline, setResponseDeadline] = useState(0);',
    '  const [responseTimedOut, setResponseTimedOut] = useState(false);',
    '  const [saveState, setSaveState] = useState("idle");',
  ].join("\n"),
  "student response timer state",
);

pickerSource = replaceOnce(
  pickerSource,
  '  useEffect(() => {\n    if (!selectedClassId) return;\n    safeStorageSet(',
  [
    '  useEffect(() => {',
    '    if (!responseDeadline || lastMarked) return undefined;',
    '    const tick = () => {',
    '      const next = Math.max(0, Math.ceil((responseDeadline - Date.now()) / 1000));',
    '      setResponseRemaining(next);',
    '      if (next <= 0) {',
    '        setResponseDeadline(0);',
    '        setResponseTimedOut(true);',
    '      }',
    '    };',
    '    tick();',
    '    const timer = window.setInterval(tick, 250);',
    '    return () => window.clearInterval(timer);',
    '  }, [responseDeadline, lastMarked]);',
    '',
    '  useEffect(() => {',
    '    if (!currentKey) {',
    '      setResponseRemaining(0);',
    '      setResponseDeadline(0);',
    '      setResponseTimedOut(false);',
    '    }',
    '  }, [currentKey]);',
    '',
    '  useEffect(() => {',
    '    if (!selectedClassId) return;',
    '    safeStorageSet(',
  ].join("\n"),
  "student response timer effects",
);

pickerSource = replaceOnce(
  pickerSource,
  '  function pickStudent() {',
  [
    '  function startResponseTimer(seconds = responseSeconds) {',
    '    const safeSeconds = Math.max(1, Number(seconds || DEFAULT_RESPONSE_SECONDS));',
    '    setResponseRemaining(safeSeconds);',
    '    setResponseDeadline(Date.now() + safeSeconds * 1000);',
    '    setResponseTimedOut(false);',
    '  }',
    '',
    '  function stopResponseTimer() {',
    '    setResponseDeadline(0);',
    '    setResponseTimedOut(false);',
    '  }',
    '',
    '  function extendResponseTimer(seconds = 15) {',
    '    const added = Math.max(1, Number(seconds || 15));',
    '    const base = Math.max(0, Number(responseRemaining || 0));',
    '    const next = base + added;',
    '    setResponseRemaining(next);',
    '    setResponseDeadline(Date.now() + next * 1000);',
    '    setResponseTimedOut(false);',
    '  }',
    '',
    '  function chooseResponseSeconds(seconds) {',
    '    const next = Number(seconds);',
    '    if (!RESPONSE_TIME_PRESETS.includes(next)) return;',
    '    setResponseSeconds(next);',
    '    safeStorageSet(RESPONSE_TIME_KEY, String(next));',
    '  }',
    '',
    '  function pickStudent() {',
  ].join("\n"),
  "student response timer controls",
);

pickerSource = replaceOnce(
  pickerSource,
  '    publishQuestion(assignedQuestion);\n  }\n\n  function pickNextQuestion()',
  '    publishQuestion(assignedQuestion);\n    startResponseTimer();\n  }\n\n  function pickNextQuestion()',
  "start response timer when student is picked",
);

pickerSource = replaceOnce(
  pickerSource,
  '    publishQuestion(nextQuestion);\n  }\n\n  function markCurrent(status)',
  '    publishQuestion(nextQuestion);\n    startResponseTimer();\n  }\n\n  function markCurrent(status)',
  "restart response timer for next question",
);

pickerSource = replaceOnce(
  pickerSource,
  '    if (hasQuestionMode && !currentQuestion) return;\n    const result = recordedResult(status);',
  '    if (hasQuestionMode && !currentQuestion) return;\n    stopResponseTimer();\n    const result = recordedResult(status);',
  "stop response timer when result is recorded",
);

pickerSource = replaceOnce(
  pickerSource,
  '  function resetLessonParticipation() {\n    roster.forEach((entry) => absenceOverrides.current.set(entry.key, false));',
  [
    '  function resetLessonParticipation() {',
    '    roster.forEach((entry) => absenceOverrides.current.set(entry.key, false));',
    '    setResponseRemaining(0);',
    '    setResponseDeadline(0);',
    '    setResponseTimedOut(false);',
  ].join("\n"),
  "clear response timer on participation reset",
);

const responseTimerUi = [
  '        {current ? (',
  '          <div className={`presenter-response-timer ${responseTimedOut ? "is-expired" : responseRemaining <= 10 && !lastMarked ? "is-warning" : ""}`} aria-live={responseTimedOut ? "assertive" : "polite"}>',
  '            <span>{responseTimedOut ? `Time\'s up — ${current.name}` : lastMarked ? "Response recorded" : "Answer time"}</span>',
  '            <strong>{lastMarked ? "RECORDED" : responseTimedOut ? "TIME UP" : formatResponseTime(responseRemaining)}</strong>',
  '            {responseTimedOut && !lastMarked ? <button type="button" onClick={() => extendResponseTimer(15)}>+15s</button> : null}',
  '          </div>',
  '        ) : null}',
  '',
  '        {current ? (',
  '          <div className="presenter-student-actions" role="group" aria-label="Record student response">',
].join("\n");
pickerSource = replaceOnce(
  pickerSource,
  '        {current ? (\n          <div className="presenter-student-actions" role="group" aria-label="Record student response">',
  responseTimerUi,
  "student response timer display",
);

const settingsAnchor = '            <small>Cloud sync lets you continue the same lesson on another signed-in device. “Absent” only removes a learner from this presenter rotation and never changes official attendance or grades.</small>';
const settingsBlock = [
  settingsAnchor,
  '            <div className="presenter-response-time-settings">',
  '              <strong>Student answer time</strong>',
  '              <div role="group" aria-label="Student answer time presets">',
  '                {RESPONSE_TIME_PRESETS.map((seconds) => (',
  '                  <button',
  '                    key={seconds}',
  '                    type="button"',
  '                    className={responseSeconds === seconds ? "is-selected" : ""}',
  '                    onClick={() => chooseResponseSeconds(seconds)}',
  '                  >',
  '                    {seconds}s',
  '                  </button>',
  '                ))}',
  '              </div>',
  '              <small>Starts automatically when you pick a student or give the same student a new question. Default: 30 seconds.</small>',
  '            </div>',
].join("\n");
pickerSource = replaceOnce(pickerSource, settingsAnchor, settingsBlock, "student response timer settings");
fs.writeFileSync(pickerTarget, pickerSource);

const pickerCssTarget = new URL("../src/components/PresenterStudentPicker.css", import.meta.url);
let pickerCss = fs.readFileSync(pickerCssTarget, "utf8");
if (!pickerCss.includes(".presenter-response-timer")) {
  pickerCss += `

.presenter-response-timer {
  display: grid;
  gap: 2px;
  min-width: 130px;
  padding: 7px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
}

.presenter-response-timer span {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: #475569;
}

.presenter-response-timer strong {
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
}

.presenter-response-timer button {
  justify-self: start;
  margin-top: 3px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  background: #fff;
  padding: 3px 7px;
  cursor: pointer;
}

.presenter-response-timer.is-warning {
  border-color: #f59e0b;
  background: #fffbeb;
}

.presenter-response-timer.is-expired {
  border-color: #dc2626;
  background: #fef2f2;
}

.presenter-response-timer.is-expired strong,
.presenter-response-timer.is-expired span {
  color: #b91c1c;
}

.presenter-response-time-settings {
  display: grid;
  gap: 6px;
  margin: 8px 0;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #f8fafc;
}

.presenter-response-time-settings > div {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.presenter-response-time-settings button.is-selected {
  border-color: #0f172a;
  font-weight: 700;
  background: #e2e8f0;
}
`;
}
fs.writeFileSync(pickerCssTarget, pickerCss);

console.log("Presenter class-session and per-student response timers applied.");
