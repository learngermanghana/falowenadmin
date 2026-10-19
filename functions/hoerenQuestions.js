"use strict";
function norm(value) {
  return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("de-DE");
}
function validateQuestionSet({ script, kind, questions, expectedCount = 5 }) {
  if (!["richtig-falsch", "multiple-choice"].includes(kind) || !Array.isArray(questions) || questions.length !== expectedCount || expectedCount < 1 || expectedCount > 15) {
    throw new Error(`Exactly ${expectedCount} questions and a supported question type are required.`);
  }
  const source = norm(script);
  if (source.length < 35 || source.length > 7500) throw new Error("Invalid script length.");
  for (const [index, q] of questions.entries()) {
    const question = String(q?.question || "").trim();
    const evidence = String(q?.evidence || "").trim();
    if (question.length < 8 || question.length > 320 || evidence.length < 6 || evidence.length > 320 ||
        !source.includes(norm(evidence))) {
      throw new Error("Question " + (index + 1) + " needs a literal supporting quote from the script.");
    }
    if (kind === "richtig-falsch" && !["Richtig", "Falsch"].includes(q?.answer)) throw new Error("Invalid correct answer.");
    if (kind === "multiple-choice" && (!Array.isArray(q?.options) || q.options.length !== 3 ||
        q.options.some(v => typeof v !== "string" || !v.trim()) ||
        !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 2)) {
      throw new Error("Invalid multiple-choice answers.");
    }
  }
  return questions;
}
function extractLessonDraft(result = {}, expectedCount = 5) {
  const raw = (result.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim()
    .replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  let obj;
  try { obj = JSON.parse(raw); }
  catch { throw new Error("Google did not return structured questions. Try again."); }
  const script = String(obj?.script || "").trim();
  const kind = String(obj?.kind || "richtig-falsch");
  validateQuestionSet({ script, kind, questions: obj?.questions, expectedCount });
  return { script, kind, questions: obj.questions };
}
function questionInstructions(kind, count = 5) {
  const task = kind === "multiple-choice"
    ? "Each question must have options: three distinct strings, and correctIndex: 0, 1 or 2. No answer field."
    : "Each question must be a true/false statement with answer: 'Richtig' or 'Falsch'. Mix true and false statements.";
  return "Return ONLY a JSON object with properties script (complete transcript), kind ('" + kind +
    "'), and questions (exactly " + count + " objects). Every question needs a question string and an evidence string copied verbatim as a contiguous quote from the transcript (6+ characters). " +
    task + " Confirm every correct answer against its own evidence. No explanations outside JSON.";
}
module.exports = { norm, validateQuestionSet, extractLessonDraft, questionInstructions };
