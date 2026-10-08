import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/pages/MarkingPage.jsx", import.meta.url), "utf8");
const hubSource = fs.readFileSync(new URL("../src/pages/MarkingHubPage.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/pages/MarkingPage.css", import.meta.url), "utf8");

test("marking hub exposes only the marking workspace", () => {
  assert.match(hubSource, /return <MarkingPage \/>/);
  assert.doesNotMatch(hubSource, /Assignment Registry/);
  assert.doesNotMatch(hubSource, /AI Audit/);
  assert.doesNotMatch(hubSource, /Answer Keys/);
  assert.doesNotMatch(hubSource, /Student Results/);
});

test("marking page keeps the core review workflow visible", () => {
  assert.match(source, /<h3>Student work<\/h3>/);
  assert.match(source, /<h3>Reference<\/h3>/);
  assert.match(source, /<h3>Objective mapping<\/h3>/);
  assert.match(source, />Mark with AI<\/button>/);
  assert.match(source, /<h3>AI feedback & score<\/h3>/);
  assert.match(source, /Comment \/ feedback/);
  assert.match(source, /Copy full report/);
});

test("submission queue is limited to work that still needs marking", () => {
  assert.match(source, /Only incoming work that still needs marking/);
  assert.match(source, /!\["marked", "sent"\]\.includes\(status\)/);
  assert.doesNotMatch(source, /Filter submissions by status/);
  assert.doesNotMatch(source, /All attempts/);
});

test("full marking report carries the current reviewed scores and has a manual copy fallback", () => {
  assert.match(source, /"STUDENT WORK"/);
  assert.match(source, /"AI FEEDBACK"/);
  assert.match(source, /objectiveMarkingResult\.details/);
  assert.match(source, /smartMarkingResult\?\.feedback/);
  assert.match(source, /writingScore: schreibenMark === "" \? null : Number\(schreibenMark\)/);
  assert.match(source, /finalScore: displayedFinalScore/);
  assert.match(source, /Full report — select and copy manually/);
});

test("legacy noisy marking controls are removed from the main page", () => {
  assert.doesNotMatch(source, /Incoming notifications/);
  assert.doesNotMatch(source, /Find all submission attempts/);
  assert.doesNotMatch(source, /Copy marking report or reference/);
  assert.doesNotMatch(source, /marking-key-settings/);
});

test("marking layout uses one queue column and one focused review column", () => {
  assert.match(css, /grid-template-columns:\s*minmax\(240px, 290px\)\s+minmax\(0, 1fr\)/);
  assert.match(css, /\.marking-reference-work-grid/);
  assert.match(css, /\.marking-objective-table/);
  assert.match(css, /\.marking-student-actions/);
});
