export const AI_FEEDBACK_MIN_WORDS = 80;
export const AI_FEEDBACK_MAX_WORDS = 120;

export const AI_FEEDBACK_INSTRUCTION = `Develop feedback specifically from this assignment, its objectives, the reference answer, and the student's complete submission. Always inspect every section before scoring. If Teil 2, Schreiben, writing, letter, email, essay, or any long free-text answer appears anywhere, you must mark that writing section even when the reference answer only contains Teil 3 or Teil 4 objective answers. Never return only the deterministic objective score when a writing section is present. For objective/MCQ/reading/listening answers, compare against the reference answer first and do not guess missing keys. For mixed submissions, state the exact objective result, identify exact wrong objective answers, give a separate writing score, and explain how the final score combines objective and writing. For writing, assess task completion, grammar, word order, vocabulary, structure/coherence, tone/formality, spelling/punctuation, and clarity. In plain text feedback, include these ideas naturally: Score breakdown, why this score was given, one genuine strength, two or three concrete corrections using the student's exact short wording and improved wording, the most useful language rule, and one next step. Keep the student-facing feedback short, tutor-friendly, and actionable. Avoid generic praise, stock openings, markdown, asterisks, and vague comments. Write ${AI_FEEDBACK_MIN_WORDS} to ${AI_FEEDBACK_MAX_WORDS} words in plain text.`;

export function limitFeedbackWords(value, maxWords = AI_FEEDBACK_MAX_WORDS) {
  return String(value || "")
    .replace(/\*\*/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}
