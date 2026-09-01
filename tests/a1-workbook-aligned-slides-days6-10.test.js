import test from "node:test";
import assert from "node:assert/strict";
import {
  a1WorkbookAlignedSlidesDays6To10,
  getA1WorkbookAlignedSlideDay6To10,
} from "../src/data/a1WorkbookAlignedSlidesDays6To10.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";

const EXPECTED = {
  "A1-2.3": {
    day: 6,
    grammarRoute: null,
    workbookRoute: "/campus/course/a1-day-6-family-and-hobbies-workbook",
    supportTerms: ["ein bisschen", "conjugated verb first", "gern", "mein Vater"],
  },
  "A1-3": {
    day: 7,
    grammarRoute: "/campus/course/a1-day-7-asking-about-prices-and-preferences",
    workbookRoute: "/campus/course/a1-chapter-3-asking-about-prices-workbook",
    supportTerms: ["kostet", "kosten", "der → er", "mögen", "lieber"],
  },
  "A1-4": {
    day: 8,
    grammarRoute: "/campus/course/forming-basic-statements-german-a1-day-8",
    workbookRoute: "/campus/course/a1-day-8-countries-and-languages-workbook",
    supportTerms: ["woher", "wohin", "nach", "in die Schweiz", "war/hatte"],
  },
  "A1-5": {
    day: 9,
    grammarRoute: "/campus/course/a1-day-9-nominative-and-accusative-cases",
    workbookRoute: "/campus/course/a1-chapter-5-german-cases-workbook",
    supportTerms: ["Nominativ", "Akkusativ", "der → den", "ein → einen", "direct object"],
  },
  "A1-6": {
    day: 10,
    grammarRoute: "/campus/course/objects-and-colors-chapter-6",
    workbookRoute: "/campus/course/a1-day-10-objects-colors-possessive-articles-workbook",
    supportTerms: ["mein Tisch", "meine Tasche", "meinen Tisch", "Ihr", "Lieblingsfarbe"],
  },
};

const part = (slide, label) => slide.workbookConnection.parts.find((entry) => entry.label === label);

test("A1 official Days 6-10 expose five workbook-aligned slides with exact routes", () => {
  assert.equal(a1WorkbookAlignedSlidesDays6To10.length, 5);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA1WorkbookAlignedSlideDay6To10(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.dayNumber, expected.day);
    assert.equal(slide.workbookConnection.grammarUrl, expected.grammarRoute);
    assert.equal(slide.workbookConnection.workbookUrl, expected.workbookRoute);
  }
});

test("A1 Days 6-10 are selected by the native-Node Teaching Slides resolver", () => {
  for (const assignmentId of Object.keys(EXPECTED)) {
    const aligned = getA1WorkbookAlignedSlideDay6To10(assignmentId);
    const resolved = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(resolved, `${assignmentId} should resolve in teachingSlides`);
    assert.equal(resolved.id, aligned.id);
    assert.equal(resolved.dayNumber, aligned.dayNumber);
    assert.equal(resolved.workbookConnection.workbookUrl, aligned.workbookConnection.workbookUrl);
    assert.ok(resolved.teacherSupport, `${assignmentId} should expose teacher support`);
  }
});

test("A1 Days 6-10 teacher support matches the actual lesson language", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const support = buildTeacherSlideSupport(getA1WorkbookAlignedSlideDay6To10(assignmentId));
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

test("A1-2.3 Day 6 keeps all five workbook sections and no invented grammar route", () => {
  const slide = getA1WorkbookAlignedSlideDay6To10("A1-2.3");
  assert.equal(slide.workbookConnection.grammarUrl, null);
  assert.ok(part(slide, "Teil 1 · Family Vocabulary"));
  assert.ok(part(slide, "Teil 2 · Writing About Your Family"));
  assert.ok(part(slide, "Teil 3 · Languages and ein bisschen"));
  assert.ok(part(slide, "Teil 4 · Yes/No Questions"));
  assert.ok(part(slide, "Teil 5 · Hobbies"));
  assert.match(slide.workbookConnection.subtitle, /no separate grammar route/i);
  assert.match(slide.workbookConnection.subtitle, /no formal scored submission/i);
});

test("A1-3 Day 7 does not invent Hören for the current in-app workbook", () => {
  const slide = getA1WorkbookAlignedSlideDay6To10("A1-3");
  assert.ok(part(slide, "Teil 1 · Preise und Kosten"));
  assert.ok(part(slide, "Teil 2 · Writing About Family"));
  assert.ok(part(slide, "Teil 3 · Hobbys"));
  assert.equal(slide.workbookConnection.parts.some((entry) => /Hören/i.test(entry.label)), false);
  assert.match(slide.teacherNotesEn.join(" "), /not a listening workbook/i);
});

test("A1-4 Day 8 distinguishes the neighbor reading from the Anna travel Hören", () => {
  const slide = getA1WorkbookAlignedSlideDay6To10("A1-4");
  assert.ok(part(slide, "Teil 1 · Translation"));
  assert.ok(part(slide, "Teil 2 · Germany's Neighbors"));
  assert.ok(part(slide, "Teil 3 · Hören"));
  assert.match(part(slide, "Teil 2 · Germany's Neighbors").detailEn, /nine neighbors/i);
  assert.match(part(slide, "Teil 3 · Hören").detailEn, /Anna's travel story/i);
});

test("A1-5 Day 9 contains vocabulary, nominative and accusative only", () => {
  const slide = getA1WorkbookAlignedSlideDay6To10("A1-5");
  assert.ok(part(slide, "Teil 1 · Vocabulary Review"));
  assert.ok(part(slide, "Teil 2 · Nominative Case"));
  assert.ok(part(slide, "Teil 3 · Accusative Case"));
  assert.equal(slide.workbookConnection.parts.some((entry) => /Hören/i.test(entry.label)), false);
  assert.match(slide.workbookConnection.subtitle, /no Hören/i);
});

test("A1-6 Day 10 keeps colors in grammar support and apartment tasks in the workbook", () => {
  const slide = getA1WorkbookAlignedSlideDay6To10("A1-6");
  assert.ok(part(slide, "Grammar"));
  assert.ok(part(slide, "Teil 1 · Reading / Writing"));
  assert.ok(part(slide, "Teil 2 · Questions"));
  assert.ok(part(slide, "Teil 3 · Hören"));
  assert.match(part(slide, "Grammar").detailEn, /colors/i);
  assert.match(part(slide, "Teil 2 · Questions").detailEn, /Die Wohnung/i);
  assert.equal(slide.workbookConnection.parts.some((entry) => /Teil .*Color/i.test(entry.label)), false);
});
