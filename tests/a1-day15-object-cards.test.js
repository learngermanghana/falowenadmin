import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { A1_TEIL3_OBJECT_CARDS, a1Teil3ObjectPrompt, getA1Teil3ObjectCard } from "../src/data/a1Teil3ObjectCards.js";
import { getA1Days11To15UnderstandingChecks } from "../src/data/a1Days11To15Understanding.js";
import { buildA1PresenterQuestionPool } from "../src/utils/a1PresenterQuestionPool.js";
import { getA1PresenterMusicStage } from "../src/data/a1PresenterMusicStage.js";
import { getCuratedMusicByAssignment } from "../src/data/curatedLessonMusic.js";

test("A1 Day 15 assigns ten distinct object cards and one independent exit card", () => {
  const checks = getA1Days11To15UnderstandingChecks("A1-4.7");
  assert.equal(A1_TEIL3_OBJECT_CARDS.length, 11);
  assert.equal(checks.length, 11);
  assert.equal(new Set(checks.map((item) => item.questionDe)).size, 11);
  assert.ok(checks.slice(0, -1).every((item) => item.responseMode === "performance"));
  assert.match(checks.at(-1).questionDe, /^Exit-Check:/);
  assert.equal(getA1Teil3ObjectCard(checks[0].questionDe)?.objectDe, "die Flasche");
  assert.equal(getA1Teil3ObjectCard(checks.at(-1).questionDe)?.objectDe, "das Fenster");
  assert.ok(checks.every((item) => item.noteEn.includes("Do not show the model before the answer")));
  assert.ok(A1_TEIL3_OBJECT_CARDS.every((item) =>
    item.objectDe && item.symbol && item.verb && item.requestDe && item.reactionDe &&
    item.requestDe.startsWith("Können Sie")
  ));
});

test("student-picker question pool carries stable card identifiers without displaying model verbs", () => {
  const cards = getA1Days11To15UnderstandingChecks("A1-4.7").slice(0, 10);
  const pool = buildA1PresenterQuestionPool(cards, 18, "A1-4.7-live");
  assert.equal(pool.length, 18);
  assert.equal(new Set(pool.map((item) => item.id)).size, 18);
  for (const question of pool) {
    const card = getA1Teil3ObjectCard(question.sourceQuestion || question.questionDe);
    assert.ok(card, question.questionDe);
    assert.equal(question.responseMode, "performance");
    assert.ok(!question.sourceQuestion.includes(card.verb), "verb must remain hidden before reveal");
    assert.equal(question.answerDe, card.requestDe + " – " + card.reactionDe);
  }
  assert.equal(getA1Teil3ObjectCard("unrelated lesson"), null);
  assert.match(a1Teil3ObjectPrompt(A1_TEIL3_OBJECT_CARDS[0]), /Bildkarte flasche/);
});

test("Day 15 presenter uses projected picture-card UI and keeps published music", () => {
  const slide = getSlidesByCourse("A1").find((entry) => entry.assignmentId === "A1-4.7");
  assert.ok(slide);
  assert.ok(slide.studentQuestionsDe.some((q) => q.includes("Bildkarte: die Flasche")));
  assert.match(slide.teacherNotesEn.join(" "), /Keep the existing published music activity/);
  assert.equal(getCuratedMusicByAssignment("A1-4.7")?.status, "published");
  assert.equal(getA1PresenterMusicStage("A1-4.7")?.type, "published-music");
  const presenter = fs.readFileSync("src/components/A1GrammarPresenter.jsx", "utf8");
  assert.match(presenter, /presenter-a1-teil3-object-card/);
  assert.match(presenter, /getA1Teil3ObjectCard\(activeCheck\?\.sourceQuestion/);
  assert.match(presenter, /getA1PresenterMusicStage\(slide\.assignmentId\)/);
  assert.match(presenter, /id: "music-lesson"/);
});
