import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";
import { buildA1SlideReviewChecks } from "../src/data/a1SlideReview.js";
import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "../src/data/a1PublishedWorkbookRoutes.js";
import {
  A1_DAYS11_TO15_ASSIGNMENTS,
  getA1Days11To15UnderstandingChecks,
  getA1Days11To15QuickChecks,
  getA1Days11To15ApplicationChecks,
} from "../src/data/a1Days11To15Understanding.js";

const expected = {
  "A1-7": [11, "tutor-marked"],
  "A1-8": [12, "tutor-marked"],
  "A1-3.5": [13, "review"],
  "A1-3.6": [14, "review"],
  "A1-4.7": [15, "review"],
};

test("A1 Days 11–15 include 75 unique checks, correct answers and teacher explanations", () => {
  const slides = getSlidesByCourse("A1");
  assert.deepEqual([...A1_DAYS11_TO15_ASSIGNMENTS].sort(), Object.keys(expected).sort());
  let total = 0;
  for (const [id, [day, kind]] of Object.entries(expected)) {
    const slide = slides.find((s) => String(s.assignmentId || "").toUpperCase() === id);
    assert.ok(slide, id + ": missing official lesson");
    assert.equal(slide.dayNumber, day, id + ": lesson day mismatch");
    const path = getA1LearningPath(slide);
    assert.equal(path.kind, kind, id + ": marking requirement must be evidenced");
    assert.equal(path.activityUrl, A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[id],
      id + ": actual learner URL must be used");
    assert.ok(path.activityUrl?.startsWith("/campus/course/"), id);

    const verified = getA1Days11To15UnderstandingChecks(id);
    const selected = getA1PresenterUnderstandingChecks(id,
      getA1GrammarChecks(id, slide), { slide, support: buildTeacherSlideSupport(slide) });
    assert.deepEqual(selected, verified, id + ": presenter must use lesson bank");
    assert.equal(verified.length, 11);
    assert.match(verified[10].questionDe, /^Exit-Check:/);
    const quick = getA1Days11To15QuickChecks(id);
    const applied = getA1Days11To15ApplicationChecks(id);
    assert.equal(quick.length, 2);
    assert.equal(applied.length, 2);
    const all = [...verified, ...quick, ...applied];
    const questionKeys = all.map((item) => item.questionDe.trim().toLocaleLowerCase("de-DE"));
    assert.equal(new Set(questionKeys).size, 15, id + ": duplicated question across stages");
    assert.ok(all.every((item) => item.questionDe && item.answerDe && item.noteEn?.length >= 20),
      id + ": answer or teacher explanation missing");
    assert.equal(buildA1SlideReviewChecks(verified, 2).length, 2, id + ": insufficient reveal cards");
    total += all.length;
  }
  assert.equal(total, 75);
});

test("Days 11 and 12 preserve only the verified Lesen and Hören workbook parts", () => {
  const slides = getSlidesByCourse("A1");
  for (const id of ["A1-7", "A1-8"]) {
    const slide = slides.find((s) => s.assignmentId === id);
    const parts = slide.workbookConnection.parts;
    assert.equal(parts.length, 2);
    assert.match(parts[0].label, /Lesen/);
    assert.match(parts[1].label, /Hören/);
    assert.ok(slide.workbookConnection.subtitle.includes("Tutor-marked"));
    assert.equal(slide.workbookConnection.grammarUrl, null);
  }
  const day12 = slides.find((s) => s.assignmentId === "A1-8");
  assert.match(day12.workbookConnection.subtitle, /12-hour conversion is unscored/);
});

test("Days 13–15 use Course Book links without inventing scored sections", () => {
  const slides = getSlidesByCourse("A1");
  for (const id of ["A1-3.5", "A1-3.6", "A1-4.7"]) {
    const slide = slides.find((s) => s.assignmentId === id);
    assert.equal(getA1LearningPath(slide).kind, "review");
    assert.ok(slide.workbookConnection.parts.every((p) => !/^Teil [0-9]+/.test(p.label)) || id === "A1-4.7");
    assert.doesNotMatch(slide.workbookConnection.subtitle, /Tutor-marked|graded submission/i);
  }
});

test("Days 11–14 are comprehension-first, while Day 15 preserves the real Goethe exam-format lesson", () => {
  const slides = getSlidesByCourse("A1");
  for (const id of ["A1-7", "A1-8", "A1-3.5", "A1-3.6"]) {
    const slide = slides.find((s) => s.assignmentId === id);
    assert.ok(slide.interactionFlow.every((step) => !/role.play|pair interview|mini dialogue|speaking round/i.test(step.phase)),
      id + ": generic speaking activity reintroduced");
    assert.match(slide.wrapUpTaskDe, /Schreibe|Ergänze|Unterstreiche/);
  }
  const day15 = slides.find((s) => s.assignmentId === "A1-4.7");
  assert.match(day15.workbookConnection.subtitle, /Goethe A1 exam-format/);
  assert.match(day15.interactionFlow.map((x) => x.detailEn).join(" "), /Teil 1|Teil 2|Teil 3/);
  assert.match(day15.teacherNotesEn.join(" "), /A1-5\.9/);
  const questions = getA1Days11To15UnderstandingChecks("A1-4.7");
  const response = questions.map((q) => q.questionDe + " " + q.answerDe).join("\n");
  assert.match(response, /make a polite request|Kannst du mir bitte/i);
  assert.match(response, /respond positively|Ja, gern|Ja, natürlich/i);
  assert.match(response, /do not want to use können|imperative/i);
  assert.match(response, /refuse politely|Tut mir leid/i);
  assert.doesNotMatch(response, /Was machst du am Wochenende|make a new sentence of your own/i);
});

test("A1 presenter and existing teacher view use the correct source material without tracking changes", () => {
  const presenter = fs.readFileSync("src/components/A1GrammarPresenter.jsx", "utf8");
  const registry = fs.readFileSync("src/data/a1GenericLessonUpgrades.js", "utf8");
  const resolver = fs.readFileSync("src/data/a1PresenterUnderstandingChecks.js", "utf8");
  assert.match(registry, /enhanceA1Days11To15Slide\(lessonSlide\)/);
  assert.match(resolver, /getA1Days11To15UnderstandingChecks\(key\)/);
  assert.match(presenter, /getA1Days11To15QuickChecks\(slide\.assignmentId\)/);
  assert.match(presenter, /getA1Days11To15ApplicationChecks\(slide\.assignmentId\)/);
  assert.match(presenter, /reviewChecks: buildA1SlideReviewChecks\(mainChecks, 2\)/);
  assert.match(presenter, /<details key=\{item\.questionDe\}/);
  assert.doesNotMatch(presenter, /Student Learning Progress|Self-practice completion tracking/);
});
