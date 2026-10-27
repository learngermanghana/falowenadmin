import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("A2 scenario challenges genuinely replace focused practice in the same teaching slot", () => {
  const slides = getSlidesByCourse("A2");
  const challengeIds = [];
  for (const slide of slides) {
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const practiceStages = stages.filter((stage) => ["practice", "scenario-challenge", "career-challenge"].includes(stage.id));
    assert.equal(practiceStages.length, 1, slide.assignmentId + " must have exactly one learner-production activity");
    const practice = practiceStages[0];
    assert.ok(practice.items?.length, slide.assignmentId + " activity has no prompts");
    if (practice.id === "scenario-challenge") {
      challengeIds.push(slide.assignmentId);
      assert.ok(practice.suggestedMinutes > 0, slide.assignmentId + " has no classroom time");
      assert.ok(practice.teacherPurpose?.student, slide.assignmentId + " has no intended learner output");
    }
  }
  assert.ok(challengeIds.length >= 10, "A2 interactive challenges should not be classified as missing practice");
});

test("A2 restaurant roleplay is a valid checked speaking task, not a missing question-support stage", () => {
  const slide = getSlidesByCourse("A2").find((row) => row.assignmentId === "A2-3.8");
  const stage = buildTeachingPresenterStages(slide, slide.topic).find((row) => row.id === "questions");
  assert.equal(stage.type, "flow");
  assert.ok(stage.items.length >= 2);
});

test("lesson-by-lesson A2 teaching audit accepts substantive challenges and roleplay", () => {
  const result = spawnSync(process.execPath, ["scripts/auditTeachingMaterialQuality.mjs", "--level=A2"], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  assert.equal(result.status, 0, (result.stderr || "") + "\n" + (result.stdout || "").slice(-5000));
  assert.doesNotMatch(result.stdout, /missing presenter stage: practice/);
  assert.doesNotMatch(result.stdout, /missing check, produce/);
});
