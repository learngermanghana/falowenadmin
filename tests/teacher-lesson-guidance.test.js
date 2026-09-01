import test from "node:test";
import assert from "node:assert/strict";
import { getTeacherLessonGuidance } from "../src/data/teacherLessonGuidance.js";
import { getA2WorkbookAlignedSlide } from "../src/data/a2WorkbookAlignedSlides.js";

test("generic lessons keep the pre-workbook teacher guidance and numbering", () => {
  const guidance = getTeacherLessonGuidance({ assignmentId: "A1-1.1" });

  assert.equal(guidance.hasWorkbookConnection, false);
  assert.equal(guidance.grammarSubtitle, "What the teacher should watch and reinforce during this lesson.");
  assert.equal(guidance.notesSubtitle, "Delivery guidance for this lesson.");
  assert.equal(guidance.guidedPracticeSubtitle, "Move from controlled practice to freer production.");
  assert.equal(guidance.speakingSubtitle, "Use these for pair work, follow-ups, or whole-class discussion.");
  assert.equal(guidance.wrapUpSubtitle, "Finish with one short production task that checks the lesson objective.");
  assert.deepEqual(Object.values(guidance.steps), ["03", "04", "05", "06", "07", "08", "09", "10", "11"]);
});

test("workbook-specific teacher guidance appears only when alignment data exists", () => {
  const slide = getA2WorkbookAlignedSlide("A2-1.1");
  const guidance = getTeacherLessonGuidance(slide);

  assert.equal(guidance.hasWorkbookConnection, true);
  assert.match(guidance.grammarSubtitle, /workbook/i);
  assert.match(guidance.notesSubtitle, /workbook/i);
  assert.match(guidance.guidedPracticeSubtitle, /workbook/i);
  assert.match(guidance.speakingSubtitle, /workbook/i);
  assert.match(guidance.wrapUpSubtitle, /workbook/i);
  assert.deepEqual(Object.values(guidance.steps), ["04", "05", "06", "07", "08", "09", "10", "11", "12"]);
});
