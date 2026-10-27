import { PRESENTER_READING_LESSONS } from "./presenterReadingLessons.js";

// Keep questions, passages and evidence in the same authored source.
export const A2_B1_KNOWLEDGE_ANSWERS = Object.freeze(Object.fromEntries(
  Object.entries(PRESENTER_READING_LESSONS).map(([id, lesson]) => [id, lesson.answers]),
));

export function getA2B1KnowledgeAnswers(assignmentId = "") {
  return A2_B1_KNOWLEDGE_ANSWERS[String(assignmentId || "").trim().toUpperCase()] || null;
}
