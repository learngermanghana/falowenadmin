import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  a2WorkbookAlignedSlidesDays6To10,
  getA2WorkbookAlignedSlideDay6To10,
} from "../src/data/a2WorkbookAlignedSlidesDays6To10.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA2PresenterKnowledge } from "../src/data/a2PresenterKnowledge.js";
import { getCanonicalTeachingSlideId, getTeachingSlideById } from "../src/data/teachingSlides.js";

const EXPECTED = {
  "A2-3.6": {
    grammarRoute: "/campus/course/moebel-und-raeume-3-6-grammar-notes",
    workbookRoute: "/campus/course/a2-day-6-moebel-und-raeume-workbook",
    supportTerms: ["Wo?", "Wohin?", "Dativ", "Akkusativ", "Wechselpräpositionen"],
  },
  "A2-3.7": {
    grammarRoute: "/campus/course/relativsaetze-die-der-das-wohnung-suchen-3-7-notes",
    workbookRoute: "/campus/course/a2-day-7-eine-wohnung-suchen-workbook",
    supportTerms: ["relative", "der", "die", "das", "verb"],
  },
  "A2-3.8": {
    grammarRoute: "/campus/course/imperativ-rezepte-und-essen-3-8-grammar-notes",
    workbookRoute: "/campus/course/a2-day-8-rezepte-und-essen-workbook",
    supportTerms: ["Imperative", "du", "ihr", "Sie", "Nimm"],
  },
  "A2-4.9": {
    grammarRoute: "/campus/course/perfekt-urlaub-4-9-grammar-notes",
    workbookRoute: "/campus/course/a2-day-9-urlaub-workbook",
    supportTerms: ["Perfekt", "haben", "sein", "Partizip", "angekommen"],
  },
  "A2-4.10": {
    grammarRoute: "/campus/course/praeteritum-tourismus-und-traditionelle-feste-4-10-grammar-notes",
    workbookRoute: "/campus/course/a2-day-10-tourismus-und-traditionelle-feste-workbook",
    supportTerms: ["Präteritum", "war", "hatte", "ging", "fuhr"],
  },
};

test("A2 days 6-10 each expose the exact Falowen grammar and workbook routes", () => {
  assert.equal(a2WorkbookAlignedSlidesDays6To10.length, 5);

  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay6To10(assignmentId);
    assert.ok(slide, `${assignmentId} should have a workbook-aligned slide`);
    assert.equal(slide.workbookConnection.grammarUrl, expected.grammarRoute);
    assert.equal(slide.workbookConnection.workbookUrl, expected.workbookRoute);
    assert.deepEqual(
      slide.workbookConnection.parts.map((part) => part.label),
      ["Grammar", "Teil 1 · Sprechen", "Teil 2 · Schreiben", "Teil 3 · Lesen", "Teil 4 · Hören"],
    );
    assert.ok(slide.teacherNotesEn.some((note) => /workbook|teil|lesen|hören/i.test(note)));
  }
});

test("A2 days 6-10 teacher support matches the grammar actually taught in Falowen", () => {
  for (const [assignmentId, expected] of Object.entries(EXPECTED)) {
    const slide = getA2WorkbookAlignedSlideDay6To10(assignmentId);
    const support = buildTeacherSlideSupport(slide);
    const searchable = [
      ...support.grammarFocusEn,
      ...support.modelExamplesDe,
      ...support.commonMistakesEn,
    ].join(" ").toLowerCase();

    for (const term of expected.supportTerms) {
      assert.ok(
        searchable.includes(term.toLowerCase()),
        `${assignmentId} teacher support should include ${term}`,
      );
    }
  }
});

test("Day 8 uses the Restaurant Seeblick reading", () => {
  const slide = getA2WorkbookAlignedSlideDay6To10("A2-3.8");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  assert.match(reading.detailEn, /Restaurant Seeblick/i);
  assert.match(reading.detailEn, /reservation|fish|mineral water|tip/i);
  assert.match(slide.teacherNotesEn.join(" "), /Restaurant Seeblick/i);
});

test("Day 9 identifies Kultur und Freizeit as a separate reading-comprehension topic", () => {
  const slide = getA2WorkbookAlignedSlideDay6To10("A2-4.9");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  assert.match(reading.detailEn, /separate comprehension topic/i);
  assert.match(reading.detailEn, /Kultur und Freizeit/i);
});

test("Day 10 keeps the workbook on the friendly city-exploring theme", () => {
  const slide = getA2WorkbookAlignedSlideDay6To10("A2-4.10");
  const speaking = slide.workbookConnection.parts.find((part) => part.label === "Teil 1 · Sprechen");
  const writing = slide.workbookConnection.parts.find((part) => part.label === "Teil 2 · Schreiben");
  const reading = slide.workbookConnection.parts.find((part) => part.label === "Teil 3 · Lesen");
  const listening = slide.workbookConnection.parts.find((part) => part.label === "Teil 4 · Hören");

  assert.match(slide.title, /Eine Stadt entdecken und etwas erleben/i);
  assert.match(speaking.detailEn, /friendly city-exploring day/i);
  assert.match(writing.detailEn, /friend/i);
  assert.match(reading.detailEn, /Hamburg|Touristeninformation|Landungsbrücken|Elbphilharmonie/i);
  assert.match(listening.detailEn, /Oktoberfest as one city experience/i);
});

test("Day 10 Wissensimpuls and focused practice stay inside the city-exploring story", () => {
  const knowledge = getA2PresenterKnowledge("A2-4.10");

  assert.ok(knowledge);
  assert.match(knowledge.title, /Eine Stadt entdecken/i);
  assert.match(knowledge.textDe, /Stadt oder ein neues Viertel/i);
  assert.match(knowledge.textDe, /war und hatte/i);
  assert.equal(knowledge.activity.title, "Entdeckungstag in der Stadt");
  assert.match(knowledge.activity.instruction, /Stadttag/i);
  assert.deepEqual(knowledge.activity.prompts, [
    "Ich war am Samstag in der Altstadt.",
    "Wir haben zuerst einen Markt besucht.",
    "Danach gingen wir in ein kleines Café.",
  ]);
});

test("old A2 Day 10 tourism Presenter URL redirects to the new city-exploring slide id", () => {
  assert.equal(
    getCanonicalTeachingSlideId("a2-day-10-tourismus-feste"),
    "a2-day-10-stadt-entdecken",
  );

  const slide = getTeachingSlideById("a2-day-10-tourismus-feste");
  assert.ok(slide);
  assert.equal(slide.id, "a2-day-10-stadt-entdecken");
  assert.equal(slide.assignmentId, "A2-4.10");
  assert.match(slide.title, /Eine Stadt entdecken und etwas erleben/i);

  const page = fs.readFileSync(new URL("../src/pages/TeachingSlidesPage.jsx", import.meta.url), "utf8");
  assert.match(page, /getCanonicalTeachingSlideId/);
  assert.match(page, /<Navigate/);
  assert.match(page, /\$\{location\.search\}/);
});
