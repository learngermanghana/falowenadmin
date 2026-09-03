import { buildTeacherSlideSupport } from "../data/teacherSlideSupport.js";

const A1_PRESENTER_V2_EXCLUDED_ASSIGNMENTS = new Set(["A1-TUTORIAL"]);

const A2_PRESENTER_V2_ASSIGNMENTS = new Set([
  "A2-1.1", "A2-1.2", "A2-1.3", "A2-2.4", "A2-2.5", "A2-3.6", "A2-3.7", "A2-3.8", "A2-4.9",
  "A2-4.10", "A2-4.11", "A2-5.12", "A2-5.13", "A2-5.14", "A2-6.15", "A2-6.16", "A2-6.17",
  "A2-7.18", "A2-7.19", "A2-7.20", "A2-8.21", "A2-8.22", "A2-9.23", "A2-9.24", "A2-9.25",
  "A2-10.26", "A2-10.27", "A2-10.28",
]);

const B1_PRESENTER_V2_ASSIGNMENTS = new Set([
  "B1-1.1", "B1-1.2", "B1-1.3", "B1-2.4", "B1-2.5", "B1-2.6", "B1-3.7", "B1-3.8", "B1-3.9",
  "B1-4.10", "B1-4.11", "B1-4.12", "B1-4.13", "B1-5.14", "B1-5.15", "B1-5.16", "B1-5.17",
  "B1-6.18", "B1-6.19", "B1-6.20", "B1-7.21", "B1-7.22", "B1-7.23", "B1-8.24", "B1-8.25",
  "B1-9.26", "B1-10.27", "B1-10.28",
]);

const B2_PRESENTER_V2_ASSIGNMENTS = new Set(
  Array.from({ length: 28 }, (_, index) => {
    const day = index + 1;
    return `B2-${Math.ceil(day / 4)}.${day}`;
  }),
);

const C1_PRESENTER_V2_ASSIGNMENTS = new Set(
  Array.from({ length: 28 }, (_, index) => `C1 ${index + 1}`),
);

function normalizedAssignmentId(slide = {}) {
  return String(slide.assignmentId || "").trim().toUpperCase();
}

function classroomLevel(slide = {}) {
  return String(slide.course || "").trim().toUpperCase();
}

function isAdvancedClassroomSlide(slide = {}) {
  return ["B2", "C1"].includes(classroomLevel(slide));
}

function cleanTopic(slide = {}) {
  return String(slide.topic || slide.title || "dieses Thema")
    .replace(/^\s*\d+(?:\.\d+)*\s*/, "")
    .trim();
}

export function isA1PresenterV2Slide(slide = {}) {
  const assignmentId = normalizedAssignmentId(slide);
  const course = classroomLevel(slide);
  return course === "A1"
    && assignmentId.startsWith("A1-")
    && !A1_PRESENTER_V2_EXCLUDED_ASSIGNMENTS.has(assignmentId);
}

export function isA2PresenterV2Slide(slide = {}) {
  return A2_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide));
}

export function isB1PresenterV2Slide(slide = {}) {
  return B1_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide));
}

export function isB2PresenterV2Slide(slide = {}) {
  return B2_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide));
}

export function isC1PresenterV2Slide(slide = {}) {
  return C1_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide));
}

export function isTeachingPresenterV2Slide(slide = {}) {
  return isA1PresenterV2Slide(slide)
    || isA2PresenterV2Slide(slide)
    || isB1PresenterV2Slide(slide)
    || isB2PresenterV2Slide(slide)
    || isC1PresenterV2Slide(slide);
}

export function parsePresenterMinutes(value = "") {
  const match = String(value || "").match(/(\d+)\s*min/i);
  return match ? Number(match[1]) : 0;
}

function interactionMinutes(slide = {}, index = 0) {
  return parsePresenterMinutes(slide.interactionFlow?.[index]?.detailEn || "");
}

