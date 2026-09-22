import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
const picker = fs.readFileSync(new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url), "utf8");

test("warm-up has a 30-second preparation mode that rolls into speaking", () => {
  assert.match(presenter, /function startWarmupPreparation\(\)/);
  assert.match(presenter, /setTimerMode\("prepare"\)/);
  assert.match(presenter, /setTimerRemaining\(30\)/);
  assert.match(presenter, /timerMode === "prepare"/);
  assert.match(presenter, /setTimerMode\("warmup"\)/);
  assert.match(presenter, /Prepare 30s/);
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
