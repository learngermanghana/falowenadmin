import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { A2_DAY17_AUDIO_KEY, A2_DAY17_TRANSCRIPT, A2_DAY17_WARMUP, A2_DAY17_LISTENING } from "../src/data/a2Day17Opening.js";

test("A2 Day 17 replaces only its opening stages with a 10-minute warm-up and listening", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-6.17");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const warm = stages.find((stage) => stage.id === "warmup");
  const listening = stages.find((stage) => stage.id === "knowledge");
  assert.equal(warm.type, "pharmacy-warmup");
  assert.equal(warm.suggestedMinutes, 10);
  assert.equal(warm.items.length, 4);
  assert.equal(warm.items.reduce((total, row) => total + row.minutes, 0), 10);
  assert.equal(listening.type, "pharmacy-listening");
  assert.equal(listening.suggestedMinutes, 6);
  assert.equal(listening.audioKey, A2_DAY17_AUDIO_KEY);
  assert.equal(listening.transcript.length, A2_DAY17_TRANSCRIPT.length);
  assert.equal(listening.items.length, A2_DAY17_LISTENING.length);
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
