import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
const picker = fs.readFileSync(new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url), "utf8");
const presenterCss = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
const pickerCss = fs.readFileSync(new URL("../src/components/PresenterStudentPicker.css", import.meta.url), "utf8");

test("A2 and B1 knowledge slides expose an intelligent reading mode with the shared Activity timer", () => {
  assert.match(presenter, /const readingEligible = \["A2", "B1"\]\.includes/);
  assert.match(presenter, /function startReadingMode\(\)/);
  assert.match(presenter, /function shareReadingNow\(\)/);
  assert.match(presenter, /Use the Activity timer for silent reading, then share the text when you are ready/);
  assert.match(presenter, /Share reading/);
  assert.doesNotMatch(presenter, /reading-silent/);
});

test("reading phase changes only when the teacher chooses to share the text", () => {
  assert.match(presenter, /function shareReadingNow\(\)[\s\S]*setReadingPhase\("share"\)/);
  assert.doesNotMatch(presenter, /timerRemaining !== 0[\s\S]*setReadingPhase\("share"\)/);
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
