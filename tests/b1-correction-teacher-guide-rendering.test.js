import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");

test("B1 grammar renders concise English support instead of a separate correction drill page", () => {
  assert.match(presenter, /stage\.type === "b1-grammar"/);
  assert.match(presenter, /Short English support for the rule/);
  assert.match(presenter, /Watch out:/);
  assert.match(css, /\.presenter-b1-grammar-grid/);
  assert.match(css, /\.presenter-b1-grammar-card/);
});

test("B1 Day 12 grammar still explains temporal narration in English support", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-4.12");
  const grammar = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "grammar");
  const support = grammar.items.map((item) => item.supportEn + " " + item.attentionEn).join(" ");

  assert.match(support, /Perfekt|Präteritum/i);
  assert.match(support, /nachdem|als|temporal|sequence/i);
  assert.equal(grammar.type, "b1-grammar");
});

test("B1 no longer exposes the old b1-grammar-check stage", () => {
  for (const slide of getSlidesByCourse("B1")) {
    const ids = buildTeachingPresenterStages(slide, slide.topic).map((stage) => stage.id);
    assert.equal(ids.includes("b1-grammar-check"), false, slide.assignmentId);
  }
});
