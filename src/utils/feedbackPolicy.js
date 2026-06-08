export const AI_FEEDBACK_MIN_WORDS = 80;
export const AI_FEEDBACK_MAX_WORDS = 120;

export const AI_FEEDBACK_INSTRUCTION = `Develop feedback specifically from this assignment, its objectives, and the student's complete submission. Always inspect every section in the submission before scoring. If Teil 2, Schreiben, writing, or a letter/email section appears anywhere, you must mark that writing section even when the reference answer only contains Teil 3 or Teil 4 objective answers. Never return only the deterministic objective score when a writing section is present. For mixed submissions, state the supplied objective result, identify exact wrong objective answers, give a separate writing score, and explain how the final score combines objective and writing. For writing, assess task completion, grammar, vocabulary, structure/coherence, spelling/punctuation, and clarity. Explain a genuine strength, give two or three concrete corrections that quote the student's short wording and show improved wording, briefly explain the most useful language rule, and give a relevant next step. Prioritize actionable detail over a stock introduction or generic praise. Write ${AI_FEEDBACK_MIN_WORDS} to ${AI_FEEDBACK_MAX_WORDS} words in plain text with no Markdown or asterisks.`;

export function limitFeedbackWords(value, maxWords = AI_FEEDBACK_MAX_WORDS) {
  return String(value || "")
    .replace(/\*\*/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}