const ADVANCED_GRAMMAR_RULES = [
  { pattern: /adjective endings|adjektiv/i, de: "Adjektivendungen vor Nomen sicher verwenden." },
  { pattern: /nominalis/i, de: "Nominalisierung: Verben oder Adjektive in Nomen umformen, um formeller zu formulieren." },
  { pattern: /konjunktiv ii/i, de: "Konjunktiv II: höfliche Vorschläge, Wünsche und hypothetische Situationen formulieren." },
  { pattern: /indirect question|indirekte frage/i, de: "Indirekte Fragen mit ob oder W-Wort: das konjugierte Verb steht am Satzende." },
  { pattern: /relative clause|relative clauses|prepositional relatives/i, de: "Relativsätze mit Präposition: z. B. die Person, mit der … / das Thema, über das …." },
  { pattern: /passive|modal passive/i, de: "Passiv und Modalpassiv: Handlung, Regel oder Ergebnis stehen im Mittelpunkt." },
  { pattern: /reported|laut|zufolge|nach angaben|source-report/i, de: "Quellen wiedergeben: laut / zufolge / nach Angaben; eigene Meinung klar davon trennen." },
  { pattern: /concess|obwohl|obgleich|wenngleich|trotz|dennoch/i, de: "Konzessive Verknüpfungen: obwohl / obgleich / wenngleich / trotz / dennoch." },
  { pattern: /wohingegen|hingegen|im gegensatz|explicit contrasts/i, de: "Kontrast präzise ausdrücken: während / wohingegen / hingegen / im Gegensatz dazu." },
  { pattern: /paired connector|einerseits|zwar .*jedoch|nicht nur|sowohl|structure complex arguments/i, de: "Argumente strukturieren: einerseits … andererseits / zwar … jedoch / nicht nur … sondern auch / sowohl … als auch." },
  { pattern: /consequence|causal|aufgrund|sodass|weshalb|wodurch|infolgedessen/i, de: "Ursache und Folge präzise verbinden: aufgrund / sodass / weshalb / wodurch / infolgedessen." },
  { pattern: /condition|conditions|sofern|falls|vorausgesetzt/i, de: "Bedingungen formulieren: falls / sofern / vorausgesetzt, dass; Hypothesen mit Konjunktiv II." },
  { pattern: /purpose|indem|dadurch|um \.\.\. zu|damit/i, de: "Zweck und Methode ausdrücken: um … zu / damit / indem / dadurch, dass." },
  { pattern: /ohne \.\.\. zu|statt \.\.\. zu|alternative|avoided behavio(?:u)?r/i, de: "Alternative oder vermiedene Handlung: ohne … zu / statt … zu." },
  { pattern: /temporal|bevor|nachdem|sobald|solange/i, de: "Zeitliche Abläufe verbinden: bevor / nachdem / sobald / solange / während." },
  { pattern: /futur i|prediction/i, de: "Prognosen formulieren: Futur I mit Vermutungswörtern wie vermutlich oder wahrscheinlich." },
  { pattern: /je \.\.\. desto/i, de: "je … desto: zwei Entwicklungen oder Bedingungen direkt miteinander verknüpfen." },
  { pattern: /academic|evidence|interpretation|limitation/i, de: "Wissenschaftlicher Stil: Quelle, Befund, Interpretation und Einschränkung klar voneinander trennen." },
  { pattern: /comparative|comparison/i, de: "Vergleiche präzise formulieren und die Vergleichsseiten klar benennen." },
  { pattern: /dass-clause|dass clause/i, de: "dass-Sätze: das konjugierte Verb steht am Ende des Nebensatzes." },
];

function advancedGrammarItemsDe(value = "") {
  const text = String(value || "").trim();
  const matches = ADVANCED_GRAMMAR_RULES
    .filter(({ pattern }) => pattern.test(text))
    .map(({ de }) => de);

  return matches.length
    ? [...new Set(matches)]
    : ["Zielstruktur: Formuliere einen vollständigen Satz mit der neuen Struktur dieser Lektion."];
}

function buildAdvancedGrammarItems(slide = {}, support = {}) {
  if (normalizedAssignmentId(slide) === "B2-1.1") {
    return [
      "Adjektivendungen vor Nomen: ein ruhiger Mensch · eine prägende Erfahrung · einen zuverlässigen Menschen.",
      "Neue Kontrastmittel: während · hingegen · auf der einen Seite … auf der anderen Seite · im Gegensatz dazu.",
    ];
  }

  const source = Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : [];
  return [...new Set(source.flatMap(advancedGrammarItemsDe))];
}

