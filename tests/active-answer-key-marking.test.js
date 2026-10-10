import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const marking = readFileSync(new URL("../src/pages/MarkingPage.jsx", import.meta.url), "utf8");

test("saved answer-key registry is the active reference for objective scoring and display", () => {
  assert.match(marking, /computeObjectiveScore\(matchingRegistry \|\| objectiveAssignmentId/);
  assert.match(marking, /computeObjectiveScore\(registryEntry \|\| deterministicAssignmentId/);
  assert.match(marking, /active\?\.parts/);
  assert.match(marking, /No current saved answer key for this assignment/);
});

test("marking does not overwrite user-updated answer keys from GitHub manifest", () => {
  assert.doesNotMatch(marking, /syncAnswerKeysFromGitHub\(/);
  assert.match(marking, /Existing edited answers were preserved/);
  assert.match(marking, /keyComparison === "missing"/);
});

test("empty registry shells block AI marking and never display metadata dumps", () => {
  assert.match(marking, /scorableSavedKey\(matchingRegistry\)/);
  assert.match(marking, /scorableSavedKey\(registryEntry\)/);
  assert.match(marking, /if \(!registryEntry\) throw new Error/);
  assert.match(marking, /if \(scorableSavedKey\(active\)\) return renderSavedAnswerKey\(active\)/);
  assert.match(marking, /entry\.rawAnswers/);
  assert.match(marking, /item\?\.rawCorrectAnswer/);
});
