export const AI_FEEDBACK_MIN_WORDS = 80;
export const AI_FEEDBACK_MAX_WORDS = 120;

export const AI_FEEDBACK_INSTRUCTION = `Develop feedback specifically from this assignment, its objectives, and the student’s submitted writing. Write ${AI_FEEDBACK_MIN_WORDS} to ${AI_FEEDBACK_MAX_WORDS} words in plain text with no Markdown or asterisks. For writing, explain a genuine strength, give two or three concrete corrections that quote the student’s wording and show improved wording, briefly explain the most useful language rule, and give a relevant next step. For mixed submissions, also state the supplied objective result and identify exact wrong answers. Prioritize actionable detail over a stock introduction or generic praise.`;

export function limitFeedbackWords(value, maxWords = AI_FEEDBACK_MAX_WORDS) {
  return String(value || "")
    .replace(/\*\*/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}
