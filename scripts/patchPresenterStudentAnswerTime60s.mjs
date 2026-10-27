import fs from "node:fs";

const pickerTarget = new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url);
let source = fs.readFileSync(pickerTarget, "utf8");

function replaceRequired(before, after, label) {
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`Student speaking timer patch anchor changed: ${label}`);
  source = source.replace(before, after);
}

const legacyConstants = [
  'const RESPONSE_TIME_KEY = "falowen:presenter:response-seconds";',
  "const DEFAULT_RESPONSE_SECONDS = 30;",
  "const RESPONSE_TIME_PRESETS = [15, 30, 45, 60];",
].join("\n");

const levelAwareConstants = [
  'const RESPONSE_TIME_KEY = "falowen:presenter:response-seconds:v3";',
  "const DEFAULT_RESPONSE_SECONDS = 60;",
  "const RESPONSE_TIME_PRESETS = [60, 120, 180];",
  "",
  'function defaultResponseSecondsForCourse(course = "") {',
  "  const level = normalize(course).toUpperCase();",
  '  if (level === "A2") return 120;',
  '  if (level === "B1") return 180;',
  "  return DEFAULT_RESPONSE_SECONDS;",
  "}",
  "",
  'function responseTimeStorageKey(course = "") {',
  '  const level = normalize(course).toUpperCase() || "DEFAULT";',
  "  return `${RESPONSE_TIME_KEY}:${level}`;",
  "}",
].join("\n");

if (!source.includes(levelAwareConstants)) {
  if (source.includes(legacyConstants)) {
    source = source.replace(legacyConstants, levelAwareConstants);
  } else {
    const oneMinuteConstants = [
      'const RESPONSE_TIME_KEY = "falowen:presenter:response-seconds:v2";',
      "const DEFAULT_RESPONSE_SECONDS = 60;",
      "const RESPONSE_TIME_PRESETS = [15, 30, 45, 60];",
    ].join("\n");
    if (!source.includes(oneMinuteConstants)) {
      throw new Error("Student speaking timer constants anchor changed.");
    }
    source = source.replace(oneMinuteConstants, levelAwareConstants);
  }
}

const legacyState = [
  "  const [responseSeconds, setResponseSeconds] = useState(() => {",
  "    const saved = Number(safeStorageGet(RESPONSE_TIME_KEY, String(DEFAULT_RESPONSE_SECONDS)));",
  "    return RESPONSE_TIME_PRESETS.includes(saved) ? saved : DEFAULT_RESPONSE_SECONDS;",
  "  });",
].join("\n");

const levelAwareState = [
  "  const [responseSeconds, setResponseSeconds] = useState(() => {",
  "    const defaultSeconds = defaultResponseSecondsForCourse(slide?.course);",
  "    const saved = Number(safeStorageGet(responseTimeStorageKey(slide?.course), String(defaultSeconds)));",
  "    return RESPONSE_TIME_PRESETS.includes(saved) ? saved : defaultSeconds;",
  "  });",
].join("\n");

replaceRequired(legacyState, levelAwareState, "course-aware response timer state");

const refsAnchor = "  const absenceOverrides = useRef(new Map());";
const refsReplacement = [
  refsAnchor,
  "  const responseAudioContextRef = useRef(null);",
  "  const responseTimeoutBeepedRef = useRef(false);",
].join("\n");
replaceRequired(refsAnchor, refsReplacement, "response audio refs");

const timeoutAnchor = [
  "      if (next <= 0) {",
  "        setResponseDeadline(0);",
  "        setResponseTimedOut(true);",
  "        return false;",
  "      }",
].join("\n");
const timeoutReplacement = [
  "      if (next <= 0) {",
  "        playResponseTimeoutBeep();",
  "        setResponseDeadline(0);",
  "        setResponseTimedOut(true);",
  "        return false;",
  "      }",
].join("\n");
replaceRequired(timeoutAnchor, timeoutReplacement, "timeout beep");

const disabledEffectAnchor = [
  "  useEffect(() => {",
  "    if (responseTimerEnabled) return;",
  "    setResponseRemaining(0);",
  "    setResponseDeadline(0);",
  "    setResponseTimedOut(false);",
  "  }, [responseTimerEnabled]);",
].join("\n");

const courseEffect = [
  disabledEffectAnchor,
  "",
  "  useEffect(() => {",
  "    const defaultSeconds = defaultResponseSecondsForCourse(slide?.course);",
  "    const saved = Number(safeStorageGet(responseTimeStorageKey(slide?.course), String(defaultSeconds)));",
  "    setResponseSeconds(RESPONSE_TIME_PRESETS.includes(saved) ? saved : defaultSeconds);",
  "    setResponseRemaining(0);",
  "    setResponseDeadline(0);",
  "    setResponseTimedOut(false);",
  "    responseTimeoutBeepedRef.current = false;",
  "  }, [slide?.course]);",
  "",
  "  useEffect(() => () => {",
  "    try {",
  "      responseAudioContextRef.current?.close?.();",
  "    } catch {",
  "      // Nothing to clean up when browser audio is unavailable.",
  "    }",
  "  }, []);",
].join("\n");
replaceRequired(disabledEffectAnchor, courseEffect, "course timer reset and audio cleanup");

