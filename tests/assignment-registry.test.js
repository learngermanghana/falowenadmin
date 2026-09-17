import test from "node:test";
import assert from "node:assert/strict";

import { getTeachingSlideByAssignmentId, teachingSlides } from "../src/data/teachingSlides.js";
import { VERIFIED_ASSIGNMENT_TASK_COUNT } from "../src/data/verifiedAssignmentTasks.js";
import {
  assignmentVersionId,
  buildAssignmentRegistryDraftFromSlide,
  buildAssignmentRegistryDrafts,
  toPublicAssignmentRecord,
  toQuestionAwareWritingTask,
  validateAssignmentRegistryDraft,
} from "../src/utils/assignmentRegistry.js";
import { detectWritingTextType, WRITING_TEXT_TYPES } from "../src/utils/writingTaskSchema.js";

test("A2/B1 workbook writing tasks generate registry drafts without pretending summaries are verified", () => {
  const drafts = buildAssignmentRegistryDrafts(teachingSlides);
  assert.ok(drafts.length >= 40, `Expected broad A2/B1 coverage, received ${drafts.length}`);
  assert.ok(drafts.every((draft) => ["A2", "B1"].includes(draft.level)));
  assert.ok(drafts.every((draft) => draft.markingSpec?.taskPoints?.length > 0));
  assert.ok(drafts.some((draft) => draft.publicTask.promptVerified === false));
  assert.ok(drafts.some((draft) => draft.source?.kind === "falowen_student_task"));
});

test("source-traced Falowen tasks arrive pre-verified and summaries do not", () => {
  assert.ok(VERIFIED_ASSIGNMENT_TASK_COUNT >= 9);

  const b1 = buildAssignmentRegistryDraftFromSlide(getTeachingSlideByAssignmentId("B1-1.2"));
  assert.equal(b1.assignmentId, "B1-1.2");
  assert.equal(b1.publicTask.promptVerified, true);
  assert.equal(b1.source.kind, "falowen_student_task");
  assert.match(b1.source.path, /B1Day2FreundeFuersLebenWorkbookPage\.js$/);
  assert.match(b1.publicTask.prompt, /Wie haben Sie sich kennengelernt\?/i);
  assert.equal(b1.markingSpec.textType, WRITING_TEXT_TYPES.INFORMAL_EMAIL);
  assert.equal(b1.markingSpec.register, "informal");
  assert.equal(b1.markingSpec.taskPoints.length, 3);

  const a2 = buildAssignmentRegistryDraftFromSlide(getTeachingSlideByAssignmentId("A2-1.1"));
  assert.equal(a2.publicTask.promptVerified, true);
  assert.match(a2.publicTask.prompt, /Arbeit und deine Familie/i);
  assert.equal(a2.source.kind, "falowen_student_task");

  const fallback = buildAssignmentRegistryDrafts(teachingSlides).find((draft) => !draft.publicTask.promptVerified);
  assert.ok(fallback, "Expected at least one workbook summary that still needs source verification");
  assert.equal(fallback.source.kind, "admin_workbook_summary");
  assert.ok(validateAssignmentRegistryDraft(fallback).some((message) => /verify/i.test(message)));
});

test("publishing validation accepts a source-verified exact task", () => {
  const draft = buildAssignmentRegistryDraftFromSlide(getTeachingSlideByAssignmentId("B1-1.2"));
  assert.deepEqual(validateAssignmentRegistryDraft(draft), []);
});

test("public record never exposes private marking specification or source provenance", () => {
  const draft = buildAssignmentRegistryDraftFromSlide(getTeachingSlideByAssignmentId("B1-1.2"));
  const record = { ...draft, version: 4, status: "published" };
  const publicRecord = toPublicAssignmentRecord(record);
  assert.equal(publicRecord.version, 4);
  assert.equal(Object.hasOwn(publicRecord, "markingSpec"), false);
  assert.equal(Object.hasOwn(publicRecord, "source"), false);
  assert.ok(publicRecord.publicTask.prompt);
  assert.equal(assignmentVersionId("B1-1.2", 4), "B1-1.2__v4");
});

test("published private record converts to the exact task used by the examiner", () => {
  const draft = buildAssignmentRegistryDraftFromSlide(getTeachingSlideByAssignmentId("B1-1.2"));
  const task = toQuestionAwareWritingTask({ ...draft, version: 2 });
  assert.equal(task.assignmentKey, "B1-1.2");
  assert.equal(task.assignmentVersion, 2);
  assert.equal(task.textType, WRITING_TEXT_TYPES.INFORMAL_EMAIL);
  assert.equal(task.source, "assignmentRegistry");
  assert.equal(task.taskPoints.length, 3);
  assert.match(task.taskText, /Vorschlag für ein Treffen/i);
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
