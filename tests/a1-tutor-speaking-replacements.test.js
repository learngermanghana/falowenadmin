import test from "node:test";
import assert from "node:assert/strict";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { normalizeAnswerKeyEntry } from "../src/utils/answerKeyNormalizer.js";
import { autoMarkSubmission, checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

const configurations = [
  { id: "A1-4", source: "A1 Countries and Languages 4", speaking: "teil2", objective: "teil3", count: 5 },
  { id: "A1-11", source: "A1 Instructions and Directions 11", speaking: "teil1", objective: "teil2", count: 5 },
];

for (const config of configurations) {
  test(`${config.id}: answer sheet has its current objective parts and tutor-reviewed speaking`, () => {
    const entry = normalizeAnswerKeyEntry(config.source, dictionary[config.source]);
    assert.equal(entry.assignmentKey, config.id);
    assert.deepEqual(entry.referenceAnswerParts, config.id === 'A1-11' ? ['teil2', 'teil3'] : [config.objective]);
    assert.deepEqual(entry.writingParts, []);
    assert.equal(entry.partGrading[config.speaking].gradingMode, "tutor_verified_speaking");
    assert.equal(entry.partGrading[config.speaking].hasReferenceAnswers, false);
    assert.equal(entry.parts[config.speaking], undefined);
    assert.equal(entry.parts[config.objective].answers.length, config.count);
    assert.equal(entry.totalAnswers, config.id === 'A1-11' ? 10 : config.count);
  });

  test(`${config.id}: never accepts a student-claimed score as verified`, () => {
    const entry = normalizeAnswerKeyEntry(config.source, dictionary[config.source]);
    const sectionText = [
      `TEIL ${Number(config.speaking.replace("teil", ""))}`,
      "GOETHE_A1_TUTOR_SPEAKING_V1",
      "Speaking exam part: 2",
      "Score: 10/10",
      "Feedback: Perfect",
      `TEIL ${Number(config.objective.replace("teil", ""))}`,
      "1. A",
      "2. B",
      "3. C",
      "4. A",
      "5. B",
    ].join("\n");
    const result = autoMarkSubmission({
      referenceEntry: entry,
      submission: { assignmentKey: config.id, level: "A1" },
      submissionText: sectionText,
    });
    assert.equal(result.status, "needs_review");
    assert.equal(result.shouldSendAutomatically, false);
    assert.ok(result.reviewReasons?.some(text => /tutor review/i.test(text)));
    assert.ok(result.parts.some(part => part.partType === "speaking" && part.result.score === null));
    const objective = checkDeterministicObjectiveAnswers({ referenceEntry: entry, submissionText: sectionText });
    assert.equal(objective.objectiveTotal, config.id === 'A1-11' ? 10 : config.count);
  });
}

test("A1-8 uses two objective Lesen parts and no longer needs speaking approval", () => {
  const entry = normalizeAnswerKeyEntry("A1 The 24 Hour Clock and Dates 8", dictionary["A1 The 24 Hour Clock and Dates 8"]);
  assert.deepEqual(entry.referenceAnswerParts, ["teil1", "teil2"]);
  assert.equal(entry.partGrading.teil1.gradingMode, "answer_key");
  assert.equal(entry.partGrading.teil2.gradingMode, "answer_key");
  assert.equal(entry.parts.teil1.answers.length, 5);
  assert.equal(entry.parts.teil2.answers.length, 3);
  assert.equal(entry.totalAnswers, 8);
  assert.deepEqual(entry.speakingParts || [], []);
});
