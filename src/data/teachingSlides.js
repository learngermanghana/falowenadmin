import { courseDictionary } from "./courseDictionary.js";
import { enhanceA1GenericLessonSlide } from "./a1GenericLessonUpgrades.js";
import { getSlideQuestionSet } from "./teachingSlideQuestionDictionary.js";
import { getCourseTaskDay } from "./courseSessionGroups.js";
import { a1WorkbookAlignedSlidesDays1To5 } from "./a1WorkbookAlignedSlidesDays1To5.js";
import { a1WorkbookAlignedSlidesDays6To10 } from "./a1WorkbookAlignedSlidesDays6To10.js";
import { a1LaterTeachingSlides } from "./a1LaterTeachingSlides.js";
import { a2WorkbookAlignedSlides } from "./a2WorkbookAlignedSlides.js";
import { a2WorkbookAlignedSlidesDays6To10 } from "./a2WorkbookAlignedSlidesDays6To10.js";
import { a2WorkbookAlignedSlidesDays11To15 } from "./a2WorkbookAlignedSlidesDays11To15.js";
import { a2WorkbookAlignedSlidesDays16To20 } from "./a2WorkbookAlignedSlidesDays16To20.js";
import { a2WorkbookAlignedSlidesDays21To24 } from "./a2WorkbookAlignedSlidesDays21To24.js";
import { a2WorkbookAlignedSlidesDays25To28 } from "./a2WorkbookAlignedSlidesDays25To28.js";
import { b1WorkbookAlignedSlidesDays1To10 } from "./b1WorkbookAlignedSlidesDays1To10.js";
import { b1WorkbookAlignedSlidesDays11To20 } from "./b1WorkbookAlignedSlidesDays11To20.js";
import { b1WorkbookAlignedSlidesDays21To28 } from "./b1WorkbookAlignedSlidesDays21To28.js";
import { b2PresenterSlides } from "./b2PresenterSlides.js";
import { c1PresenterSlides } from "./c1PresenterSlides.js";
import { c2PresenterSlides } from "./c2PresenterSlides.js";

