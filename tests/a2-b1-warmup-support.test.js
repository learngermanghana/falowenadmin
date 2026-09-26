import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { splitWarmupQuestionSegments } from "../src/utils/warmupText.js";

for (const level of ["A2", "B1"]) {
  test(level + " warm-up questions expose keyword and optional support", () => {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);

    for (const slide of slides) {
      const warmup = buildTeachingPresenterStages(slide, slide.topic)
        .find((stage) => stage.id === "warmup");

      assert.ok(warmup, slide.assignmentId + " warm-up missing");
      assert.equal(warmup.questionSupport.length, warmup.items.length, slide.assignmentId + " support count");

      warmup.questionSupport.forEach((support, index) => {
        assert.ok(Array.isArray(support.keywords), slide.assignmentId + " keywords missing");
        assert.ok(support.keywords.length >= 1 && support.keywords.length <= 3, slide.assignmentId + " keyword count");
        assert.ok(String(support.hintEn || "").trim(), slide.assignmentId + " English hint missing");
        assert.ok(String(support.answerStarterDe || "").trim(), slide.assignmentId + " answer starter missing");
        assert.ok(String(support.followUpDe || "").trim(), slide.assignmentId + " follow-up missing");
        assert.ok(["Easy", "Extend", "Challenge"].includes(support.difficulty), slide.assignmentId + " difficulty marker");
        if (index === 0) assert.equal(support.difficulty, "Easy", slide.assignmentId + " first warm-up should start easy");
      });

      if (warmup.questionSupport.length >= 3) {
        assert.equal(
          warmup.questionSupport[warmup.questionSupport.length - 1].difficulty,
          "Challenge",
          slide.assignmentId + " final warm-up should be the challenge",
        );
      }
    }
  });
}

test("advanced B2/C1 warm-ups exposed by teachingSlides keep the existing simple list behavior", () => {
  for (const level of ["B2", "C1"]) {
    const slide = getSlidesByCourse(level)[0];
    const warmup = buildTeachingPresenterStages(slide, slide.topic)
      .find((stage) => stage.id === "warmup");

    assert.ok(warmup);
    assert.deepEqual(warmup.questionSupport || [], [], level + " should not get A2/B1 support controls");
  }
});

test("warm-up keyword highlighting matches whole words instead of prefixes", () => {
  const question = "Wo wohnst du lieber: in der Stadt oder auf dem Land?";
  const segments = splitWarmupQuestionSegments(question, ["Wo", "lieber"]);
  const highlighted = segments.filter((segment) => segment.highlighted).map((segment) => segment.text);

  assert.equal(segments.map((segment) => segment.text).join(""), question);
  assert.deepEqual(highlighted, ["Wo", "lieber"]);
  assert.equal(highlighted.filter((item) => item === "Wo").length, 1, "Wo should highlight only the standalone question word");
});

test("Erfahrung comparisons do not receive a past-event hint", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-6.20");
  const warmup = buildTeachingPresenterStages(slide, slide.topic)
    .find((stage) => stage.id === "warmup");
  const questionIndex = warmup.items.indexOf("Was ist wichtiger: Ausbildung oder Erfahrung?");
  const hint = warmup.questionSupport[questionIndex]?.hintEn || "";

  assert.ok(questionIndex >= 0);
  assert.match(hint, /Compare both sides/i);
  assert.doesNotMatch(hint, /past-time/i);
});

test("method questions with besser are not treated as comparisons", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-5.15");
  const warmup = buildTeachingPresenterStages(slide, slide.topic)
    .find((stage) => stage.id === "warmup");
  const questionIndex = warmup.items.indexOf("Wie kann man Arbeit und Privatleben besser trennen?");
  const hint = warmup.questionSupport[questionIndex]?.hintEn || "";

  assert.ok(questionIndex >= 0);
  assert.match(hint, /practical method/i);
  assert.doesNotMatch(hint, /Compare both sides/i);
});

test("wide presenter layouts fit the standard four warm-up questions in a two-column grid", () => {
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");

  assert.match(css, /@media \(min-width: 1050px\)/);
  assert.match(css, /\.presenter-warmup-question-list\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s);
  assert.match(css, /@media \(min-width: 1050px\) and \(max-height: 900px\)/);
  assert.match(css, /\.presenter-warmup-question-card:only-child/);
});

