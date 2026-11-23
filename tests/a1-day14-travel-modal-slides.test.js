import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  A1_DAY14_ASSIGNMENT,
  A1_DAY14_CLASSROOM_STAGES,
  A1_DAY14_EXIT_STAGE,
  A1_DAY14_TRAIN_WORDS,
  A1_DAY14_HOTEL_WORDS,
  A1_DAY14_MODALS,
  A1_DAY14_CONJUGATIONS,
  A1_DAY14_BUILD,
  A1_DAY14_CORRECTIONS,
  A1_DAY14_QUESTIONS,
  A1_DAY14_HOTEL_DIALOGUE,
} from "../src/data/a1Day14Classroom.js";
import { enhanceA1Days11To15Slide } from "../src/data/a1Days11To15Slides.js";
import { getA1Days11To15UnderstandingChecks } from "../src/data/a1Days11To15Understanding.js";
import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "../src/data/a1PublishedWorkbookRoutes.js";

test("A1 Day 14 has exactly 12 approved pages with the original music at page 11", () => {
  assert.equal(A1_DAY14_ASSIGNMENT, "A1-3.6");
  assert.deepEqual(A1_DAY14_CLASSROOM_STAGES.map(s => s.step), [
    "review", "separable", "train", "hotel", "meanings",
    "conjugation", "sentence-frame", "train-build", "reservation", "questions",
  ]);
  assert.equal(A1_DAY14_CLASSROOM_STAGES.length + 1 + Number(Boolean(A1_DAY14_EXIT_STAGE)), 12);
  assert.equal(A1_DAY14_EXIT_STAGE.step, "exit");
  const presenter = readFileSync(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "utf8");
  assert.match(presenter, /A1_DAY14_ASSIGNMENT/);
  assert.match(presenter, /getA1PresenterMusicStage\(A1_DAY14_ASSIGNMENT, slide\.dayNumber\)/);
  assert.match(presenter, /A1_DAY14_CLASSROOM_STAGES/);
  assert.match(presenter, /\.\.\.A1_DAY14_EXIT_STAGE/);
  assert.match(presenter, /stage\.type === "a1-day14"/);
  assert.match(presenter, /A1Day14ClassroomStage/);
});

test("Day 14 revises sentence order and separable verbs before modals", () => {
  assert.deepEqual(A1_DAY14_BUILD.review[0].answer,
    ["Ich", "fahre", "morgen", "nach Berlin"]);
  assert.equal(A1_DAY14_BUILD.review[1].model, "Morgen fahre ich nach Berlin.");
  assert.equal(A1_DAY14_BUILD.separable[0].model, "Ich steige in den Zug ein.");
  assert.equal(A1_DAY14_BUILD["train-build"][0].model, "Ich muss in Hamburg umsteigen.");
  assert.equal(A1_DAY14_BUILD["train-build"][1].model, "Wir möchten in Berlin aussteigen.");
  for (const group of Object.values(A1_DAY14_BUILD)) {
    for (const exercise of group) {
      assert.deepEqual(
        [...exercise.words].sort((a, b) => a.localeCompare(b)),
        [...exercise.answer].sort((a, b) => a.localeCompare(b)),
        "Sentence builder must contain exactly the words in the correct answer",
      );
      assert.equal(exercise.answer.join(" ") + ".", exercise.model,
        "The model must match the checkable word order");
    }
  }
});

test("Four modal verbs, station language, reservations, and correct A1 forms", () => {
  assert.deepEqual(A1_DAY14_MODALS.map(item => item.word), [
    "können", "möchten", "wollen", "müssen",
  ]);
  for (const verb of ["einsteigen", "aussteigen", "umsteigen"]) {
    assert.ok(A1_DAY14_TRAIN_WORDS.some(item => item.word === verb), verb);
  }
  for (const word of ["übernachten", "reservieren", "buchen", "das Einzelzimmer", "das Doppelzimmer"]) {
    assert.ok(A1_DAY14_HOTEL_WORDS.some(item => item.word === word), word);
  }
  assert.deepEqual(A1_DAY14_CONJUGATIONS[0], ["ich", "kann", "möchte", "will", "muss"]);
  assert.deepEqual(A1_DAY14_CONJUGATIONS[1], ["du", "kannst", "möchtest", "willst", "musst"]);
  assert.ok(A1_DAY14_CORRECTIONS.some(([bad, good]) =>
    bad === "Ich kann steige ein." && good === "Ich kann einsteigen."));
  assert.ok(A1_DAY14_QUESTIONS.some(([, question]) => question === "Kannst du morgen fahren?"));
  assert.ok(A1_DAY14_HOTEL_DIALOGUE.some(([, prompt]) => prompt.includes("Einzelzimmer")));
  assert.ok(A1_DAY14_HOTEL_DIALOGUE.some(([, prompt]) => prompt.includes("übernachten")));
});

test("Published Day 14 workbook remains unchanged; extra classroom practice is unscored", () => {
  const lesson = enhanceA1Days11To15Slide({ assignmentId: A1_DAY14_ASSIGNMENT });
  assert.equal(lesson.workbookConnection.workbookUrl,
    A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[A1_DAY14_ASSIGNMENT]);
  assert.match(lesson.workbookConnection.subtitle, /unscored/i);
  assert.match(lesson.wrapUpTaskDe, /können, möchten, wollen und müssen/);
  assert.equal(getA1Days11To15UnderstandingChecks(A1_DAY14_ASSIGNMENT).length, 11);
  const component = readFileSync(new URL("../src/components/A1Day14ClassroomStage.jsx", import.meta.url), "utf8");
  assert.match(component, /A1_DAY14_HOTEL_DIALOGUE/);
  assert.match(component, /a1day14-workbook-link/);
  assert.match(component, /Vorhandenes Day-14-Workbook öffnen/);
  assert.match(component, /Erst selbst sprechen/);
});
