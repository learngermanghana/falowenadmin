import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("presenter class timer hard-codes A1 to 60 minutes and A2/B1 to 90 minutes", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /A1:\s*60/);
  assert.match(source, /A2:\s*90/);
  assert.match(source, /B1:\s*90/);
  assert.match(source, /Start class/);
  assert.match(source, /Class time is up/);
});

test("class timer is session-wide for selected class, level and date rather than tied to a lesson page", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /presenterClassTimerStorageKey/);
  assert.match(source, /LAST_CLASS_KEY = "falowen:presenter:last-class"/);
  assert.match(source, /class-timer:\$\{localDateKey\(now\)\}:\$\{safeLevel\}:\$\{safeClass\}/);
  assert.match(source, /currentPresenterClassId/);
  assert.match(source, /window\.localStorage\.getItem\(key\)/);
  assert.match(source, /window\.localStorage\.setItem\(storageKey/);
  assert.doesNotMatch(source, /slide\.assignmentId \|\| slide\.id/);
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

test("student picker starts a 30-second answer timer automatically and announces timeout", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(picker, /DEFAULT_RESPONSE_SECONDS = 30/);
  assert.match(picker, /RESPONSE_TIME_PRESETS = \[15, 30, 45, 60\]/);
  assert.match(picker, /startResponseTimer\(\);\s*\n\s*}\s*\n\s*\n\s*function pickNextQuestion/);
  assert.match(picker, /publishQuestion\(nextQuestion\);\s*\n\s*startResponseTimer\(\)/);
  assert.match(picker, /Time's up —/);
  assert.match(picker, /\+15s/);
  assert.match(picker, /Starts automatically when you pick a student or give the same student a new question/);
});

test("recording a student result stops the answer timer instead of auto-marking timeout", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(picker, /if \(hasQuestionMode && !currentQuestion\) return;\s*\n\s*stopResponseTimer\(\);\s*\n\s*const result = recordedResult\(status\)/);
  assert.doesNotMatch(picker, /responseTimedOut[\s\S]{0,120}markCurrent\(/);
});
