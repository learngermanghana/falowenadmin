"use strict";
const { questionInstructions } = require("./hoerenQuestions");
// Owner UI takes lesson metadata from the Falowen Admin course dictionary.
function validateCourseLessonContext(value, level) {
  if (value == null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("Invalid course lesson selection."), {status:400});
  const assignmentKey = String(value.assignmentKey || "").trim();
  const chapter = String(value.chapter || "").trim();
  const title = String(value.title || "").trim();
  const englishTitle = String(value.englishTitle || "").trim();
  const upperKey = assignmentKey.toUpperCase();
  const matchesLevel = upperKey.startsWith(level + "-") || upperKey.startsWith(level + " ");
  if (!matchesLevel || assignmentKey.length > 80 || chapter.length > 24 || title.length < 3 || title.length > 180 || englishTitle.length > 180 ||
      [assignmentKey, chapter, title, englishTitle].some(part => /[\r\n<>]/.test(part))) {
    throw Object.assign(new Error("Selected curriculum lesson must match the level and contain a valid title."), {status:400});
  }
  return { assignmentKey, chapter, title, englishTitle };
}
function courseLessonPrompt({ level, type, topic, kind, lessonContext }) {
  const intro = `Create original German audio for a Falowen Course Book activity at CEFR ${level}. Recording type ${type}. Requested topic: ${topic}.\n`;
  const alignment = lessonContext ? `Falowen curriculum reference: ${lessonContext.assignmentKey}; chapter ${lessonContext.chapter}; German title "${lessonContext.title}"; English title "${lessonContext.englishTitle}". Treat the topic as a subtopic. Align the script, vocabulary and all questions with this exact lesson, not another chapter.\n` : "";
  return intro + alignment +
    "Write a practical teaching text with natural German, approximately 80–150 spoken words. Use A:/B:/C: speaker turns and optional [PAUSE 3] lines, max 18 spoken segments and 320 characters per segment. No official Goethe affiliation. " +
    questionInstructions(kind);
}
module.exports = { validateCourseLessonContext, courseLessonPrompt };
