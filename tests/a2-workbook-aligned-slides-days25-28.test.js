import test from "node:test";
import assert from "node:assert/strict";
import {
  a2WorkbookAlignedSlidesDays25To28,
  getA2WorkbookAlignedSlideDay25To28,
} from "../src/data/a2WorkbookAlignedSlidesDays25To28.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getSlidesByCourse, getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";

const EXPECTED = {
  "A2-9.25": {
    grammarRoute: null,
    workbookRoute: "/campus/course/a2-day-25-tagesablauf-workbook",
    supportTerms: ["Präsens", "separable", "position 2", "auf", "fern"],
  },
  "A2-10.26": {
    grammarRoute: null,
    workbookRoute: "/campus/course/a2-day-26-gefuehle-in-verschiedenen-situationen-workbook",
    supportTerms: ["wenn", "verb", "main clause", "nervös"],
  },
  "A2-10.27": {
    grammarRoute: null,
    workbookRoute: "/campus/course/a2-day-27-digitale-kommunikation-workbook",
    supportTerms: ["dass", "verb", "Ich finde", "Daten"],
  },
  "A2-10.28": {
    grammarRoute: "/campus/course/ueber-die-zukunft-sprechen-10-28-final-a2-grammar-notes",
    workbookRoute: "/campus/course/a2-day-28-ueber-die-zukunft-sprechen-workbook",
    supportTerms: ["Futur I", "werden", "infinitive", "position 2"],
  },
};

test("A2 days 25-28 expose the real workbook and grammar-link structure", () => {
  assert.equal(a2WorkbookAlignedSlidesDays25To28.length, 4);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay25To28(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.workbookConnection.grammarUrl, expected.grammarRoute);
    assert.equal(slide.workbookConnection.workbookUrl, expected.workbookRoute);
  }
});

test("A2 days 25-28 are selected by the native-Node Teaching Slides resolver", () => {
  for (const assignmentId of Object.keys(EXPECTED)) {
    const aligned = getA2WorkbookAlignedSlideDay25To28(assignmentId);
    const resolved = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(resolved, `${assignmentId} should resolve in teachingSlides`);
    assert.equal(resolved.id, aligned.id);
    assert.equal(resolved.workbookConnection.workbookUrl, aligned.workbookConnection.workbookUrl);
  }
});

test("A2 days 25-28 teacher support matches the grammar actually taught in Falowen", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay25To28(assignmentId);
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

test("Day 25 represents two Lesen sections and explicitly no Hören", () => {
  const slide = getA2WorkbookAlignedSlideDay25To28("A2-9.25");
  const labels = slide.workbookConnection.parts.map((part) => part.label);
  assert.deepEqual(labels, ["Grammar", "Teil 1 · Sprechen", "Teil 2 · Schreiben", "Teil 3 · Lesen", "Teil 4 · Lesen"]);
  assert.match(slide.workbookConnection.subtitle, /two Lesen tasks/i);
  assert.match(slide.workbookConnection.subtitle, /no Hören/i);
  assert.equal(labels.some((label) => /Hören/i.test(label)), false);
  assert.match(slide.workbookConnection.parts.at(-1).detailEn, /Familie Meyer/i);
  assert.match(slide.workbookConnection.parts.at(-1).detailEn, /no listening assignment/i);
});

test("Day 26 keeps the family and childcare reading separate and Hören self-checked", () => {
  const slide = getA2WorkbookAlignedSlideDay25To28("A2-10.26");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");
  assert.match(reading.detailEn, /Separate comprehension topic/i);
  assert.match(reading.detailEn, /Mutterschutz|Elternzeit|childcare/i);
  assert.match(listening.detailEn, /Goethe/i);
  assert.match(listening.detailEn, /not submitted/i);
});

test("Day 27 follows production Goethe self-check behavior instead of stale source questions", () => {
  const slide = getA2WorkbookAlignedSlideDay25To28("A2-10.27");
  const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");
  assert.match(listening.detailEn, /Production behavior/i);
  assert.match(listening.detailEn, /self-check/i);
  assert.match(listening.detailEn, /only Teil 2 and Teil 3 are submitted/i);
  assert.match(slide.teacherNotesEn.join(" "), /source component contains listening questions/i);
  assert.match(slide.teacherNotesEn.join(" "), /production cleanup/i);
});

test("Day 28 uses the canonical Futur-I route and separates Germany-integration Lesen", () => {
  const slide = getA2WorkbookAlignedSlideDay25To28("A2-10.28");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");
  assert.equal(slide.workbookConnection.grammarUrl, "/campus/course/ueber-die-zukunft-sprechen-10-28-final-a2-grammar-notes");
  assert.match(reading.detailEn, /Separate Germany-integration comprehension/i);
  assert.match(reading.detailEn, /Ausländerbehörde|Arbeitsagentur/i);
  assert.match(listening.detailEn, /Goethe/i);
  assert.match(listening.detailEn, /not submitted/i);
});

test("the complete canonical A2 course now resolves to workbook-aligned teacher guides", () => {
  const a2Slides = getSlidesByCourse("A2");
  assert.equal(a2Slides.length, 28);
  assert.deepEqual(a2Slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));
  for (const slide of a2Slides) {
    assert.ok(slide.workbookConnection, `${slide.assignmentId} should have workbookConnection`);
    assert.ok(slide.teacherSupport, `${slide.assignmentId} should have teacherSupport`);
  }
});
