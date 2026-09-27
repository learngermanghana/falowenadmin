import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const LEVELS = ["A2", "B1", "B2", "C1", "C2"];

test("every A2-C2 vocabulary presenter can run the same missing-word challenge", () => {
  for (const level of LEVELS) {
    const slides = getSlidesByCourse(level);
    assert.ok(slides.length > 0, `${level} slides missing`);

    for (const slide of slides) {
      const vocabulary = buildTeachingPresenterStages(slide, slide.topic)
        .find((stage) => stage.type === "vocabulary");
      if (!vocabulary || !vocabulary.items?.length) continue;

      assert.ok(
        Array.isArray(vocabulary.challengeItems) && vocabulary.challengeItems.length > 0,
        `${slide.assignmentId} must expose vocabulary cloze challenges`,
      );

      for (const item of vocabulary.challengeItems) {
        assert.match(item.sentence, /______/);
        assert.ok(String(item.answer || "").trim(), `${slide.assignmentId} challenge answer missing`);
        assert.ok(String(item.clue || "").trim(), `${slide.assignmentId} challenge clue missing`);
      }
    }
  }
});

test("Presenter exposes one shared A2-C2 vocabulary challenge interaction", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");

  assert.match(presenter, /Welches Wort passt\? starten/);
  assert.match(presenter, /Tipp · Synonym\/Bedeutung/);
  assert.match(presenter, /Antwort anzeigen/);
  assert.match(presenter, /presenter-vocabulary-cloze-card/);
  assert.match(css, /\.presenter-vocabulary-cloze-card/);
  assert.match(css, /\.presenter-vocabulary-challenge-actions/);
});

test("A2 and B1 Wissensimpuls questions expose teacher answer support", () => {
  for (const level of ["A2", "B1"]) {
    for (const slide of getSlidesByCourse(level)) {
      const knowledge = buildTeachingPresenterStages(slide, slide.topic)
        .find((stage) => stage.id === "knowledge");
      if (!knowledge) continue;

      assert.equal(
        knowledge.answerItems.length,
        knowledge.items.length,
        `${slide.assignmentId} knowledge answer count must match checks`,
      );
      assert.ok(
        knowledge.answerItems.every((answer) => String(answer || "").trim()),
        `${slide.assignmentId} contains an empty knowledge answer`,
      );
    }
  }
});

test("A2 Day 22 keeps concise explicit teacher answers", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-8.22");
  assert.ok(slide, "A2-8.22 slide missing");

  const knowledge = buildTeachingPresenterStages(slide, slide.topic)
    .find((stage) => stage.id === "knowledge");

  assert.deepEqual(knowledge.answerItems, [
    "Feste Termine.",
    "Das Präsens.",
    "Damit man flexibel bleibt, wenn sich etwas ändert.",
  ]);
});
