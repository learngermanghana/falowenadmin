import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  a2WorkbookAlignedSlidesDays11To15,
  getA2WorkbookAlignedSlideDay11To15,
} from "../src/data/a2WorkbookAlignedSlidesDays11To15.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXPECTED = {
  "A2-4.11": {
    grammarRoute: "/campus/course/unterwegs-verkehrsmittel-vergleichen-4-11-grammar-notes",
    workbookRoute: "/campus/course/a2-day-11-unterwegs-verkehrsmittel-vergleichen-workbook",
    supportTerms: ["Komparativ", "Superlativ", "als", "am besten", "schneller"],
  },
  "A2-5.12": {
    grammarRoute: "/campus/course/mein-traumberuf-5-12-grammar-notes",
    workbookRoute: "/campus/course/a2-day-12-mein-traumberuf-workbook",
    supportTerms: ["möchten", "wollen", "können", "weil", "dass"],
  },
  "A2-5.13": {
    grammarRoute: "/campus/course/modalverben-im-praeteritum-vorstellungsgespraech-5-13-grammar-notes",
    workbookRoute: "/campus/course/a2-day-13-vorstellungsgespraech-workbook",
    supportTerms: ["konnte", "musste", "wollte", "infinitive", "past"],
  },
  "A2-5.14": {
    grammarRoute: "/campus/course/beruf-und-karriere-5-14-um-zu-grammar-notes",
    workbookRoute: "/campus/course/a2-day-14-beruf-und-karriere-workbook",
    supportTerms: ["um ... zu", "purpose", "same", "damit", "Infinitiv"],
  },
  "A2-6.15": {
    grammarRoute: "/campus/course/mein-lieblingssport-6-15-seit-dativ-praesens-grammar-notes",
    workbookRoute: "/campus/course/a2-day-15-mein-lieblingssport-workbook",
    supportTerms: ["seit", "Dativ", "Präsens", "einem", "vor"],
  },
};

test("A2 days 11-15 each expose the exact in-app grammar and workbook routes", () => {
  assert.equal(a2WorkbookAlignedSlidesDays11To15.length, 5);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay11To15(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.workbookConnection.grammarUrl, expected.grammarRoute);
    assert.equal(slide.workbookConnection.workbookUrl, expected.workbookRoute);
    assert.deepEqual(
      slide.workbookConnection.parts.map((part) => part.label),
      ["Grammar", "Teil 1 · Sprechen", "Teil 2 · Schreiben", "Teil 3 · Lesen", "Teil 4 · Hören"],
    );
  }
});

test("Teaching Slides wires the Day 11-15 aligned collection into the assignment resolver", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../src/data/teachingSlides.js"), "utf8");
  assert.match(source, /import \{ a2WorkbookAlignedSlidesDays11To15 \} from "\.\/a2WorkbookAlignedSlidesDays11To15\.js";/);
  assert.match(source, /\.\.\.a2WorkbookAlignedSlidesDays11To15/);
  assert.match(source, /curatedSlidesByAssignment\[slide\.assignmentId\] \|\| slide/);
});

test("A2 days 11-15 teacher support matches the grammar actually taught in Falowen", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay11To15(assignmentId);
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

test("Day 12 identifies qualification recognition and job search as the reading focus", () => {
  const slide = getA2WorkbookAlignedSlideDay11To15("A2-5.12");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  assert.match(reading.detailEn, /recognition|qualifications/i);
  assert.match(reading.detailEn, /BIZ|Jobcenter/i);
});

test("Day 13 keeps childcare reading separate from the interview grammar target", () => {
  const slide = getA2WorkbookAlignedSlideDay11To15("A2-5.13");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  assert.match(reading.detailEn, /Separate comprehension topic/i);
  assert.match(reading.detailEn, /childcare|Kinderkrippe|Kita/i);
  assert.match(slide.teacherNotesEn.join(" "), /topic split|childcare/i);
});

test("Day 14 explicitly records that there is no Teil 4 Hören assignment", () => {
  const slide = getA2WorkbookAlignedSlideDay11To15("A2-5.14");
  const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");
  assert.match(listening.detailEn, /No Teil 4 Hören/i);
  assert.match(listening.detailEn, /Do not create or assign/i);
  assert.match(slide.teacherNotesEn.join(" "), /no Teil 4 Hören/i);
});

test("Day 15 teaches continuing duration with seit plus dative and present tense", () => {
  const slide = getA2WorkbookAlignedSlideDay11To15("A2-6.15");
  const grammar = slide.workbookConnection.parts.find((part) => part.label === "Grammar");
  assert.match(grammar.detailEn, /seit \+ Dativ \+ Präsens/i);
  assert.match(grammar.detailEn, /continues now/i);
  assert.match(slide.teacherSupport.modelExamplesDe.join(" "), /seit zwei Jahren|seit dem Sommer/i);
});
