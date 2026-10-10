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
