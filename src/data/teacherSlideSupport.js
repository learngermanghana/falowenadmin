const LEVEL_DEFAULTS = {
  A1: {
    grammarFocusEn: [
      "Keep one clear main-clause pattern visible: subject + conjugated verb + remaining information.",
      "Recycle the article, pronoun, and case forms that are necessary for this lesson rather than adding too much new grammar at once.",
    ],
    modelExamplesDe: [
      "Ich kann sagen: „Ich ...“",
      "Für mich ist ... wichtig.",
      "Kannst du das bitte wiederholen?",
    ],
    commonMistakesEn: [
      "Using the infinitive instead of the correctly conjugated verb.",
      "Forgetting German noun capitalization or leaving out a needed article.",
      "Copying English word order into a German main clause.",
    ],
  },
  A2: {
    grammarFocusEn: [
      "Keep verb position accurate in main clauses and after common connectors.",
      "Use complete reasons with weil where the topic allows it, with the conjugated verb at the end of the subordinate clause.",
    ],
    modelExamplesDe: [
      "Ich denke, dass ...",
      "Für mich ist ... wichtig, weil ...",
      "Meiner Meinung nach ...",
    ],
    commonMistakesEn: [
      "Keeping main-clause word order after weil or dass instead of moving the conjugated verb to the end.",
      "Dropping article or case endings when answers become longer.",
      "Giving one-word answers instead of extending them with a reason or example.",
    ],
  },
  B1: {
    grammarFocusEn: [
      "Link ideas with connectors such as weil, obwohl, wenn, dass, deshalb, and trotzdem while maintaining the correct verb position.",
      "Keep tense use consistent and encourage connected answers rather than isolated sentences.",
    ],
    modelExamplesDe: [
      "Ich bin der Meinung, dass ...",
      "Einerseits ..., andererseits ...",
      "Das hängt davon ab, ob ...",
    ],
    commonMistakesEn: [
      "Mixing verb-second and verb-final word order after subordinate-clause connectors.",
      "Changing tense unnecessarily inside one answer.",
      "Using advanced connectors without completing the sentence structure correctly.",
    ],
  },
};

