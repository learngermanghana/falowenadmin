import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  activeLessonHighlights, activeLessonSlide, prepareLessonScript, safeLessonFilename,
  spreadLessonSlides, timeLabel,
} from "../src/utils/lessonVideoStudio.js";

test("slide timestamps follow narration timeline and can be evenly spaced", () => {
  const slides = spreadLessonSlides([
    { image: "1", start: 0 }, { image: "2", start: 0 }, { image: "3", start: 0 },
  ], 90);
  assert.deepEqual(slides.map(s => s.start), [0, 30, 60]);
  assert.equal(activeLessonSlide(slides, 29.5), 0);
  assert.equal(activeLessonSlide(slides, 30), 1);
  assert.equal(activeLessonSlide(slides, 88), 2);
  assert.equal(timeLabel(125), "2:05");
});
test("highlights are scoped to their slide and bounded by start/end", () => {
  const markers = [
    { slide: 0, start: 1.2, end: 3.2, x: 0.1, y: 0.2, w: 0.4, h: 0.2 },
    { slide: 1, start: 1.2, end: 3.2 },
  ];
  assert.equal(activeLessonHighlights(markers, 0, 1.1).length, 0);
  assert.equal(activeLessonHighlights(markers, 0, 2).length, 1);
  assert.equal(activeLessonHighlights(markers, 1, 2).length, 1);
  assert.equal(activeLessonHighlights(markers, 0, 3.2).length, 0);
});
test("script outlines preserve teacher edits and use imported slide text", () => {
  const output = prepareLessonScript([
    { script: "Hallo!", text: "Original" }, { text: "Wenn es regnet, bleibe ich zu Hause." }, { text: "" },
  ]);
  assert.match(output, /Hallo!/);
  assert.match(output, /Wenn es regnet, bleibe ich zu Hause/);
  assert.match(output, /Write or paste/);
  assert.equal(safeLessonFilename('Mastering „Wenn“ & „Falls“'), "mastering-wenn-falls");
});
test("lesson-video studio is owner-scoped and lazy-loaded", () => {
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(app, /const LessonVideoStudioPage = lazy/);
  assert.match(app, /<Route path="\/lesson-video-studio" element={<OwnerStudioRoute lesson \/>} \/>/);
  assert.match(app, /lesson \? <LessonVideoStudioPage \/> : music/);
  assert.match(app, /ownerUid \|\| user.uid !== ownerUid/);
});
test("local lesson video export does not make API calls", () => {
  const src = readFileSync(new URL("../src/utils/lessonVideoStudio.js", import.meta.url), "utf8");
  assert.match(src, /MediaRecorder/);
  assert.match(src, /canvas\.captureStream/);
  assert.match(src, /createMediaStreamDestination/);
  assert.doesNotMatch(src, /\/api\/|firestore|openai\.com|cloudflare\.com/);
});
