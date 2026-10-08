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
  assert.match(source, /Student work/);
  assert.match(source, /Mark with AI/);
  assert.match(source, /Review & save/);
  assert.match(source, /Comment \/ feedback/);
  assert.match(source, /Copy full report/);
});

test("reference is selected automatically and manual override stays secondary", () => {
  assert.match(source, /findReferenceEntryForSubmission\(referenceEntries, selectedSubmission\)/);
  assert.match(source, /Matched automatically/);
  assert.match(source, /<summary>Change reference<\/summary>/);
  assert.match(source, /aria-label="Reference answer"/);
});

test("stale or missing AI keys are offered only after the registry check completes", () => {
  assert.match(source, /answerKeyRegistryStatus/);
  assert.match(source, /answerKeyRegistryReady = answerKeyRegistryStatus === "ready"/);
  assert.match(source, /answerKeySyncNeeded = answerKeyRegistryReady && \(keyComparison === "different" \|\| keyComparison === "missing"\)/);
  assert.match(source, /Checking the saved AI key before marking/);
  assert.match(source, /Retry key check/);
  assert.match(source, /Sync latest answer keys/);
  assert.match(source, /Sync AI key/);
  assert.doesNotMatch(source, /Refresh or import the current key before AI marking/);
  assert.match(css, /\.marking-key-sync-warning/);
  assert.match(css, /\.marking-sync-key-action/);
});

test("answer-key sync verifies the current assignment and reports partial failures", () => {
  assert.match(source, /const refreshedRegistry = await refreshAnswerKeyRegistry\(\)/);
  assert.match(source, /const refreshedComparison = answerKeyComparison\(referenceEntry, refreshedMatchingRegistry\)/);
  assert.match(source, /const currentFailure = \(result\.failed \|\| \[\]\)\.find/);
  assert.match(source, /AI marking remains blocked/);
  assert.match(source, /result\.failedCount > 0/);
  assert.match(source, /other answer key/);
  assert.match(source, /This assignment’s AI key is ready/);
});

test("objective mapping defaults to issues and can reveal all answers", () => {
  assert.match(source, /objectiveIssueEntries = objectiveEntries\.filter/);
  assert.match(source, /visibleObjectiveEntries = showAllObjectiveAnswers \? objectiveEntries : objectiveIssueEntries/);
  assert.match(source, /Showing only wrong or unanswered questions/);
  assert.match(source, /Show all answers/);
  assert.match(source, /All objective answers are correct/);
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

test("mobile keeps the current marking action visible", () => {
  assert.match(source, /marking-mobile-sticky-action/);
  assert.match(source, /Current marking action/);
  assert.match(source, /\{autoMarking \? "Marking\.\.\." : "Mark with AI"\}/);
  assert.match(source, /\{savingScore \? "Saving\.\.\." : "Save mark"\}/);
  assert.match(css, /\.marking-mobile-sticky-action/);
  assert.match(css, /position:\s*fixed/);
});

test("marking layout uses one queue column and one focused review column", () => {
  assert.match(css, /grid-template-columns:\s*minmax\(240px, 290px\)\s+minmax\(0, 1fr\)/);
  assert.match(css, /\.marking-reference-work-grid/);
  assert.match(css, /\.marking-objective-table/);
  assert.match(css, /\.marking-student-actions/);
  assert.match(css, /\.marking-stage-bar/);
  assert.match(css, /\.marking-reference-selected/);
  assert.match(css, /\.marking-objective-actions/);
});