function buildAdvancedMistakes(slide = {}) {
  if (normalizedAssignmentId(slide) === "B2-1.1") {
    return [
      "Vor einem Nomen braucht das Adjektiv eine Endung: ein ruhiger Mensch.",
      "Im maskulinen Akkusativ: einen zuverlässigen Menschen.",
      "Heute nicht auf bekannte B1-Konnektoren ausweichen; gezielt während, hingegen und im Gegensatz dazu üben.",
    ];
  }

  if (classroomLevel(slide) === "C1") {
    return [
      "Komplexe Strukturen nur verwenden, wenn Wortstellung und Bezug eindeutig bleiben.",
      "Abstrakte Aussagen immer mit Beispiel, Folge oder betroffener Gruppe konkretisieren.",
      "Ein Gegenargument nicht nur nennen, sondern anschließend darauf reagieren.",
    ];
  }

  return [
    "Nicht nur Ideen aufzählen: Aussage → Grund → Beispiel.",
    "Bei Nebensätzen auf die Verbendstellung achten.",
    "Nicht denselben Konnektor ständig wiederholen; die neue Zielstruktur bewusst variieren.",
  ];
}

function teacherNoteFromFlow(flow = [], index = 0, fallback = "") {
  return String(flow[index]?.detailEn || fallback).trim();
}

function buildB2Day1Practice(slide = {}, support = {}, flow = []) {
  return [
    {
      title: "1. Adjektivendungen",
      instruction: "Ergänze die richtige Form.",
      prompts: [
        "Ich bin ein ___ Mensch. (ruhig)",
        "Eine ___ Erfahrung hat mich geprägt. (wichtig)",
        "Ich beschreibe einen ___ Menschen. (zuverlässig)",
      ],
      modelItems: ["ein ruhiger Mensch", "eine wichtige Erfahrung", "einen zuverlässigen Menschen"],
      teacherNote: "Check the endings quickly; do not reteach the full adjective-declension table.",
      minutes: 7,
    },
    {
      title: "2. Kontrast mit während",
      instruction: "Verbinde die beiden Aussagen mit während.",
      prompts: ["Im Beruf bin ich eher zurückhaltend. Mit Freunden spreche ich sehr offen."],
      modelItems: ["Während ich im Beruf eher zurückhaltend bin, spreche ich mit Freunden sehr offen."],
      teacherNote: "Use one clear contrast and check verb position before moving on.",
      minutes: 6,
    },
    {
      title: "3. Neue B2-Konnektoren",
      instruction: "Formuliere denselben Gegensatz zweimal neu.",
      prompts: [
        "Nutze einmal hingegen.",
        "Nutze einmal im Gegensatz dazu oder auf der einen Seite … auf der anderen Seite.",
      ],
      modelItems: [
        "Im Beruf bin ich eher zurückhaltend. Mit Freunden hingegen spreche ich sehr offen.",
        "Auf der einen Seite bin ich eher ruhig, auf der anderen Seite übernehme ich in wichtigen Situationen gern Verantwortung.",
      ],
      teacherNote: "Focus on the new B2 contrast expressions; skip deshalb, denn and weil drills here.",
      minutes: 8,
    },
    {
      title: "4. Sprechen",
      instruction: "Beschreibe zwei Seiten deiner Persönlichkeit und erkläre, wann sie sichtbar werden.",
      prompts: ["Sprich 60–90 Sekunden und nutze mindestens zwei neue Kontrastmittel sowie ein konkretes Beispiel."],
      modelItems: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe.slice(0, 2) : [],
      teacherNote: "Let the student finish the response, then correct the target connector and adjective-ending errors.",
      minutes: 10,
    },
  ];
}

