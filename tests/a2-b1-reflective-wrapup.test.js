import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const OLD_REPETITIVE_IDS = new Set([
  "grammar-check",
  "vocabulary-retrieval",
  "sentence-builder",
  "guided-action",
  "role-play",
  "b1-grammar-check",
  "b1-vocabulary-retrieval",
  "b1-sentence-builder",
  "b1-guided-action",
  "b1-role-play",
  "learning-reflection",
  "learning-exit-ticket",
]);

for (const level of ["A2", "B1"]) {
  test(`${level} uses one weekly challenge mechanic before the final lesson summary`, () => {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);

    const titlesByWeek = new Map();
    for (const slide of slides) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const ids = stages.map((stage) => stage.id);
      const challenge = stages.find((stage) => stage.id === "weekly-challenge");

      assert.ok(challenge, `${slide.assignmentId} missing weekly challenge`);
      assert.equal(challenge.type, "flow");
      assert.ok(challenge.items.length >= 3, `${slide.assignmentId} should expose a multi-step weekly challenge`);
      assert.deepEqual(ids.slice(-2), ["weekly-challenge", "lesson-summary"], `${slide.assignmentId} should end with weekly challenge then summary`);

      for (const oldId of OLD_REPETITIVE_IDS) {
        assert.equal(ids.includes(oldId), false, `${slide.assignmentId} still exposes repetitive ending ${oldId}`);
      }

      const week = Math.ceil(slide.dayNumber / 4);
      const existing = titlesByWeek.get(week);
      if (existing) assert.equal(challenge.title, existing, `${slide.assignmentId} should use the same mechanic identity within week ${week}`);
      else titlesByWeek.set(week, challenge.title);

      const challengeText = JSON.stringify(challenge);
      assert.doesNotMatch(challengeText, /Finde und korrigiere den Fehler/i);
      assert.doesNotMatch(challengeText, /Baue einen stärkeren B1-Satz/i);
    }

    assert.equal(titlesByWeek.size, 7);
    assert.equal(new Set(titlesByWeek.values()).size, 7, `${level} should expose seven distinct weekly mechanics`);
  });
}

test("A2 week 6 uses the new two-minute fluency mechanic", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.dayNumber === 21);
  const challenge = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "weekly-challenge");
  assert.match(challenge.title, /2-Minuten-Challenge/);
  assert.ok(challenge.items.some((item) => item.minutes === 2 && /2 Minuten/i.test(item.instruction)));
});

test("B1 week 6 uses the new three-minute position mechanic", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.dayNumber === 21);
  const challenge = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "weekly-challenge");
  assert.match(challenge.title, /3-Minuten-Position/);
  assert.ok(challenge.items.some((item) => item.minutes === 3 && /3 Minuten/i.test(item.instruction)));
});

test("B1 Day 15 ends with Interview and spontaneous follow-up, not the old predictable drill", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-5.15");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const challenge = stages.find((stage) => stage.id === "weekly-challenge");

  assert.match(challenge.title, /Interview & Rückfrage/);
  assert.ok(challenge.items.some((item) => /Spontane Rückfrage/i.test(item.title)));
  assert.match(JSON.stringify(challenge), /nicht auf der Folie steht/i);
  assert.deepEqual(stages.map((stage) => stage.id).slice(-2), ["weekly-challenge", "lesson-summary"]);
});