const CURATED_OVERRIDES = {
  "A2-1.1": {
    grammarFocusEn: [
      "Review W-questions and yes/no questions with the conjugated verb in the correct position.",
      "Keep person endings accurate when students switch between ich, du, er/sie, and wir.",
    ],
    modelExamplesDe: [
      "Ich komme aus Ghana und wohne in Accra.",
      "Am Wochenende treffe ich gern Freunde.",
      "Und du? Was machst du gern in deiner Freizeit?",
    ],
    commonMistakesEn: [
      "Using statement word order inside a direct question.",
      "Forgetting the verb ending when changing the subject.",
      "Ending the conversation after one answer instead of asking a follow-up question.",
    ],
  },
  "A2-1.2": {
    grammarFocusEn: [
      "Use sein + adjective for personality and haben + noun phrase for physical features.",
      "Remind learners that predicative adjectives after sein do not take adjective endings: Er ist freundlich.",
    ],
    modelExamplesDe: [
      "Meine Schwester ist ruhig, aber sehr humorvoll.",
      "Er hat kurze schwarze Haare und trägt oft eine Brille.",
      "Ich finde, dass sie sehr zuverlässig ist.",
    ],
    commonMistakesEn: [
      "Adding adjective endings after sein when the adjective is predicative.",
      "Mixing er and sie while describing one person.",
      "Listing adjectives without giving a reason or example.",
    ],
  },
  "A2-1.3": {
    grammarFocusEn: [
      "Form the comparative correctly and use als for unequal comparisons.",
      "Recycle common irregular forms such as besser, mehr, lieber, and höher where relevant.",
    ],
    modelExamplesDe: [
      "Der Zug ist schneller als der Bus.",
      "Online-Lernen ist für mich flexibler als Präsenzunterricht.",
      "Ich koche lieber selbst, weil es günstiger ist.",
    ],
    commonMistakesEn: [
      "Using wie instead of als after a comparative.",
      "Forgetting an umlaut or irregular comparative form.",
      "Making a comparison without clearly naming both sides.",
    ],
  },
  "A2-2.4": {
    grammarFocusEn: [
      "Use wollen + infinitive and the reflexive verb sich treffen correctly.",
      "Practise time expressions with am, um, and von ... bis ... while negotiating a plan.",
    ],
    modelExamplesDe: [
      "Wollen wir uns am Samstag um 15 Uhr treffen?",
      "Da kann ich leider nicht. Passt dir 17 Uhr?",
      "Dann treffen wir uns vor dem Café.",
    ],
    commonMistakesEn: [
      "Leaving out uns in wir treffen uns.",
      "Using the wrong preposition before days or clock times.",
      "Rejecting a suggestion without offering an alternative.",
    ],
  },
  "A2-2.5": {
    grammarFocusEn: [
      "Place frequency expressions naturally in the sentence and contrast gern, lieber, and am liebsten.",
      "Use würde gern + infinitive for an activity the learner would like to try.",
    ],
    modelExamplesDe: [
      "Ich gehe zweimal pro Woche joggen.",
      "Am liebsten höre ich Musik, wenn ich zu Hause bin.",
      "Ich würde gern einen Tanzkurs ausprobieren.",
    ],
    commonMistakesEn: [
      "Putting frequency expressions in an unnatural position.",
      "Confusing gern with gut when expressing a preference.",
      "Using würde gern without the infinitive at the end.",
    ],
  },
  "B2-1.1": {
    grammarFocusEn: [
      "Use adjective endings in noun phrases with ein/eine/einen: ein ruhiger Mensch, eine prägende Erfahrung, einen zuverlässigen Menschen.",
      "Focus on new B2 contrast expressions: während, hingegen, auf der einen Seite ... auf der anderen Seite, im Gegensatz dazu.",
    ],
    modelExamplesDe: [
      "Ich bin ein eher ruhiger, aber zuverlässiger Mensch.",
      "Eine prägende Erfahrung hat mich selbstständiger gemacht.",
      "Während ich im Beruf eher zurückhaltend bin, spreche ich mit Freunden sehr offen.",
    ],
    commonMistakesEn: [
      "Leaving off the adjective ending before a noun: ein ruhiger Mensch, not ein ruhig Mensch.",
      "Forgetting masculine accusative endings: einen zuverlässigen Menschen.",
      "Falling back on familiar B1 connectors instead of practising the new B2 contrast expressions.",
    ],
  },
};

function cleanTopic(slide = {}) {
  return String(slide.topic || slide.title || "the lesson topic")
    .replace(/^\s*\d+(?:\.\d+)*\s*/, "")
    .trim();
}

export function buildTeacherSlideSupport(slide = {}) {
  const level = String(slide.course || "A2").toUpperCase();
  const defaults = LEVEL_DEFAULTS[level] || LEVEL_DEFAULTS.A2;
  const assignmentId = String(slide.assignmentId || "").toUpperCase();
  const curated = CURATED_OVERRIDES[assignmentId] || {};
  const direct = slide.teacherSupport || {};
  const topic = cleanTopic(slide);
  const preferCurated = assignmentId === "B2-1.1";

  const grammarFocusEn = preferCurated
    ? curated.grammarFocusEn || direct.grammarFocusEn || defaults.grammarFocusEn
    : direct.grammarFocusEn || curated.grammarFocusEn || defaults.grammarFocusEn;
  const modelExamplesDe = preferCurated
    ? curated.modelExamplesDe || direct.modelExamplesDe || defaults.modelExamplesDe
    : direct.modelExamplesDe || curated.modelExamplesDe || defaults.modelExamplesDe;
  const commonMistakesEn = preferCurated
    ? curated.commonMistakesEn || direct.commonMistakesEn || defaults.commonMistakesEn
    : direct.commonMistakesEn || curated.commonMistakesEn || defaults.commonMistakesEn;

  return {
    lessonOverviewEn:
      direct.lessonOverviewEn ||
      curated.lessonOverviewEn ||
      `Teacher-led lesson on ${topic}. Activate prior knowledge, establish useful language, model the target communication, then move from guided practice to freer speaking.`,
    grammarFocusEn,
    modelExamplesDe,
    commonMistakesEn,
  };
}