function buildAdvancedPracticeItems(slide = {}, support = {}, flow = [], grammarItems = []) {
  if (normalizedAssignmentId(slide) === "B2-1.1") return buildB2Day1Practice(slide, support, flow);

  const level = classroomLevel(slide);
  const topic = cleanTopic(slide);
  const questions = Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [];
  const models = Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [];
  const firstQuestion = questions[0] || `Welche Bedeutung hat „${topic}“?`;
  const argumentQuestion = questions[1] || firstQuestion;
  const counterQuestion = questions[2] || argumentQuestion;
  const finalQuestion = questions[questions.length - 1] || firstQuestion;

  if (level === "C1") {
    return [
      {
        title: "1. Spontane Position",
        instruction: firstQuestion,
        prompts: ["Antworte in 30–45 Sekunden und nutze eine heutige Zielstruktur."],
        modelItems: models.slice(0, 1),
        teacherNote: teacherNoteFromFlow(flow, 0, "Elicit a position before giving language support."),
        minutes: interactionMinutes(slide, 0) || 6,
      },
      {
        title: "2. Satz-Upgrade",
        instruction: `Formuliere differenzierter: „${topic} hat Vorteile und Nachteile.“`,
        prompts: grammarItems.slice(0, 2).map((item) => `Nutze diese Zielstruktur: ${item}`),
        modelItems: models.slice(0, 2),
        teacherNote: teacherNoteFromFlow(flow, 1, "Push precision, not unnecessary complexity."),
        minutes: interactionMinutes(slide, 1) || 10,
      },
      {
        title: "3. Gegenargument",
        instruction: counterQuestion,
        prompts: ["Baue: These → Begründung → Gegenargument → Reaktion."],
        modelItems: models.slice(1, 3),
        teacherNote: teacherNoteFromFlow(flow, 2, "Require a real response to the counterargument."),
        minutes: interactionMinutes(slide, 2) || 10,
      },
      {
        title: "4. 90-Sekunden-Stellungnahme",
        instruction: finalQuestion,
        prompts: ["Sprich 60–90 Sekunden: Position → Grund → Beispiel → Gegenargument → Schluss."],
        modelItems: models.slice(0, 2),
        teacherNote: teacherNoteFromFlow(flow, 3, "Correct after the full response and prioritise two or three high-value points."),
        minutes: interactionMinutes(slide, 3) || 12,
      },
    ];
  }

  return [
    {
      title: "1. Zielstruktur anwenden",
      instruction: `Formuliere zwei eigene Sätze zum Thema „${topic}“.`,
      prompts: grammarItems.slice(0, 2).map((item) => `Nutze diese Struktur: ${item}`),
      modelItems: models.slice(0, 2),
      teacherNote: teacherNoteFromFlow(flow, 0, "Keep the first answers short and accurate."),
      minutes: interactionMinutes(slide, 0) || 6,
    },
    {
      title: "2. Satz-Upgrade",
      instruction: `Formuliere differenzierter: „${topic} hat positive und negative Seiten.“`,
      prompts: ["Nutze eine neue Kontrast-, Bedingungs- oder Folgestruktur aus der heutigen Grammatik."],
      modelItems: models.slice(0, 2),
      teacherNote: teacherNoteFromFlow(flow, 1, "Upgrade one sentence at a time; do not overload the structure."),
      minutes: interactionMinutes(slide, 1) || 8,
    },
    {
      title: "3. Argument aufbauen",
      instruction: argumentQuestion,
      prompts: ["Baue: Aussage → Grund → konkretes Beispiel → kurzer Gegenpunkt."],
      modelItems: models.slice(1, 3),
      teacherNote: teacherNoteFromFlow(flow, 2, "Require connected reasoning rather than a list of ideas."),
      minutes: interactionMinutes(slide, 2) || 10,
    },
    {
      title: "4. Sprechen",
      instruction: finalQuestion,
      prompts: ["Sprich 60–90 Sekunden und nutze mindestens zwei heutige Zielstrukturen."],
      modelItems: models.slice(0, 2),
      teacherNote: teacherNoteFromFlow(flow, 3, "Let the learner finish, then correct the target structures."),
      minutes: interactionMinutes(slide, 3) || 10,
    },
  ];
}

function buildClassicStages(slide = {}, topicLabel = "") {
  return [
    {
      id: "intro",
      type: "intro",
      kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(),
      title: slide.title || "Lesson",
      topic: topicLabel || slide.topic || "",
      objective: slide.objective || "",
      duration: slide.estimatedDuration || "",
    },
    {
      id: "warmup",
      type: "list",
      kicker: "Warm-up",
      title: "Warm-up",
      items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],
    },
    {
      id: "phrases",
      type: "list",
      kicker: "Redemittel",
      title: "Key phrases",
      items: Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : [],
    },
    {
      id: "questions",
      type: "numbered-list",
      kicker: "Sprechen",
      title: "Student questions",
      items: Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [],
    },
    {
      id: "wrapup",
      type: "task",
      kicker: "Abschluss",
      title: "Wrap-up task",
      body: slide.wrapUpTaskDe || "",
    },
  ];
}

