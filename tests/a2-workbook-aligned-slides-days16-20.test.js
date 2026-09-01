import test from "node:test";
import assert from "node:assert/strict";
import {
  a2WorkbookAlignedSlidesDays16To20,
  getA2WorkbookAlignedSlideDay16To20,
} from "../src/data/a2WorkbookAlignedSlidesDays16To20.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";

const EXPECTED = {
  "A2-6.16": {
    grammarRoute: "/campus/course/wohlbefinden-und-entspannung-6-16-reflexive-verben-grammar-notes",
    workbookRoute: "/campus/course/a2-day-16-wohlbefinden-und-entspannung-workbook",
    supportTerms: ["mich", "dich", "sich", "uns", "euch"],
  },
  "A2-6.17": {
    grammarRoute: "/campus/course/modal-verbs-day-14-3-6?level=A2&day=17",
    workbookRoute: "/campus/course/a2-day-17-in-die-apotheke-gehen-workbook",
    supportTerms: ["können", "müssen", "sollen", "infinitive"],
  },
  "A2-7.18": {
    grammarRoute: "/campus/course/die-bank-anrufen-7-18-hoefliche-fragen-und-bitten-grammar-notes",
    workbookRoute: "/campus/course/a2-day-18-die-bank-anrufen-workbook",
    supportTerms: ["Könnten Sie", "würde gern", "infinitive", "polite"],
  },
  "A2-7.19": {
    grammarRoute: "/campus/course/einkaufen-wo-und-wie-7-19-oder-denn-grammar-notes",
    workbookRoute: "/campus/course/a2-day-19-einkaufen-wo-und-wie-workbook",
    supportTerms: ["oder", "denn", "main-clause", "subject + verb"],
  },
  "A2-7.20": {
    grammarRoute: "/campus/course/typische-reklamationssituationen-7-20-hoefliche-bitten-und-begruendungen-grammar-notes",
    workbookRoute: "/campus/course/a2-day-20-typische-reklamationssituationen-workbook",
    supportTerms: ["weil", "denn", "Könnten Sie", "Ich hätte gern"],
  },
};

test("A2 days 16-20 each expose the exact canonical grammar and workbook routes", () => {
  assert.equal(a2WorkbookAlignedSlidesDays16To20.length, 5);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay16To20(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.workbookConnection.grammarUrl, expected.grammarRoute);
    assert.equal(slide.workbookConnection.workbookUrl, expected.workbookRoute);
    assert.deepEqual(
      slide.workbookConnection.parts.map((part) => part.label),
      ["Grammar", "Teil 1 · Sprechen", "Teil 2 · Schreiben", "Teil 3 · Lesen", "Teil 4 · Hören"],
    );
  }
});

test("A2 days 16-20 are selected by the native-Node Teaching Slides resolver", () => {
  for (const assignmentId of Object.keys(EXPECTED)) {
    const aligned = getA2WorkbookAlignedSlideDay16To20(assignmentId);
    const resolved = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(resolved, `${assignmentId} should resolve in teachingSlides`);
    assert.equal(resolved.id, aligned.id);
    assert.equal(resolved.workbookConnection.workbookUrl, aligned.workbookConnection.workbookUrl);
  }
});

test("A2 days 16-20 teacher support matches the grammar actually taught in Falowen", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay16To20(assignmentId);
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

test("Day 16 follows the actual reflexive-verbs grammar page", () => {
  const slide = getA2WorkbookAlignedSlideDay16To20("A2-6.16");
  const grammar = slide.workbookConnection.parts.find((part) => part.label === "Grammar");
  assert.match(grammar.detailEn, /Reflexive verbs/i);
  assert.match(grammar.detailEn, /mich, dich, sich, uns and euch/i);
  assert.match(slide.teacherNotesEn.join(" "), /actual Day 16 grammar page.*reflexive verbs/i);
});

test("Day 17 keeps the A2 context query on the shared modal-verbs route", () => {
  const slide = getA2WorkbookAlignedSlideDay16To20("A2-6.17");
  assert.equal(slide.workbookConnection.grammarUrl, "/campus/course/modal-verbs-day-14-3-6?level=A2&day=17");
});

test("Day 19 keeps the furniture-shopping invitation distinct from the consumption lesson", () => {
  const slide = getA2WorkbookAlignedSlideDay16To20("A2-7.19");
  const writing = slide.workbookConnection.parts.find((part) => part.label === "Teil 2 · Schreiben");
  assert.match(writing.detailEn, /invitation/i);
  assert.match(writing.detailEn, /furniture/i);
  assert.match(slide.teacherNotesEn.join(" "), /writing-task shift/i);
});

test("Day 20 marks Lesen as mixed revision and Hören as complaint-specific", () => {
  const slide = getA2WorkbookAlignedSlideDay16To20("A2-7.20");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");
  assert.match(reading.detailEn, /Separate mixed-revision section/i);
  assert.match(reading.detailEn, /job application|career choice/i);
  assert.match(listening.detailEn, /kettle|receipt|return label/i);
  assert.match(slide.teacherNotesEn.join(" "), /Do not present it as complaint-specific reading/i);
});
