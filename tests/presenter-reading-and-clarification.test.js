import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PRESENTER_READING_LESSONS } from "../src/data/presenterReadingLessons.js";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { splitPresenterSentences } from "../src/utils/presenterSentenceNumbering.js";
import { getA2B1KnowledgeAnswers } from "../src/data/a2B1KnowledgeAnswers.js";

test("all 56 reading passages have exactly three checks and valid numbered evidence", () => {
  const slides = ["A2", "B1"].flatMap(getSlidesByCourse);
  assert.equal(slides.length, 56);
  assert.deepEqual(Object.keys(PRESENTER_READING_LESSONS).sort(), slides.map(s => s.assignmentId).sort());
  for (const slide of slides) {
    const reading = PRESENTER_READING_LESSONS[slide.assignmentId];
    const sentences = splitPresenterSentences(reading.textDe);
    assert.equal(sentences.length, 5, slide.assignmentId);
    assert.equal(reading.checks.length, 3);
    assert.equal(reading.answers.length, 3);
    for (const reference of reading.evidence) {
      const numbers = reference.match(/\d+/g).map(Number);
      assert.ok(numbers.length > 0);
      assert.ok(numbers.every(n => n >= 1 && n <= sentences.length), `${slide.assignmentId}: ${reference}`);
    }
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    assert.equal(stages[1].id, "warmup");
    assert.equal(stages[2].id, "knowledge");
    assert.equal(stages[2].instruction, reading.readingPurpose);
    assert.deepEqual(stages[2].answerItems, reading.answers);
    assert.deepEqual(getA2B1KnowledgeAnswers(slide.assignmentId), reading.answers);
  }
});

test("claim checks mix supported, contradicted and unresolved claims", () => {
  for (const level of ["A2", "B1"]) {
    const answers = Object.entries(PRESENTER_READING_LESSONS)
      .filter(([id]) => id.startsWith(level)).map(([, reading]) => reading.answers[2]);
    assert.ok(answers.some(a => a.startsWith("Ja:")), level);
    assert.ok(answers.some(a => /^(Nein:|Widerlegt:)/.test(a)), level);
    assert.ok(answers.some(a => /offen|nicht geklärt|Nicht geklärt|nicht angegeben/.test(a)), level);
  }
});

test("the former workbook bridge becomes clarification without adding a slide", () => {
  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
    for (const slide of getSlidesByCourse(level)) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const stage = stages.find(s => s.id === "workbook");
      if (!stage) continue; // Non-V2 orientation slides have no workbook bridge.
      assert.equal(stage.type, "clarification", slide.assignmentId);
      assert.equal(stage.title, "Was ist noch unklar?");
      assert.deepEqual(stage.items.map(i => i.label), ["Wort oder Ausdruck", "Grammatik", "Aufgabe"]);
      assert.match(stage.instruction, /laut.*Chat/);
      assert.match(stage.teacherPurpose.teacher, /30 Sekunden.*beobachtete Schwierigkeit/);
      assert.equal(stage.answerItems, undefined);
      assert.equal(stage.workbookUrl, undefined);
      assert.equal(stage.grammarUrl, undefined);
      assert.equal(stages.filter(s => s.type === "clarification").length, 1);
    }
  }
});

test("clarification UI invites questions without an answer-reveal exercise", () => {
  const source = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const branch = source.split('stage.type === "clarification" ? (')[1].split('stage.type === "workbook" ? (')[0];
  assert.match(branch, /stage.instruction/);
  assert.match(branch, /30 Sekunden/);
  assert.doesNotMatch(branch, /<button|modelItems|answerItems|Open workbook/);
});


test("evidence labels use Satz for one sentence and Sätze for lists or ranges", () => {
  let singleCount = 0;
  let pluralCount = 0;
  for (const [id, reading] of Object.entries(PRESENTER_READING_LESSONS)) {
    reading.evidence.forEach((reference, index) => {
      const expected = /^\\d+$/.test(String(reference).trim()) ? "Satz" : "Sätze";
      assert.ok(reading.answers[index].endsWith(`Beleg: ${expected} ${reference}.`),
        `${id}: wrong evidence label for ${reference}`);
      if (expected === "Satz") singleCount++; else pluralCount++;
    });
  }
  assert.ok(singleCount > 0 && pluralCount > 0, "the readings need both evidence forms");
  assert.match(PRESENTER_READING_LESSONS["B1-7.23"].answers[0], /Beleg: Sätze 2–3, 5\\.$/);
});

test("B1-7.22 reading stays aligned with partners, relationship values and online dating", () => {
  const relationship = PRESENTER_READING_LESSONS["B1-7.22"];
  assert.match(relationship.textDe, /Dating-App/);
  assert.match(relationship.textDe, /ein Paar/);
  assert.match(relationship.textDe, /Erwartungen/);
  assert.match(relationship.textDe, /einander vertraut und respektiert/);
  assert.match(relationship.readingPurpose, /Online-Dating/);
  assert.match(relationship.answers[2], /Vertrauen und gegenseitiger Respekt/);
  assert.doesNotMatch(relationship.textDe, /Schwester|Behördentermine|Unterricht verpassen/);
});

test("B1-8.24 names the repair and continued use without an unintended causative", () => {
  const repair = PRESENTER_READING_LESSONS["B1-8.24"];
  assert.match(repair.textDe, /lässt Sara die Maschine reparieren und nutzt sie danach weiter/);
  assert.doesNotMatch(repair.textDe, /lässt sie das vorhandene Gerät weiter nutzen/);
  assert.match(repair.answers[0], /Reparatur/);
});
