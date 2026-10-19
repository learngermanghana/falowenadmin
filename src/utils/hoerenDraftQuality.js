import { parseStudioTranscript } from "./hoerenAudio.js";
import { validateDraftQuestions, normalizeQuote } from "./hoerenQuestions.js";

// Structural checks only: a matching quote cannot prove an answer is semantically true.
// All audio and answer keys still require an owner review before publishing.
export function inspectHoerenDraft({ script, kind, questions = [], expectedCount = 5, profile = null, mode = "course", questionScript = "" }) {
  const errors = [];
  const warnings = [];
  let spokenLines = [];
  let wordCount = 0;
  let pauseCount = 0;
  try {
    const parsed = parseStudioTranscript(script);
    spokenLines = parsed.filter(line => line.type === "speech");
    pauseCount = parsed.length - spokenLines.length;
    wordCount = spokenLines.reduce((total, line) => total + line.text.trim().split(/\s+/u).filter(Boolean).length, 0);
    if (spokenLines.length > 18) errors.push("Audio generation is limited to 18 spoken segments.");
    if (!spokenLines.length) errors.push("Add at least one spoken segment.");
  } catch (error) {
    errors.push(error.message);
  }

  if (mode === "goethe" && !profile) errors.push("Choose a valid Goethe level and Teil.");
  if (mode === "goethe" && profile) {
    if (kind !== profile.kind) errors.push("Question format does not match the selected exam template.");
    if (spokenLines.length) {
      const target = Number(profile.wordTarget);
      if (target && wordCount < target * 0.6) warnings.push(`Audio script is short for this Teil (${wordCount} / ~${target} words).`);
      if (target && wordCount > target * 1.55) warnings.push(`Audio script may be long for this Teil (${wordCount} / ~${target} words).`);
    }
  }

  if (questions.length) {
    if (questionScript !== script) errors.push("The transcript changed since the questions were generated. Regenerate or verify the questions.");
    try {
      validateDraftQuestions({ script, questions, kind, expectedCount });
    } catch (error) {
      errors.push(error.message);
    }
    // Matching formats must use one stable set of options for every item.
    if (mode === "goethe" && profile?.level === "C1" && profile.part === "1" &&
      Array.isArray(questions) && questions.length === expectedCount &&
      kind === "multiple-choice") {
      const first = questions[0]?.options?.map(normalizeQuote);
      if (!first || first.length !== 3 || !first.every((option, index) => option.startsWith(`buch ${index + 1}`))) {
        errors.push("C1 Teil 1 needs the same three labelled choices: Buch 1, Buch 2, Buch 3.");
      } else if (questions.some(q => JSON.stringify(q.options?.map(normalizeQuote)) !== JSON.stringify(first))) {
        errors.push("All six C1 book-matching questions must share the same three book options.");
      }
      const answers = new Set(questions.map(q => q.correctIndex));
      if (answers.size < 3) warnings.push("Verify that all three books are represented in the answer key.");
    }
  } else {
    warnings.push(mode === "goethe" ? "Generate the preset questions before producing an exam recording." : "No questions yet. Audio export still works, but Course Book publishing needs five reviewed questions.");
  }

  if (spokenLines.some(line => line.text.length > 285)) warnings.push("Some segments are close to the 320-character speech limit.");
  if (mode === "goethe" && spokenLines.length && new Set(spokenLines.map(line => line.speaker)).size === 1 && /discussion|interview/i.test(profile?.type || "")) {
    warnings.push("This Teil describes a conversation. Check whether more than one voice is needed.");
  }
  return { errors, warnings, spokenLines, wordCount, pauseCount, readyForVoice: errors.length === 0 && (mode !== "goethe" || questions.length === expectedCount) };
}
