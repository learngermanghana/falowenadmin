import test from "node:test";
import assert from "node:assert/strict";
import {
  a1WorkbookAlignedSlidesDays1To5,
  getA1WorkbookAlignedSlideDay1To5,
} from "../src/data/a1WorkbookAlignedSlidesDays1To5.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";

const EXPECTED = {
  "A1-0.1": {
    day: 1,
    grammarRoute: "/campus/course/basic-greetings-goodbyes-and-how-you-are-day-1",
    workbookRoute: "/campus/course/a1-day-1-greetings-workbook",
    supportTerms: ["Guten Morgen", "Guten Tag", "Guten Abend", "dir", "Ihnen"],
  },
  "A1-0.2": {
    day: 2,
    grammarRoute: "/campus/course/german-alphabet-grammar-notes-day-2",
    workbookRoute: "/campus/course/a1-day-2-german-alphabet-reviewing-workbook",
    supportTerms: ["Ä", "Ö", "Ü", "ß", "Eszett", "buchstabiert"],
  },
  "A1-1.1": {
    day: 2,
    grammarRoute: "/campus/course/singular-pronouns-verb-conjugation-day-2",
    workbookRoute: "/campus/course/a1-day-2-kapitel-1-1-workbook",
    supportTerms: ["ich", "du", "er/sie/es", "heiße", "wohnst"],
  },
  "A1-1.1-practice": {
    day: 3,
    grammarRoute: null,
    workbookRoute: "/campus/course/a1-day-3-schreiben-sprechen-kapitel-1-1-workbook",
    supportTerms: ["Was", "Wer", "Wie", "Wo", "Woher"],
  },
  "A1-1.2": {
    day: 3,
    grammarRoute: "/campus/course/a1-day-3-kapitel-1-2-grammar-notes",
    workbookRoute: "/campus/course/a1-day-3-pronouns-introducing-yourself-workbook",
    supportTerms: ["wir", "ihr", "sie/Sie", "arbeitest", "heißt"],
  },
  "A1-2": {
    day: 4,
    grammarRoute: "/campus/course/german-numbers-1-10-with-pronunciation",
    workbookRoute: "/campus/course/a1-day-4-numbers-for-beginners-workbook",
    supportTerms: ["und", "hundert", "tausend", "fünfundzwanzig"],
  },
  "A1-1.3": {
    day: 5,
    grammarRoute: "/campus/course/a1-day-3-kapitel-1-2-grammar-notes",
    workbookRoute: "/campus/course/a1-day-5-introducing-yourself-and-articles-workbook",
    supportTerms: ["der Tisch", "die Lampe", "das Auto", "adjective", "Woher"],
  },
};

const part = (slide, label) => slide.workbookConnection.parts.find((entry) => entry.label === label);

test("A1 official Days 1-5 expose all seven grouped assignment slides with exact routes", () => {
  assert.equal(a1WorkbookAlignedSlidesDays1To5.length, 7);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA1WorkbookAlignedSlideDay1To5(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.dayNumber, expected.day);
    assert.equal(slide.workbookConnection.grammarUrl, expected.grammarRoute);
    assert.equal(slide.workbookConnection.workbookUrl, expected.workbookRoute);
  }
});

test("A1 Days 1-5 use the official grouped day mapping", () => {
  assert.equal(getA1WorkbookAlignedSlideDay1To5("A1-0.1").dayNumber, 1);
  assert.equal(getA1WorkbookAlignedSlideDay1To5("A1-0.2").dayNumber, 2);
  assert.equal(getA1WorkbookAlignedSlideDay1To5("A1-1.1").dayNumber, 2);
  assert.equal(getA1WorkbookAlignedSlideDay1To5("A1-1.1-PRACTICE").dayNumber, 3);
  assert.equal(getA1WorkbookAlignedSlideDay1To5("A1-1.2").dayNumber, 3);
  assert.equal(getA1WorkbookAlignedSlideDay1To5("A1-2").dayNumber, 4);
  assert.equal(getA1WorkbookAlignedSlideDay1To5("A1-1.3").dayNumber, 5);
});

test("A1 Days 1-5 are selected by the native-Node Teaching Slides resolver", () => {
  for (const assignmentId of Object.keys(EXPECTED)) {
    const aligned = getA1WorkbookAlignedSlideDay1To5(assignmentId);
    const resolved = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(resolved, `${assignmentId} should resolve in teachingSlides`);
    assert.equal(resolved.id, aligned.id);
    assert.equal(resolved.dayNumber, aligned.dayNumber);
    assert.equal(resolved.workbookConnection.workbookUrl, aligned.workbookConnection.workbookUrl);
    assert.ok(resolved.teacherSupport, `${assignmentId} should expose teacher support`);
  }
});

