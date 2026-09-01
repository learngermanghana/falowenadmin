import test from "node:test";
import assert from "node:assert/strict";
import {
  a2WorkbookAlignedSlidesDays6To10,
  getA2WorkbookAlignedSlideDay6To10,
} from "../src/data/a2WorkbookAlignedSlidesDays6To10.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";

const EXPECTED = {
  "A2-3.6": {
    grammarRoute: "/campus/course/moebel-und-raeume-3-6-grammar-notes",
    workbookRoute: "/campus/course/a2-day-6-moebel-und-raeume-workbook",
    supportTerms: ["Wo?", "Wohin?", "Dativ", "Akkusativ", "Wechselpräpositionen"],
  },
  "A2-3.7": {
    grammarRoute: "/campus/course/relativsaetze-die-der-das-wohnung-suchen-3-7-notes",
    workbookRoute: "/campus/course/a2-day-7-eine-wohnung-suchen-workbook",
    supportTerms: ["relative", "der", "die", "das", "verb"],
  },
  "A2-3.8": {
    grammarRoute: "/campus/course/imperativ-rezepte-und-essen-3-8-grammar-notes",
    workbookRoute: "/campus/course/a2-day-8-rezepte-und-essen-workbook",
    supportTerms: ["Imperative", "du", "ihr", "Sie", "Nimm"],
  },
  "A2-4.9": {
    grammarRoute: "/campus/course/perfekt-urlaub-4-9-grammar-notes",
    workbookRoute: "/campus/course/a2-day-9-urlaub-workbook",
    supportTerms: ["Perfekt", "haben", "sein", "Partizip", "angekommen"],
  },
  "A2-4.10": {
    grammarRoute: "/campus/course/praeteritum-tourismus-und-traditionelle-feste-4-10-grammar-notes",
    workbookRoute: "/campus/course/a2-day-10-tourismus-und-traditionelle-feste-workbook",
    supportTerms: ["Präteritum", "war", "hatte", "ging", "fuhr"],
  },
};

test("A2 days 6-10 each expose the exact Falowen grammar and workbook routes", () => {
  assert.equal(a2WorkbookAlignedSlidesDays6To10.length, 5);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay6To10(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.workbookConnection.grammarUrl, expected.grammarRoute);
    assert.equal(slide.workbookConnection.workbookUrl, expected.workbookRoute);
    assert.deepEqual(
      slide.workbookConnection.parts.map((part) => part.label),
      ["Grammar", "Teil 1 · Sprechen", "Teil 2 · Schreiben", "Teil 3 · Lesen", "Teil 4 · Hören"],
    );
    assert.ok(slide.teacherNotesEn.some((note) => /workbook|teil|lesen|hören/i.test(note)));
  }
});

test("A2 days 6-10 teacher support matches the grammar actually taught in Falowen", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay6To10(assignmentId);
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

test("Day 8 makes the restaurant email distinct from the recipe speaking lesson", () => {
  const slide = getA2WorkbookAlignedSlideDay6To10("A2-3.8");
  const writing = slide.workbookConnection.parts.find((part) => part.label === "Teil 2 · Schreiben");
  assert.match(writing.detailEn, /separate application task/i);
  assert.match(writing.detailEn, /restaurant/i);
  assert.match(slide.teacherNotesEn.join(" "), /not a recipe-writing task/i);
});

test("Day 9 identifies Kultur und Freizeit as a separate reading-comprehension topic", () => {
  const slide = getA2WorkbookAlignedSlideDay6To10("A2-4.9");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  assert.match(reading.detailEn, /separate comprehension topic/i);
  assert.match(reading.detailEn, /Kultur und Freizeit/i);
});

test("Day 10 identifies Grundrechte as separate from the tourism and festival lesson", () => {
  const slide = getA2WorkbookAlignedSlideDay6To10("A2-4.10");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  assert.match(reading.detailEn, /separate comprehension topic/i);
  assert.match(reading.detailEn, /Grundgesetz|rights and duties/i);
  assert.match(slide.teacherNotesEn.join(" "), /separate Grundrechte/i);
});
