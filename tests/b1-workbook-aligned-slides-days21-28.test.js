import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  b1WorkbookAlignedSlidesDays21To28,
  getB1WorkbookAlignedSlideDay21To28,
} from "../src/data/b1WorkbookAlignedSlidesDays21To28.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getTeachingSlideByAssignmentId, getSlidesByCourse } from "../src/data/teachingSlides.js";

const answerDictionary = JSON.parse(
  readFileSync(new URL("../src/data/answers_dictionary.json", import.meta.url), "utf8"),
);
const contractByAssignmentId = Object.fromEntries(
  Object.values(answerDictionary)
    .filter((entry) => entry?.assignment_id)
    .map((entry) => [entry.assignment_id, entry]),
);

const EXPECTED = {
  "B1-7.21": { day: 21, directGrammar: true, terms: ["obwohl", "während", "einerseits", "zwar"] },
  "B1-7.22": { day: 22, directGrammar: false, terms: ["dass", "relative", "miteinander", "füreinander"] },
  "B1-7.23": { day: 23, directGrammar: false, terms: ["könnten", "würde", "wenn", "weil"] },
  "B1-8.24": { day: 24, directGrammar: false, terms: ["dass", "weil", "um … zu", "sollten", "einerseits"] },
  "B1-8.25": { day: 25, directGrammar: false, terms: ["Könnten Sie", "dass", "deshalb", "erstatten"] },
  "B1-9.26": { day: 26, directGrammar: false, terms: ["wenn", "falls", "würden", "sollten"] },
  "B1-10.27": { day: 27, directGrammar: false, terms: ["indem", "dass", "wenn", "könnte"] },
  "B1-10.28": { day: 28, directGrammar: false, terms: ["indem", "weil", "trotzdem", "dass"] },
};

const part = (slide, label) => slide.workbookConnection.parts.find((entry) => entry.label === label);

test("B1 days 21-28 expose exact workbook routes without inventing grammar links", () => {
  assert.equal(b1WorkbookAlignedSlidesDays21To28.length, 8);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getB1WorkbookAlignedSlideDay21To28(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.dayNumber, expected.day);
    assert.equal(slide.workbookConnection.workbookUrl, `/campus/course/lesson/B1/${expected.day}?view=workbook`);
    assert.equal(
      slide.workbookConnection.grammarUrl,
      expected.directGrammar ? `/campus/course/lesson/B1/${expected.day}?view=grammar` : null,
      `${assignmentId} should reflect the grammar route actually exposed by the current student lesson`,
    );
  }
});

test("B1 days 21-28 are selected by the native-Node Teaching Slides resolver", () => {
  for (const assignmentId of Object.keys(EXPECTED)) {
    const aligned = getB1WorkbookAlignedSlideDay21To28(assignmentId);
    const resolved = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(resolved, `${assignmentId} should resolve in teachingSlides`);
    assert.equal(resolved.id, aligned.id);
    assert.equal(resolved.workbookConnection.workbookUrl, aligned.workbookConnection.workbookUrl);
    assert.ok(resolved.teacherSupport, `${assignmentId} should expose teacher support`);
  }
});

