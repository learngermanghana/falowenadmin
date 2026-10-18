// Question drafts must be reviewed by the owner before they are published.
// The learner receives no answers or evidence until the server scores an attempt.
export const QUESTION_KINDS = Object.freeze({
  "richtig-falsch": "Richtig / Falsch",
  "multiple-choice": "Multiple choice (3 options)",
});
export const normalizeQuote = value => String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("de-DE");

export function parseGeminiLessonDraft(text) {
  const value = String(text || "").trim().replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  let parsed;
  try { parsed = JSON.parse(value); }
  catch { throw new Error("Google did not return structured script and question data. Try again."); }
  if (!parsed || typeof parsed.script !== "string" || parsed.script.trim().length < 30) {
    throw new Error("Google did not return a usable dialogue.");
  }
  return {
    script: parsed.script.trim(),
    questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    kind: ["richtig-falsch", "multiple-choice"].includes(parsed.kind) ? parsed.kind : "richtig-falsch",
  };
}

export function validateDraftQuestions({ script, questions, kind }) {
  if (!QUESTION_KINDS[kind]) throw new Error("Choose a supported question type.");
  if (!Array.isArray(questions) || questions.length !== 5) throw new Error("Review exactly five listening questions.");
  const whole = normalizeQuote(script);
  if (whole.length < 35 || whole.length > 7500) throw new Error("A complete script is required.");
  return questions.map((q, index) => {
    const question = String(q?.question || "").trim();
    const evidence = String(q?.evidence || "").trim();
    if (question.length < 8 || question.length > 320) throw new Error(`Question ${index + 1} needs a complete question.`);
    if (evidence.length < 6 || evidence.length > 320 || !whole.includes(normalizeQuote(evidence))) {
      throw new Error(`Question ${index + 1} needs an exact quote from the transcript.`);
    }
    if (kind === "richtig-falsch") {
      if (!["Richtig", "Falsch"].includes(q.answer)) throw new Error(`Question ${index + 1} needs a correct Richtig/Falsch answer.`);
      return { question, evidence, answer: q.answer };
    }
    const options = Array.isArray(q.options) ? q.options.map(x => String(x || "").trim()) : [];
    const correctIndex = Number(q.correctIndex);
    if (options.length !== 3 || options.some(x => !x || x.length > 140) ||
        new Set(options.map(x => x.toLowerCase())).size !== 3 ||
        !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 2) {
      throw new Error(`Question ${index + 1} needs three distinct options and one correct answer.`);
    }
    return { question, evidence, options, correctIndex };
  });
}
