import { presenterConceptLabel } from "./presenterConceptLabels.js";

const VARIANTS = [
  (question) => question,
  (question) => question,
  (question) => question,
  (question) => question,
];

const PERFORMANCE_VARIANTS = [
  (question) => question,
  (question) => `Complete this speaking task independently: ${question}`,
  (question) => `Complete the same exam task with your own wording: ${question}`,
  (question) => `Do this speaking task without copying the previous student's wording: ${question}`,
];

const KNOWLEDGE_VARIANTS = [
  (question) => question,
  (question) => `Answer this readiness question without looking at the notes: ${question}`,
  (question) => `Give the correct exam strategy or factual answer: ${question}`,
  (question) => `Answer the same readiness question briefly and accurately: ${question}`,
];

const clean = (value) => String(value ?? "").trim();
const MIN_A1_PRESENTER_QUESTIONS = 10;
const MAX_A1_PRESENTER_QUESTIONS = 150;

function normalizeQuestion(question = {}, index = 0) {
  const questionText = clean(question.questionDe || question.question || question.prompt);
  if (!questionText) return null;
  return {
    sourceIndex: index,
    questionDe: questionText,
    answerDe: clean(question.answerDe || question.answer || question.modelAnswer),
    noteEn: clean(question.noteEn || question.note || ""),
    conceptLabel: clean(question.conceptLabel) || presenterConceptLabel(questionText),
    responseMode: clean(question.responseMode || "concept"),
  };
}

/**
 * Expand the small curated A1 concept bank into a roster-sized live-class pool.
 * Always keep at least 10 questions available, then grow with the selected class
 * roster so each learner can receive one unused question per round.
 * A1 roster expansion repeats the curated direct question when a class is larger
 * than the available unique checks. It never wraps questions in generic meta-prompts.
 */
export function buildA1PresenterQuestionPool(baseQuestions = [], targetSize = 0, seedPrefix = "a1") {
  const normalized = (Array.isArray(baseQuestions) ? baseQuestions : [])
    .map(normalizeQuestion)
    .filter(Boolean);
  if (!normalized.length) return [];

  const requested = Math.min(
    Math.max(MIN_A1_PRESENTER_QUESTIONS, Number(targetSize) || normalized.length),
    MAX_A1_PRESENTER_QUESTIONS,
  );
  const pool = [];
  let cycle = 0;

  while (pool.length < requested) {
    for (let sourceIndex = 0; sourceIndex < normalized.length && pool.length < requested; sourceIndex += 1) {
      const base = normalized[sourceIndex];
      const variants = base.responseMode === "performance"
        ? PERFORMANCE_VARIANTS
        : base.responseMode === "knowledge"
          ? KNOWLEDGE_VARIANTS
          : VARIANTS;
      const variantIndex = cycle % variants.length;
      const rendered = variants[variantIndex](base.questionDe);
      const questionDe = rendered;
      pool.push({
        id: `${clean(seedPrefix) || "a1"}-q${sourceIndex + 1}-v${cycle + 1}`,
        questionDe,
        answerDe: base.answerDe,
        noteEn: base.noteEn,
        sourceQuestion: base.questionDe,
        conceptLabel: base.conceptLabel,
        responseMode: base.responseMode,
        sourceIndex,
        variantIndex,
      });
    }
    cycle += 1;
  }

  return pool;
}

export function resultLabel(result = "") {
  if (result === "correct") return "Correct";
  if (result === "needs_review") return "Needs review";
  if (result === "skipped") return "Skipped";
  if (result === "presenter_absent") return "Presenter absent";
  return clean(result) || "Recorded";
}
