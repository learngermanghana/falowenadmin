import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
const picker = fs.readFileSync(new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url), "utf8");

test("A2 and B1 use one reusable Activity timer with 7, 5 and 2 minute presets", () => {
  assert.match(presenter, /A2_B1_ACTIVITY_TIMER_PRESETS = \[7, 5, 3, 2, 1\]/);
  assert.match(presenter, /DEFAULT_ACTIVITY_TIMER_MINUTES = 5/);
  assert.match(presenter, /const \[activityTimerMinutes, setActivityTimerMinutes\]/);
  assert.match(presenter, /Activity timer/);
  assert.match(presenter, /aria-label="Activity timer duration"/);
  assert.match(presenter, /setTimerMinutes\(minutes, a2B1ActivityTimer \? "activity" : "stage"\)/);
  assert.doesNotMatch(presenter, /Prepare class/);
  assert.doesNotMatch(presenter, /Class preparation ·/);
  assert.doesNotMatch(presenter, /Presentation · \$\{warmupMinutes\}/);
});

test("the shared Activity timer sounds a six-second alarm and stays on the warm-up slide", () => {
  assert.match(presenter, /function playPresenterTimerAlarm\(\)/);
  assert.match(presenter, /const alertDurationSeconds = 6/);
  assert.match(presenter, /offset < alertDurationSeconds; offset \+= 0\.72/);
  assert.match(presenter, /oscillator\.stop\(startedAt \+ alertDurationSeconds\)/);
  assert.match(presenter, /if \(!showPresenterTimer \|\| !timerRunning \|\| timerRemaining !== 0\) return undefined/);
  assert.match(presenter, /playPresenterTimerAlarm\(\)/);
  assert.match(presenter, /setTimerRunning\(false\)/);
  assert.doesNotMatch(presenter, /clampPresenterIndex\(current \+ 1, stages\.length\)/);
  assert.doesNotMatch(presenter, /\}, 3000\)/);
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

test("large rosters keep question-count advice separate from the Activity timer", () => {
  assert.match(presenter, /rosterCount >= 8/);
  assert.match(presenter, /Use fewer questions if needed and choose 7, 5, 3, 2 or 1 minutes on the Activity timer/);
  assert.match(presenter, /Use 2 questions/);
  assert.match(presenter, /Restore 4 questions/);
  assert.doesNotMatch(presenter, /students × \{warmupMinutes\} min/);
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


test("per-student warm-ups keep answer cards even when optional support is empty", () => {
  assert.match(presenter, /const enhancedWarmup = warmupPerStudent;/);
  assert.match(presenter, /const warmupHasSupport = Array\.isArray\(stage\?\.questionSupport\) && stage\.questionSupport\.length > 0/);
  assert.match(presenter, /const hasSupport = warmupHasSupport && Boolean\(support\)/);
  assert.match(presenter, /\{hasSupport \? \([\s\S]*presenter-warmup-support-actions[\s\S]*\) : null\}/);
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


test("fullscreen presentation keeps the same Activity timer visible and controllable", () => {
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  assert.match(presenter, /presenter-focus-stage-timer/);
  assert.match(presenter, /aria-label="Active stage timer"/);
  assert.match(presenter, /A2_B1_ACTIVITY_TIMER_PRESETS/);
  assert.match(presenter, /onClick=\{togglePresenterTimer\}/);
  assert.match(presenter, /activityTimerMinutes === minutes/);
  assert.match(css, /\.presenter-focus-stage-timer\s*\{/);
  assert.match(css, /right:\s*clamp\(8\.6rem, 11vw, 10\.5rem\)/);
  assert.match(css, /\.presenter-timer-presets button\.is-active/);
});


test("A2/B1 fullscreen warm-up shows a simple bottom countdown with short changing cues", () => {
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  assert.match(presenter, /focusMode && warmupPerStudent && a2B1ActivityTimer/);
  assert.match(presenter, /aria-label="Warm-up time remaining"/);
  assert.match(presenter, /Think/);
  assert.match(presenter, /Build/);
  assert.match(presenter, /Add detail/);
  assert.match(presenter, /Check/);
  assert.match(presenter, /Say it/);
  assert.match(presenter, /Time up · finish this turn/);
  assert.match(presenter, /presenter-warmup-coaching-card/);
  assert.match(presenter, /Math\.floor\(warmupElapsedSeconds \/ 8\)/);
  assert.match(presenter, /presenter-warmup-bottom-progress/);
  assert.match(presenter, /\$\{visibleWarmupAnsweredCount\}\/\$\{visibleWarmupQuestionCount\} answered/);
  assert.match(css, /\.presenter-warmup-bottom-timer\s*\{/);
  assert.match(css, /bottom:\s*clamp\(0\.55rem, 1\.4vw, 1rem\)/);
  assert.match(css, /width:\s*min\(760px, calc\(100% - 22rem\)\)/);
  assert.match(css, /font-size:\s*1\.35rem/);
});
