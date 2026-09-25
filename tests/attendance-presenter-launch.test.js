import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Attendance Start class & slides resolves the lesson and launches Presenter Mode", () => {
  const page = read("src/pages/CheckinDisplayPage.jsx");

  assert.match(page, /useNavigate, useSearchParams/);
  assert.match(page, /getTeachingSlideByAssignmentId/);
  assert.match(page, /const presenterSlide = useMemo/);
  assert.match(page, /getTeachingSlideByAssignmentId\(assignmentId\)/);
  assert.match(page, /const presenterLaunchPath = useMemo/);
  assert.match(page, /\/teaching-slides\/course\/\$\{encodeURIComponent\(presenterSlide\.course\)\}\/\$\{encodeURIComponent\(presenterSlide\.id\)\}\?present=1/);

  const handlerStart = page.indexOf("const handleStartClassNow = useCallback(async () => {");
  const handlerEnd = page.indexOf("\n  const syncPresenterEnd", handlerStart);
  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart, "async Attendance start handler should exist");
  const handler = page.slice(handlerStart, handlerEnd);
  const syncIndex = handler.indexOf("await syncPresenterStart(startedAt)");
  const navigateIndex = handler.indexOf("navigate(presenterLaunchPath)");
  assert.ok(syncIndex >= 0, "Attendance must await presenter session synchronization");
  assert.ok(navigateIndex > syncIndex, "Presenter navigation must happen after session synchronization");
  assert.match(handler, /stopWaitingMusic\(\)/);
  assert.match(handler, /missing-slide/);
});

test("Attendance assignment identity resolves to the same canonical teaching slide used by direct Presenter Mode", () => {
  const slide = getTeachingSlideByAssignmentId("A2-2.4");
  assert.ok(slide, "A2-2.4 slide should resolve");
  assert.equal(slide.course, "A2");
  assert.equal(slide.id, "a2-day-4-treffen");
  const path = `/teaching-slides/course/${encodeURIComponent(slide.course)}/${encodeURIComponent(slide.id)}?present=1`;
  assert.equal(path, "/teaching-slides/course/A2/a2-day-4-treffen?present=1");
});

test("both presenter implementations mount the shared Attendance class timer", () => {
  for (const path of [
    "src/components/TeachingSlidePresenter.jsx",
    "src/components/A1GrammarPresenter.jsx",
  ]) {
    const source = read(path);
    assert.match(source, /import PresenterSessionTimer from "\.\/PresenterSessionTimer\.jsx";/);
    assert.match(source, /<PresenterSessionTimer slide=\{slide\} \/>/);
  }
});

test("production, dev and test lifecycle apply the full presenter live-session patch bundle", () => {
  const packageJson = JSON.parse(read("package.json"));
  for (const scriptName of ["prebuild", "predev", "pretest"]) {
    assert.match(
      packageJson.scripts[scriptName] || "",
      /node scripts\/patchPresenterSessionAndResponseTimers\.mjs/,
      `${scriptName} must install presenter timer and realtime sync before running`,
    );
  }
});
