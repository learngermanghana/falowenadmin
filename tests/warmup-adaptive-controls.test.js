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

test("teacher can choose one, two, or four warm-up questions", () => {
  assert.match(presenter, /\[1, 2, 4\]\.map/);
  assert.match(presenter, /setWarmupQuestionCount\(count\)/);
  assert.match(presenter, /stage\.items\.slice\(0, visibleWarmupQuestionCount\)/);
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