const curatedSlides = [
  {
    id: "a2-day-1-small-talk",
    course: "A2",
    day: "Day 1",
    dayNumber: 1,
    assignmentId: "A2-1.1",
    title: "A2 Day 1 · Small Talk",
    topic: "1.1 Small Talk",
    objective: "Students confidently start, continue, and close short conversations in German.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: ["Wie geht's dir heute?", "Was war heute Morgen dein erster Gedanke?", "Sprichst du lieber morgens oder abends mit Freunden? Warum?"],
    keyPhrasesDe: ["Hallo! Wie geht's?", "Woher kommst du?", "Was machst du beruflich / Was studierst du?", "Was machst du gern in deiner Freizeit?", "War schön, mit dir zu sprechen!"],
    studentQuestionsDe: ["Wie heißt du und woher kommst du?", "Was machst du beruflich oder was studierst du?", "Was machst du gern am Wochenende?", "Trinkst du lieber Kaffee oder Tee? Warum?", "Welche Musik hörst du zurzeit gern?"],
    teacherNotesEn: ["Model the first dialogue with one volunteer before pair work.", "Push follow-up language: Warum?, Echt?, Und du?, Interessant!", "Focus on confidence and fluency over perfect grammar."],
    interactionFlow: [
      { phase: "Demo", detailEn: "5 min: teacher + volunteer conversation with opening, follow-up, and closing." },
      { phase: "Pair Round A", detailEn: "8 min: students ask guided questions with one follow-up each." },
      { phase: "Wrap-up", detailEn: "5 min: learners write one sentence on what they learned today." },
    ],
    wrapUpTaskDe: "Schreibe: 'Heute habe ich gelernt, wie man ein Gespräch beginnt und weiterführt.'",
  },
  {
    id: "a2-day-2-personen-beschreiben",
    course: "A2",
    day: "Day 2",
    dayNumber: 2,
    assignmentId: "A2-1.2",
    title: "A2 Day 2 · Personen beschreiben",
    topic: "1.2 Personen beschreiben",
    objective: "Students describe people using appearance, personality, and habits.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: ["Welche drei Wörter beschreiben dich heute?", "Ist es wichtiger: freundlich oder pünktlich?", "Kennst du eine sehr humorvolle Person?"],
    keyPhrasesDe: ["Er/Sie ist sehr ...", "Er/Sie hat ... Haare.", "Er/Sie wirkt ...", "Ich finde, dass ..."],
    studentQuestionsDe: ["Wie sieht dein bester Freund / deine beste Freundin aus?", "Welche Eigenschaften sind dir wichtig?", "Bist du eher ruhig oder offen? Warum?"],
    teacherNotesEn: ["Give one model with sentence frames before asking free production.", "Encourage adjectives with reasons, not single-word answers."],
    interactionFlow: [
      { phase: "Vocabulary activation", detailEn: "8 min: brainstorm adjectives (positive + neutral)." },
      { phase: "Guided pairs", detailEn: "10 min: students ask first 3 questions with sentence frames." },
      { phase: "Mini-presentations", detailEn: "10 min: each learner describes one person for 30-45 seconds." },
    ],
    wrapUpTaskDe: "Nenne 3 Adjektive über eine Person in deiner Klasse und begründe sie kurz.",
  },
  {
    id: "a2-day-3-vergleichen",
    course: "A2",
    day: "Day 3",
    dayNumber: 3,
    assignmentId: "A2-1.3",
    title: "A2 Day 3 · Dinge und Personen vergleichen",
    topic: "1.3 Vergleichen",
    objective: "Students compare people/things using Komparativ and simple opinions.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: ["Ist Reisen mit dem Zug besser als mit dem Bus?", "Was ist interessanter: Filme oder Bücher?", "Wer ist sportlicher in deiner Familie?"],
    keyPhrasesDe: ["... ist größer/schneller/interessanter als ...", "Im Vergleich zu ...", "Meiner Meinung nach ..."],
    studentQuestionsDe: ["Was ist einfacher: online lernen oder im Kurs lernen?", "Welche Stadt ist teurer als deine Heimatstadt?", "Was ist gesünder: selbst kochen oder bestellen?"],
    teacherNotesEn: ["Keep a visible board list of comparative forms learners produce.", "Ask for justification after each comparison: Warum?"],
    interactionFlow: [
      { phase: "Board race", detailEn: "7 min: teams create comparative sentences from prompts." },
      { phase: "Pair interviews", detailEn: "12 min: students ask all guided questions and add one follow-up." },
      { phase: "Wrap-up", detailEn: "6 min: class shares best comparative sentence heard today." },
    ],
    wrapUpTaskDe: "Schreibe 3 Sätze mit '... als ...' über dein Leben.",
  },
  {
    id: "a2-day-4-treffen",
    course: "A2",
    day: "Day 4",
    dayNumber: 4,
    assignmentId: "A2-2.4",
    title: "A2 Day 4 · Wo möchten wir uns treffen?",
    topic: "2.4 Treffen vereinbaren",
    objective: "Students suggest meeting places/times and agree on a plan.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: ["Wo triffst du normalerweise Freunde?", "Wann hast du diese Woche Zeit?", "Lieber Café oder Park?"],
    keyPhrasesDe: ["Hast du am ... Zeit?", "Wollen wir uns um ... treffen?", "Passt dir das?", "Tut mir leid, da kann ich nicht."],
    studentQuestionsDe: ["Wann hast du am Wochenende Zeit?", "Welcher Ort ist für dich am besten?", "Was können wir dort machen?"],
    teacherNotesEn: ["Teach accepting and rejecting politely as equal skills.", "Use role-cards with constraints (busy schedule, low budget, distance)."],
    interactionFlow: [
      { phase: "Prompted dialogue", detailEn: "8 min: teacher models planning with one student." },
      { phase: "Role-play", detailEn: "20 min: partners negotiate place/time and present final plan." },
      { phase: "Wrap-up", detailEn: "5 min: learners say one phrase they will reuse in real life." },
    ],
    wrapUpTaskDe: "Schreibe eine kurze Nachricht: Ort, Uhrzeit und Aktivität für ein Treffen.",
  },
  {
    id: "a2-day-5-freizeit",
    course: "A2",
    day: "Day 5",
    dayNumber: 5,
    assignmentId: "A2-2.5",
    title: "A2 Day 5 · Was machst du in deiner Freizeit?",
    topic: "2.5 Freizeit",
    objective: "Students discuss hobbies, frequency, and preferences in extended turns.",
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: ["Was machst du am liebsten nach der Arbeit / nach dem Kurs?", "Wie oft machst du Sport?", "Was möchtest du neu ausprobieren?"],
    keyPhrasesDe: ["In meiner Freizeit ...", "Ich mache das einmal/zweimal pro Woche.", "Am liebsten ...", "Ich würde gern ..."],
    studentQuestionsDe: ["Welche Hobbys hast du?", "Wie oft machst du dieses Hobby?", "Warum gefällt dir dieses Hobby?"],
    teacherNotesEn: ["Push adverbs of frequency (oft, manchmal, selten, nie).", "Require one follow-up question after each answer."],
    interactionFlow: [
      { phase: "Warm-up mingle", detailEn: "8 min: students ask warm-up questions to three classmates." },
      { phase: "Pair interview", detailEn: "12 min: complete all guided questions in pairs." },
      { phase: "Spotlight share", detailEn: "10 min: introduce partner's hobby profile to class." },
    ],
    wrapUpTaskDe: "Schreibe 4 Sätze über deine Freizeit mit Häufigkeit (z. B. zweimal pro Woche).",
  },
];

