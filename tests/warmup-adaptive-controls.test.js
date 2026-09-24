import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
const picker = fs.readFileSync(new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url), "utf8");

test("warm-up gives the whole class five minutes to prepare before presentations", () => {
  assert.match(presenter, /WARMUP_PREPARATION_MINUTES = 5/);
  assert.match(presenter, /function startWarmupPreparation\(\)/);
  assert.match(presenter, /setTimerMode\("prepare"\)/);
  assert.match(presenter, /setTimerRemaining\(WARMUP_PREPARATION_MINUTES \* 60\)/);
  assert.match(presenter, /Class preparation ·/);
  assert.match(presenter, /Prepare class \{WARMUP_PREPARATION_MINUTES\}m/);
  assert.match(presenter, /Presentation · \$\{warmupMinutes\} min/);
});

test("five-minute preparation ends with a beep and a ready presentation timer", () => {
  assert.match(presenter, /function playWarmupTransitionBeep\(\)/);
  assert.match(presenter, /\[660, 820, 980\]/);
  assert.match(presenter, /timerMode !== "prepare"/);
  assert.match(presenter, /timerRemaining !== 0/);
  assert.match(presenter, /playWarmupTransitionBeep\(\)/);
  assert.match(presenter, /setTimerMode\("warmup"\)/);
  assert.match(presenter, /setTimerRemaining\(Math\.max\(1, Number\(warmupMinutes \|\| 5\)\) \* 60\)/);
  assert.match(presenter, /setTimerRunning\(false\)/);
});

test("teacher can choose one through four warm-up questions", () => {
  assert.match(presenter, /\[1, 2, 3, 4\]\.map/);
  assert.match(presenter, /setWarmupQuestionCount\(count\)/);
  assert.match(presenter, /aria-pressed=\{warmupQuestionCount === count\}/);
  assert.match(presenter, /Show \$\{count\} warm-up question/);
  assert.match(presenter, /stage\.items\.slice\(0, visibleWarmupQuestionCount\)/);
});

test("warm-up question count controls are projector-visible", () => {
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  assert.match(css, /\.presenter-warmup-question-count button \{/);
  assert.match(css, /min-width: 2\.6rem/);
  assert.match(css, /border: 2px solid #64748b/);
  assert.match(css, /font-size: 1rem/);
  assert.match(css, /font-weight: 900/);
  assert.match(css, /button\.is-active \{[\s\S]*background: #1d4ed8;[\s\S]*color: #fff/);
});

test("large rosters only suggest a shorter warm-up", () => {
  assert.match(presenter, /rosterCount >= 8/);
  assert.match(presenter, /students × \{warmupMinutes\} min/);
  assert.match(presenter, /Use 2 questions \/ 3 min per student/);
  assert.match(presenter, /Restore 4 questions \/ 5 min/);
  assert.match(presenter, /The teacher remains in control/);
});

test("student picker reports the selected class roster size", () => {
  assert.match(picker, /onRosterCountChange/);
  assert.match(picker, /onRosterCountChange\?\.\(roster\.length\)/);
  assert.match(presenter, /onRosterCountChange=\{setRosterCount\}/);
});


test("per-student warm-up uses the speaking timer instead of the short answer timer", () => {
  assert.match(presenter, /responseTimerEnabled=\{!warmupPerStudent\}/);
  assert.match(picker, /responseTimerEnabled = true/);
});


test("teacher can tick warm-up questions as the student answers them", () => {
  assert.match(presenter, /const \[warmupAnswered, setWarmupAnswered\] = useState\(\{\}\)/);
  assert.match(presenter, /function toggleWarmupAnswered\(questionIndexValue\)/);
  assert.match(presenter, /type="checkbox"/);
  assert.match(presenter, /checked=\{Boolean\(warmupAnswered\[itemIndex\]\)\}/);
  assert.match(presenter, /Mark warm-up question \$\{itemIndex \+ 1\} as answered/);
  assert.match(presenter, /Tick when answered/);
  assert.match(presenter, /Answered/);
});

test("warm-up checklist shows coverage and clears for the next student", () => {
  assert.match(presenter, /visibleWarmupAnsweredCount/);
  assert.match(presenter, /visibleWarmupMissedCount/);
  assert.match(presenter, /Covered \{visibleWarmupAnsweredCount\}\/\{visibleWarmupQuestionCount\}/);
  assert.match(presenter, /still to answer/);
  assert.match(presenter, /all covered/);
  assert.match(presenter, /function resetWarmupStudent\(\)[\s\S]*setWarmupAnswered\(\{\}\)/);
});

test("answered warm-up questions are clearly visible on the projector", () => {
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  assert.match(css, /\.presenter-warmup-question-card\.is-answered/);
  assert.match(css, /\.presenter-warmup-answer-check/);
  assert.match(css, /\.presenter-warmup-answer-check input/);
  assert.match(css, /\.presenter-warmup-coverage/);
});
