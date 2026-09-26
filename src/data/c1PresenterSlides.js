import { getC1CanonicalLesson } from "./c1CanonicalCurriculum.js";
import { getC1TopicCollocations } from "./c1PresenterLanguage.js";

const slug = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const sentenceCase = (value = "") => {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
};

function tensionSentence(tension = "") {
  const [left, right] = String(tension || "").split("↔").map((part) => part.trim());
  if (!left || !right) return String(tension || "");
  return `Einerseits geht es um ${sentenceCase(left)}, andererseits um ${sentenceCase(right)}.`;
}

function grammarFocus(lesson) {
  return [
    `Grammatikschwerpunkt: ${lesson.grammarTitle}.`,
    `Anwendung: Nutze die Zielstruktur, um ${lesson.profile.aim}.`,
    `Kontrollpunkt: ${lesson.profile.mistake}`,
  ];
}

function modelExamples(lesson) {
  const firstAngle = lesson.profile.angles?.[0] || "eine zentrale Perspektive";
  return [
    lesson.foundation.example,
    `Bei der Beurteilung von „${lesson.title}“ sollte insbesondere ${sentenceCase(firstAngle)} berücksichtigt werden.`,
    tensionSentence(lesson.foundation.tension),
  ];
}

function speakingQuestions(lesson) {
  const points = Array.isArray(lesson.profile.points) ? lesson.profile.points.slice(0, 4) : [];
  return [...points, lesson.profile.question].filter(Boolean).slice(0, 5);
}

function speakingAnswer(lesson, question, index) {
  const angle = lesson.profile.angles?.[index % Math.max(1, lesson.profile.angles?.length || 1)] || "die zentrale Fragestellung";
  const example = lesson.foundation.example;
  const tension = tensionSentence(lesson.foundation.tension);
  const closers = [
    "Deshalb würde ich die Frage nicht pauschal beantworten, sondern die genannten Bedingungen und die konkreten Folgen gegeneinander abwägen.",
    "Eine überzeugende Lösung sollte daher sowohl den unmittelbaren Nutzen als auch langfristige Folgen und die betroffenen Gruppen berücksichtigen.",
    "Für eine differenzierte Bewertung ist entscheidend, nicht nur einen Vorteil zu nennen, sondern auch Grenzen, Gegenargumente und mögliche Nebenwirkungen einzubeziehen.",
    "Daraus folgt für mich, dass eine tragfähige Maßnahme nur dann überzeugt, wenn sie praktisch umsetzbar ist und zugleich die Gegenposition ernst nimmt.",
    "Zusammenfassend halte ich eine ausgewogene Position für sinnvoll, weil sie den Zielkonflikt sichtbar macht und konkrete Bedingungen für eine Lösung nennt.",
  ];
  return [
    `Zur Frage „${question}“ würde ich beim Thema „${lesson.title}“ zunächst ${sentenceCase(angle)} betrachten.`,
    lesson.foundation.intro,
    `Ein konkretes Beispiel zeigt das Problem: ${example}`,
    tension,
    closers[index] || closers[0],
  ].join(" ");
}

