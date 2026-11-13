import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Regression contracts for the two review findings in PR #1461.
// The Admin presentation is rendered by React Router, which can reuse the
// component without remounting when switching from index to lesson.
const source = readFileSync(new URL("../src/components/SwahiliTeachingSlides.jsx", import.meta.url), "utf8");

test("Swahili presenter synchronizes with route changes, not initial state alone", () => {
  assert.match(source, /setPresenting\(Boolean\(slideId\) && present\)/);
  assert.match(source, /\[slideId, present\]/);
  assert.match(source, /setIndex\(0\)/);
});

test("focused presenter buttons allow ArrowRight and PageDown, but Space keeps native activation", () => {
  assert.match(source, /\["ArrowRight", "PageDown", " "\]/);
  assert.match(source, /\["INPUT", "TEXTAREA", "SELECT"\]/);
  assert.doesNotMatch(source, /\["INPUT", "TEXTAREA", "SELECT", "BUTTON"\]/);
  assert.match(source, /event\.key === " ".*closest\("button, a, \[role='button'\]"\)/);
  assert.match(source, /\["ArrowLeft", "PageUp"\]/);
});
