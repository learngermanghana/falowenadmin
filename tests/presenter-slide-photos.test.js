import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getPresenterSlidePhoto, PRESENTER_PHOTO_PATHS } from "../src/utils/presenterSlidePhotos.js";

test("every locally mapped photo exists and remains self-hosted without an API", () => {
  assert.equal(PRESENTER_PHOTO_PATHS.length, 4);
  for (const asset of PRESENTER_PHOTO_PATHS) {
    assert.match(asset, /^\/presenter-photos\/[a-z-]+\.jpg$/);
    const location = "public" + asset;
    assert.ok(fs.existsSync(location), location);
    assert.ok(fs.statSync(location).size > 10000, location);
  }
});

test("curated A2/B1 lessons get their own meaningful photographs", () => {
  const interview = getPresenterSlidePhoto({ course: "B1", assignmentId: "B1-6.19" },
    { type: "intro", title: "Das Vorstellungsgespräch" });
  const shopping = getPresenterSlidePhoto({ course: "A2", assignmentId: "A2-7.19" },
    { type: "intro", title: "Einkaufen" });
  assert.equal(interview.src, "/presenter-photos/job-interview.jpg");
  assert.equal(shopping.src, "/presenter-photos/clothes-shopping.jpg");
});

test("B2 Day 4 plastic and packaging never displays the stale interview photo", () => {
  // B2 Day 4 is "Plastik, Verpackungen und bewusster Einkauf", not a career lesson.
  const photo = getPresenterSlidePhoto(
    { course: "B2", assignmentId: "B2-1.4", title: "Plastik, Verpackungen und bewusster Einkauf" },
    { type: "intro", title: "Plastik, Verpackungen und bewusster Einkauf" },
  );
  assert.equal(photo, null);
});

test("photos never take space on exercises, dense vocabulary or unrelated slides", () => {
  const slide = { course: "A2", assignmentId: "A2-7.19" };
  for (const type of ["grammar-check", "question-reveal", "flow", "scenario-challenge",
    "career-challenge", "list", "workbook"]) {
    assert.equal(getPresenterSlidePhoto(slide, { type }), null);
  }
  assert.equal(getPresenterSlidePhoto(slide, { type: "vocabulary", items: [1, 2, 3, 4] }), null);
  assert.equal(getPresenterSlidePhoto(slide, { type: "intro", studentReference: {} }).density, "compact");
  assert.equal(getPresenterSlidePhoto(slide, { type: "intro" }).density, "wide");
  assert.equal(getPresenterSlidePhoto({ course: "A2", assignmentId: "A2-1.1" }, { type: "intro" }), null);
});

test("teacher controls retain their own layout rows; photos are decoration only", () => {
  const source = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");
  assert.match(source, /getPresenterSlidePhoto\(slide, stage\)/);
  assert.match(source, /className="presenter-slide-photo" aria-hidden="true"/);
  assert.match(source, /loading="lazy" decoding="async" draggable="false"/);
  assert.match(css, /\.presenter-stage:not\(\.is-focus-mode\) > \.presenter-footer\s*\{\s*grid-row:\s*4/);
  assert.match(css, /\.presenter-slide-photo\s*\{[\s\S]*?position:\s*absolute;/);
  assert.match(css, /@media \(max-width: 950px\), \(max-height: 600px\)/);
  assert.match(css, /\.presenter-fit-tight > \.presenter-slide-photo\s*\{\s*display:\s*none;/);
});