test("every A2/B1 warm-up follow-up is a real conversational question", () => {
  for (const level of ["A2", "B1"]) {
    for (const slide of getSlidesByCourse(level)) {
      const warmup = buildTeachingPresenterStages(slide, slide.topic)
        .find((stage) => stage.id === "warmup");

      warmup.questionSupport.forEach((support, index) => {
        const followUp = String(support.followUpDe || "").trim();
        assert.ok(followUp.endsWith("?"), `${slide.assignmentId} warm-up ${index + 1} must end as a question`);
        assert.doesNotMatch(
          followUp,
          /Nenne ein Beispiel|Was genau meinst du damit|Kannst du ein (?:konkretes )?Beispiel nennen/i,
          `${slide.assignmentId} warm-up ${index + 1} still uses a generic example prompt`,
        );
        assert.ok(
          followUp.split(/\s+/).length >= 5,
          `${slide.assignmentId} warm-up ${index + 1} follow-up is too generic`,
        );
      });
    }
  }
});

test("A2 Day 5 uses natural follow-up questions instead of example prompts", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-2.5");
  const warmup = buildTeachingPresenterStages(slide, slide.topic)
    .find((stage) => stage.id === "warmup");
  const byQuestion = new Map(warmup.items.map((question, index) => [
    question,
    warmup.questionSupport[index]?.followUpDe || "",
  ]));

  assert.equal(
    byQuestion.get("Was machst du gern am Wochenende?"),
    "Mit wem verbringst du dein Wochenende am liebsten?",
  );
  assert.equal(
    byQuestion.get("Wann stehst du am Wochenende auf?"),
    "Was machst du direkt nach dem Aufstehen?",
  );
  assert.equal(
    byQuestion.get("Siehst du abends oft fern?"),
    "Was siehst du abends am liebsten im Fernsehen?",
  );
  assert.equal(
    byQuestion.get("Gehst du manchmal mit Freunden aus?"),
    "Wohin gehst du mit deinen Freunden am liebsten?",
  );
});

test("A2 Day 22 follow-ups are tailored to the actual warm-up question", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-8.22");
  const warmup = buildTeachingPresenterStages(slide, slide.topic)
    .find((stage) => stage.id === "warmup");
  const byQuestion = new Map(warmup.items.map((question, index) => [
    question,
    warmup.questionSupport[index]?.followUpDe || "",
  ]));

  assert.match(byQuestion.get("Was machst du am Montag?") || "", /Montag/i);
  assert.match(byQuestion.get("Wann hast du diese Woche Deutschkurs?") || "", /Deutschkurs/i);
  assert.match(byQuestion.get("An welchem Tag kannst du Freunde treffen?") || "", /Freunde/i);
});

test("B1 follow-ups stay tied to the comparison or method in the question", () => {
  const comparisonSlide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-6.20");
  const comparison = buildTeachingPresenterStages(comparisonSlide, comparisonSlide.topic)
    .find((stage) => stage.id === "warmup");
  const comparisonIndex = comparison.items.indexOf("Was ist wichtiger: Ausbildung oder Erfahrung?");
  const comparisonFollowUp = comparison.questionSupport[comparisonIndex]?.followUpDe || "";

  assert.equal(
    comparisonFollowUp,
    "Wann ist praktische Erfahrung wichtiger als eine Ausbildung?",
  );

  const methodSlide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-5.15");
  const method = buildTeachingPresenterStages(methodSlide, methodSlide.topic)
    .find((stage) => stage.id === "warmup");
  const methodIndex = method.items.indexOf("Wie kann man Arbeit und Privatleben besser trennen?");
  const methodFollowUp = method.questionSupport[methodIndex]?.followUpDe || "";

  assert.equal(
    methodFollowUp,
    "Welche feste Regel hilft dir, nach der Arbeit wirklich abzuschalten?",
  );
});

test("presenter renders highlighted keywords with optional hint, starter and follow-up", () => {
  const source = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");

  assert.match(source, /presenter-warmup-keyword/);
  assert.match(source, /Hint \(EN\)/);
  assert.match(source, /Answer starter/);
  assert.match(source, /Follow-up/);
  assert.match(source, /presenter-warmup-difficulty/);
  assert.match(css, /\.presenter-warmup-question-card/);
  assert.match(css, /\.presenter-warmup-keyword/);
  assert.match(css, /background:\s*#facc15/);
  assert.match(css, /color:\s*#422006/);
  assert.match(css, /font-weight:\s*900/);
  assert.match(css, /box-shadow:\s*inset 0 -2px 0 #ca8a04/);
  assert.match(css, /\.presenter-warmup-support-actions/);
});
