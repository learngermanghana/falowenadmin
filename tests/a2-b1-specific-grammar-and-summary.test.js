import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const B1_TWO_PAGE_DAYS = new Set([3, 4, 5, 7, 9, 15, 26]);
const A2_GRAMMAR_PAGE_COUNTS = { 2: 4, 4: 2, 6: 2, 7: 2, 9: 3, 10: 2, 16: 2, 23: 3 };

for (const level of ["A2", "B1"]) {
  test(`${level}: each workbook grammar slide teaches before corrections and reading`, () => {
    const titles = new Set();
    for (const slide of getSlidesByCourse(level)) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const grammar = stages.filter(stage => stage.type === "workbook-grammar");
      assert.equal(grammar.length, level === "A2" ? A2_GRAMMAR_PAGE_COUNTS[slide.dayNumber] || 1 : B1_TWO_PAGE_DAYS.has(slide.dayNumber) ? 2 : 1, slide.assignmentId);
      const first = stages.indexOf(grammar[0]);
      assert.deepEqual(stages.slice(first, first + grammar.length), grammar);
      assert.equal(stages[first + grammar.length].id, "common-mistakes", slide.assignmentId);
      titles.add(grammar[0].title);
      const items = grammar.flatMap(stage => stage.items);
      const rules = items.filter(item => item.example);
      const checks = items.filter(item => item.answer);
      assert.ok(rules.length >= 2 && rules.every(item => item.label && item.prompt), slide.assignmentId);
      assert.ok(checks.length > 0, slide.assignmentId);
      assert.ok(grammar.every(page => page.items.length >= 2 && page.items.length <= 4), slide.assignmentId);
      assert.ok(checks.every(item => item.prompt && !item.example), slide.assignmentId);
    }
    assert.equal(titles.size, 28);
  });

  test(`${level}: 28 lesson summaries use the taught expressions and a real speaking question`, () => {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);
    for (const slide of slides) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const summary = stages.find(stage => stage.id === "lesson-summary");
      assert.equal(summary.id, "lesson-summary", slide.assignmentId);
      assert.equal(new Set(stages.map(stage => stage.id)).size, stages.length, slide.assignmentId);
      const expressions = summary.items.find(item => item.label === "Redemittel");
      const spoken = summary.items.find(item => item.label === "Sprechprobe");
      const check = summary.items.find(item => item.label === "Selbstcheck");
      assert.ok(expressions, slide.assignmentId + ": missing language check");
      assert.ok(spoken, slide.assignmentId + ": missing speaking exit check");
      assert.ok(check, slide.assignmentId + ": missing original wrap-up");
      assert.ok(expressions.detail.includes(slide.keyPhrasesDe[0]), slide.assignmentId);
      assert.ok(expressions.detail.includes(slide.keyPhrasesDe[1]), slide.assignmentId);
      assert.ok(spoken.detail.includes(slide.studentQuestionsDe.at(-1)), slide.assignmentId);
      assert.equal(check.detail, slide.wrapUpTaskDe, slide.assignmentId);
      assert.doesNotMatch([expressions.detail, spoken.detail].join(" "), /You can talk about|You can use today.s target grammar accurately/i, slide.assignmentId);
      assert.deepEqual(stages.slice(-4).map(s => s.id), ["questions", "workbook-presentation", "workbook", "lesson-summary"], slide.assignmentId);
    }
  });

  test(`${level}: grammar-check tasks match the application lab`, () => {
    const titles = new Set();
    for (const slide of getSlidesByCourse(level)) {
      const stage = buildTeachingPresenterStages(slide, slide.topic).find(s => s.id === "grammar-check");
      assert.equal(stage.variant, level.toLowerCase() + "-application-lab");
      assert.equal(stage.items.length, 3);
      assert.ok(!titles.has(stage.lab.title), slide.assignmentId);
      titles.add(stage.lab.title);
      assert.equal(stage.lab.day, slide.dayNumber);
      assert.ok(stage.lab.context && stage.lab.columns.length >= 3 && stage.lab.rows.length >= 3);
      assert.ok(stage.lab.rows.every(row => row.length === stage.lab.columns.length && row.every(Boolean)));
      assert.ok(stage.lab.tasks.every(task => task.label && task.hint && task.answer && task.criterion));
      assert.equal(new Set(stage.lab.tasks.map(task => task.prompt)).size, 3);
      for (const [index, item] of stage.items.entries()) {
        assert.equal(item.prompt, stage.lab.tasks[index].prompt);
        assert.equal(item.answer, stage.lab.tasks[index].answer);
      }
    }
  });
}

test("A2 and B1 open with music and finish with the workbook presentation", () => {
  const listeningDays = { A2: [1, 2, 3, 4, 17, 18, 19, 20, 21, 23, 24, 25], B1: [24, 25, 26, 27, 28] };
  for (const slide of ["A2", "B1"].flatMap(getSlidesByCourse)) {
    const stages = buildTeachingPresenterStages(slide);
    const music = stages.filter(stage => stage.variant === "interactive-music-video");
    const listening = stages.find(stage => stage.variant === "interactive-listening");
    assert.equal(music.length, 1, slide.assignmentId);
    assert.equal(stages[0].id, "intro", slide.assignmentId);
    assert.equal(stages[1], music[0], slide.assignmentId);
    assert.equal(music[0].musicVideo.day, slide.dayNumber, slide.assignmentId);
    assert.equal(music[0].musicVideo.level, slide.course, slide.assignmentId);
    assert.ok(stages.every(stage => stage.variant !== "interactive-warmup" && stage.title !== "Warm-up"), slide.assignmentId);
    assert.equal(Boolean(listening), listeningDays[slide.course].includes(slide.dayNumber), slide.assignmentId);
    if (listening) {
      assert.ok(listening.audioKey && listening.listeningItems.length, slide.assignmentId);
      assert.equal(stages[2], listening, slide.assignmentId);
    }
    assert.equal(stages[listening ? 3 : 2].id, "workbook-grammar", slide.assignmentId);
    assert.equal(stages.filter(stage => stage.id === "workbook-presentation").length, 1, slide.assignmentId);
    assert.equal(stages.at(-1).id, "lesson-summary", slide.assignmentId);
  }
});

test("A2 Day 10 summary checks city-exploring language and a real student task", () => {
 const slide = getSlidesByCourse("A2").find(row => row.assignmentId === "A2-4.10");
 const summary = buildTeachingPresenterStages(slide, slide.topic).find(stage => stage.id === "lesson-summary");
 assert.match(summary.items.find(x=>x.label==="Redemittel").detail,/entdecken/);
 assert.match(summary.items.find(x=>x.label==="Sprechprobe").detail,/Entdeckungstag/);
});
