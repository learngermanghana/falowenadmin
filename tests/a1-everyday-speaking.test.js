import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { A1_EVERYDAY_SPEAKING, getA1EverydaySpeaking } from "../src/data/a1EverydaySpeaking.js";

const regularA1 = getSlidesByCourse("A1").filter((slide) =>
  !["A1-TUTORIAL", "A1-5.9"].includes(String(slide.assignmentId || "").toUpperCase()));

test("every normal A1 teaching block has two genuinely authored speaking stages", () => {
  assert.equal(regularA1.length, 27, "expected 27 normal A1 teaching blocks");
  assert.equal(Object.keys(A1_EVERYDAY_SPEAKING).length, regularA1.length);
  assert.equal(getA1EverydaySpeaking("A1-5.9"), null, "do not replace the Goethe exam-readiness flow");

  for (const slide of regularA1) {
    const activity = getA1EverydaySpeaking(slide.assignmentId);
    assert.ok(activity, `${slide.assignmentId}: missing curated speaking plan`);
    assert.equal(activity.words.length, 5, `${slide.assignmentId}: exactly five words`);
    assert.equal(new Set(activity.words).size, 5, `${slide.assignmentId}: duplicate vocabulary`);

    for (const [type, keys] of [
      ["mission", ["title", "situation", "prompt", "model", "hint", "secondRound"]],
      ["reaction", ["title", "situation", "prompt", "model", "note"]],
      ["reaction.second", ["situation", "prompt", "model", "note"]],
    ]) {
      for (const key of keys) {
        const target = type === "reaction.second" ? activity.reaction.second : activity[type];
        assert.ok(String(target?.[key] || "").trim().length > 6,
          `${slide.assignmentId}: ${type} missing ${key}`);
      }
      const prompt = type === "reaction.second" ? activity.reaction.second.prompt : activity[type].prompt;
      assert.doesNotMatch(prompt, /change one detail|same grammar pattern|make a new sentence/i,
        `${slide.assignmentId}: generic prompt is forbidden`);
    }
  }
});

test("missions target distinct lesson grammar and listening responses are concrete", () => {
  const cases = getA1EverydaySpeaking("A1-5");
  assert.match(cases.mission.model, /einen Apfel/);
  assert.match(cases.reaction.model, /den Hund/);
  const no = getA1EverydaySpeaking("A1-9");
  assert.match(no.mission.model, /keinen Kaffee/);
  assert.match(no.reaction.model, /keinen Kaffee/);
  const twoWay = getA1EverydaySpeaking("A1-12.1");
  assert.match(twoWay.mission.model, /auf dem Tisch/);
  assert.match(twoWay.reaction.model, /auf den Tisch/);
  assert.match(getA1EverydaySpeaking("A1-14.2").mission.model, /helfe dem Mann/);
  assert.match(getA1EverydaySpeaking("A1-5.10").mission.model, /weil ich krank bin/);
});

test("presenter replaces sentence and workbook bridge slides after Common Mistakes", () => {
  const presenter = fs.readFileSync(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "utf8");
  const correction = presenter.indexOf('id: "mistake-fix"');
  const common = presenter.indexOf('id: "mistakes"', correction);
  const mission = presenter.indexOf('id: "mini-mission"', common);
  const reaction = presenter.indexOf('id: "listen-respond"', mission);
  const exit = presenter.indexOf('id: "exit-check"', reaction);
  assert.ok(correction >= 0 && common > correction && mission > common && reaction > mission && exit > reaction);
  assert.doesNotMatch(presenter, /id: "sentence-build"|id: "workbook",/);
  assert.match(presenter, /<A1EverydaySpeakingStage key=/);
  assert.match(presenter, /key=\\{.*slide\\.assignmentId.*stage\\.id/);
  assert.match(presenter, /const isSpeakingReadiness = .*A1-5\.9/);
  assert.match(presenter, /id: "mock"/);
  assert.match(presenter, /<PresenterStudentPicker/);
  assert.match(presenter, /<PresenterSessionTimer/);
  assert.match(presenter, /id: "grammar-check"/);
});

test("new classroom practice reveals hints and models on demand, without scoring", () => {
  const jsx = fs.readFileSync(new URL("../src/components/A1EverydaySpeakingStage.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  assert.match(jsx, /useState\(false\)/);
  assert.match(jsx, /Erst mündlich antworten lassen/);
  assert.match(jsx, /aria-expanded=\{showModel\}/);
  assert.match(jsx, /stage.words.map/);
  assert.match(jsx, /Musterantwort anzeigen/);
  assert.match(jsx, /Situation \{number \+ 1\}/);
  assert.match(jsx, /setShowModel\(false\)/);
  assert.doesNotMatch(jsx, /submitAssignment|saveAttempt|awardScore|markCorrect/);
  assert.match(css, /\.presenter-a1-speaking-words/);
  assert.match(css, /@media \(max-width: 700px\)/);
});
