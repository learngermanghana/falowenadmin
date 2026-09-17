import test from "node:test";
import assert from "node:assert/strict";

import { getTeachingSlideByAssignmentId, teachingSlides } from "../src/data/teachingSlides.js";
import {
  assignmentVersionId,
  buildAssignmentRegistryDraftFromSlide,
  buildAssignmentRegistryDrafts,
  toPublicAssignmentRecord,
  toQuestionAwareWritingTask,
  validateAssignmentRegistryDraft,
} from "../src/utils/assignmentRegistry.js";
import { detectWritingTextType, WRITING_TEXT_TYPES } from "../src/utils/writingTaskSchema.js";

test("A2/B1 workbook writing tasks generate canonical registry drafts", () => {
  const drafts = buildAssignmentRegistryDrafts(teachingSlides);
  assert.ok(drafts.length >= 40, `Expected broad A2/B1 coverage, received ${drafts.length}`);
  assert.ok(drafts.every((draft) => ["A2", "B1"].includes(draft.level)));
  assert.ok(drafts.every((draft) => draft.markingSpec?.taskPoints?.length > 0));
});

test("B1-1.2 draft carries the communicative task and normalized text type", () => {
  const slide = getTeachingSlideByAssignmentId("B1-1.2");
  const draft = buildAssignmentRegistryDraftFromSlide(slide);
  assert.equal(draft.assignmentId, "B1-1.2");
  assert.equal(draft.markingSpec.textType, WRITING_TEXT_TYPES.INFORMAL_EMAIL);
  assert.equal(draft.markingSpec.register, "informal");
  assert.equal(draft.markingSpec.taskPoints.length, 3);
  assert.equal(draft.publicTask.promptVerified, false);
  assert.match(draft.source.summary, /explain how you met/i);
});

test("publishing validation requires exact prompt verification", () => {
  const draft = buildAssignmentRegistryDraftFromSlide(getTeachingSlideByAssignmentId("B1-1.2"));
  assert.ok(validateAssignmentRegistryDraft(draft).some((message) => /verify/i.test(message)));
  draft.publicTask.promptVerified = true;
  assert.deepEqual(validateAssignmentRegistryDraft(draft), []);
});

test("public record never exposes private marking specification", () => {
  const draft = buildAssignmentRegistryDraftFromSlide(getTeachingSlideByAssignmentId("B1-1.2"));
  draft.publicTask.promptVerified = true;
  const record = { ...draft, version: 4, status: "published" };
  const publicRecord = toPublicAssignmentRecord(record);
  assert.equal(publicRecord.version, 4);
  assert.equal(Object.hasOwn(publicRecord, "markingSpec"), false);
  assert.equal(Object.hasOwn(publicRecord, "source"), false);
  assert.ok(publicRecord.publicTask.prompt);
  assert.equal(assignmentVersionId("B1-1.2", 4), "B1-1.2__v4");
});

test("published private record converts to the task used by the examiner", () => {
  const draft = buildAssignmentRegistryDraftFromSlide(getTeachingSlideByAssignmentId("B1-1.2"));
  const task = toQuestionAwareWritingTask({ ...draft, version: 2 });
  assert.equal(task.assignmentKey, "B1-1.2");
  assert.equal(task.assignmentVersion, 2);
  assert.equal(task.textType, WRITING_TEXT_TYPES.INFORMAL_EMAIL);
  assert.equal(task.source, "assignmentRegistry");
  assert.equal(task.taskPoints.length, 3);
});

test("text type detector does not treat an essay body as an email just because it has a greeting and closing", () => {
  const submission = `Hallo Carmen,\nMeine Meinung ist, dass Freundschaft wichtig ist. Einerseits gibt es viele Vorteile. Andererseits kann Vertrauen verletzt werden. Zusammenfassend ist Freundschaft sehr wichtig.\nViele Grüße\nFred`;
  const detected = detectWritingTextType(submission);
  assert.equal(detected.detectedType, WRITING_TEXT_TYPES.OPINION_ESSAY);
  assert.ok(detected.confidence >= 0.72);
});

test("text type detector recognizes a genuine informal email", () => {
  const submission = `Hallo Carmen,\nwie geht es dir? Ich möchte dir von Kofi erzählen. Wir haben uns im Deutschkurs kennengelernt. Hast du am Samstag Zeit? Wollen wir uns im Café treffen?\nLiebe Grüße\nFred`;
  const detected = detectWritingTextType(submission);
  assert.equal(detected.detectedType, WRITING_TEXT_TYPES.INFORMAL_EMAIL);
  assert.ok(detected.confidence >= 0.72);
});
