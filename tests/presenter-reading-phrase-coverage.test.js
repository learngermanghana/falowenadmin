import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { splitPresenterSentences } from "../src/utils/presenterSentenceNumbering.js";
import { segmentReadingPhrases, getReadingPhraseTranslations } from "../src/data/readingPhraseTranslations.js";
import {
  PRESENTER_READING_PHRASES,
  getPresenterReadingPhraseTranslations,
} from "../src/data/presenterReadingPhraseTranslations.js";

test("all 56 actual A2/B1 lesson-reading stages have real tappable presenter vocabulary", () => {
  const checked = [];
  for (const level of ["A2", "B1"]) {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28, `${level}: unexpected lesson count`);
    for (const slide of slides) {
      const stage = buildTeachingPresenterStages(slide).find((item) => item.variant === "lesson-reading");
      assert.ok(stage?.textDe, `${slide.assignmentId}: missing presenter reading stage`);
      const phrases = getPresenterReadingPhraseTranslations(slide.assignmentId);
      const sentences = splitPresenterSentences(stage.textDe);
      assert.equal(sentences.length, 5, `${slide.assignmentId}: source changed; review glossary`);
      assert.ok(phrases.length >= 5, `${slide.assignmentId}: needs at least five curated phrase meanings`);
      const rendered = segmentReadingPhrases(stage.textDe, phrases);
      const tappable = rendered.filter((part) => part.en);
      assert.ok(tappable.length >= 5, `${slide.assignmentId}: not enough tappable phrases in the actual passage`);
      for (const { de, en } of phrases) {
        assert.ok(en && en !== de && en.length >= 3, `${slide.assignmentId}: invalid English for ${de}`);
        const exact = segmentReadingPhrases(stage.textDe, [{ de, en }]).filter((part) => part.en);
        assert.equal(exact.length, 1, `${slide.assignmentId}: ${de} does not appear as a whole phrase in presenter text`);
      }
      for (const [index, sentence] of sentences.entries()) {
        const underlined = segmentReadingPhrases(sentence, phrases).filter((part) => part.en);
        assert.ok(underlined.length >= 1, `${slide.assignmentId}: no vocabulary in sentence ${index + 1}`);
      }
      checked.push(slide.assignmentId);
    }
  }
  assert.equal(checked.length, 56);
  assert.deepEqual(new Set(checked).size, 56);
  assert.deepEqual(Object.keys(PRESENTER_READING_PHRASES).sort(), checked.sort(),
    "Presenter glossary must be reviewed whenever a lesson is added, renamed, or removed");
});

test("presenter glossary does not reuse unrelated student-workbook day vocabulary", () => {
  const presenter = getPresenterReadingPhraseTranslations("A2-1.1");
  assert.ok(presenter.some((part) => part.de === "Gehalt"));
  assert.ok(!presenter.some((part) => part.de === "Mittagspause"));
  assert.ok(getReadingPhraseTranslations("A2", 1).some((part) => part.de === "Mittagspause"));
  assert.deepEqual(getPresenterReadingPhraseTranslations("A2-99.99"), []);
});

test("teaching slide passes assignment ID to both read-aloud and full-text glossary renderers", () => {
  const presenter = readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const component = readFileSync(new URL("../src/components/InlineReadingTranslations.jsx", import.meta.url), "utf8");
  const binding = /<InlineReadingTranslations text=\{text\} level=\{presenterLevel\} day=\{presenterReadingDay\} assignmentId=\{slide\.assignmentId\} \/>/g;
  assert.equal([...presenter.matchAll(binding)].length, 2);
  assert.match(component, /assignmentId\s*\?\s*getPresenterReadingPhraseTranslations\(assignmentId\)/);
  assert.match(component, /segmentReadingPhrases\(text, entries\)/);
});
