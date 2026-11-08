import test from "node:test";
import assert from "node:assert/strict";
import { courseDictionary } from "../src/data/courseDictionary.js";
import { getSlidesByCourse, getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { A1_ACTIVE_READING_IDS, getA1PresenterReadingLesson } from "../src/data/a1PresenterReadingLessons.js";
import { getPresenterReadingPhraseTranslations } from "../src/data/presenterReadingPhraseTranslations.js";
import { segmentReadingPhrases } from "../src/data/readingPhraseTranslations.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("all 24 currently published A1 lesson entries have beginner Lesen and verified answers", () => {
  const activeIds = Object.keys(courseDictionary.A1)
    .filter((id) => id !== "A1-Tutorial")
    .map((id) => id.toUpperCase());
  assert.equal(activeIds.length, 24, "A1 active curriculum changed; review and author the reading content");
  assert.deepEqual([...A1_ACTIVE_READING_IDS].sort(), [...activeIds].sort());
  const catalog = getSlidesByCourse("A1");
  for (const assignmentId of activeIds) {
    const slide = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(slide, `${assignmentId} missing published slide`);
    assert.ok(catalog.some((item) => item.assignmentId.toUpperCase() === assignmentId));
    const original = getA1PresenterReadingLesson(assignmentId);
    const stages = buildTeachingPresenterStages(slide);
    const readingStages = stages.filter((stage) => stage.variant === "lesson-reading");
    assert.equal(readingStages.length, 1, `${assignmentId} missing dedicated classroom Lesen`);
    const reading = readingStages[0];
    assert.equal(reading.textDe, original.textDe, `${assignmentId} source text changed`);
    assert.ok(reading.textDe.length >= 110);
    assert.equal(reading.items.length, 3);
    assert.equal(reading.answerItems.length, reading.items.length);
    assert.equal(reading.evidence.length, reading.items.length);
    assert.ok(reading.answerItems.every((item) => item.includes("Beleg:")));
    const dictionary = getPresenterReadingPhraseTranslations(assignmentId);
    const matches = segmentReadingPhrases(reading.textDe, dictionary, 80).filter((part) => part.en);
    assert.ok(matches.length >= 4, `${assignmentId} needs more contextual word translations`);
    assert.ok(matches.every((entry) => entry.en !== entry.de && reading.textDe.includes(entry.text)));
  }
  assert.equal(getA1PresenterReadingLesson("A1-TUTORIAL"), null);
  assert.equal(getA1PresenterReadingLesson("A1-12.2"), null);
});

test("A1 glossary never edits scoring, teacher answer keys or earlier levels", () => {
  const a1Slides = getSlidesByCourse("A1");
  assert.ok(a1Slides.some((slide) => slide.assignmentId === "A1-0.1"));
  assert.equal(getPresenterReadingPhraseTranslations("A1-0.1").find((part) => part.de === "Guten Morgen")?.en, "good morning");
  const a2Text = getPresenterReadingPhraseTranslations("A2-1.1");
  assert.ok(a2Text.some((part) => part.de === "Gehalt"), "A2 context-only glossary should remain intact");
});
