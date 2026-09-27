import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import {
  A2_B1_SPEAKING_DIFFICULTY,
  getSpeakingDifficultySelection,
  SPEAKING_DIFFICULTY_LEVELS,
} from "../src/data/presenterSpeakingDifficulty.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("all 56 A2/B1 lessons have explicit Easy Neutral Difficult selections", () => {
  const slides = [...getSlidesByCourse("A2"), ...getSlidesByCourse("B1")];
  assert.equal(slides.length, 56);
  assert.equal(Object.keys(A2_B1_SPEAKING_DIFFICULTY).length, 56);

  for (const slide of slides) {
    const selection = getSpeakingDifficultySelection(slide.assignmentId);
    assert.ok(selection, `${slide.assignmentId} difficulty mapping missing`);
    assert.deepEqual(selection.labels, SPEAKING_DIFFICULTY_LEVELS);
    assert.equal(selection.indexes.length, 3);
    assert.equal(new Set(selection.indexes).size, 3, `${slide.assignmentId} difficulty indexes must be distinct`);
    for (const index of selection.indexes) {
      assert.ok(Number.isInteger(index) && index >= 0 && index < slide.studentQuestionsDe.length, `${slide.assignmentId} index ${index} out of range`);
    }

    const stage = buildTeachingPresenterStages(slide, slide.topic).find((item) => item.id === "questions");
    assert.equal(stage.difficultySource, "curated", `${slide.assignmentId} must not use positional fallback`);
    assert.deepEqual(stage.difficultyIndexes, selection.indexes);
    assert.deepEqual(stage.items, selection.indexes.map((index) => slide.studentQuestionsDe[index]));
    assert.deepEqual(stage.questionLevels, ["Easy", "Neutral", "Difficult"]);
  }
});

test("difficulty curation is genuinely lesson-specific rather than first-middle-last", () => {
  const a2 = getSpeakingDifficultySelection("A2-4.11");
  const b1 = getSpeakingDifficultySelection("B1-2.6");
  const a2Day1 = getSpeakingDifficultySelection("A2-1.1");

  assert.deepEqual(a2.indexes, [1, 0, 4]);
  assert.deepEqual(b1.indexes, [1, 3, 4]);
  assert.deepEqual(a2Day1.indexes, [1, 3, 5]);
  assert.notDeepEqual(a2.indexes, [0, 2, 4]);
  assert.notDeepEqual(b1.indexes, [0, 2, 4]);
});

test("Teacher Lesson Dashboard reads the same curated difficulty source", () => {
  const dashboard = fs.readFileSync("src/pages/TeacherLessonDashboardPage.jsx", "utf8");
  assert.match(dashboard, /getSpeakingDifficultySelection/);
  assert.match(dashboard, /curatedSpeakingDifficulty\.indexes\.map/);
  assert.match(dashboard, /SPEAKING_DIFFICULTY_LEVELS/);
  assert.doesNotMatch(dashboard, /Math\.floor\(\(sourceSpeakingQuestions\.length - 1\) \/ 2\)/);
});
