import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("presenter class timer shares A1/A2/B1 duration rules with check-in", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  const timing = read("src/utils/presenterSessionTiming.js");
  assert.match(timing, /A1:\s*60/);
  assert.match(timing, /A2:\s*90/);
  assert.match(timing, /B1:\s*90/);
  assert.match(source, /presenterSessionMinutes/);
  assert.match(source, /Start class/);
  assert.match(source, /Class time is up/);
});

test("class timer storage is isolated by selected class and presenter session", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /presenterClassTimerStorageKey/);
  assert.match(source, /LAST_CLASS_KEY = "falowen:presenter:last-class"/);
  assert.match(source, /safeSession/);
  assert.match(source, /class-timer:\$\{localDateKey\(now\)\}:\$\{safeLevel\}:\$\{safeClass\}:\$\{safeSession\}/);
  assert.match(source, /presenterLive\.sessionKey/);
  assert.match(source, /window\.localStorage\.getItem\(key\)/);
  assert.match(source, /window\.localStorage\.setItem\(storageKey/);
  assert.doesNotMatch(source, /sessionStorage/);
});

test("class timer gives unobtrusive 30, 15, 10, 5 minute and time-up warnings", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /CLASS_WARNING_MINUTES = Object\.freeze\(\[30, 15, 10, 5, 0\]\)/);
  assert.match(source, /30, 15, 10 and 5 minutes left and at time up/);
  assert.match(source, /recordCrossedWarnings/);
  assert.match(source, /warningLabel/);
  assert.doesNotMatch(source, /window\.alert/);
});

test("class timer warning sound is optional and persisted", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /SOUND_PREFERENCE_KEY/);
  assert.match(source, /Sound: \{soundEnabled \? "on" : "off"\}/);
  assert.match(source, /playWarningTone/);
  assert.match(source, /window\.localStorage\.setItem\(SOUND_PREFERENCE_KEY/);
  assert.match(source, /aria-pressed=\{soundEnabled\}/);
});

test("both A1 and general teaching presenters show the class timer", () => {
  const a1 = read("src/components/A1GrammarPresenter.jsx");
  const general = read("src/components/TeachingSlidePresenter.jsx");
  assert.match(a1, /PresenterSessionTimer/);
  assert.match(a1, /<PresenterSessionTimer slide=\{slide\} \/>/);
  assert.match(general, /PresenterSessionTimer/);
  assert.match(general, /<PresenterSessionTimer slide=\{slide\} \/>/);
});

test("student picker starts a one-minute answer timer automatically and announces timeout", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(picker, /DEFAULT_RESPONSE_SECONDS = 60/);
  assert.match(picker, /RESPONSE_TIME_KEY = "falowen:presenter:response-seconds:v2"/);
  assert.match(picker, /RESPONSE_TIME_PRESETS = \[15, 30, 45, 60\]/);
  assert.match(picker, /startResponseTimer\(\);\s*\n\s*}\s*\n\s*\n\s*function pickNextQuestion/);
  assert.match(picker, /publishQuestion\(nextQuestion\);\s*\n\s*startResponseTimer\(\)/);
  assert.match(picker, /Time's up —/);
  assert.match(picker, /\+15s/);
  assert.match(picker, /Starts automatically when you pick a student or give the same student a new question/);
  assert.match(picker, /Default: 1 minute/);
});

test("recording a student result stops the answer timer instead of auto-marking timeout", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(picker, /if \(hasQuestionMode && !currentQuestion\) return;\s*\n\s*stopResponseTimer\(\);\s*\n\s*const result = recordedResult\(status\)/);
  assert.doesNotMatch(picker, /responseTimedOut[\s\S]{0,120}markCurrent\(/);
});

test("presenter live sync stays on the existing class document but isolates sessions", () => {
  const service = read("src/services/presenterLiveSessionService.js");
  assert.match(service, /onSnapshot/);
  assert.match(service, /updateDoc/);
  assert.match(service, /doc\(db, "classes", id\)/);
  assert.match(service, /presenterSessions\.\$\{key\}/);
  assert.match(service, /presenterActiveSessionKey/);
  assert.match(service, /PRESENTER_LAST_SESSION_KEY/);
  assert.doesNotMatch(service, /liveTeachingSessions/);
});

test("class timer publishes and consumes shared absolute timer state", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /usePresenterLiveSession/);
  assert.match(source, /timerEndAt/);
  assert.match(source, /timerUpdatedAtMs/);
  assert.match(source, /publishTimerState/);
  assert.match(source, /computer ↔ iPad live/);
});

test("student picker synchronizes class, student, question, fair-pick state and response deadline", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(picker, /setPresenterClassContext/);
  assert.match(picker, /usePresenterLiveSession/);
  assert.match(picker, /pickerStudentKey/);
  assert.match(picker, /pickerQuestionId/);
  assert.match(picker, /pickerResponseDeadline/);
  assert.match(picker, /pickerRoundPicked/);
  assert.match(picker, /pickerRoundQuestionIds/);
  assert.match(picker, /Computer ↔ iPad live/);
});

test("A1 and general presenters synchronize their stage position", () => {
  const a1 = read("src/components/A1GrammarPresenter.jsx");
  const general = read("src/components/TeachingSlidePresenter.jsx");
  for (const source of [a1, general]) {
    assert.match(source, /usePresenterLiveSession/);
    assert.match(source, /presenterStageUpdatedAtMs/);
    assert.match(source, /presenterStageIndex/);
    assert.match(source, /presenterLessonId/);
  }
  assert.match(a1, /presenterItemIndex/);
  assert.match(general, /presenterQuestionIndex/);
});


test("presenter applies synchronized timer snapshots even when check-in used the same browser session", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /if \(!presenterLive\.hasSnapshot \|\| !presenterLive\.isToday \|\| !remoteStamp\) return;/);
  assert.doesNotMatch(source, /!presenterLive\.isRemoteState \|\| !remoteStamp/);
  assert.match(source, /remote\.classStartSource === "checkin"/);
  assert.match(source, /Started from check-in/);
});


test("presenter heartbeat is low-frequency and does not write countdown ticks", () => {
  const hook = read("src/hooks/usePresenterLiveSession.js");
  assert.match(hook, /PRESENTER_HEARTBEAT_MS = 90 \* 1000/);
  assert.match(hook, /presenterHeartbeatAtMs/);
  assert.match(hook, /window\.setInterval\(heartbeat, PRESENTER_HEARTBEAT_MS\)/);
  assert.doesNotMatch(hook, /setInterval\([^\n]*1000\)/);
});

test("presenter timer recognizes check-in class end state", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /remote\.classStatus === "ended"/);
  assert.match(source, /Class ended from check-in/);
});
