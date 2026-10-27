// Teacher-facing A1 slide review cards. The questions and answer keys are
// taken only from the current lesson's verified class checks. No model answers
// are invented, and these cards never mark or track student progress.
const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
const OPEN_ENDED_GUIDE = /^(?:accept\b|for example[,:]? accept\b|the teacher\b|a correct (?:a1 |german )?(?:sentence|answer|example)\b|students? (?:may|can) )/i;
const ABSTRACT_PROMPT = /^(?:show this lesson point|teach this rule to|give one correct example that avoids)/i;

export function buildA1SlideReviewChecks(checks = [], limit = 3) {
  const seen = new Set();
  const result = [];
  const count = Math.max(0, Math.min(3, Number(limit) || 0));
  if (!count) return result;
  for (const entry of Array.isArray(checks) ? checks : []) {
    const questionDe = clean(entry?.questionDe);
    const answerDe = clean(entry?.answerDe);
    const noteEn = clean(entry?.noteEn);
    const key = questionDe.toLocaleLowerCase("de-DE");
    if (!questionDe || !answerDe || seen.has(key) || ABSTRACT_PROMPT.test(questionDe)
      || OPEN_ENDED_GUIDE.test(answerDe)) continue;
    seen.add(key);
    result.push({ questionDe, answerDe, noteEn });
    if (result.length >= count) break;
  }
  return result;
}
