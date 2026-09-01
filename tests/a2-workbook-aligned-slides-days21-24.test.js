import test from "node:test";
import assert from "node:assert/strict";
import {
  a2WorkbookAlignedSlidesDays21To24,
  getA2WorkbookAlignedSlideDay21To24,
} from "../src/data/a2WorkbookAlignedSlidesDays21To24.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";

const EXPECTED = {
  "A2-8.21": {
    grammarRoute: "/campus/course/ein-wochenende-planen-8-21-wenn-ob-falls-grammar-notes",
    workbookRoute: "/campus/course/a2-day-21-ein-wochenende-planen-workbook",
    supportTerms: ["wenn", "falls", "ob", "verb", "main clause"],
  },
  "A2-8.22": {
    grammarRoute: "/campus/course/die-woche-planung-8-22-praesens-future-time-phrases-modalverben-grammar-notes",
    workbookRoute: "/campus/course/a2-day-22-die-woche-planung-workbook",
    supportTerms: ["Präsens", "position 2", "können", "müssen", "infinitive"],
  },
  "A2-9.23": {
    grammarRoute: "/campus/course/wie-kommst-du-zur-schule-zur-arbeit-9-23-praepositionen-mit-verkehrsmitteln-grammar-notes",
    workbookRoute: "/campus/course/a2-day-23-wie-kommst-du-zur-schule-oder-zur-arbeit-workbook",
    supportTerms: ["mit + Dativ", "zu + Dativ", "nach", "zu Fuß"],
  },
  "A2-9.24": {
    grammarRoute: "/campus/course/einen-urlaub-planen-9-24-final-a2-grammar-notes",
    workbookRoute: "/campus/course/a2-day-24-einen-urlaub-planen-workbook",
    supportTerms: ["nach", "in + Akkusativ", "ans Meer", "möchte", "werden"],
  },
};

test("A2 days 21-24 expose the exact canonical grammar and workbook routes", () => {
  assert.equal(a2WorkbookAlignedSlidesDays21To24.length, 4);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay21To24(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.workbookConnection.grammarUrl, expected.grammarRoute);
    assert.equal(slide.workbookConnection.workbookUrl, expected.workbookRoute);
    assert.deepEqual(
      slide.workbookConnection.parts.map((part) => part.label),
      ["Grammar", "Teil 1 · Sprechen", "Teil 2 · Schreiben", "Teil 3 · Lesen", "Teil 4 · Hören"],
    );
  }
});

test("A2 days 21-24 are selected by the native-Node Teaching Slides resolver", () => {
  for (const assignmentId of Object.keys(EXPECTED)) {
    const aligned = getA2WorkbookAlignedSlideDay21To24(assignmentId);
    const resolved = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(resolved, `${assignmentId} should resolve in teachingSlides`);
    assert.equal(resolved.id, aligned.id);
    assert.equal(resolved.workbookConnection.workbookUrl, aligned.workbookConnection.workbookUrl);
  }
});

test("A2 days 21-24 teacher support matches the grammar actually taught in Falowen", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay21To24(assignmentId);
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

test("Days 21-24 identify Teil 4 as Goethe listening self-check rather than normal in-app Hören", () => {
  for (const assignmentId of Object.keys(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay21To24(assignmentId);
    const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");
    assert.match(listening.detailEn, /Goethe/i);
    assert.match(listening.detailEn, /self-check|check their own|correct their own/i);
  }
});

test("Day 21 keeps the Stefan Berger reading separate from weekend-condition grammar", () => {
  const slide = getA2WorkbookAlignedSlideDay21To24("A2-8.21");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  assert.match(reading.detailEn, /Separate comprehension topic/i);
  assert.match(reading.detailEn, /Stefan Berger|TV chef/i);
  assert.match(slide.teacherNotesEn.join(" "), /separate biography|Stefan Berger/i);
});

test("Day 22 keeps Gülcan student-life Lesen separate from weekly planning", () => {
  const slide = getA2WorkbookAlignedSlideDay21To24("A2-8.22");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  assert.match(reading.detailEn, /Separate comprehension topic/i);
  assert.match(reading.detailEn, /Gülcan|international student/i);
});

test("Day 23 keeps the transport reading aligned but Hören self-checked", () => {
  const slide = getA2WorkbookAlignedSlideDay21To24("A2-9.23");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");
  assert.match(reading.detailEn, /Matthias, Bernd and Thomas/i);
  assert.match(reading.detailEn, /transport|U-Bahn|motorcycle/i);
  assert.match(listening.detailEn, /officially evaluates Lesen and Schreiben/i);
});

test("Day 24 keeps restaurant and celebration Lesen separate and marks Sprechen as no-submission group practice", () => {
  const slide = getA2WorkbookAlignedSlideDay21To24("A2-9.24");
  const speaking = slide.workbookConnection.parts.find((part) => part.label === "Teil 1 · Sprechen");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  assert.match(speaking.detailEn, /no speaking submission/i);
  assert.match(reading.detailEn, /Separate comprehension topic/i);
  assert.match(reading.detailEn, /wedding|business meal|children's birthday/i);
  assert.match(slide.teacherNotesEn.join(" "), /restaurant\/celebration/i);
});
