import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_FEEDBACK_INSTRUCTION,
  AI_FEEDBACK_MAX_WORDS,
  AI_FEEDBACK_MIN_WORDS,
  limitFeedbackWords,
} from "../src/utils/feedbackPolicy.js";

test("AI feedback policy allows enough space for actionable writing guidance", () => {
  assert.equal(AI_FEEDBACK_MIN_WORDS, 80);
  assert.equal(AI_FEEDBACK_MAX_WORDS, 120);
  assert.match(AI_FEEDBACK_INSTRUCTION, /both the objective section and writing are perfect/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /objective section is strong but writing needs work/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /writing is strong but the objective section needs work/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /two or three concrete corrections/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /do not invent corrections/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /show improved wording/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /most useful language rule/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /exact wrong answers/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /ignore capitalisation\/case differences/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /at least two unique anchors/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /quoted short phrase/);
  assert.match(AI_FEEDBACK_INSTRUCTION, /Do not start with reusable phrases/);
});

test("feedback normalization removes bold markers and caps feedback at 120 words", () => {
  const source = `**Strength:** ${Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ")}`;
  const normalized = limitFeedbackWords(source);
  const words = normalized.split(/\s+/);

  assert.equal(words.length, AI_FEEDBACK_MAX_WORDS);
  assert.doesNotMatch(normalized, /\*\*/);
  assert.equal(words.at(-1), "word119");
});
