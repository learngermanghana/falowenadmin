import test from "node:test";
import assert from "node:assert/strict";
import { MARKING_FEEDBACK_TEMPLATES } from "../src/data/markingFeedbackTemplates.js";

const templatesById = new Map(MARKING_FEEDBACK_TEMPLATES.map((template) => [template.id, template]));

test("marking page offers feedback for the three mixed objective and writing outcomes", () => {
  const perfect = templatesById.get("perfect-objective-and-writing");
  const objectiveStrong = templatesById.get("strong-objective-improve-writing");
  const writingStrong = templatesById.get("strong-writing-improve-objective");

  assert.match(perfect.text, /Excellent work/);
  assert.match(perfect.text, /every objective question correctly/);
  assert.match(perfect.text, /writing fully met the task/);

  assert.match(objectiveStrong.text, /Well done on the objective section/);
  assert.match(objectiveStrong.text, /writing still needs some work/);

  assert.match(writingStrong.text, /Well done on the writing section/);
  assert.match(writingStrong.text, /objective questions you missed/);
});
