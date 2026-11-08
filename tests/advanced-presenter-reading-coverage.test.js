import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { getPresenterReadingPhraseTranslations } from "../src/data/presenterReadingPhraseTranslations.js";
import { segmentReadingPhrases } from "../src/data/readingPhraseTranslations.js";
import { ADVANCED_READING_SOURCES } from "../src/data/advancedPresenterReadingSources.js";

test("all 84 B2–C2 teaching lessons have a distinct reading stage with evidence", () => {
  const identifiers = new Set();
  for (const level of ["B2", "C1", "C2"]) {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28, `${level} lesson count changed`);
    for (const slide of slides) {
      const stages = buildTeachingPresenterStages(slide);
      const reading = stages.filter((stage) => stage.variant === "lesson-reading");
      assert.equal(reading.length, 1, `${slide.assignmentId}: expected one Lesen activity`);
      const stage = reading[0];
      assert.ok(stage.textDe.length >= 250, `${slide.assignmentId}: passage too short`);
      assert.ok(!stage.textDe.includes("Simple English:"), `${slide.assignmentId}: mixed-language passage`);
      assert.equal(stage.items.length, 3, `${slide.assignmentId}: three evidence-based checks required`);
      assert.equal(stage.answerItems.length, stage.items.length);
      assert.equal(stage.evidence.length, stage.items.length);
      for (const evidence of stage.evidence) assert.ok(String(evidence).trim().length > 3);
      assert.ok(!identifiers.has(slide.assignmentId), "duplicate assignment ID");
      identifiers.add(slide.assignmentId);
    }
  }
  assert.equal(identifiers.size, 84);
});

test("advanced presenter words map to actual visible German expressions", () => {
  for (const level of ["B2", "C1", "C2"]) {
    for (const slide of getSlidesByCourse(level)) {
      const textDe = buildTeachingPresenterStages(slide).find((stage) => stage.variant === "lesson-reading")?.textDe;
      const entries = getPresenterReadingPhraseTranslations(slide.assignmentId);
      assert.ok(entries.length >= 100, `${slide.assignmentId} must have curated static dictionary`);
      const seen = segmentReadingPhrases(textDe, entries, 80).filter((part) => part.en);
      assert.ok(seen.length >= 3, `${slide.assignmentId}: need at least 3 actual words or expressions`);
      for (const match of seen) {
        assert.ok(textDe.includes(match.text), `${slide.assignmentId}: phrase missing in source`);
        assert.ok(match.en && match.en !== match.text, `${slide.assignmentId}: invalid English meaning`);
      }
    }
  }
});

test("teacher reads original Falowen B2/C1/C2 passages without changing assessment content", () => {
  assert.equal(Object.keys(ADVANCED_READING_SOURCES.B2).length, 7);
  assert.equal(Object.keys(ADVANCED_READING_SOURCES.C1).length, 28);
  assert.equal(Object.keys(ADVANCED_READING_SOURCES.C2).length, 7);
  for (const level of ["B2", "C1", "C2"]) {
    for (const [day, source] of Object.entries(ADVANCED_READING_SOURCES[level])) {
      const slide = getSlidesByCourse(level).find((s) => s.dayNumber === Number(day));
      const stage = buildTeachingPresenterStages(slide).find((s) => s.variant === "lesson-reading");
      assert.equal(stage.textDe, source.paragraphs.join("\n\n"), `${level} Day ${day}: original passage changed`);
    }
  }
});
