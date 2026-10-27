import test from "node:test";
import assert from "node:assert/strict";
import { a2WorkbookAlignedSlides, getA2WorkbookAlignedSlide } from "../src/data/a2WorkbookAlignedSlides.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";

const EXPECTED = {
  "A2-1.1": {
    grammarRoute: "/campus/course/a2-starter-conjunctions-day-1",
    workbookRoute: "/campus/course/a2-day-2-small-talk-workbook",
    supportTerms: ["weil", "denn", "deshalb"],
  },
  "A2-1.2": {
    grammarRoute: "/campus/course/personen-beschreiben-1-2-grammar-notes",
    workbookRoute: "/campus/course/a2-day-2-personen-beschreiben-workbook",
    supportTerms: ["Nominativ", "Akkusativ", "einen kleinen"],
  },
  "A2-1.3": {
    grammarRoute: "/campus/course/dinge-und-personen-vergleichen-1-3-grammar-notes",
    workbookRoute: "/campus/course/a2-day-3-dinge-und-personen-vergleichen-workbook",
    supportTerms: ["genauso", "comparative", "superlative"],
  },
  "A2-2.4": {
    grammarRoute: "/campus/course/wo-moechten-wir-uns-treffen-2-4-grammar-notes",
    workbookRoute: "/campus/course/a2-day-4-wo-moechten-wir-uns-treffen-workbook",
    supportTerms: ["Wo?", "Wohin?", "Dativ", "Akkusativ"],
  },
  "A2-2.5": {
    grammarRoute: "/campus/course/was-machst-du-in-deiner-freizeit-2-5-grammar-notes",
    workbookRoute: "/campus/course/a2-day-5-freizeit-workbook",
    supportTerms: ["separable", "prefix", "modal"],
  },
};

test("A2 days 1-5 each connect teacher slides to all workbook sections", () => {
  assert.equal(a2WorkbookAlignedSlides.length, 5);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlide(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.workbookConnection.grammarUrl, expected.grammarRoute);
    assert.equal(slide.workbookConnection.workbookUrl, expected.workbookRoute);
    assert.deepEqual(
      slide.workbookConnection.parts.map((part) => part.label),
      ["Grammar", "Teil 1 · Sprechen", "Teil 2 · Schreiben", "Teil 3 · Lesen", "Teil 4 · Hören"],
    );
    assert.ok(slide.teacherNotesEn.some((note) => /workbook/i.test(note)));
    assert.ok(slide.interactionFlow.some((step) => /workbook|writing/i.test(`${step.phase} ${step.detailEn}`)));
  }
});

test("A2 days 1-5 use the grammar actually taught in their linked workbook notes", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlide(assignmentId);
    const support = buildTeacherSlideSupport(slide);
    const searchable = [
      ...support.grammarFocusEn,
      ...support.modelExamplesDe,
      ...support.commonMistakesEn,
    ].join(" ").toLowerCase();

    for (const term of expected.supportTerms) {
      assert.ok(
        searchable.includes(term.toLowerCase()),
        `${assignmentId} teacher support should include ${term}`,
      );
    }
  }
});

test("Day 5 explicitly treats the restaurant reading as a separate comprehension task", () => {
  const slide = getA2WorkbookAlignedSlide("A2-2.5");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  assert.match(reading.detailEn, /restaurant/i);
  assert.match(reading.detailEn, /separate comprehension/i);
});