function compareChapter(a, b) {
  const aParts = String(a).split(".").map((part) => Number(part));
  const bParts = String(b).split(".").map((part) => Number(part));
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const left = aParts[index] ?? 0;
    const right = bParts[index] ?? 0;
    if (left !== right) return left - right;
  }

  return 0;
}

function createTemplateSlide(level, entry, lessonNumber) {
  const levelLabel = level.toUpperCase();
  const topicContext = {
    topicDe: entry.de,
    topicEn: entry.en,
    level: levelLabel,
    assignmentId: entry.assignment_id,
  };
  const questionSet = getSlideQuestionSet(entry.assignment_id, topicContext);

  return {
    id: entry.assignment_id.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    course: levelLabel,
    day: `Lesson ${lessonNumber}`,
    dayNumber: lessonNumber,
    assignmentId: entry.assignment_id,
    title: `${levelLabel} Lesson ${lessonNumber} · ${entry.de}`,
    topic: `${entry.chapter} ${entry.de}`,
    objective: `Students can communicate about ${entry.en.toLowerCase()} with clear ${levelLabel} sentence patterns.`,
    estimatedDuration: "45–60 minutes",
    warmupQuestionsDe: questionSet.warmupQuestionsDe,
    keyPhrasesDe: [
      `${entry.de}: wichtige Redemittel`,
      "Ich denke, dass ...",
      "Kannst du das bitte wiederholen?",
      "Ich brauche ein Beispiel.",
    ],
    studentQuestionsDe: questionSet.studentQuestionsDe,
    teacherNotesEn: [
      `Keep the lesson focused on high-frequency ${levelLabel} language for ${entry.en}.`,
      "Model one full exchange before pair speaking.",
      "Use short correction slots after each speaking phase.",
    ],
    interactionFlow: [
      { phase: "Input", detailEn: "8 min: activate vocabulary and useful sentence frames." },
      { phase: "Guided pairs", detailEn: "12 min: students use prompts with controlled answers." },
      { phase: "Free practice", detailEn: "12 min: switch partners and expand answers." },
      { phase: "Reflection", detailEn: "8 min: class feedback + correction recap." },
    ],
    wrapUpTaskDe: `Schreibe 3 Sätze zum Thema „${entry.de}“ und nutze neue Wörter von heute.`,
  };
}