function makeSlide(day) {
  const lesson = getC1CanonicalLesson(day);
  if (!lesson) throw new Error(`Missing canonical C1 lesson for Day ${day}`);

  const topic = lesson.title;
  const questions = speakingQuestions(lesson);
  const models = modelExamples(lesson);
  const grammar = grammarFocus(lesson);

  return {
    id: `c1-day-${day}-${slug(topic)}`,
    course: "C1",
    day: `Day ${day}`,
    dayNumber: day,
    assignmentId: `C1 ${day}`,
    title: `C1 Day ${day} · ${topic}`,
    topic: `${day} ${topic}`,
    objective: `Students ${lesson.profile.aim}, develop a nuanced position and transfer the same reasoning into a short C1 written response.`,
    estimatedDuration: "60–75 minutes",
    warmupQuestionsDe: [
      `Welche Erfahrung oder Beobachtung verbindest du mit „${topic}“?`,
      ...lesson.profile.angles.slice(0, 3).map((angle) => `Welche Rolle spielt ${sentenceCase(angle)} bei diesem Thema?`),
    ].slice(0, 4),
    keyPhrasesDe: [
      ...getC1TopicCollocations(day),
      "Bei der Beurteilung dieser Frage sollte berücksichtigt werden, dass ...",
      "Einerseits ..., andererseits ...",
      "Zwar ..., jedoch ...",
      "Ein entscheidender Aspekt besteht darin, dass ...",
      "Dem lässt sich entgegenhalten, dass ...",
      "Unter der Voraussetzung, dass ...,",
      "Zusammenfassend lässt sich festhalten, dass ...",
    ],
    studentQuestionsDe: questions,
    speakingModels: questions.map((questionDe, index) => ({
      questionDe,
      modelAnswerDe: speakingAnswer(lesson, questionDe, index),
    })),
    teacherNotesEn: [
      "The Admin lesson now follows the same canonical C1 day/topic identity as the learner Course Book.",
      "Teach the topic foundation before debate, then connect the learner-side grammar target to the live argument.",
      "Require claim → reason → example → counterargument → response rather than isolated opinions.",
      "Correct the learner-side grammar target first; complexity without structural control is not the goal.",
      "Finish by bridging the same topic and reasoning back into Falowen Speak/Write/Workbook.",
    ],
    interactionFlow: [
      { phase: "Position line", detailEn: "6 min: learners answer the first learner-aligned thinking prompt and give one reason." },
      { phase: "Language upgrade", detailEn: `10 min: upgrade sentences using the learner grammar target: ${lesson.grammarTitle}.` },
      { phase: "Argument map", detailEn: "12 min: build claim → reason → concrete example → counterargument → response." },
      { phase: "Timed speaking", detailEn: "12 min: 60–90 second learner-aligned answers, partner follow-up and targeted correction." },
      { phase: "Writing bridge", detailEn: "10 min: convert the oral argument into a structured C1 paragraph or response." },
    ],
    wrapUpTaskDe: `Selbstcheck: Ist deine Position zu „${topic}“ klar? Hast du ein konkretes Beispiel, ein Gegenargument mit Reaktion und die Zielgrammatik „${lesson.grammarTitle}“ kontrolliert verwendet?`,
    workbookConnection: {
      grammarUrl: null,
      workbookUrl: null,
      subtitle: `C1 Day ${day} classroom bridge aligned to the Falowen learner lesson.`,
      parts: [
        { label: "Teil 1 · Thema", detailEn: `Review the same learner topic: ${topic}.` },
        { label: "Teil 2 · Grammatik", detailEn: `Apply the learner grammar target: ${lesson.grammarTitle}.` },
        { label: "Teil 3 · Sprechen", detailEn: "Answer the same core question with position, reason, example and counterargument." },
        { label: "Teil 4 · Schreiben", detailEn: "Transfer the argument into the lesson's C1 writing task with clear paragraph logic." },
        { label: "Teil 5 · Reflexion", detailEn: "Check whether the final position addresses the learner-side target conflict and question." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: `Learner-aligned C1 lesson on ${topic}. Foundation: ${lesson.foundation.intro}`,
      grammarFocusEn: grammar,
      modelExamplesDe: models,
      commonMistakesEn: [
        lesson.profile.mistake,
        "Abstrakte Aussagen immer mit Beispiel, Folge oder betroffener Gruppe konkretisieren.",
        "Ein Gegenargument nicht nur nennen, sondern anschließend darauf reagieren.",
        "Komplexe Strukturen nur verwenden, wenn Wortstellung und Bezug eindeutig bleiben.",
      ],
    },
    canonicalLearnerLesson: {
      day,
      title: topic,
      grammarTitle: lesson.grammarTitle,
      coreQuestion: lesson.profile.question,
      tension: lesson.foundation.tension,
      aim: lesson.profile.aim,
      angles: [...lesson.profile.angles],
      points: [...lesson.profile.points],
      mistake: lesson.profile.mistake,
      foundationIntro: lesson.foundation.intro,
      foundationExample: lesson.foundation.example,
    },
  };
}

export const c1PresenterSlides = Array.from({ length: 28 }, (_, index) => makeSlide(index + 1));
