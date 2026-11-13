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
  assert.ok(source.includes('PresenterControls, { PresenterActions, PresenterStageJump }'));
  assert.ok(source.includes('<PresenterControls'));
  assert.ok(source.includes('<PresenterStageJump'));
  assert.ok(source.includes('"./TeachingSlidePresenter.css"'));
});

test("presenter mode has a real A2-sized viewport and enlarged classroom content", () => {
  const css = readFileSync(new URL("../src/components/SwahiliTeachingSlides.css", import.meta.url), "utf8");
  assert.ok(source.includes('presenting ? "is-presenting" : ""'));
  assert.match(css, /\.swahili-a2-presenter\.is-presenting\s*\{/);
  assert.match(css, /\.swahili-a2-presenter\.is-presenting\s*\{[^}]*height:100dvh/s);
  assert.match(css, /\.swahili-a2-presenter\.is-presenting \.swahili-a2-presenter__model\s*\{[^}]*font-size:clamp\(1\.8rem/s);
  assert.match(css, /\.swahili-a2-presenter\.is-presenting \.swahili-a2-presenter__content\s*\{[^}]*overflow-y:auto/s);
  assert.match(css, /\.swahili-a2-presenter\.is-presenting \.presenter-shared-controls/);
});

test("Swahili presenter uses Falowen fixed classroom shell rather than Dashboard layout", () => {
  const css = readFileSync(new URL("../src/components/SwahiliTeachingSlides.css", import.meta.url), "utf8");
  assert.match(source, /presenter-shell swahili-a2-shell/);
  assert.match(css, /\.swahili-a2-shell\.presenter-shell \.swahili-a2-presenter/);
  assert.match(css, /grid-template-rows:auto auto minmax\(0,1fr\) auto auto/);
  assert.match(css, /grid-row:2/);
  assert.match(css, /grid-row:3/);
});
