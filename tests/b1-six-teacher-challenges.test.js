import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { B1_TEACHER_CHALLENGES, getB1TeacherChallenge } from "../src/data/b1TeacherChallenges.js";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const REQUIRED = new Map([
  ["B1-2.5", "Apartment Simulator"],
  ["B1-3.8", "Health Coach"],
  ["B1-4.12", "Adventure Builder"],
  ["B1-6.19", "Interview Challenge"],
  ["B1-8.25", "Complaint Challenge"],
  ["B1-9.26", "Travel Rescue Mission"],
]);

test("Six curriculum-aligned challenge definitions contain complete three-step scenario missions", () => {
  assert.deepEqual(new Set(Object.keys(B1_TEACHER_CHALLENGES)), new Set(REQUIRED.keys()));
  for (const [assignmentId, title] of REQUIRED) {
    const activity = getB1TeacherChallenge(assignmentId);
    assert.equal(activity.title, title);
    assert.ok(activity.grammar);
    assert.ok(activity.goal);
    assert.equal(activity.scenarios.length, 3, assignmentId);
    assert.equal(new Set(activity.scenarios.map(s => s.id)).size, 3);
    for (const scenario of activity.scenarios) {
      assert.ok(scenario.context && scenario.label && scenario.icon);
      assert.equal(scenario.steps.length, 3);
      for (const step of scenario.steps) {
        assert.ok(step.actionDe && step.questionDe && step.modelDe);
      }
    }
  }
  assert.equal(getB1TeacherChallenge("B1-6.18"), null, "Career challenge must remain distinct");
});

test("All six B1 missions replace focused practice with no duplicate slide, preserving grammar, speaking and workbook", () => {
  const slides = getSlidesByCourse("B1");
  for (const [assignmentId, title] of REQUIRED) {
    const slide = slides.find(x => x.assignmentId === assignmentId);
    assert.ok(slide, assignmentId);
    const ids = buildTeachingPresenterStages(slide, slide.topic).map(s => s.id);
    assert.deepEqual(ids, [
      "intro", "warmup", "knowledge", "phrases", "grammar-check",
      "scenario-challenge", "questions", "workbook", "lesson-summary",
    ], assignmentId);
    assert.equal(ids.length, 9);
    const challenge = buildTeachingPresenterStages(slide, slide.topic)[5];
    assert.equal(challenge.title, title);
    assert.equal(challenge.items, getB1TeacherChallenge(assignmentId).scenarios);
    assert.ok(slide.workbookConnection?.workbookUrl);
    assert.match(challenge.teacherPurpose.teacher, /No student login or submission/);
  }
  for (const slide of slides.filter(s => !REQUIRED.has(s.assignmentId))) {
    const ids = buildTeachingPresenterStages(slide).map(s => s.id);
    assert.equal(ids.includes("scenario-challenge"), false);
    assert.equal(ids.includes(slide.assignmentId === "B1-6.18" ? "career-challenge" : "practice"), true);
  }
});

test("Presenter exposes randomized, hidden model, teacher-led three-step scenario controls", () => {
  const jsx = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  assert.match(jsx, /stage\.type === "scenario-challenge"/);
  assert.match(jsx, /newRandomScenario/);
  assert.match(jsx, /nextScenarioStep/);
  assert.match(jsx, /setScenarioAnswerVisible\(\(current\) => !current\)/);
  assert.match(jsx, /scenarioAnswerVisible \? \(/);
  assert.match(jsx, /Math\.floor\(Math\.random\(\) \* stage\.items\.length\)/);
  assert.match(jsx, /Pick student/);
  assert.match(jsx, /Kein Schülerzugang und keine automatische Bewertung/);
  assert.match(jsx, /presenter-career-challenge/);
});
