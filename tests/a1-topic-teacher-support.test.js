import test from "node:test";
import assert from "node:assert/strict";

import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { A1_TOPIC_TEACHER_SUPPORT } from "../src/data/a1TopicTeacherSupport.js";

const LATER_A1_ASSIGNMENTS = [
  "A1-7",
  "A1-8",
  "A1-3.5",
  "A1-3.6",
  "A1-4.7",
  "A1-9",
  "A1-10",
  "A1-11",
  "A1-12.1",
  "A1-12.2",
  "A1-5.9",
  "A1-12.3",
  "A1-13",
  "A1-14.1",
  "A1-14.2",
];

const GENERIC_A1_EXAMPLES = new Set([
  "Ich kann sagen: „Ich ...“",
  "Für mich ist ... wichtig.",
  "Kannst du das bitte wiederholen?",
]);

const GENERIC_A1_MISTAKES = new Set([
  "Using the infinitive instead of the correctly conjugated verb.",
  "Forgetting German noun capitalization or leaving out a needed article.",
  "Copying English word order into a German main clause.",
]);

test("later A1 presenter lessons have topic-specific support instead of the generic template", () => {
  assert.deepEqual(Object.keys(A1_TOPIC_TEACHER_SUPPORT).sort(), [...LATER_A1_ASSIGNMENTS].sort());

  for (const assignmentId of LATER_A1_ASSIGNMENTS) {
    const support = buildTeacherSlideSupport({
      course: "A1",
      assignmentId,
      title: assignmentId,
      topic: assignmentId,
    });

    assert.ok(support.grammarFocusEn.length >= 3, `${assignmentId} needs lesson-specific grammar focus`);
    assert.ok(support.modelExamplesDe.length >= 4, `${assignmentId} needs lesson-specific examples`);
    assert.ok(support.commonMistakesEn.length >= 3, `${assignmentId} needs lesson-specific mistakes`);
    assert.ok(support.modelExamplesDe.every((item) => !GENERIC_A1_EXAMPLES.has(item)), `${assignmentId} still uses generic examples`);
    assert.ok(support.commonMistakesEn.every((item) => !GENERIC_A1_MISTAKES.has(item)), `${assignmentId} still uses generic mistakes`);
  }
});

test("A1-13 Weather support is actually about weather", () => {
  const support = buildTeacherSlideSupport({
    course: "A1",
    assignmentId: "A1-13",
    title: "A1 · Wetter",
    topic: "13 Wetter",
  });

  assert.ok(support.modelExamplesDe.some((item) => /sonnig|regnet|windig|Grad/i.test(item)));
  assert.ok(support.commonMistakesEn.some((item) => /weather|regnet|Grad|temperature/i.test(item)));
  assert.ok(support.grammarFocusEn.some((item) => /weather|Wetter|regnet|Grad|temperature/i.test(item)));
});

test("slide-specific teacherSupport still wins over the later-A1 fallback bank", () => {
  const support = buildTeacherSlideSupport({
    course: "A1",
    assignmentId: "A1-13",
    teacherSupport: {
      grammarFocusEn: ["Direct grammar"],
      modelExamplesDe: ["Direct example"],
      commonMistakesEn: ["Direct mistake"],
    },
  });

  assert.deepEqual(support.grammarFocusEn, ["Direct grammar"]);
  assert.deepEqual(support.modelExamplesDe, ["Direct example"]);
  assert.deepEqual(support.commonMistakesEn, ["Direct mistake"]);
});