function buildPresenterV2Stages(slide = {}, topicLabel = "") {
  const support = buildTeacherSlideSupport(slide);
  const flow = Array.isArray(slide.interactionFlow) ? slide.interactionFlow : [];
  const workbookParts = Array.isArray(slide.workbookConnection?.parts) ? slide.workbookConnection.parts : [];
  const advanced = isAdvancedClassroomSlide(slide);
  const grammarItems = advanced
    ? buildAdvancedGrammarItems(slide, support)
    : (Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : []);
  const practiceItems = advanced
    ? buildAdvancedPracticeItems(slide, support, flow, grammarItems)
    : flow.map((item) => ({
      title: item.phase,
      detail: item.detailEn,
      minutes: parsePresenterMinutes(item.detailEn),
    }));
  const mistakeItems = advanced
    ? buildAdvancedMistakes(slide)
    : (Array.isArray(support.commonMistakesEn) ? support.commonMistakesEn : []);

  return [
    {
      id: "intro",
      type: "intro",
      kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(),
      title: slide.title || "Lesson",
      topic: topicLabel || slide.topic || "",
      objective: slide.objective || "",
      duration: slide.estimatedDuration || "",
    },
    {
      id: "warmup",
      type: "list",
      kicker: "Warm-up",
      title: advanced ? "Einstieg" : "Warm-up",
      items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],
      suggestedMinutes: interactionMinutes(slide, 0) || 5,
    },
    {
      id: "phrases",
      type: "list",
      kicker: "Redemittel",
      title: advanced ? "Redemittel" : "Key phrases",
      items: Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : [],
    },
    {
      id: "grammar",
      type: "list",
      kicker: "Grammatik",
      title: advanced ? "Neue Strukturen" : "Grammar focus",
      items: grammarItems,
      suggestedMinutes: interactionMinutes(slide, 1) || 10,
    },
    {
      id: "examples",
      type: "list",
      kicker: "Beispiele",
      title: advanced ? "Modellsätze" : "Model examples",
      items: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [],
      suggestedMinutes: interactionMinutes(slide, 2) || 8,
    },
    {
      id: "practice",
      type: "flow",
      kicker: "Übung",
      title: advanced ? "Geführte Übung" : "Guided practice",
      items: practiceItems,
    },
    {
      id: "workbook",
      type: "workbook",
      kicker: "Workbook",
      title: advanced ? "Workbook-Verbindung" : "Workbook connection",
      items: workbookParts.map((part) => ({ label: part.label, detail: part.detailEn })),
      grammarUrl: slide.workbookConnection?.grammarUrl || "",
      workbookUrl: slide.workbookConnection?.workbookUrl || "",
      suggestedMinutes: interactionMinutes(slide, Math.max(0, flow.length - 1)) || 7,
    },
    {
      id: "mistakes",
      type: "list",
      kicker: "Achtung",
      title: advanced ? "Typische Fehler" : "Common mistakes",
      items: mistakeItems,
    },
    {
      id: "questions",
      type: "question-reveal",
      kicker: "Sprechen",
      title: advanced ? "Sprechtraining" : "Speaking questions",
      items: Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [],
      supportItems: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [],
      suggestedMinutes: interactionMinutes(slide, 3) || 10,
    },
    {
      id: "wrapup",
      type: "task",
      kicker: "Abschluss",
      title: advanced ? "Abschlussaufgabe" : "Wrap-up task",
      body: slide.wrapUpTaskDe || "",
      suggestedMinutes: 5,
    },
  ];
}

export function buildTeachingPresenterStages(slide = {}, topicLabel = "") {
  const stages = isTeachingPresenterV2Slide(slide)
    ? buildPresenterV2Stages(slide, topicLabel)
    : buildClassicStages(slide, topicLabel);

  return stages.filter((stage) => {
    if (stage.type === "intro") return Boolean(stage.title || stage.topic || stage.objective);
    if (stage.type === "task") return Boolean(stage.body);
    return Array.isArray(stage.items) && stage.items.length > 0;
  });
}

export function clampPresenterIndex(index, stageCount) {
  const lastIndex = Math.max(0, Number(stageCount || 0) - 1);
  return Math.min(lastIndex, Math.max(0, Number(index || 0)));
}
