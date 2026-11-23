import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  A1_DAY15_ASSIGNMENT, A1_DAY15_WORKBOOK, A1_DAY15_SENTENCE_TASKS,
  A1_DAY15_MISTAKES, A1_DAY15_REACTIONS, buildA1Day15ClassroomStages,
} from "../src/data/a1Day15Classroom.js";
import { A1_TEIL3_OBJECT_CARDS } from "../src/data/a1Teil3ObjectCards.js";
import { getA1PresenterMusicStage } from "../src/data/a1PresenterMusicStage.js";
import { getA1Days11To15UnderstandingChecks } from "../src/data/a1Days11To15Understanding.js";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";

const stages = () => buildA1Day15ClassroomStages({
  song: getA1PresenterMusicStage(A1_DAY15_ASSIGNMENT),
  workbookUrl: A1_DAY15_WORKBOOK,
});

test("A1 Day 15 has exactly 12 deliberate pages, with brief Teil 1/2 and main imperative/Teil 3", () => {
  const pages = stages();
  assert.equal(A1_DAY15_ASSIGNMENT, "A1-4.7");
  assert.equal(pages.length, 12);
  assert.equal(new Set(pages.map(page => page.id)).size, 12);
  assert.deepEqual(pages.map(page => page.step || page.id), [
    "exam-map", "imperative-intro", "imperative-forms", "formal-imperative",
    "separable-imperative", "koennen-request", "koennten-request", "objects",
    "grammar-check", "reactions", "a1-day15-music", "exit-check",
  ]);
  assert.ok(pages.every(page => Array.isArray(page.items) && page.items.length > 0));
  assert.equal(pages[8].type, "check");
  assert.equal(pages[8].teil3ObjectCards, true);
  assert.equal(pages[8].items.length, 10);
  assert.equal(pages[8].suggestedMinutes, 10);
  assert.equal(pages[10].type, "published-music");
  assert.match(pages[10].title, /Ich bin bereit zu sprechen/);
  assert.equal(pages[11].type, "check");
  assert.equal(pages[11].exitCheck, true);
  assert.equal(pages[11].workbookUrl, A1_DAY15_WORKBOOK);
  assert.equal(pages[11].items.length, 1);
});

test("every teaching sentence builder contains a correct German sentence order", () => {
  assert.deepEqual(Object.keys(A1_DAY15_SENTENCE_TASKS).sort(), [
    "formal", "koennen", "koennten", "separable",
  ]);
  for (const [topic, entries] of Object.entries(A1_DAY15_SENTENCE_TASKS)) {
    assert.ok(entries.length >= 2, topic);
    for (const item of entries) {
      assert.deepEqual([...item.order].sort((a,b)=>a-b), item.words.map((_,i)=>i));
      assert.equal(item.order.map(index => item.words[index]).join(" "), item.model);
      assert.ok(/[.?!]$/.test(item.model));
    }
  }
  assert.match(A1_DAY15_SENTENCE_TASKS.koennen[0].model, /Können Sie .*schließen\?/);
  assert.match(A1_DAY15_SENTENCE_TASKS.koennten[0].model, /Könnten Sie .*öffnen\?/);
  assert.ok(A1_DAY15_MISTAKES.some(item => item.wrong.includes("Konnten") && item.right.includes("Könnten")));
  assert.equal(A1_DAY15_REACTIONS.length, 3);
});

test("ten classroom object checks keep the 11th fresh exit picture hidden", () => {
  const checks = getA1Days11To15UnderstandingChecks(A1_DAY15_ASSIGNMENT);
  const pages = stages();
  assert.equal(A1_TEIL3_OBJECT_CARDS.length, 11);
  assert.deepEqual(pages[8].items, checks.slice(0, 10));
  assert.deepEqual(pages[11].items, [checks[10]]);
  assert.match(checks[10].questionDe, /Bildkarte fenster/);
  assert.equal(new Set(pages[8].items.map(i => i.questionDe)).size, 10);
  assert.ok(pages[8].items.every(i => i.responseMode === "performance" && !i.questionDe.includes("Können Sie")));
  assert.throws(() => buildA1Day15ClassroomStages({ song: null }), /requires its approved published music/);
});

test("presenter routes Day 15 to new visual pages while keeping student picker and reveal guarded", () => {
  const presenter = readFileSync(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "utf8");
  const classroom = readFileSync(new URL("../src/components/A1Day15ClassroomStage.jsx", import.meta.url), "utf8");
  assert.ok(presenter.includes("buildA1Day15ClassroomStages({"));
  assert.ok(presenter.includes('stage.type === "a1-day15"'));
  assert.ok(presenter.includes("<A1Day15ClassroomStage key={stage.id} step={stage.step} />"));
  assert.ok(presenter.includes('stage.id === "grammar-check"'));
  assert.ok(presenter.includes('getA1Teil3ObjectCard(activeCheck?.sourceQuestion'));
  assert.ok(presenter.includes("stage.workbookUrl"));
  assert.ok(classroom.includes("A1_DAY15_SENTENCE_TASKS.koennen"));
  assert.ok(classroom.includes("A1_DAY15_SENTENCE_TASKS.koennten"));
  assert.ok(classroom.includes("A1_TEIL3_OBJECT_CARDS.slice(0, 10)"));
  assert.ok(classroom.includes('aria-expanded={revealed.includes(card.id)}'));
  assert.ok(classroom.includes("ReactionsAndMistakes"));
  assert.ok(!classroom.includes("A1_TEIL3_OBJECT_CARDS[10]"), "final card must remain an independent test");
});

test("published slide remains on day 15 and preserves existing learner workbook", () => {
  const slide = getSlidesByCourse("A1").find(item => item.assignmentId === "A1-4.7");
  assert.ok(slide);
  assert.equal(slide.dayNumber, 15);
  assert.equal(slide.workbookConnection.workbookUrl, A1_DAY15_WORKBOOK);
  assert.match(slide.objective, /imperative|Imperativ/i);
  assert.match(slide.teacherNotesEn.join(" "), /Teil 1 and Teil 2 each receive only a brief orientation/);
  assert.match(slide.teacherNotesEn.join(" "), /Keep the existing published music activity/);
});
