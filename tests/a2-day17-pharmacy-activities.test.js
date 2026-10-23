import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { A2_DAY17_AUDIO_KEY, A2_DAY17_TRANSCRIPT, A2_DAY17_WARMUP, A2_DAY17_LISTENING } from "../src/data/a2Day17Opening.js";
import { INTERACTIVE_LESSON_OPENINGS, getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";

test("A2 Day 17 replaces only its opening stages with a 10-minute warm-up and listening", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-6.17");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const warm = stages.find((stage) => stage.id === "warmup");
  const listening = stages.find((stage) => stage.id === "knowledge");
  assert.equal(warm.type, "list");
  assert.equal(warm.variant, "interactive-warmup");
  assert.equal(warm.suggestedMinutes, 10);
  assert.equal(warm.challengeItems.length, 4);
  assert.equal(warm.challengeItems.reduce((total, row) => total + row.minutes, 0), 10);
  assert.equal(listening.type, "knowledge");
  assert.equal(listening.variant, "interactive-listening");
  assert.equal(listening.suggestedMinutes, 6);
  assert.equal(listening.audioKey, A2_DAY17_AUDIO_KEY);
  assert.equal(listening.transcript.length, A2_DAY17_TRANSCRIPT.length);
  assert.equal(listening.listeningItems.length, A2_DAY17_LISTENING.length);
  assert.ok(stages.some((stage) => stage.id === "phrases"));
  assert.ok(stages.some((stage) => stage.id === "grammar-check" || stage.type === "grammar-check"));
  assert.equal(stages.length, buildTeachingPresenterStages({ ...slide, assignmentId: "A2-6.16" }, slide.topic).length);
});

test("other A2/B1 lessons still have the old warm-up and short reading", () => {
  for (const level of ["A2","B1"]) {
    for (const slide of getSlidesByCourse(level)) {
      if (slide.assignmentId === "A2-6.17") continue;
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      assert.equal(stages.find((stage)=>stage.id === "warmup").type, "list");
      assert.equal(stages.find((stage)=>stage.id === "knowledge").type, "knowledge");
    }
  }
});

test("pharmacy questions are key-backed and transcript contains uploaded facts", () => {
  assert.equal(A2_DAY17_WARMUP.length, 4);
  assert.equal(A2_DAY17_AUDIO_KEY,"a2/day-17/apotheken-detektiv.mp3");
  const transcript = A2_DAY17_TRANSCRIPT.map(([speaker,text])=>speaker + ": " + text).join("\n");
  assert.match(transcript,/zwölf Euro fünfzig/);
  assert.match(transcript,/Dosierungsangaben auf der Packung/);
  for (const item of A2_DAY17_LISTENING) {
    assert.ok(item.prompt && item.hint && item.answer);
    assert.ok(Number.isInteger(item.correctIndex));
    assert.ok(item.options[item.correctIndex]);
  }
});


test("chosen chapters reuse four authored 10-minute warm-up steps without invented recordings", () => {
  const chosen = ["A2-3.8","A2-6.17","A2-7.18","A2-7.20","B1-2.5","B1-7.22","B1-8.25"];
  assert.deepEqual(Object.keys(INTERACTIVE_LESSON_OPENINGS), chosen);
  for (const id of chosen) {
    const entry = getInteractiveLessonOpening(id);
    const slide = getSlidesByCourse(id.startsWith("A2") ? "A2" : "B1").find(x => x.assignmentId === id);
    assert.ok(slide, id);
    assert.equal(entry.warmup.length, 4, id);
    assert.equal(entry.warmup.reduce((t,item) => t + item.minutes,0),10,id);
    for (const item of entry.warmup) {
      assert.ok(item.prompt && item.answer && item.teacherHint,id);
      assert.ok((item.options?.length || 0) + (item.lines?.length || 0) > 0,id);
    }
    const stages = buildTeachingPresenterStages(slide,slide.topic);
    assert.equal(stages.find(s=>s.id==="warmup").variant,"interactive-warmup",id);
    assert.equal(stages.find(s=>s.id==="warmup").type,"list",id);
    assert.equal(stages.find(s=>s.id==="knowledge").type,"knowledge",id);
    assert.equal(Boolean(entry.listening),id==="A2-6.17",id);
    assert.equal(stages.find(s=>s.id==="knowledge").variant==="interactive-listening",id==="A2-6.17",id);
    assert.equal(isInteractiveOpeningStage(id,"warmup"),true,id);
    assert.equal(isInteractiveOpeningStage(id,"knowledge"),id==="A2-6.17",id);
    assert.equal(isInteractiveOpeningStage(id,"phrases"),false,id);
  }
});

test("only the chosen chapters change: other A2/B1 days keep classic opening and knowledge", () => {
  for (const level of ["A2","B1"]) for(const slide of getSlidesByCourse(level)) {
    if(getInteractiveLessonOpening(slide.assignmentId)) continue;
    const stages=buildTeachingPresenterStages(slide,slide.topic);
    assert.notEqual(stages.find(s=>s.id==="warmup").variant,"interactive-warmup",slide.assignmentId);
    assert.notEqual(stages.find(s=>s.id==="knowledge").variant,"interactive-listening",slide.assignmentId);
  }
});

test("shared fullscreen renderer includes audio overview and optional post-audio review", () => {
  const presenter = readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  const activity = readFileSync(new URL("../src/components/InteractiveLessonOpening.jsx", import.meta.url), "utf8");
  assert.match(presenter, /const interactiveOpening = isInteractiveOpeningStage/);
  assert.match(presenter, /interactiveOpening \? \(/);
  assert.match(presenter, /<InteractiveLessonOpening key=/);
  assert.match(presenter, /presenter-content-interactive/);
  assert.match(css, /presenter-stage\.is-focus-mode > \.presenter-content\.presenter-content-interactive/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(activity, /lesson\.listening\.transcript/);
  assert.match(activity, /lesson\.listening\.audioKey/);
  assert.match(activity, /<audio key=\{audioUrl\}/);
  assert.match(activity, /pharm-question-overview/);
  assert.match(activity, /if \(autoReview\)/);
  assert.match(activity, /setReviewMode\(false\)/);
});
