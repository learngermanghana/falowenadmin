import test from "node:test";
import assert from "node:assert/strict";
import {
  b1WorkbookAlignedSlidesDays11To20,
  getB1WorkbookAlignedSlideDay11To20,
} from "../src/data/b1WorkbookAlignedSlidesDays11To20.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";

const EXPECTED = {
  "B1-4.11": { day: 11, grammar: true, terms: ["einander", "miteinander", "voneinander", "aufeinander"] },
  "B1-4.12": { day: 12, grammar: true, terms: ["Perfekt", "Präteritum", "als", "nachdem"] },
  "B1-4.13": { day: 13, grammar: true, terms: ["Passiv", "wurde", "dass", "würde"] },
  "B1-5.14": { day: 14, grammar: true, terms: ["während", "hingegen", "einerseits", "Dativ"] },
  "B1-5.15": { day: 15, grammar: true, terms: ["Passiv", "Modalpassiv", "Partizip", "werden"] },
  "B1-5.16": { day: 16, grammar: true, terms: ["weil", "sollte", "Infinitiv", "damit", "um ... zu"] },
  "B1-5.17": { day: 17, grammar: false, terms: ["wenn", "weil", "dass", "um ... zu", "damit"] },
  "B1-6.18": { day: 18, grammar: true, terms: ["Relativ", "je nachdem", "um ... zu", "Infinitiv"] },
  "B1-6.19": { day: 19, grammar: true, terms: ["Sie", "würde", "könnte", "wäre", "deshalb"] },
  "B1-6.20": { day: 20, grammar: false, terms: ["Relative", "muss", "können", "weil"] },
};

const STANDARD_PARTS = ["Grammar", "Teil 1 · Sprechen", "Teil 2 · Schreiben", "Teil 3 · Lesen", "Teil 4 · Hören"];

const part = (slide, label) => slide.workbookConnection.parts.find((entry) => entry.label === label);

test("B1 days 11-20 expose the real workbook and grammar-link structure", () => {
  assert.equal(b1WorkbookAlignedSlidesDays11To20.length, 10);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getB1WorkbookAlignedSlideDay11To20(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.dayNumber, expected.day);
    assert.equal(slide.workbookConnection.workbookUrl, `/campus/course/lesson/B1/${expected.day}?view=workbook`);
    assert.equal(
      slide.workbookConnection.grammarUrl,
      expected.grammar ? `/campus/course/lesson/B1/${expected.day}?view=grammar` : null,
      `${assignmentId} should not invent a grammar route that the current student lesson does not expose`,
    );
    assert.deepEqual(slide.workbookConnection.parts.map((entry) => entry.label), STANDARD_PARTS);
  }
});

test("B1 days 11-20 are selected by the native-Node Teaching Slides resolver", () => {
  for (const assignmentId of Object.keys(EXPECTED)) {
    const aligned = getB1WorkbookAlignedSlideDay11To20(assignmentId);
    const resolved = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(resolved, `${assignmentId} should resolve in teachingSlides`);
    assert.equal(resolved.id, aligned.id);
    assert.equal(resolved.workbookConnection.workbookUrl, aligned.workbookConnection.workbookUrl);
    assert.ok(resolved.teacherSupport, `${assignmentId} should expose teacher support`);
  }
});

test("B1 days 11-20 teacher support follows the grammar actually taught in Falowen", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getB1WorkbookAlignedSlideDay11To20(assignmentId);
    const support = buildTeacherSlideSupport(slide);
    const searchable = [
      ...support.grammarFocusEn,
      ...support.modelExamplesDe,
      ...support.commonMistakesEn,
    ].join(" ").toLowerCase();

    for (const term of expected.terms) {
      assert.ok(searchable.includes(term.toLowerCase()), `${assignmentId} teacher support should include ${term}`);
    }
  }
});

test("Day 12 connects the adventure presentation to the informal Felix letter", () => {
  const slide = getB1WorkbookAlignedSlideDay11To20("B1-4.12");
  assert.match(part(slide, "Teil 2 · Schreiben").detailEn, /Felix/i);
  assert.match(part(slide, "Teil 2 · Schreiben").detailEn, /difficulty/i);
  assert.match(part(slide, "Teil 2 · Schreiben").detailEn, /learned/i);
});

test("Day 14 keeps the formal Weiterbildung refusal separate from the learning-method comparison", () => {
  const slide = getB1WorkbookAlignedSlideDay11To20("B1-5.14");
  const writing = part(slide, "Teil 2 · Schreiben").detailEn;
  assert.match(writing, /formal-email/i);
  assert.match(writing, /six-month/i);
  assert.match(writing, /after normal working hours/i);
  assert.match(writing, /decline/i);
});

test("Day 17 does not invent a direct grammar route and points teachers to the workbook Grammar tab", () => {
  const slide = getB1WorkbookAlignedSlideDay11To20("B1-5.17");
  assert.equal(slide.workbookConnection.grammarUrl, null);
  assert.match(slide.workbookConnection.subtitle, /workbook's Grammar tab/i);
  assert.match(part(slide, "Grammar").detailEn, /inside the workbook Grammar tab/i);
});

test("Day 19 records that Teil 4 has no Hören medium and is a second Lesen task", () => {
  const slide = getB1WorkbookAlignedSlideDay11To20("B1-6.19");
  const reading = part(slide, "Teil 3 · Lesen").detailEn;
  const listeningSlot = part(slide, "Teil 4 · Hören").detailEn;

  assert.match(reading, /Feldheim/i);
  assert.match(reading, /green energy|grüne Energie/i);
  assert.match(listeningSlot, /NO HÖREN MEDIUM/i);
  assert.match(listeningSlot, /second reading/i);
  assert.match(listeningSlot, /Murten/i);
  assert.match(slide.workbookConnection.subtitle, /no audio/i);
});

test("Day 20 keeps the lost-wallet Lesen separate and Hören self-check only", () => {
  const slide = getB1WorkbookAlignedSlideDay11To20("B1-6.20");
  const reading = part(slide, "Teil 3 · Lesen").detailEn;
  const listening = part(slide, "Teil 4 · Hören").detailEn;

  assert.equal(slide.workbookConnection.grammarUrl, null);
  assert.match(reading, /Susanne/i);
  assert.match(reading, /lost-wallet|wallet/i);
  assert.match(listening, /SELF-CHECK ONLY/i);
  assert.match(listening, /do not submit/i);
  assert.match(slide.workbookConnection.subtitle, /no direct grammar link/i);
  assert.match(slide.workbookConnection.subtitle, /self-check only/i);
});

test("all B1 Day 11-20 aligned slides carry teacher-first support and workbook connections", () => {
  for (const slide of b1WorkbookAlignedSlidesDays11To20) {
    assert.ok(slide.workbookConnection, `${slide.assignmentId} should have workbookConnection`);
    assert.ok(slide.teacherSupport, `${slide.assignmentId} should have teacherSupport`);
    assert.ok(slide.teacherNotesEn.length >= 4, `${slide.assignmentId} should have lesson-specific teacher notes`);
    assert.ok(slide.interactionFlow.length >= 4, `${slide.assignmentId} should have guided classroom practice`);
  }
});
