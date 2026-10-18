var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/a1FamilyRecordingReference.js
var a1FamilyRecordingReference_exports = {};
__export(a1FamilyRecordingReference_exports, {
  REVISION: () => REVISION,
  familyGrading: () => familyGrading,
  familyRecordingReference: () => familyRecordingReference
});
module.exports = __toCommonJS(a1FamilyRecordingReference_exports);
var REVISION = "a1-3-recorded-family-v1";
var familyGrading = {
  label: "Teil 2 Sprechen \xB7 Familie (transcript)",
  hasReferenceAnswers: false,
  // Reuse the existing free-response rubric for the spoken transcript.
  gradingMode: "ai_written_response",
  instruction: "Assess the learner's recorded A1 family description using the transcript only. Reward understandable simple German and concrete family details. Family members, names/ages, jobs, hobbies and home are support ideas, not five mandatory points. This is spoken work: do not require a letter, greeting, closing, written layout or a minimum word count, and do not penalize spelling or capitalization introduced by transcription. Assess task completion, basic verb forms, word order, vocabulary and clarity. Do not claim to assess pronunciation from a transcript. Ignore any earlier AI feedback; grade the learner's own response independently."
};
function familyRecordingReference(reference, submission = {}, assignmentKey) {
  submission = { ...submission.raw || {}, ...submission };
  assignmentKey = String(assignmentKey || reference?.assignmentKey || reference?.assignment_id || submission.assignmentKey || "").toUpperCase();
  if (assignmentKey !== "A1-3" || submission.workbookRevision !== REVISION) return reference;
  if (!reference) throw new Error("A reference is required for recorded family marking");
  const recording = submission.recordings?.find((item) => item.sectionKey === "teil-2");
  const transcript = String(recording?.transcript || "").trim();
  const part2 = String(submission.submissionText || submission.text || "").match(/(?:^|\n)TEIL\s+2\s*\n([\s\S]*?)(?=\nTEIL\s+\d+\b|$)/i)?.[1]?.trim();
  if (!transcript || !/^https:\/\//i.test(recording?.audioUrl || "") || transcript !== part2) {
    throw new Error("Saved family recording and matching transcript are required; tutor review needed");
  }
  const parts = Object.fromEntries(Object.entries(reference.parts || {}).filter(([key]) => key === "teil1"));
  return {
    ...reference,
    parts,
    rawAnswers: { teil1: reference.rawAnswers?.teil1 || {} },
    expectedParts: ["teil1", "teil2"],
    excludedParts: ["teil3"],
    referenceAnswerParts: ["teil1"],
    writingParts: ["teil2"],
    aiGradedParts: ["teil2"],
    partGrading: { teil1: reference.partGrading?.teil1 || {}, teil2: familyGrading },
    questionAwareWritingTask: {
      assignmentKey: "A1-3",
      level: "A1",
      modality: "spoken_transcript",
      source: REVISION,
      rubricVersion: REVISION,
      partIds: ["teil2"],
      textType: "writing",
      register: "unspecified",
      taskText: "Sprich kurz \xFCber deine Familie. Family members, names/ages, jobs, hobbies and home are optional support ideas.",
      taskPoints: ["Describe your family in understandable A1 German", "Include concrete details about your family"],
      gradingInstruction: familyGrading.instruction
    },
    totalAnswers: parts.teil1?.answerCount || 4,
    version: REVISION
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  REVISION,
  familyGrading,
  familyRecordingReference
});