test("A1 Days 1-5 teacher support matches the language actually taught", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const support = buildTeacherSlideSupport(getA1WorkbookAlignedSlideDay1To5(assignmentId));
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

test("A1-0.2 preserves Teil 1 plus Teil 3 and does not invent Teil 2", () => {
  const slide = getA1WorkbookAlignedSlideDay1To5("A1-0.2");
  assert.ok(part(slide, "Teil 1 · Reading and Questions"));
  assert.ok(part(slide, "Teil 3 · Hören"));
  assert.equal(slide.workbookConnection.parts.some((entry) => /Teil 2/i.test(entry.label)), false);
  assert.match(slide.workbookConnection.subtitle, /no Teil 2/i);
});

test("A1-1.1-practice is self-practice with no direct grammar route or tutor submission", () => {
  const slide = getA1WorkbookAlignedSlideDay1To5("A1-1.1-practice");
  assert.equal(slide.workbookConnection.grammarUrl, null);
  assert.match(slide.workbookConnection.subtitle, /Self-practice/i);
  assert.match(slide.workbookConnection.subtitle, /no tutor-marked submission/i);
  assert.match(slide.teacherNotesEn.join(" "), /not a tutor-marked assignment/i);
});

test("A1-2 Day 4 contains no Hören section", () => {
  const slide = getA1WorkbookAlignedSlideDay1To5("A1-2");
  assert.ok(part(slide, "Teil 1 · Reading / Writing"));
  assert.ok(part(slide, "Teil 2 · Questions"));
  assert.equal(slide.workbookConnection.parts.some((entry) => /Hören/i.test(entry.label)), false);
  assert.match(slide.workbookConnection.subtitle, /no Hören/i);
});

test("A1-1.3 Day 5 remains interactive self-practice rather than tutor-marked work", () => {
  const slide = getA1WorkbookAlignedSlideDay1To5("A1-1.3");
  assert.match(slide.workbookConnection.subtitle, /Interactive self-practice/i);
  assert.match(slide.workbookConnection.subtitle, /No formal tutor-marked submission/i);
  assert.ok(part(slide, "Teil 1 · Articles"));
  assert.ok(part(slide, "Teil 2 · Adjectives"));
  assert.ok(part(slide, "Teil 3 · Personal Information"));
  assert.ok(part(slide, "Teil 4 · Mini Dialogue / W-Fragen"));
});


test("A1 Day 2 pronoun slide stays on pronouns and basic conjugation", () => {
  const slide = getTeachingSlideByAssignmentId("A1-1.1");
  const searchable = [
    slide.objective,
    ...(slide.warmupQuestionsDe || []),
    ...(slide.studentQuestionsDe || []),
    ...(slide.keyPhrasesDe || []),
    ...(slide.teacherNotesEn || []),
    ...(slide.interactionFlow || []).map((item) => item.detailEn),
    slide.wrapUpTaskDe,
  ].join(" ");

  assert.match(searchable, /Ich lernen|Ich lerne/);
  assert.match(searchable, /du.*-st|-st.*du/i);
  assert.match(searchable, /er\/sie\/es.*-t|-t.*er\/sie\/es/i);
  assert.match(searchable, /ich lerne/);
  assert.match(searchable, /du lernst/);
  assert.match(searchable, /er\/sie\/es lernt/);
  assert.doesNotMatch(searchable, /Stell dich|self-introduction|Wie heißt du|Woher kommst du|Wo wohnst du/i);
});

test("A1 alphabet slide checks the actual alphabet knowledge taught in the Course Book", () => {
  const slide = getTeachingSlideByAssignmentId("A1-0.2");
  const questions = (slide.studentQuestionsDe || []).join(" ");

  assert.match(questions, /Wie viele Buchstaben/);
  assert.match(questions, /Warum sind Ä, Ö und Ü wichtig/);
  assert.match(questions, /Buchstaben V/);
  assert.match(questions, /Buchstaben W/);
  assert.match(questions, /Buchstaben I/);
  assert.match(questions, /Buchstaben A/);
});


test("A1 Day 2 tests all subject-pronoun verb endings and sie/Sie", () => {
  const slide = getTeachingSlideByAssignmentId("A1-1.1");
  const searchable = [
    ...(slide.keyPhrasesDe || []),
    ...(slide.studentQuestionsDe || []),
    ...(slide.teacherNotesEn || []),
    ...(slide.teacherSupport?.grammarFocusEn || []),
    ...(slide.teacherSupport?.modelExamplesDe || []),
  ].join(" ");

  assert.match(searchable, /ich.*-e/i);
  assert.match(searchable, /du.*-st/i);
  assert.match(searchable, /er\s*\/\s*sie\s*\/\s*es.*-t/i);
  assert.match(searchable, /wir.*-en/i);
  assert.match(searchable, /ihr.*-t/i);
  assert.match(searchable, /sie\s*\/\s*Sie.*-en/i);
  assert.match(searchable, /sie und Sie|sie versus Sie|sie from Sie/i);
  assert.match(searchable, /Wir lernt|Wir lernen/);
  assert.match(searchable, /Ihr lernen|Ihr lernt/);
  assert.doesNotMatch(searchable, /Wie heißt du|Woher kommst du|Stell dich/i);
});
