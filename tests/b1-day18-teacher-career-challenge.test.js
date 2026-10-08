import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  B1_DAY18_CAREER_CHALLENGES,
  nextB1Day18CareerIndex,
} from "../src/data/b1Day18CareerChallenge.js";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("Day 18 career challenge offers six distinct professions and three oral purpose questions each", () => {
  assert.equal(B1_DAY18_CAREER_CHALLENGES.length, 6);
  assert.equal(new Set(B1_DAY18_CAREER_CHALLENGES.map((career) => career.id)).size, 6);
  for (const career of B1_DAY18_CAREER_CHALLENGES) {
    assert.ok(career.careerDe);
    assert.ok(career.icon);
    assert.equal(career.steps.length, 3, career.id);
    for (const step of career.steps) {
      assert.ok(step.actionDe && step.questionDe && step.modelDe, career.id);
      assert.ok(step.questionDe.endsWith("?"), step.questionDe);
      assert.match(step.modelDe, /, um /);
      assert.match(step.modelDe, /zu(?:\s+[a-zäöüß]+|[a-zäöüß]+)/i);
      assert.ok(step.modelDe.endsWith("."), career.id);
    }
  }
});

test("Next random career never repeats the current career", () => {
  for (let current = 0; current < B1_DAY18_CAREER_CHALLENGES.length; current += 1) {
    for (const randomValue of [0, 0.01, 0.25, 0.5, 0.75, 0.999999, 1]) {
      const next = nextB1Day18CareerIndex(current, B1_DAY18_CAREER_CHALLENGES.length, randomValue);
      assert.ok(next >= 0 && next < B1_DAY18_CAREER_CHALLENGES.length);
      assert.notEqual(next, current);
    }
  }
  assert.equal(nextB1Day18CareerIndex(0, 1, 0.5), 0);
  assert.equal(nextB1Day18CareerIndex(0, 0, 0.5), 0);
});

test("Day 18 career challenge replaces prioritization rather than adding another practice page", () => {
  const day18 = getTeachingSlideByAssignmentId("B1-6.18");
  const stages = buildTeachingPresenterStages(day18);
  const career = stages.find((stage) => stage.id === "career-challenge");
  assert.ok(career);
  assert.equal(career.type, "career-challenge");
  assert.equal(career.items, B1_DAY18_CAREER_CHALLENGES);
  assert.deepEqual(stages.map((stage) => stage.id), [
    "intro", "warmup", "knowledge", "phrases", "grammar-check",
    "career-challenge", "questions", "workbook", "lesson-summary",
  ]);
  assert.equal(stages.length, 9, "Day 18 must use one practice slot, not an extra slide");
  assert.equal(stages.filter((stage) => stage.id === "career-challenge").length, 1);
  assert.equal(stages.some((stage) => stage.id === "practice"), false);
  assert.equal(stages.some((stage) => stage.title === "Berufsweg priorisieren"), false);
  assert.match(career.instruction, /Lehrkraft/);
  assert.match(career.teacherPurpose.teacher, /No student login or submission/);
  assert.equal(day18.workbookConnection.grammarUrl, "/campus/course/lesson/B1/18?view=grammar");
  assert.equal(day18.workbookConnection.workbookUrl, "/campus/course/lesson/B1/18?view=workbook");
  for (const assignment of ["B1-5.17", "B1-6.19"]) {
    const other = getTeachingSlideByAssignmentId(assignment);
    assert.equal(buildTeachingPresenterStages(other).some((stage) => stage.id === "career-challenge"), false);
  }
});

test("Presenter keeps model hidden until teacher reveals it and offers teacher-only controls", () => {
  const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  assert.match(presenter, /stage\.type === "career-challenge"/);
  assert.match(presenter, /careerAnswerVisible \? \(/);
  assert.match(presenter, /setCareerAnswerVisible\(false\)/);
  assert.match(presenter, /setCareerChallengeIndex\(\(current\) => nextB1Day18CareerIndex/);
  assert.match(presenter, /Modellantwort zeigen/);
  assert.match(presenter, /Modellantwort verbergen/);
  assert.match(presenter, /Nächster Schritt/);
  assert.match(presenter, /Kein Schülerzugang und keine automatische Bewertung/);
  assert.match(css, /\.presenter-career-roadmap/);
  assert.match(css, /\.presenter-career-model/);
  assert.match(css, /@media \(max-width: 700px\)/);
});