function enhanceA1Day2PronounSlide(slide) {
  const assignmentId = String(slide.assignmentId || "").trim().toUpperCase();
  if (assignmentId !== "A1-1.1") return slide;

  return {
    ...slide,
    objective: "Students recognise the core German subject pronouns and apply the basic present-tense endings -e, -st and -t to regular verbs.",
    estimatedDuration: "35–45 minutes",
    warmupQuestionsDe: [
      "Welche Personalpronomen kennst du?",
      "Was ist richtig: ich lernen oder ich lerne?",
      "Was ist richtig: du wohnen oder du wohnst?",
      "Was ist richtig: er kommen oder er kommt?",
    ],
    keyPhrasesDe: [
      "ich → -e",
      "du → -st",
      "er / sie / es → -t",
      "lernen: ich lerne · du lernst · er/sie/es lernt",
      "wohnen: ich wohne · du wohnst · er/sie/es wohnt",
      "kommen: ich komme · du kommst · er/sie/es kommt",
    ],
    studentQuestionsDe: [
      "Korrigiere: Ich lernen Deutsch.",
      "Warum heißt es „Ich lerne Deutsch“?",
      "Korrigiere: Du lernen Deutsch.",
      "Welche Endung hat das Verb bei du?",
      "Korrigiere: Er lernen Deutsch.",
      "Welche Endung hat das Verb bei er, sie oder es?",
      "Konjugiere wohnen mit ich, du und er/sie.",
      "Konjugiere kommen mit ich, du und er/sie.",
    ],
    teacherNotesEn: [
      "Keep this lesson strictly on pronouns and basic conjugation. Do not turn it into a self-introduction lesson.",
      "Start with the pronouns students have just met, then make the verb ending visible.",
      "Use real error correction: Ich lernen → Ich lerne; Du lernen → Du lernst; Er lernen → Er lernt.",
      "For this lesson, prioritise the regular singular pattern: ich -e, du -st, er/sie/es -t.",
      "Ask students why an answer is correct after they repair it so they connect the pronoun to the ending.",
    ],
    interactionFlow: [
      { phase: "Pronoun check", detailEn: "5 min: identify ich, du, er, sie and es and match each one to a person or thing." },
      { phase: "Error correction", detailEn: "10 min: correct Ich lernen, Du lernen and Er lernen. After each correction, ask why the ending changes." },
      { phase: "Ending rule", detailEn: "8 min: build the visible rule ich → -e, du → -st, er/sie/es → -t." },
      { phase: "Verb transfer", detailEn: "10 min: apply the same pattern to wohnen and kommen." },
      { phase: "Rapid check", detailEn: "5 min: teacher gives a pronoun + infinitive; student gives the correct form immediately." },
    ],
    wrapUpTaskDe: "Konjugiere lernen, wohnen und kommen mit ich, du und er/sie/es.",
    teacherSupport: {
      ...(slide.teacherSupport || {}),
      lessonOverviewEn: "Day 2 Chapter 1.1 is a focused first conjugation lesson. Students identify core subject pronouns and learn that a regular verb changes its ending to match the subject. Self-introduction language is deliberately left for the later lesson where it is actually taught.",
      grammarFocusEn: [
        "Core subject pronouns for this lesson: ich, du, er, sie, es.",
        "Regular singular present-tense endings: ich -e, du -st, er/sie/es -t.",
        "Remove -en from a regular infinitive to see the stem, then add the personal ending: lernen → lern-.",
        "Make the subject-verb agreement visible: ich lerne, du lernst, er/sie/es lernt.",
      ],
      modelExamplesDe: [
        "Ich lerne Deutsch.",
        "Du lernst Deutsch.",
        "Er lernt Deutsch.",
        "Ich wohne in Accra. / Du wohnst in Accra. / Sie wohnt in Accra.",
        "Ich komme. / Du kommst. / Er kommt.",
      ],
      commonMistakesEn: [
        "Using the infinitive after the subject: ich lernen instead of ich lerne.",
        "Forgetting -st with du: du lernen instead of du lernst.",
        "Forgetting -t with er/sie/es: er lernen instead of er lernt.",
        "Using one verb form for every pronoun instead of matching the ending to the subject.",
        "Introducing self-introduction content before students have learned that lesson.",
      ],
    },
  };
}

function buildLevelSlides(level) {
  const entries = Object.values(courseDictionary[level] || {}).sort((left, right) => compareChapter(left.chapter, right.chapter));
  return entries.map((entry, index) => {
    const lessonNumber = String(level || "").toUpperCase() === "A1"
      ? getCourseTaskDay("A1", entry.assignment_id, index)
      : index + 1;
    return createTemplateSlide(level, entry, lessonNumber);
  });
}