test("B1 days 21-28 teacher support follows the language actually taught by the workbooks", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getB1WorkbookAlignedSlideDay21To28(assignmentId);
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

test("Day 21 has no Teil 4 and matches the marking contract", () => {
  const slide = getB1WorkbookAlignedSlideDay21To28("B1-7.21");
  const contract = contractByAssignmentId["B1-7.21"];
  assert.deepEqual(contract.expectedParts, ["teil2", "teil3"]);
  assert.ok(contract.excludedParts.includes("teil4"));
  assert.equal(slide.workbookConnection.parts.some((entry) => /Teil 4/i.test(entry.label)), false);
  assert.match(slide.workbookConnection.subtitle, /no Teil 4/i);
  assert.match(slide.workbookConnection.subtitle, /excluded/i);
});

test("Day 22 follows the grader's seven-plus-three Berlin/Bewerbung answer split", () => {
  const slide = getB1WorkbookAlignedSlideDay21To28("B1-7.22");
  const contract = contractByAssignmentId["B1-7.22"];
  assert.deepEqual(contract.expectedParts, ["teil2", "teil3", "teil4"]);
  assert.equal(Object.keys(contract.answers.teil3).length, 7);
  assert.equal(Object.keys(contract.answers.teil4).length, 3);

  const reading = part(slide, "Teil 3 · Lesen").detailEn;
  const secondReading = part(slide, "Teil 4 · Lesen").detailEn;
  assert.match(reading, /Berlin/i);
  assert.match(reading, /Bewerbung/i);
  assert.match(reading, /1–5|1-5/i);
  assert.match(reading, /1–2|1-2/i);
  assert.match(reading, /seven/i);
  assert.match(reading, /Teil 3/i);
  assert.match(secondReading, /Bewerbung/i);
  assert.match(secondReading, /3–5|3-5/i);
  assert.match(secondReading, /three/i);
  assert.match(secondReading, /Teil 4/i);
});

test("Day 23 keeps the planned listening placeholder out of scoring", () => {
  const slide = getB1WorkbookAlignedSlideDay21To28("B1-7.23");
  const contract = contractByAssignmentId["B1-7.23"];
  assert.deepEqual(contract.expectedParts, ["teil2", "teil3"]);
  assert.ok(contract.excludedParts.includes("teil4"));
  const listening = part(slide, "Teil 4 · Hören").detailEn;
  assert.match(listening, /NO SCORED TEIL 4/i);
  assert.match(listening, /planned listening placeholder/i);
  assert.match(listening, /excludes?/i);
});

test("Day 24 flags the seven-statement workbook versus five-reference-answer grading mismatch", () => {
  const slide = getB1WorkbookAlignedSlideDay21To28("B1-8.24");
  const contract = contractByAssignmentId["B1-8.24"];
  assert.deepEqual(contract.expectedParts, ["teil2", "teil3"]);
  assert.ok(contract.excludedParts.includes("teil4"));
  assert.equal(Object.keys(contract.answers.teil3).length, 5);
  const reading = part(slide, "Teil 3 · Lesen").detailEn;
  const listening = part(slide, "Teil 4 · Hören").detailEn;
  assert.match(reading, /seven/i);
  assert.match(reading, /five reference answers/i);
  assert.match(listening, /UNSCORED/i);
  assert.match(listening, /excludes?/i);
});

test("Day 25 excludes the removed listening and submits only writing plus reading", () => {
  const slide = getB1WorkbookAlignedSlideDay21To28("B1-8.25");
  const contract = contractByAssignmentId["B1-8.25"];
  assert.deepEqual(contract.expectedParts, ["teil2", "teil3"]);
  assert.ok(contract.excludedParts.includes("teil4"));
  assert.equal(Object.keys(contract.answers.teil3).length, 7);
  assert.match(part(slide, "Teil 4 · Hören").detailEn, /removed/i);
  assert.match(part(slide, "Teil 4 · Hören").detailEn, /Do not submit/i);
});

test("Day 26 flags the seven-question workbook versus six-reference-answer grading mismatch", () => {
  const slide = getB1WorkbookAlignedSlideDay21To28("B1-9.26");
  const contract = contractByAssignmentId["B1-9.26"];
  assert.deepEqual(contract.expectedParts, ["teil2", "teil3"]);
  assert.ok(contract.excludedParts.includes("teil4"));
  assert.equal(Object.keys(contract.answers.teil3).length, 6);
  const reading = part(slide, "Teil 3 · Lesen").detailEn;
  assert.match(reading, /seven questions/i);
  assert.match(reading, /six reference answers/i);
  assert.match(reading, /question 2/i);
  assert.match(reading, /not represented/i);
});

for (const assignmentId of ["B1-10.27", "B1-10.28"]) {
  test(`${assignmentId} blocks Teil 4 instead of inventing audio when the grader expects five answers`, () => {
    const slide = getB1WorkbookAlignedSlideDay21To28(assignmentId);
    const contract = contractByAssignmentId[assignmentId];
    assert.deepEqual(contract.expectedParts, ["teil2", "teil3", "teil4"]);
    assert.equal(Object.keys(contract.answers.teil4).length, 5);
    const listening = part(slide, "Teil 4 · Hören").detailEn;
    assert.match(listening, /BLOCKING MISMATCH/i);
    assert.match(listening, /five reference answers/i);
    assert.match(listening, /no live listening medium/i);
    assert.match(listening, /Do not invent/i);
    assert.match(slide.workbookConnection.subtitle, /unresolved Teil 4 source mismatch/i);
  });
}

test("all 28 B1 assignments now resolve to workbook-aligned teacher guides", () => {
  const b1Slides = getSlidesByCourse("B1");
  assert.equal(b1Slides.length, 28);
  assert.deepEqual(b1Slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));

  for (const slide of b1Slides) {
    assert.ok(slide.workbookConnection, `${slide.assignmentId} should have workbookConnection`);
    assert.ok(slide.teacherSupport, `${slide.assignmentId} should have teacherSupport`);
  }
});
