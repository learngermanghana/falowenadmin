import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { A2_WARMUP_FOLLOWUPS, getA2WarmupFollowUp } from "../src/data/a2WarmupFollowUps.js";
import { A2_VOCABULARY_QUESTIONS, getA2VocabularyQuestion } from "../src/data/a2VocabularyQuestions.js";

test("All 28 A2 lessons have a distinct curated follow-up for every actual warm-up question", () => {
  const slides = getSlidesByCourse("A2");
  assert.equal(slides.length, 28);
  assert.equal(Object.keys(A2_WARMUP_FOLLOWUPS).length, 28);
  const generic = /Was ist der wichtigste Grund für deine Antwort|Was kannst du dazu aus deiner eigenen Erfahrung erzählen|Was genau meinst du damit|Kannst du ein Beispiel nennen|Wann machst du das normalerweise, und mit wem/i;
  for (const slide of slides) {
    const warmup = buildTeachingPresenterStages(slide, slide.topic).find(stage => stage.id === "warmup");
    const curated = A2_WARMUP_FOLLOWUPS[slide.assignmentId];
    assert.ok(curated, slide.assignmentId);
    assert.deepEqual(curated.map(item => item.questionDe), warmup.items, slide.assignmentId + ": follow-ups must be paired with unchanged source questions");
    const followups = [];
    warmup.items.forEach((question, index) => {
      const followup = getA2WarmupFollowUp(slide.assignmentId, question);
      assert.equal(warmup.questionSupport[index].followUpDe, followup, slide.assignmentId + ": no generic fallback");
      assert.ok(followup.endsWith("?") && followup.split(/\s+/).length >= 6, slide.assignmentId + ": ask a complete relevant question");
      assert.doesNotMatch(followup, generic, slide.assignmentId + ": avoid generic templates");
      assert.notEqual(followup, question);
      followups.push(followup);
    });
    assert.equal(new Set(followups).size, followups.length, slide.assignmentId + ": avoid repeated follow-ups");
  }
});

test("A2 retains its source expressions while the vocabulary slot becomes Lesen", () => {
 for (const slide of getSlidesByCourse("A2")) {
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.equal(stages.some(s => s.id === "phrases"), false);
  assert.ok(stages.find(s => s.id === "reading")?.textDe);
  const entries = A2_VOCABULARY_QUESTIONS[slide.assignmentId];
  assert.ok(entries.length >= 4);
  for (const entry of entries) {
   assert.ok(slide.keyPhrasesDe.includes(entry.term));
   assert.ok(getA2VocabularyQuestion(slide.assignmentId, entry.term).endsWith("?"));
  }
 }
});

test("A2 presenter gives clear spoken-task instructions while preserving other levels", () => {
  const jsx = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  assert.match(jsx, /Redemittel-Fragen starten/);
  assert.match(jsx, /Was sagst du in dieser Situation\?/);
  assert.match(jsx, /Die Lernenden wählen A, B oder C/);
  assert.match(jsx, /presenterLevel === "A2"/);
  assert.match(jsx, /"B1"/);
});
