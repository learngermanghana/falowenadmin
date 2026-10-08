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

test("Every A2 Wortschatz page asks four contextual German questions that match its exact phrases", () => {
  const slides = getSlidesByCourse("A2");
  assert.equal(Object.keys(A2_VOCABULARY_QUESTIONS).length, 28);
  for (const slide of slides) {
    const stage = buildTeachingPresenterStages(slide, slide.topic).find(s => s.id === "phrases");
    assert.ok(stage, slide.assignmentId);
    assert.equal(stage.type, "vocabulary", slide.assignmentId);
    assert.equal(stage.challengeItems.length, 4, slide.assignmentId + ": four guided Redemittel questions");
    const entries = A2_VOCABULARY_QUESTIONS[slide.assignmentId];
    assert.deepEqual(entries.map(e => e.term), stage.items.slice(0, 4).map(item => item.term), slide.assignmentId + ": questions must be keyed to the real source phrases");
    for (let index = 0; index < 4; index++) {
      const entry = entries[index], challenge = stage.challengeItems[index];
      assert.equal(challenge.answer, entry.term);
      assert.equal(challenge.sentence, getA2VocabularyQuestion(slide.assignmentId, entry.term));
      assert.equal(challenge.mode, "situation");
      assert.equal(challenge.promptLabel, "Sprechsituation");
      assert.ok(challenge.sentence.endsWith("?"), slide.assignmentId);
      assert.ok(challenge.sentence.length >= 65, slide.assignmentId);
      assert.ok(challenge.options.includes(entry.term));
      assert.equal(new Set(challenge.options).size, 3);
      assert.ok(!/Lies die konkrete Situation|Welche Formulierung passt\?/i.test(challenge.sentence), slide.assignmentId);
    }
    assert.equal(new Set(stage.challengeItems.map(c => c.sentence)).size, 4, slide.assignmentId);
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