const startAnchor = "  function startResponseTimer(seconds = responseSeconds) {";
const audioFunctions = [
  "  function ensureResponseAudioContext() {",
  '    if (typeof window === "undefined") return null;',
  "    const AudioContextClass = window.AudioContext || window.webkitAudioContext;",
  "    if (!AudioContextClass) return null;",
  "    if (!responseAudioContextRef.current) responseAudioContextRef.current = new AudioContextClass();",
  "    const context = responseAudioContextRef.current;",
  '    if (context.state === "suspended") {',
  "      try {",
  "        const resumed = context.resume?.();",
  '        if (resumed && typeof resumed.catch === "function") resumed.catch(() => {});',
  "      } catch {",
  "        // The visible TIME UP state remains available if audio cannot resume.",
  "      }",
  "    }",
  "    return context;",
  "  }",
  "",
  "  function playResponseTimeoutBeep() {",
  "    if (responseTimeoutBeepedRef.current) return;",
  "    responseTimeoutBeepedRef.current = true;",
  "    try {",
  "      const context = ensureResponseAudioContext();",
  "      if (!context) return;",
  "      const oscillator = context.createOscillator();",
  "      const gain = context.createGain();",
  "      const startedAt = context.currentTime;",
  "      const alertDurationSeconds = 5;",
  "      oscillator.type = \"sine\";",
  "      oscillator.frequency.setValueAtTime(880, startedAt);",
  "      gain.gain.setValueAtTime(0.0001, startedAt);",
  "      for (let offset = 0; offset < alertDurationSeconds; offset += 0.75) {",
  "        const pulseStart = startedAt + offset;",
  "        const pulsePeak = Math.min(startedAt + alertDurationSeconds, pulseStart + 0.04);",
  "        const pulseHold = Math.min(startedAt + alertDurationSeconds, pulseStart + 0.34);",
  "        const pulseEnd = Math.min(startedAt + alertDurationSeconds, pulseStart + 0.55);",
  "        gain.gain.setValueAtTime(0.0001, pulseStart);",
  "        gain.gain.exponentialRampToValueAtTime(0.28, pulsePeak);",
  "        gain.gain.setValueAtTime(0.28, pulseHold);",
  "        gain.gain.exponentialRampToValueAtTime(0.0001, pulseEnd);",
  "      }",
  "      oscillator.connect(gain);",
  "      gain.connect(context.destination);",
  "      oscillator.start(startedAt);",
  "      oscillator.stop(startedAt + alertDurationSeconds);",
  "    } catch {",
  "      // Browser audio policy can block sound; the TIME UP state still appears.",
  "    }",
  "  }",
  "",
  startAnchor,
].join("\n");
replaceRequired(startAnchor, audioFunctions, "response beep helpers");

const startBodyAnchor = [
  "    const safeSeconds = Math.max(1, Number(seconds || DEFAULT_RESPONSE_SECONDS));",
  "    setResponseRemaining(safeSeconds);",
].join("\n");
const startBodyReplacement = [
  "    ensureResponseAudioContext();",
  "    responseTimeoutBeepedRef.current = false;",
  "    const safeSeconds = Math.max(1, Number(seconds || defaultResponseSecondsForCourse(slide?.course)));",
  "    setResponseRemaining(safeSeconds);",
].join("\n");
replaceRequired(startBodyAnchor, startBodyReplacement, "response timer start");

const stopAnchor = [
  "  function stopResponseTimer() {",
  "    setResponseDeadline(0);",
  "    setResponseTimedOut(false);",
  "  }",
].join("\n");
const stopReplacement = [
  "  function stopResponseTimer() {",
  "    responseTimeoutBeepedRef.current = true;",
  "    setResponseDeadline(0);",
  "    setResponseTimedOut(false);",
  "  }",
].join("\n");
replaceRequired(stopAnchor, stopReplacement, "response timer stop");

const chooseAnchor = '    safeStorageSet(RESPONSE_TIME_KEY, String(next));';
const chooseReplacement = '    safeStorageSet(responseTimeStorageKey(slide?.course), String(next));';
replaceRequired(chooseAnchor, chooseReplacement, "course-specific response preference");

replaceRequired(
  '                    {seconds}s',
  '                    {formatResponseTime(seconds)}',
  "response preset labels",
);

replaceRequired(
  "Default: 30 seconds.",
  "A2 defaults to 2 minutes. B1 defaults to 3 minutes. A1 remains 1 minute. A 5-second alert sounds when time ends.",
  "settings help text",
);

if (source.includes("Default: 1 minute.")) {
  source = source.replace(
    "Default: 1 minute.",
    "A2 defaults to 2 minutes. B1 defaults to 3 minutes. A1 remains 1 minute. A beep sounds when time ends.",
  );
}

if (!source.includes('if (level === "A2") return 120;')) {
  throw new Error("A2 speaking timer was not updated to 120 seconds.");
}
if (!source.includes('if (level === "B1") return 180;')) {
  throw new Error("B1 speaking timer was not updated to 180 seconds.");
}
if (!source.includes("playResponseTimeoutBeep();")) {
  throw new Error("Speaking timeout beep was not installed.");
}
if (!source.includes("RESPONSE_TIME_PRESETS = [60, 120, 180]")) {
  throw new Error("Speaking timer presets were not updated.");
}

fs.writeFileSync(pickerTarget, source, "utf8");
console.log("Presenter speaking timer now defaults to A2 2 minutes, B1 3 minutes, with a 5-second timeout alert.");
