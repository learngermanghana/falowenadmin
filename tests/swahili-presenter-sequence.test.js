import test from "node:test";
import assert from "node:assert/strict";
import { swahiliSlidePacks } from "../src/data/swahiliSlidePacks.js";
import { SWAHILI_PRESENTER_SECTIONS, swahiliStageSection, standardizeSwahiliStages } from "../src/utils/swahiliPresenterSequence.js";

test("all authored Swahili packs use one stable sequence without dropping stages", () => {
  for (const lessons of Object.values(swahiliSlidePacks)) {
    for (const lesson of lessons) {
      const source = lesson.stages || lesson.classroomStages;
      const before = source.map(stage => stage.id);
      const sorted = standardizeSwahiliStages(source);
      assert.equal(sorted[0].id, "intro", lesson.id);
      assert.deepEqual(sorted.map(stage => stage.id).sort(), [...before].sort(), lesson.id);
      assert.deepEqual(source.map(stage => stage.id), before, lesson.id);
      const order = sorted.map(stage => SWAHILI_PRESENTER_SECTIONS.indexOf(swahiliStageSection(stage)));
      assert.deepEqual(order, [...order].sort((a,b) => a-b), lesson.id);
      for (const section of SWAHILI_PRESENTER_SECTIONS) {
        assert.deepEqual(sorted.filter(s => swahiliStageSection(s) === section),
          source.filter(s => swahiliStageSection(s) === section), lesson.id);
      }
    }
  }
});
test("B1 Day 27 and 28 open with music, then listening, then reading", () => {
  for (const lesson of swahiliSlidePacks.B1) {
    const stages = standardizeSwahiliStages(lesson.stages || lesson.classroomStages);
    assert.deepEqual([...new Set(stages.map(swahiliStageSection))].slice(0,4), ["intro","music","listening","reading"]);
  }
  const day27 = swahiliSlidePacks.B1.find(lesson => lesson.dayNumber === 27);
  assert.equal(day27.stages.find(stage => stage.id === "music").type, "media-pending");
  assert.equal(day27.stages.find(stage => stage.id === "knowledge").listening.questions.length, 5);
});
