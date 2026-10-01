import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
const picker = fs.readFileSync(new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url), "utf8");
const presenterCss = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
const pickerCss = fs.readFileSync(new URL("../src/components/PresenterStudentPicker.css", import.meta.url), "utf8");

test("A2 and B1 knowledge slides expose an intelligent reading mode", () => {
  assert.match(presenter, /const readingEligible = \["A2", "B1"\]\.includes/);
  assert.match(presenter, /const readingSilentSeconds = presenterLevel === "B1" \? 90 : 60/);
  assert.match(presenter, /function startReadingMode\(\)/);
  assert.match(presenter, /setTimerMode\("reading-silent"\)/);
  assert.match(presenter, /Silent read → fair reader chunks → different listener check/);
  assert.match(presenter, /Restart silent reading/);
});

test("silent reading alarm transitions into shared reading assignments", () => {
  assert.match(presenter, /readingModeActive && timerMode === "reading-silent"/);
  assert.match(presenter, /setReadingPhase\("share"\)/);
  assert.match(presenter, /timerMode === "reading-silent"[\s\S]*"Silent reading"/);
});

test("presenter shows the current reader, chunk and a different listener check", () => {
  assert.match(presenter, /className="presenter-reading-current"/);
  assert.match(presenter, /<b>Reader<\/b>/);
  assert.match(presenter, /<b>Listener check<\/b>/);
  assert.match(presenter, /activeReadingAssignment\.chunk\?\.text/);
  assert.match(presenter, /activeReadingAssignment\.listenerQuestion/);
  assert.match(presenterCss, /\.presenter-reading-current\s*\{/);
});

test("student picker remembers reading rotation by class and advances sections", () => {
  assert.match(picker, /falowen:presenter:reading-history/);
  assert.match(picker, /buildReadingChunks/);
  assert.match(picker, /buildFairReadingAssignments/);
  assert.match(picker, /incrementReadingHistory/);
  assert.match(picker, /Complete & next/);
  assert.match(picker, /Listener check:/);
  assert.match(pickerCss, /\.presenter-reading-share\s*\{/);
});