function normalizeA1SlideDay(slide, fallbackIndex = 0) {
  slide = enhanceA1GenericLessonSlide(slide);
  const assignmentId = String(slide?.assignmentId || "").trim();
  if (!assignmentId) return slide;

  const dayNumber = getCourseTaskDay("A1", assignmentId, fallbackIndex);
  const normalizedAssignmentId = assignmentId.toUpperCase();
  if (normalizedAssignmentId === "A1-TUTORIAL") {
    return {
      ...slide,
      day: `Day ${dayNumber}`,
      dayNumber,
    };
  }

  const titleBody = String(slide.title || "")
    .replace(/^A1\s+(?:Day|Lesson)\s+\d+\s*·\s*/i, "")
    .replace(/^A1\s*·\s*/i, "")
    .trim();

  return {
    ...slide,
    day: `Day ${dayNumber}`,
    dayNumber,
    title: titleBody ? `A1 Day ${dayNumber} · ${titleBody}` : slide.title,
  };
}

const upgradedA1WorkbookAlignedSlidesDays1To5 = a1WorkbookAlignedSlidesDays1To5.map(enhanceA1Day2PronounSlide);

const curatedSlidesByAssignment = Object.fromEntries(
  [
    ...curatedSlides,
    ...upgradedA1WorkbookAlignedSlidesDays1To5,
    ...a1WorkbookAlignedSlidesDays6To10,
    ...a1LaterTeachingSlides,
    ...a2WorkbookAlignedSlides,
    ...a2WorkbookAlignedSlidesDays6To10,
    ...a2WorkbookAlignedSlidesDays11To15,
    ...a2WorkbookAlignedSlidesDays16To20,
    ...a2WorkbookAlignedSlidesDays21To24,
    ...a2WorkbookAlignedSlidesDays25To28,
    ...b1WorkbookAlignedSlidesDays1To10,
    ...b1WorkbookAlignedSlidesDays11To20,
    ...b1WorkbookAlignedSlidesDays21To28,
  ].map((slide) => [slide.assignmentId, slide]),
);

const a1Slides = buildLevelSlides("A1").map((slide, index) =>
  normalizeA1SlideDay(curatedSlidesByAssignment[slide.assignmentId] || slide, index),
);
const generatedA2Slides = buildLevelSlides("A2").map((slide) => curatedSlidesByAssignment[slide.assignmentId] || slide);
const b1Slides = buildLevelSlides("B1").map((slide) => curatedSlidesByAssignment[slide.assignmentId] || slide);

export const teachingSlides = [...a1Slides, ...generatedA2Slides, ...b1Slides, ...b2PresenterSlides, ...c1PresenterSlides, ...c2PresenterSlides];

export const teachingSlideIdAliases = Object.freeze({
  "a2-day-10-tourismus-feste": "a2-day-10-stadt-entdecken",
});

export function getCanonicalTeachingSlideId(id = "") {
  const normalized = String(id || "").trim();
  return teachingSlideIdAliases[normalized] || normalized;
}

export function getTeachingSlideById(id) {
  const canonicalId = getCanonicalTeachingSlideId(id);
  return teachingSlides.find((slide) => slide.id === canonicalId) || null;
}

export function getTeachingSlideByAssignmentId(assignmentId) {
  const normalized = String(assignmentId || "").trim().toUpperCase();
  if (!normalized) return null;
  return teachingSlides.find((slide) => String(slide.assignmentId || "").trim().toUpperCase() === normalized) || null;
}

export function getSlidesByCourse(courseId) {
  const normalized = String(courseId || "").trim().toUpperCase();
  return teachingSlides
    .filter((slide) => String(slide.course || "").trim().toUpperCase() === normalized)
    .sort((a, b) => Number(a.dayNumber || 0) - Number(b.dayNumber || 0));
}

export function getSlideNavigation(id, courseId) {
  const courseSlides = courseId ? getSlidesByCourse(courseId) : teachingSlides;
  const index = courseSlides.findIndex((slide) => slide.id === id);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: courseSlides[index - 1] || null,
    next: courseSlides[index + 1] || null,
  };
}

export function getAvailableSlideCourses() {
  return [...new Set(teachingSlides.map((slide) => slide.course).filter(Boolean))].sort();
}