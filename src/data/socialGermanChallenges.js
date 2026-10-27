import { CHALLENGE_QUIZZES } from "./socialChallengeQuizzes.js";
import { CHALLENGE_MISTAKES } from "./socialChallengeMistakes.js";
import { CHALLENGE_DIALOGUES } from "./socialChallengeDialogues.js";
import { CHALLENGE_EXAMS } from "./socialChallengeExams.js";

// These 120 prompts are authored editorially. Never label the original reading tasks as
// official Goethe questions or past papers.
export const CHALLENGE_TYPES = [
  { id: "quiz", label: "Can You Pass This German Test?", short: "German Quiz", count: 40 },
  { id: "mistake", label: "Stop Saying This in German!", short: "Common Mistake", count: 30 },
  { id: "dialogue", label: "German in Real Life", short: "Real-Life German", count: 30 },
  { id: "exam", label: "Exam-Style Mini Challenge", short: "Exam Practice", count: 20 },
];
export const CHALLENGE_LEVELS = ["A1", "A2", "B1", "B2"];
export const SOCIAL_GERMAN_CHALLENGES = [
  ...CHALLENGE_QUIZZES.map((item, index) => ({ ...item, id: "GC-Q-" + String(index + 1).padStart(3, "0"), type: "quiz" })),
  ...CHALLENGE_MISTAKES.map((item, index) => ({ ...item, id: "GC-M-" + String(index + 1).padStart(3, "0"), type: "mistake" })),
  ...CHALLENGE_DIALOGUES.map((item, index) => ({ ...item, id: "GC-D-" + String(index + 1).padStart(3, "0"), type: "dialogue" })),
  ...CHALLENGE_EXAMS.map((item, index) => ({ ...item, id: "GC-E-" + String(index + 1).padStart(3, "0"), type: "exam" })),
];

const safe = (value) => String(value ?? "").trim();
export function challengeCopy(entry) {
  if (!entry) return null;
  const level = safe(entry.level);
  const answers = Array.isArray(entry.options) ? entry.options.map((option, i) => String.fromCharCode(65 + i) + ". " + option).join("\n") : "";
  const correct = Array.isArray(entry.options) ? entry.options[entry.answerIndex] : "";
  let hook, challenge, reveal;
  switch (entry.type) {
    case "quiz":
      hook = "Can you pass this " + level + " German test?";
      challenge = safe(entry.prompt) + "\n" + answers;
      reveal = String.fromCharCode(65 + entry.answerIndex) + ". " + correct;
      break;
    case "mistake":
      hook = "Stop saying this in German!";
      challenge = "Spot the mistake:\n" + safe(entry.incorrect);
      reveal = safe(entry.correct);
      break;
    case "dialogue":
      hook = "German in real life · " + safe(entry.topic);
      challenge = "A: " + safe(entry.first) + "\nB: " + safe(entry.second);
      reveal = safe(entry.translation);
      break;
    case "exam":
      hook = "Exam-style " + level + " mini challenge";
      challenge = safe(entry.stimulus) + "\n\n" + safe(entry.prompt) + "\n" + answers;
      reveal = String.fromCharCode(65 + entry.answerIndex) + ". " + correct;
      break;
    default: return null;
  }
  const tags = entry.type === "exam" ? "#GermanExam #GoethePreparation #LearnGerman #Falowen"
    : "#LearnGerman #DeutschLernen #GermanPractice #Falowen";
  const caption = [
    hook,
    entry.type === "dialogue" ? challenge : challenge + "\n\nComment your answer before checking the reveal!",
    "✅ " + reveal,
    "💡 " + safe(entry.explanation),
    "Practise German with Falowen: https://falowen.app",
    tags,
  ].join("\n\n");
  return { hook, challenge, reveal, explanation: safe(entry.explanation), caption, label: CHALLENGE_TYPES.find(t => t.id === entry.type)?.short || entry.type };
}
export function filterGermanChallenges({ type = "all", level = "all", search = "" } = {}) {
  const query = safe(search).toLocaleLowerCase();
  return SOCIAL_GERMAN_CHALLENGES.filter((item) =>
    (type === "all" || item.type === type)
    && (level === "all" || item.level === level)
    && (!query || [item.id, item.topic, item.prompt, item.correct, item.incorrect, item.first, item.second, item.stimulus].some((v) => safe(v).toLocaleLowerCase().includes(query))));
}
export function nextUnusedGermanChallenge(items, statuses = {}) {
  return items.find((item) => !["Published"].includes(statuses[item.id])) || null;
}
