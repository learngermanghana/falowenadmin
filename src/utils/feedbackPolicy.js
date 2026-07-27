export const AI_FEEDBACK_MIN_WORDS = 35;
export const AI_FEEDBACK_MAX_WORDS = 60;

export const AI_FEEDBACK_INSTRUCTION = `Write one natural tutor comment for the student. Keep the detailed marking evidence in the structured fields, not in the student-facing feedback. The feedback must be one short paragraph of ${AI_FEEDBACK_MIN_WORDS} to ${AI_FEEDBACK_MAX_WORDS} words. Begin with one genuine strength, mention the strongest section when relevant, identify the exact questions that need review, mention only the most useful writing correction, and give one practical next step. Use the deterministic objective result as the source of truth for objective scores and wrong answers. Never replace it with an AI-recount. Do not use headings, bullet points, score-report labels, emojis, markdown, asterisks, or stock openings such as "Good effort". Do not list every correction when the structured marking data already contains them. Sound like a human German tutor: warm, direct, specific, and easy to read.`;

export function limitFeedbackWords(value, maxWords = AI_FEEDBACK_MAX_WORDS) {
  return String(value || "")
    .replace(/\*\*/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}
