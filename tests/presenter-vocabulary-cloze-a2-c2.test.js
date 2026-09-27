import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const LEVELS = ["A2", "B1", "B2", "C1", "C2"];

test("A2-C2 vocabulary challenges only use real target words and three visible choices", () => {
  const challengeCounts = Object.fromEntries(LEVELS.map((level) => [level, 0]));

  for (const level of LEVELS) {
    const slides = getSlidesByCourse(level);
    assert.ok(slides.length > 0, `${level} slides missing`);

    for (const slide of slides) {
      const vocabulary = buildTeachingPresenterStages(slide, slide.topic)
        .find((stage) => stage.type === "vocabulary");
      if (!vocabulary) continue;

      for (const item of vocabulary.challengeItems || []) {
        challengeCounts[level] += 1;
        assert.match(item.sentence, /______/);
        assert.ok(String(item.answer || "").trim(), `${slide.assignmentId} challenge answer missing`);
        assert.equal(item.options.length, 3, `${slide.assignmentId} challenge must have exactly three options`);
        assert.ok(item.options.includes(item.answer), `${slide.assignmentId} options must include the answer`);
        assert.ok(new Set(item.options).size === 3, `${slide.assignmentId} options must be unique`);
        assert.equal(item.clue, undefined, `${slide.assignmentId} should not use a generic clue fallback`);
      }
    }
  }

  for (const level of LEVELS) {
    assert.ok(challengeCounts[level] > 0, `${level} should expose at least one safe vocabulary challenge`);
  }
});
test("Presenter exposes one shared A2-C2 vocabulary challenge interaction", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");

  assert.match(presenter, /Welches Wort passt\? starten/);
  assert.match(presenter, /Drei Wortschatzoptionen/);
  assert.match(presenter, /Wählt das Wort, das am besten in den Satz passt/);
  assert.match(presenter, /Antwort anzeigen/);
  assert.doesNotMatch(presenter, /Tipp · Synonym\/Bedeutung/);
  assert.match(presenter, /presenter-vocabulary-cloze-card/);
  assert.match(css, /\.presenter-vocabulary-cloze-card/);
  assert.match(css, /\.presenter-vocabulary-challenge-actions/);
});

test("Wissensimpuls teacher answers are shown only when explicitly curated", () => {
  for (const level of ["A2", "B1"]) {
    for (const slide of getSlidesByCourse(level)) {
      const knowledge = buildTeachingPresenterStages(slide, slide.topic)
        .find((stage) => stage.id === "knowledge");
      if (!knowledge) continue;

      assert.equal(
        knowledge.answerItems.length,
        knowledge.items.length,
        `${slide.assignmentId} knowledge answer slots must match checks`,
      );
      assert.ok(
        knowledge.answerItems.every((answer) => typeof answer === "string"),
        `${slide.assignmentId} knowledge answers must be explicit strings`,
      );
    }
  }

  const a2Day11 = buildTeachingPresenterStages(
    getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-1.1"),
  ).find((stage) => stage.id === "knowledge");
  assert.ok(a2Day11, "A2-1.1 knowledge stage missing");
  assert.ok(a2Day11.answerItems.every((answer) => answer === ""), "A2-1.1 must not show inferred teacher answers");
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
