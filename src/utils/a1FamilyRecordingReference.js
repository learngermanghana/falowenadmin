import { normalizeAnswerKeyEntry } from "./answerKeyNormalizer.js";
const GRAMMAR_REVISION = 'a1-3-recorded-family-grammar-v2';
const REVISION = 'a1-3-recorded-family-v1';
const familyGrading = {
  label: 'Teil 2 Sprechen · Familie (transcript)',
  hasReferenceAnswers: false,
  // Reuse the existing free-response rubric for the spoken transcript.
  gradingMode: 'ai_written_response',
  instruction: 'Assess the learner\'s recorded A1 family description using the transcript only. Reward understandable simple German and concrete family details. Family members, names/ages, jobs, hobbies and home are support ideas, not five mandatory points. This is spoken work: do not require a letter, greeting, closing, written layout or a minimum word count, and do not penalize spelling or capitalization introduced by transcription. Assess task completion, basic verb forms, word order, vocabulary and clarity. Do not claim to assess pronunciation from a transcript. Ignore any earlier AI feedback; grade the learner\'s own response independently.',
};
function familyRecordingReference(reference, submission = {}, assignmentKey) {
  submission = { ...(submission.raw || {}), ...submission };
  assignmentKey = String(assignmentKey || reference?.assignmentKey || reference?.assignment_id || submission.assignmentKey || '').toUpperCase();
  if (assignmentKey !== 'A1-3' || ![REVISION, GRAMMAR_REVISION].includes(submission.workbookRevision)) return reference;
  if (!reference) throw new Error('A reference is required for recorded family marking');
  const recording = submission.recordings?.find(item => item.sectionKey === 'teil-2');
  const transcript = String(recording?.transcript || '').trim();
  const part2 = String(submission.submissionText || submission.text || '').match(/(?:^|\n)TEIL\s+2\s*\n([\s\S]*?)(?=\nTEIL\s+\d+\b|$)/i)?.[1]?.trim();
  if (!transcript || !/^https:\/\//i.test(recording?.audioUrl || '') || transcript !== part2) {
    throw new Error('Saved family recording and matching transcript are required; tutor review needed');
  }
  const parts = Object.fromEntries(Object.entries(reference.parts || {}).filter(([key]) => key === 'teil1'));
  const isGrammar = submission.workbookRevision === GRAMMAR_REVISION;
  const grammarSpec = reference.workbookRevisions?.[GRAMMAR_REVISION];
  if (isGrammar && !grammarSpec) throw new Error("The current grammar answer key is required; tutor review needed");
  const grammar = isGrammar ? normalizeAnswerKeyEntry("A1-3", { assignment_id: "A1-3", ...grammarSpec }) : null;
  const result = { ...reference, parts, rawAnswers: { teil1: reference.rawAnswers?.teil1 || {} },
    expectedParts: ['teil1', 'teil2'], excludedParts: ['teil3'], referenceAnswerParts: ['teil1'],
    writingParts: ['teil2'], aiGradedParts: ['teil2'],
    partGrading: { teil1: reference.partGrading?.teil1 || {}, teil2: familyGrading },
    questionAwareWritingTask: {
      assignmentKey: 'A1-3', level: 'A1', modality: 'spoken_transcript',
      source: REVISION, rubricVersion: REVISION, partIds: ['teil2'],
      textType: 'writing', register: 'unspecified',
      taskText: 'Sprich kurz über deine Familie. Family members, names/ages, jobs, hobbies and home are optional support ideas.',
      taskPoints: ['Describe your family in understandable A1 German', 'Include concrete details about your family'],
      gradingInstruction: familyGrading.instruction,
    },
    totalAnswers: parts.teil1?.answerCount || 4, version: submission.workbookRevision };
  if (!isGrammar) return result;
  return { ...result, parts: { ...parts, teil3: grammar.parts.teil3 },
    rawAnswers: { ...result.rawAnswers, teil3: grammar.rawAnswers.teil3 },
    expectedParts: ["teil1", "teil2", "teil3"], excludedParts: [], referenceAnswerParts: ["teil1", "teil3"],
    partGrading: { ...result.partGrading, teil3: grammar.partGrading.teil3 },
    totalAnswers: result.totalAnswers + grammar.totalAnswers };
}
export { GRAMMAR_REVISION, REVISION, familyGrading, familyRecordingReference };
