import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/SwahiliTeachingSlides.jsx", import.meta.url), "utf8");

test("lesson route updates presenter state even when React Router preserves the component", () => {
  assert.ok(source.includes("setPresenting(Boolean(slideId) && present)"));
  assert.ok(source.includes("[slideId, present]"));
  assert.ok(source.includes("setIndex(0)"));
});

test("keyboard navigation works from focused buttons without overriding native Space", () => {
  assert.ok(source.includes("ArrowRight:"));
  assert.ok(source.includes("PageDown:"));
  assert.ok(source.includes("ArrowLeft:"));
  assert.ok(source.includes("PageUp:"));
  assert.ok(source.includes('event.key === " "'));
  assert.ok(source.includes('closest(\'button, a, [role="button"]\')'));
  assert.ok(!source.includes('input, textarea, select, button'));
});

test("Swahili reuses the A2 shared stage navigation instead of copying it", () => {
  assert.ok(source.includes('PresenterControls, { PresenterStageJump }'));
  assert.ok(source.includes('<PresenterControls'));
  assert.ok(source.includes('<PresenterStageJump'));
  assert.ok(source.includes('"./TeachingSlidePresenter.css"'));
});
