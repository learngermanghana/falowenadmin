import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  a2WorkbookAlignedSlidesDays11To15,
  getA2WorkbookAlignedSlideDay11To15,
} from "../src/data/a2WorkbookAlignedSlidesDays11To15.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";

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
    supportTerms: ["seit", "Dativ", "present tense", "einem", "vor"],
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

test("A2 days 11-15 are selected by the native-Node Teaching Slides resolver", () => {
  for (const assignmentId of Object.keys(EXPECTED)) {
    const aligned = getA2WorkbookAlignedSlideDay11To15(assignmentId);
    const resolved = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(resolved, `${assignmentId} should resolve in teachingSlides`);
    assert.equal(resolved.id, aligned.id);
    assert.equal(resolved.workbookConnection.workbookUrl, aligned.workbookConnection.workbookUrl);
  }
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


test("Day 15 writing slide now guides an informal email to Jan", () => {
  const slide = getA2WorkbookAlignedSlideDay11To15("A2-6.15");
  const writing = slide.workbookConnection.parts.find(part => part.label === "Teil 2 · Schreiben");
  assert.match(writing.detailEn, /Jan/);
  assert.match(writing.detailEn, /Saturday/);
  assert.doesNotMatch(writing.detailEn, /fitness studio|course places/i);
});


test("Day 15 live A2 V2 presenter actually uses the interactive Sport-Matchmaker", async () => {
  const { buildTeachingPresenterStages } = await import("../src/utils/teachingPresenter.js");
  const slide = getTeachingSlideByAssignmentId("A2-6.15");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const practice = stages.filter(stage => stage.id === "practice");
  assert.equal(practice.length, 1, "replace the existing practice slide, never add a new one");
  assert.equal(practice[0].type, "sport-matchmaker");
  assert.equal(practice[0].title, "Sport-Matchmaker");
  assert.equal(practice[0].items.length, 1);
  assert.ok(practice[0].suggestedMinutes > 0);
  assert.equal(stages.filter(stage=>stage.id==="practice").length,1);
  assert.deepEqual(stages.map(stage=>stage.id), ["intro","warmup","knowledge","phrases","grammar-check","practice","questions","workbook","lesson-summary"]);
  assert.equal(stages.some(stage=>/Finde die wichtige Information/.test(stage.title || "")),false);
  const view = readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const game = readFileSync(new URL("../src/components/A2SportMatchmaker.jsx", import.meta.url), "utf8");
  assert.match(view, /stage\.type === "sport-matchmaker" \? \(<A2SportMatchmaker \/>\)/);
  assert.match(game, /Antwort zeigen/);
  assert.match(game, /E-Mail an Jan/);
});
