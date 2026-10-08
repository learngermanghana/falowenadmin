import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { B1_SCENARIO_CHALLENGES, getB1ScenarioChallenge } from "../src/data/b1ScenarioChallenges.js";

const expectedIds = ["B1-2.5", "B1-3.8", "B1-4.12", "B1-6.19", "B1-8.25", "B1-9.26"];

test("Six topic-aligned teacher speaking missions replace exactly one B1 practice page", () => {
  assert.deepEqual(Object.keys(B1_SCENARIO_CHALLENGES).sort(), [...expectedIds].sort());
  const slides = getSlidesByCourse("B1");
  assert.equal(slides.length, 28);
  for (const slide of slides) {
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    assert.equal(stages.length, 9, slide.assignmentId);
    const ids = stages.map(stage => stage.id);
    assert.deepEqual(ids.slice(0, 5), ["intro", "warmup", "knowledge", "phrases", "grammar-check"], slide.assignmentId);
    assert.deepEqual(ids.slice(-3), ["questions", "workbook", "lesson-summary"], slide.assignmentId);
    const replacement = getB1ScenarioChallenge(slide.assignmentId);
    if (replacement) {
      assert.equal(ids[5], "scenario-challenge", slide.assignmentId);
      assert.equal(ids.includes("practice"), false, slide.assignmentId);
      const stage = stages[5];
      assert.equal(stage.type, "scenario-challenge");
      assert.equal(stage.title, replacement.title);
      assert.equal(stage.items.length, 3, slide.assignmentId);
      assert.equal(stage.suggestedMinutes, 8);
      for (const item of stage.items) {
        assert.ok(item.careerDe && item.icon && item.id, slide.assignmentId);
        assert.equal(item.steps.length, 3, slide.assignmentId);
        for (const step of item.steps) {
          assert.ok(step.actionDe && step.questionDe && step.modelDe, slide.assignmentId);
        }
      }
    } else if (slide.assignmentId === "B1-6.18") {
      assert.equal(ids[5], "career-challenge");
    } else {
      assert.equal(ids[5], "practice", slide.assignmentId);
    }
    assert.equal(ids.filter(id => ["practice", "scenario-challenge", "career-challenge"].includes(id)).length, 1, slide.assignmentId);
  }
});

test("Six missions preserve differentiated language patterns", () => {
  const all = Object.values(B1_SCENARIO_CHALLENGES);
  assert.ok(all.every(mission => mission.title && mission.label && mission.items.length === 3));
  const joined = id => getB1ScenarioChallenge(id).items.flatMap(i => i.steps.map(s => s.modelDe)).join(" ");
  assert.match(joined("B1-2.5"), /Könnten Sie|Wäre es möglich/);
  assert.match(joined("B1-3.8"), /solltest|musst|kannst/);
  assert.match(joined("B1-4.12"), /Nachdem|Als|Während/);
  assert.match(joined("B1-6.19"), /bewerbe|würde|könnte/i);
  assert.match(joined("B1-8.25"), /Deshalb|Könnten Sie/);
  assert.match(joined("B1-9.26"), /Wenn|Falls|könnten/);
});

test("Teacher challenge interface includes random scenario, hidden models and no submission", () => {
  const jsx = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  assert.match(jsx, /"scenario-challenge"/);
  assert.match(jsx, /Neue zufällige Situation/);
  assert.match(jsx, /setCareerAnswerVisible/);
  assert.match(jsx, /Modellantwort zeigen/);
  assert.match(jsx, /Nächster Schritt/);
  assert.match(jsx, /<PresenterStudentPicker/);
  assert.match(jsx, /No student login or submission|Kein Schülerzugang und keine automatische Bewertung/);
});
