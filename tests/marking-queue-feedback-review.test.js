import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../src/pages/MarkingPage.css", import.meta.url), "utf8");
const quality = readFileSync(new URL("../src/utils/markingQuality.js", import.meta.url), "utf8");

test("marking queue keeps long student names in independent, wrapping rows", () => {
  assert.match(styles, /\.marking-workspace \.marking-queue-list \{/);
  assert.match(styles, /flex-direction: column/);
  assert.match(styles, /\.marking-workspace \.marking-queue-item > strong/);
  assert.match(styles, /height: auto !important/);
  assert.match(styles, /overflow-wrap: anywhere/);
});

test("review warnings flag irrelevant and repetitive marking feedback without changing student scores", () => {
  assert.match(quality, /Feedback repeats the task-point assessment/);
  assert.match(quality, /hotel-specific advice that is not supported/);
  assert.match(quality, /A matched Admin key is not proof/);
});
