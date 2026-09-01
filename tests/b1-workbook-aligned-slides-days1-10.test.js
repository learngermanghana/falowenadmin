import test from "node:test";
import assert from "node:assert/strict";
import {
  b1WorkbookAlignedSlidesDays1To10,
  getB1WorkbookAlignedSlideDay1To10,
} from "../src/data/b1WorkbookAlignedSlidesDays1To10.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";

const EXPECTED = {
  "B1-1.1": { day: 1, supportTerms: ["Präsens", "Perfekt", "haben", "sein", "Partizip"] },
  "B1-1.2": { day: 2, supportTerms: ["adjective", "weil", "denn", "deshalb"] },
  "B1-1.3": { day: 3, supportTerms: ["Nominativ", "Akkusativ", "Dativ", "einen erfolgreichen"] },
  "B1-2.4": { day: 4, supportTerms: ["sowohl", "sondern auch", "einerseits", "weder"] },
  "B1-2.5": { day: 5, supportTerms: ["Könnten Sie", "Wäre", "würde", "indirect"] },
  "B1-2.6": { day: 6, supportTerms: ["Komparativ", "weil", "obwohl", "Relative"] },
  "B1-3.7": { day: 7, supportTerms: ["Genitiv", "wegen", "trotz", "des hohen"] },
  "B1-3.8": { day: 8, supportTerms: ["sollte", "muss", "kann", "infinitive"] },
  "B1-3.9": { day: 9, supportTerms: ["um ... zu", "damit", "indem", "obwohl"] },
  "B1-4.10": { day: 10, supportTerms: ["Komparativ", "Superlativ", "so/genauso", "je ... desto"] },
};

const STANDARD_PARTS = ["Grammar", "Teil 1 · Sprechen", "Teil 2 · Schreiben", "Teil 3 · Lesen", "Teil 4 · Hören"];

test("B1 days 1-10 expose live in-app grammar and workbook routes", () => {
  assert.equal(b1WorkbookAlignedSlidesDays1To10.length, 10);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getB1WorkbookAlignedSlideDay1To10(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.dayNumber, expected.day);
    assert.equal(slide.workbookConnection.grammarUrl, `/campus/course/lesson/B1/${expected.day}?view=grammar`);
    assert.equal(slide.workbookConnection.workbookUrl, `/campus/course/lesson/B1/${expected.day}?view=workbook`);
    assert.deepEqual(slide.workbookConnection.parts.map((part) => part.label), STANDARD_PARTS);
  }
});

test("B1 days 1-10 are selected by the native-Node Teaching Slides resolver", () => {
  for (const assignmentId of Object.keys(EXPECTED)) {
    const aligned = getB1WorkbookAlignedSlideDay1To10(assignmentId);
    const resolved = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(resolved, `${assignmentId} should resolve in teachingSlides`);
    assert.equal(resolved.id, aligned.id);
    assert.equal(resolved.workbookConnection.workbookUrl, aligned.workbookConnection.workbookUrl);
    assert.ok(resolved.teacherSupport, `${assignmentId} should expose teacher support`);
  }
});

test("B1 days 1-10 teacher support matches the grammar actually rendered in Falowen", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getB1WorkbookAlignedSlideDay1To10(assignmentId);
    const support = buildTeacherSlideSupport(slide);
    const searchable = [
      ...support.grammarFocusEn,
      ...support.modelExamplesDe,
      ...support.commonMistakesEn,
    ].join(" ").toLowerCase();

    for (const term of expected.supportTerms) {
      assert.ok(searchable.includes(term.toLowerCase()), `${assignmentId} teacher support should include ${term}`);
    }
  }
});

test("Day 2 follows the rendered adjective plus weil grammar rather than stale catalog metadata", () => {
  const slide = getB1WorkbookAlignedSlideDay1To10("B1-1.2");
  const grammar = slide.workbookConnection.parts.find((part) => part.label === "Grammar");
  assert.match(grammar.detailEn, /adjective/i);
  assert.match(grammar.detailEn, /weil/i);
  assert.match(grammar.detailEn, /denn/i);
  assert.match(grammar.detailEn, /deshalb/i);
});

test("Day 3 follows the rendered adjective-declension grammar across three cases", () => {
  const slide = getB1WorkbookAlignedSlideDay1To10("B1-1.3");
  const grammar = slide.workbookConnection.parts.find((part) => part.label === "Grammar");
  assert.match(grammar.detailEn, /Nominativ/i);
  assert.match(grammar.detailEn, /Akkusativ/i);
  assert.match(grammar.detailEn, /Dativ/i);
  assert.match(slide.teacherSupport.modelExamplesDe.join(" "), /einen klaren Plan|einen.*Plan/i);
});

test("Day 7 marks the sugar text plus advertisement matching as a separate reading section", () => {
  const slide = getB1WorkbookAlignedSlideDay1To10("B1-3.7");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");
  assert.match(reading.detailEn, /sugar/i);
  assert.match(reading.detailEn, /advertisement/i);
  assert.match(reading.detailEn, /A–F|A-F/i);
  assert.match(listening.detailEn, /hidden sugar/i);
  assert.match(slide.teacherNotesEn.join(" "), /workbook shift/i);
});

test("Day 8 keeps medical-hero Lesen and Hören distinct from the healthy-lifestyle production task", () => {
  const slide = getB1WorkbookAlignedSlideDay1To10("B1-3.8");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");
  assert.match(reading.detailEn, /medical-hero|Medizinwelt/i);
  assert.match(listening.detailEn, /Herr Weber/i);
  assert.match(slide.teacherNotesEn.join(" "), /separate/i);
});

test("Days 9 and 10 explicitly mark Hören as self-check only and not submitted", () => {
  for (const assignmentId of ["B1-3.9", "B1-4.10"]) {
    const slide = getB1WorkbookAlignedSlideDay1To10(assignmentId);
    const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");
    assert.match(listening.detailEn, /SELF-CHECK ONLY/i);
    assert.match(listening.detailEn, /not submitted/i);
    assert.match(slide.workbookConnection.subtitle, /self-check only/i);
    assert.match(slide.workbookConnection.subtitle, /not submitted/i);
  }
});

test("all B1 Day 1-10 aligned slides carry teacher-first support and workbook connections", () => {
  for (const slide of b1WorkbookAlignedSlidesDays1To10) {
    assert.ok(slide.workbookConnection, `${slide.assignmentId} should have workbookConnection`);
    assert.ok(slide.teacherSupport, `${slide.assignmentId} should have teacherSupport`);
    assert.ok(slide.teacherNotesEn.length >= 4, `${slide.assignmentId} should have lesson-specific teacher notes`);
    assert.ok(slide.interactionFlow.length >= 4, `${slide.assignmentId} should have guided classroom practice`);
  }
});
