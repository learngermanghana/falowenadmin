import { stripMarkingEmojis } from "./markingFeedbackText.js";

export const AI_FEEDBACK_MIN_WORDS = 40;
export const AI_FEEDBACK_MAX_WORDS = 65;

export const AI_FEEDBACK_INSTRUCTION = `Write one natural tutor comment for the student. Keep the detailed marking evidence in the structured fields, not in the student-facing feedback. The feedback must be one short paragraph of ${AI_FEEDBACK_MIN_WORDS} to ${AI_FEEDBACK_MAX_WORDS} words. Begin with one genuine strength, mention one accurate quotation from the student's actual writing and explain why it is effective, include one genuine correction or a brief optional improvement (never invent an error), and leave objective scores to the verified scoring system. Never assign a new practice exercise. For all levels A1–C2, base the comment on the actual writing task and student's sentences; do not praise only greetings or a connector such as "weil". Evaluate the actual assignment points, consistent du/Sie register, appropriate length where the task specifies a word limit, and sentence variety. Never demand memorised formulas such as "Ich schreibe" or "Ich freue mich"; reward natural equivalent expressions. Avoid praising repeated stock openings. Comment on one concrete way to improve. Use the deterministic objective result as the source of truth for objective scores and wrong answers. Never replace it with an AI-recount. Do not use headings, bullet points, score-report labels, emojis, markdown, asterisks, or stock openings such as "Good effort". Do not list every correction when the structured marking data already contains them. Sound like a human German tutor: warm, direct, specific, and easy to read.`;

export function dedupeRepeatedFeedback(value = "") {
  const text = stripMarkingEmojis(value);
  if (!text) return "";

  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  if (paragraphs.length > 1 && paragraphs.every((item) => item === paragraphs[0])) {
    return paragraphs[0];
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 12 && words.length % 2 === 0) {
    const midpoint = words.length / 2;
    const first = words.slice(0, midpoint).join(" ");
    const second = words.slice(midpoint).join(" ");
    if (first.toLocaleLowerCase("de-DE") === second.toLocaleLowerCase("de-DE")) {
      return first;
    }
  }

  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (sentences.length > 1) {
    const seen = new Set();
    const unique = sentences.filter((item) => {
      const key = item
        .toLocaleLowerCase("de-DE")
        .replace(/\s+/g, " ")
        .trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (unique.length !== sentences.length) return unique.join(" ");
  }

  return text;
}

export function limitFeedbackWords(value, maxWords = AI_FEEDBACK_MAX_WORDS) {
  return stripMarkingEmojis(value)
    .replace(/\*\*/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}
