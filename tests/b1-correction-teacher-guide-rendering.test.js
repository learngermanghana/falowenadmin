import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");

test("B1 grammar renders one three-step diagnostic instead of reteaching the rule", () => {
  assert.match(presenter, /stage\.type === "grammar-check"/);
  assert.match(presenter, /Teacher answer anzeigen/);
  assert.match(css, /\.presenter-grammar-check-grid/);
  assert.match(css, /\.presenter-grammar-check-card/);
});

test("B1 Day 12 grammar still explains temporal narration in English support", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-4.12");
  const grammar = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "grammar-check");
  const support = grammar.items.map((item) => [item.answer, item.note].filter(Boolean).join(" ")).join(" ");

  assert.match(support, /Perfekt|Präteritum/i);
  assert.match(support, /nachdem|als|temporal|sequence/i);
  assert.equal(grammar.type, "grammar-check");
  assert.equal(grammar.items.length, 3);
});

test("B1 no longer exposes the retired teaching and correction stages", () => {
  for (const slide of getSlidesByCourse("B1")) {
    const ids = buildTeachingPresenterStages(slide, slide.topic).map((stage) => stage.id);
    assert.equal(ids.includes("b1-grammar-check"), false, slide.assignmentId);
    assert.equal(ids.includes("grammar"), false, slide.assignmentId);
    assert.equal(ids.includes("examples"), false, slide.assignmentId);
    assert.equal(ids.includes("mistakes"), false, slide.assignmentId);
    assert.equal(ids.includes("grammar-check"), true, slide.assignmentId);
  }
});
