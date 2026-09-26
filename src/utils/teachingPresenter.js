import { buildTeacherSlideSupport } from "../data/teacherSlideSupport.js";
import { getA2FocusedPractice, getA2PresenterKnowledge } from "../data/a2PresenterKnowledge.js";
import { getB1FocusedPractice, getB1PresenterKnowledge } from "../data/b1PresenterKnowledge.js";
import { getPresenterTopicFoundation } from "../data/presenterTopicFoundations.js";
import { buildCourseBookBridgeItems, getCurriculumParityReference } from "../data/studentCurriculumParity.js";

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

const B2_PRESENTER_V2_ASSIGNMENTS = new Set(Array.from({ length: 28 }, (_, index) => { const day = index + 1; return `B2-${Math.ceil(day / 4)}.${day}`; }));
const C1_PRESENTER_V2_ASSIGNMENTS = new Set(Array.from({ length: 28 }, (_, index) => `C1 ${index + 1}`));
const C2_PRESENTER_V2_ASSIGNMENTS = new Set([...Array.from({ length: 28 }, (_, index) => `C2 ${index + 1}`), ...["C2-1.1","C2-1.2","C2-1.3","C2-1.4","C2-1.5","C2-1.6","C2-1.7","C2-2.1","C2-2.2","C2-2.3","C2-2.4","C2-2.5","C2-2.6","C2-2.7","C2-3.1","C2-3.2","C2-3.3","C2-3.4","C2-3.5","C2-4.1","C2-4.2","C2-4.3","C2-4.4","C2-4.5","C2-5.1","C2-5.2","C2-5.3","C2-5.4"]]);

function normalizedAssignmentId(slide = {}) { return String(slide.assignmentId || "").trim().toUpperCase(); }
function classroomLevel(slide = {}) { return String(slide.course || "").trim().toUpperCase(); }
function isAdvancedClassroomSlide(slide = {}) { return ["B2", "C1", "C2"].includes(classroomLevel(slide)); }
function cleanTopic(slide = {}) { return String(slide.topic || slide.title || "dieses Thema").replace(/^\s*\d+(?:\.\d+)*\s*/, "").trim(); }

export function isA1PresenterV2Slide(slide = {}) { const assignmentId = normalizedAssignmentId(slide); return classroomLevel(slide) === "A1" && assignmentId.startsWith("A1-") && !A1_PRESENTER_V2_EXCLUDED_ASSIGNMENTS.has(assignmentId); }
export function isA2PresenterV2Slide(slide = {}) { return A2_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide)); }
export function isB1PresenterV2Slide(slide = {}) { return B1_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide)); }
export function isB2PresenterV2Slide(slide = {}) { return B2_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide)); }
export function isC1PresenterV2Slide(slide = {}) { return C1_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide)); }
export function isC2PresenterV2Slide(slide = {}) { return C2_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide)); }
export function isTeachingPresenterV2Slide(slide = {}) { return isA1PresenterV2Slide(slide) || isA2PresenterV2Slide(slide) || isB1PresenterV2Slide(slide) || isB2PresenterV2Slide(slide) || isC1PresenterV2Slide(slide) || isC2PresenterV2Slide(slide); }
export function parsePresenterMinutes(value = "") { const match = String(value || "").match(/(\d+)\s*min/i); return match ? Number(match[1]) : 0; }
function interactionMinutes(slide = {}, index = 0) { return parsePresenterMinutes(slide.interactionFlow?.[index]?.detailEn || ""); }

const PER_STUDENT_WARMUP_LEVELS = new Set(["A2", "B1", "B2", "C1", "C2"]);
const WARMUP_SUPPORT_LEVELS = new Set(["A2", "B1", "B2", "C1", "C2"]);
const WARMUP_STOPWORDS = new Set([
  "aber", "alle", "alles", "auch", "auf", "aus", "bei", "bist", "dann", "das", "dass", "dein", "deine",
  "dem", "den", "der", "des", "die", "dies", "diese", "diesem", "diesen", "dieser", "dieses", "dir", "doch",
  "du", "ein", "eine", "einem", "einen", "einer", "eines", "er", "es", "für", "gegen", "gibt", "haben", "hast",
  "hat", "ich", "ihm", "ihn", "ihnen", "ihr", "ihre", "im", "in", "ist", "kann", "kannst", "können", "man",
  "mein", "meine", "mit", "nach", "nicht", "noch", "oder", "ohne", "schon", "sein", "seine", "sich", "sie", "sind",
  "über", "um", "und", "uns", "unter", "vom", "von", "vor", "war", "was", "werden", "wie", "wir", "wo", "zu", "zum",
  "zur",
]);

function warmupDifficulty(index = 0, total = 0) {
  if (index === 0) return "Easy";
  if (index >= Math.max(2, total - 1)) return "Challenge";
  return "Extend";
}

function warmupCue(question = "") {
  const text = String(question || "");
  const cues = [
    { pattern: /\bwie oft\b/i, value: "Wie oft" },
    { pattern: /\bmit wem\b/i, value: "Mit wem" },
    { pattern: /\bwarum\b/i, value: "Warum" },
    { pattern: /\bwann\b/i, value: "Wann" },
    { pattern: /\bwo(?:hin|her)?\b/i, value: (text.match(/\bwo(?:hin|her)?\b/i) || [""])[0] },
    { pattern: /\bwelche[nrms]?\s+(?:vorteile|nachteile|probleme|gründe|erfahrungen|eigenschaften)\b/i, value: (text.match(/\bwelche[nrms]?\s+(?:vorteile|nachteile|probleme|gründe|erfahrungen|eigenschaften)\b/i) || [""])[0] },
    { pattern: /\bwürdest\b/i, value: "würdest" },
    { pattern: /\bmöchtest\b/i, value: "möchtest" },
  ];
  return cues.find(({ pattern }) => pattern.test(text))?.value || "";
}

function warmupKeywords(question = "") {
  const text = String(question || "").trim();
  if (!text) return [];
  const cue = warmupCue(text);
  const originalTokens = text.match(/[A-Za-zÄÖÜäöüß]+/g) || [];
  const content = originalTokens.filter((token, index) => {
    const normalized = token.toLocaleLowerCase("de-DE");
    if (normalized.length < 5 || WARMUP_STOPWORDS.has(normalized)) return false;
    if (cue && cue.toLocaleLowerCase("de-DE").includes(normalized)) return false;
    if (index === 0 && /^(welche[nrms]?|welches|welcher)$/i.test(token)) return false;
    return true;
  });
  const selected = [...new Set([cue, ...content].filter(Boolean))].slice(0, 3);
  if (selected.length) return selected;

  const fallback = originalTokens.find((token) => token.length >= 4) || originalTokens[0] || "";
  return fallback ? [fallback] : [];
}

function isWarmupComparisonQuestion(question = "") {
  const text = String(question || "");
  if (/\b(?:vergleichen|vergleich|unterschiede?|gegenüber)\b/i.test(text)) return true;

  const hasComparator = /\b(?:wichtiger|wichtigeres|besser|schlechter|größer|kleiner)\b/i.test(text);
  const hasExplicitAlternative = /\b(?:als|oder)\b/i.test(text);
  return hasComparator && hasExplicitAlternative;
}

function warmupHintEn(question = "") {
  const text = String(question || "");
  if (/\bwarum\b/i.test(text)) return "Give a clear reason, not only a short answer.";
  if (/\bwie oft\b/i.test(text)) return "Say how often it happens and add one detail.";
  if (/\bwann\b|\buhr\b|\btag\b|\bwochenende\b/i.test(text)) return "Give a concrete time or day.";
  if (/\bwo(?:hin|her)?\b|\bort\b|\bland\b|\bstadt\b/i.test(text)) return "Name a place and add one useful detail.";
  if (/vorteil|nachteil|problem/i.test(text)) return "Name one point and explain why it matters.";
  if (/\bwürdest\b|\bmöchtest\b|\blieber\b/i.test(text)) return "State your choice, then explain your reason.";
  if (isWarmupComparisonQuestion(text)) return "Compare both sides and explain your choice.";
  if (/\bwie\s+(?:kann|könnte|sollte)\s+(?:man|ich|du|wir)\b|\bwie\s+lässt\s+sich\b/i.test(text)) return "Name a practical method and explain how it helps.";
  if (/\b(?:gestern|früher|damals|letztes?|letzten|letzte|vergangene[nrms]?)\b/i.test(text)) return "Use a past-time expression and one concrete detail.";
  return "Answer in a full sentence and add one concrete detail.";
}

function warmupAnswerStarterDe(question = "") {
  const text = String(question || "");
  if (/\bwarum\b/i.test(text)) return "Für mich ..., weil ...";
  if (/\bwie oft\b/i.test(text)) return "Ich ... einmal / zweimal / oft ...";
  if (/\bwann\b/i.test(text)) return "Am ... / Um ...";
  if (/\bwohin\b/i.test(text)) return "Ich fahre / gehe nach ...";
  if (/\bwoher\b/i.test(text)) return "Ich komme aus ...";
  if (/\bwo\b/i.test(text)) return "In ... / Dort ...";
  if (/vorteil/i.test(text) && /nachteil/i.test(text)) return "Ein Vorteil ist ...; ein Nachteil ist ...";
  if (/vorteil/i.test(text)) return "Ein Vorteil ist ...";
  if (/nachteil|problem/i.test(text)) return "Ein Nachteil / Problem ist ...";
  if (/\bwürdest\b/i.test(text)) return "Ich würde ..., weil ...";
  if (/\bmöchtest\b/i.test(text)) return "Ich möchte ..., weil ...";
  if (/\bwelche[nrms]?\b/i.test(text)) return "Für mich ist / sind ...";
  if (/\bwie\b/i.test(text)) return "Ich ... / Für mich ...";
  return "Ich denke, dass ... / Für mich ...";
}

const WARMUP_FOLLOWUP_OVERRIDES = new Map([
  ["was machst du gern am wochenende?", "Mit wem verbringst du dein Wochenende am liebsten?"],
  ["wann stehst du am wochenende auf?", "Was machst du direkt nach dem Aufstehen?"],
  ["siehst du abends oft fern?", "Was siehst du abends am liebsten im Fernsehen?"],
  ["gehst du manchmal mit freunden aus?", "Wohin gehst du mit deinen Freunden am liebsten?"],
  ["was machst du am montag?", "Was steht am Montag noch auf deinem Plan?"],
  ["wann hast du diese woche deutschkurs?", "Was machst du vor oder nach dem Deutschkurs?"],
  ["an welchem tag kannst du freunde treffen?", "Was möchtest du mit deinen Freunden an diesem Tag machen?"],
  ["was musst du diese woche unbedingt erledigen?", "Wann willst du diese Aufgabe erledigen?"],
  ["was ist wichtiger: ausbildung oder erfahrung?", "Wann ist praktische Erfahrung wichtiger als eine Ausbildung?"],
  ["wie kann man arbeit und privatleben besser trennen?", "Welche feste Regel hilft dir, nach der Arbeit wirklich abzuschalten?"],
]);

function normalizeWarmupQuestion(question = "") {
  return String(question || "")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/\s+/g, " ");
}

function warmupFollowUpDe(question = "") {
  const text = String(question || "").trim();
  const normalized = normalizeWarmupQuestion(text);
  const override = WARMUP_FOLLOWUP_OVERRIDES.get(normalized);
  if (override) return override;

  if (/\b(?:schon einmal|zuletzt|letzte[nrms]?|vergangene[nrms]?|früher|damals)\b/i.test(text)
      || /\b(?:hast|bist|warst)\s+du\b/i.test(text) && /\b(?:gemacht|gesehen|erlebt|gereist|gegangen|gewesen|zurückgebracht)\b/i.test(text)) {
    return "Was ist dabei genau passiert, und wie hast du reagiert?";
  }

  if (/\bwie oft\b/i.test(text)) {
    return "An welchen Tagen oder zu welcher Uhrzeit machst du das normalerweise?";
  }

  if (/\bwie lange\b/i.test(text)) {
    return "Was machst du während dieser Zeit normalerweise?";
  }

  if (/\bwann\b|\bwelchem tag\b|\bwelcher tag\b/i.test(text)) {
    return "Was machst du direkt davor oder danach?";
  }

  if (/\bwohin\b/i.test(text)) {
    return "Was möchtest du dort machen, wenn du angekommen bist?";
  }

  if (/\bwoher\b/i.test(text)) {
    return "Was vermisst du an diesem Ort am meisten?";
  }

  if (/\bwo\b|\bwelcher ort\b|\bwelchen ort\b/i.test(text)) {
    return "Was gefällt dir an diesem Ort besonders?";
  }

  if (/\bwarum\b/i.test(text)) {
    return "Was ist für dich der wichtigste Grund dafür?";
  }

  if (/\bwelche rolle\b/i.test(text)) {
    return "Welcher dieser Punkte beeinflusst deine Entscheidung am stärksten?";
  }

  if (/\b(?:vorteil|nachteil|problem|schwierigkeit|herausforderung)\b/i.test(text)) {
    return "Wann merkt man diesen Punkt im Alltag besonders deutlich?";
  }

  if (/\b(?:möchtest|würdest|willst|soll)\b/i.test(text)) {
    return "Was wäre dein erster Schritt, um das wirklich umzusetzen?";
  }

  if (/\bwie\s+(?:kann|könnte|sollte)\s+(?:man|ich|du|wir)\b|\bwas\s+(?:tust|machst)\s+du,?\s+um\b|\bwas\s+hilft\b|\bstrategie\b/i.test(text)) {
    return "Welche konkrete Methode würdest du selbst zuerst ausprobieren?";
  }

  if (isWarmupComparisonQuestion(text) || /\blieber\b|\boder\b/i.test(text)) {
    return "In welcher Situation würdest du dich anders entscheiden als heute?";
  }

  if (/\bwelche[nrms]?\b|\bwelches\b|\bwelcher\b|\bwelchen\b/i.test(text)) {
    return "Welcher Punkt davon ist für dich persönlich am wichtigsten und warum?";
  }

  if (/^was\s+(?:machst|tust|kaufst|sagst|kontrollierst|brauchst)\b/i.test(text)) {
    return "Wann machst du das normalerweise, und mit wem?";
  }

  if (/^was\s+ist\b/i.test(text)) {
    return "Woran merkst du das in deinem eigenen Alltag?";
  }

  if (/^wie\b/i.test(text)) {
    return "Was ist dabei für dich am einfachsten oder am schwierigsten?";
  }

  if (/^(?:ist|sind|hast|kannst|kaufst|bezahlst|benutzt|lernst|arbeitest|gehst|siehst|empfiehlst)\b/i.test(text)) {
    return "Was ist der wichtigste Grund für deine Antwort?";
  }

  return "Was kannst du dazu aus deiner eigenen Erfahrung erzählen?";
}

function advancedWarmupHintEn(question = "", level = "") {
  const base = warmupHintEn(question);
  if (level === "B2") return `${base} Extend the answer with a reason, a concrete example and one useful contrast or consequence.`;
  if (level === "C1") return `${base} Weigh at least two relevant factors and make the logical relation between them explicit.`;
  if (level === "C2") return `${base} Identify the underlying tension, state your evaluation criteria and qualify the claim where the evidence is limited.`;
  return base;
}

function advancedWarmupStarterDe(level = "", question = "") {
  if (level === "B2") return "Aus meiner Sicht ..., weil ... Ein konkretes Beispiel dafür ist ...";
  if (level === "C1") return "Bei der Beurteilung dieser Frage sollte berücksichtigt werden, dass ... Einerseits ...; andererseits ...";
  if (level === "C2") return "Grundsätzlich spricht dafür, dass ...; zugleich ist einzuräumen, dass ... Entscheidend ist dabei, ob ...";
  return warmupAnswerStarterDe(question);
}

function advancedWarmupFollowUpDe(question = "", level = "") {
  const text = String(question || "");
  if (level === "B2") {
    if (isWarmupComparisonQuestion(text) || /\boder\b/i.test(text)) return "Nach welchem konkreten Kriterium würdest du beide Möglichkeiten vergleichen?";
    if (/\bwie\s+(?:kann|könnte|sollte)\b|\bmaßnahme|lösung|strategie\b/i.test(text)) return "Welche Schwierigkeit könnte bei dieser Lösung in der Praxis entstehen?";
    if (/\bwarum\b/i.test(text)) return "Welches Gegenargument müsste man bei deiner Begründung trotzdem berücksichtigen?";
    return "Welche konkrete Folge hätte dieser Punkt für Menschen im Alltag?";
  }
  if (level === "C1") {
    if (isWarmupComparisonQuestion(text) || /\boder\b/i.test(text)) return "Welches Bewertungskriterium ist für deinen Vergleich entscheidend, und warum?";
    if (/\bwie\s+(?:kann|könnte|sollte)\b|\bmaßnahme|lösung|strategie\b/i.test(text)) return "Unter welcher Voraussetzung wäre diese Lösung tatsächlich überzeugend?";
    if (/\bwarum\b/i.test(text)) return "Welche plausible Gegenposition könnte deine Begründung relativieren?";
    return "Unter welcher Bedingung würdest du deine Position ändern oder stärker einschränken?";
  }
  if (level === "C2") {
    if (isWarmupComparisonQuestion(text) || /\boder\b/i.test(text)) return "Nach welchen Kriterien ist dieser Vergleich tragfähig, und wo stößt er an seine Grenzen?";
    if (/\bwie\s+(?:kann|könnte|sollte)\b|\bmaßnahme|lösung|strategie\b/i.test(text)) return "Unter welchen Bedingungen wäre diese Maßnahme nur bedingt wirksam oder sogar kontraproduktiv?";
    if (/\bwarum\b/i.test(text)) return "Welche Annahme liegt deiner Begründung zugrunde, und wie belastbar ist sie?";
    return "Welche Evidenz würde deine Bewertung stützen, und welche Evidenz würde sie relativieren?";
  }
  return warmupFollowUpDe(question);
}

function buildWarmupQuestionSupport(slide = {}) {
  const level = classroomLevel(slide);
  if (!WARMUP_SUPPORT_LEVELS.has(level)) return [];
  const questions = Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [];
  return questions.map((question, index) => ({
    keywords: warmupKeywords(question),
    hintEn: ["B2", "C1", "C2"].includes(level) ? advancedWarmupHintEn(question, level) : warmupHintEn(question),
    answerStarterDe: ["B2", "C1", "C2"].includes(level) ? advancedWarmupStarterDe(level, question) : warmupAnswerStarterDe(question),
    followUpDe: ["B2", "C1", "C2"].includes(level) ? advancedWarmupFollowUpDe(question, level) : warmupFollowUpDe(question),
    difficulty: warmupDifficulty(index, questions.length),
  }));
}

function warmupSuggestedMinutes(slide = {}) { return PER_STUDENT_WARMUP_LEVELS.has(classroomLevel(slide)) ? 5 : (interactionMinutes(slide, 0) || 5); }
function warmupTimingLabel(slide = {}, questionCount = 0) {
  if (!PER_STUDENT_WARMUP_LEVELS.has(classroomLevel(slide))) return "";
  const count = Number(questionCount || 0);
  return `5 min per student${count ? ` · ${count} warm-up question${count === 1 ? "" : "s"}` : ""}`;
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
  { pattern: /indem|dadurch(?:,? dass)?/i, de: "Methode ausdrücken: indem / dadurch, dass." },
  { pattern: /purpose|um \.\.\. zu|damit/i, de: "Zweck ausdrücken: um … zu / damit." },
  { pattern: /ohne \.\.\. zu|statt \.\.\. zu|alternative|avoided behavio(?:u)?r/i, de: "Alternative oder vermiedene Handlung: ohne … zu / statt … zu." },
  { pattern: /temporal|bevor|nachdem|sobald|solange/i, de: "Zeitliche Abläufe verbinden: bevor / nachdem / sobald / solange / während." },
  { pattern: /futur i|prediction/i, de: "Prognosen formulieren: Futur I mit Vermutungswörtern wie vermutlich oder wahrscheinlich." },
  { pattern: /je \.\.\. desto/i, de: "je … desto: zwei Entwicklungen oder Bedingungen direkt miteinander verknüpfen." },
  { pattern: /academic|evidence|interpretation|limitation/i, de: "Wissenschaftlicher Stil: Quelle, Befund, Interpretation und Einschränkung klar voneinander trennen." },
  { pattern: /comparative|comparison/i, de: "Vergleiche präzise formulieren und die Vergleichsseiten klar benennen." },
  { pattern: /dass-clause|dass clause/i, de: "dass-Sätze: das konjugierte Verb steht am Ende des Nebensatzes." },
];
function advancedGrammarItemsDe(value = "") { const text = String(value || "").trim(); const matches = ADVANCED_GRAMMAR_RULES.filter(({ pattern }) => pattern.test(text)).map(({ de }) => de); return matches.length ? [...new Set(matches)] : ["Zielstruktur: Formuliere einen vollständigen Satz mit der neuen Struktur dieser Lektion."]; }
function buildAdvancedGrammarItems(slide = {}, support = {}) { const source = Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : []; if (["B2", "C1"].includes(classroomLevel(slide)) && source.length) return source; return [...new Set(source.flatMap(advancedGrammarItemsDe))]; }
function buildAdvancedMistakes(slide = {}) { if (classroomLevel(slide) === "C1") return ["Komplexe Strukturen nur verwenden, wenn Wortstellung und Bezug eindeutig bleiben.", "Abstrakte Aussagen immer mit Beispiel, Folge oder betroffener Gruppe konkretisieren.", "Ein Gegenargument nicht nur nennen, sondern anschließend darauf reagieren."]; return ["Nicht nur Ideen aufzählen: Aussage → Grund → Beispiel.", "Bei Nebensätzen auf die Verbendstellung achten.", "Nicht denselben Konnektor ständig wiederholen; die neue Zielstruktur bewusst variieren."]; }
function teacherNoteFromFlow(flow = [], index = 0, fallback = "") { return String(flow[index]?.detailEn || fallback).trim(); }

const VOCABULARY_STAGE_LEVELS = new Set(["A2", "B1", "B2", "C1", "C2"]);
const VOCABULARY_LIMITS = Object.freeze({ A2: 7, B1: 9, B2: 9, C1: 10, C2: 10 });

function vocabularyInstruction(level = "") {
  if (level === "B2") return "Verwende mindestens zwei Ausdrücke in einer begründeten Antwort und verbinde sie mit einem konkreten Beispiel.";
  if (level === "C1") return "Verwende mindestens drei Ausdrücke präzise und achte auf Register, Kollokation und logische Verknüpfung.";
  if (level === "C2") return "Verwende mindestens drei Ausdrücke idiomatisch und präzise; baue sie nur dort ein, wo sie Argumentation und Register tatsächlich verbessern.";
  return "Verwende mindestens zwei Wörter oder Ausdrücke in eigenen Sätzen.";
}

function buildVocabularyItems(slide = {}, support = {}) {
  const level = classroomLevel(slide);
  const phrases = [...new Set(
    (Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  )].slice(0, VOCABULARY_LIMITS[level] || 7);
  const examples = [...new Set(
    (Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  )];
  const usedExamples = new Set();

  return phrases.map((term, index) => {
    const comparableTerm = term.toLocaleLowerCase("de-DE");
    const preferredExample = examples.find((example) => {
      if (usedExamples.has(example) || example.toLocaleLowerCase("de-DE") === comparableTerm) return false;
      const keywords = comparableTerm
        .replace(/[.…?!,:;()/"']/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 5);
      return keywords.some((word) => example.toLocaleLowerCase("de-DE").includes(word));
    });
    const example = preferredExample || "";

    if (example) usedExamples.add(example);
    return { term, example, number: index + 1 };
  });
}

function buildAdvancedPracticeItems(slide = {}, support = {}, flow = [], grammarItems = []) {
  const level = classroomLevel(slide); const topic = cleanTopic(slide); const questions = Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : []; const models = Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : []; const firstQuestion = questions[0] || `Welche Bedeutung hat „${topic}“?`; const argumentQuestion = questions[1] || firstQuestion; const counterQuestion = questions[2] || argumentQuestion; const finalQuestion = questions[questions.length - 1] || firstQuestion;
  if (level === "C1") return [
    { title: "1. Spontane Position", instruction: firstQuestion, prompts: ["Antworte in 30–45 Sekunden und nutze eine heutige Zielstruktur."], modelItems: models.slice(0, 1), teacherNote: teacherNoteFromFlow(flow, 0, "Elicit a position before giving language support."), minutes: interactionMinutes(slide, 0) || 6 },
    { title: "2. Satz-Upgrade", instruction: `Formuliere differenzierter: „${topic} hat Vorteile und Nachteile.“`, prompts: grammarItems.slice(0, 2).map((item) => `Nutze diese Zielstruktur: ${item}`), modelItems: models.slice(0, 2), teacherNote: teacherNoteFromFlow(flow, 1, "Push precision, not unnecessary complexity."), minutes: interactionMinutes(slide, 1) || 10 },
    { title: "3. Gegenargument", instruction: counterQuestion, prompts: ["Formuliere zuerst ein Gegenargument und reagiere anschließend darauf."], modelItems: models.slice(1, 3), teacherNote: teacherNoteFromFlow(flow, 2, "Require a response to the counterargument, not just its mention."), minutes: interactionMinutes(slide, 2) || 10 },
    { title: "4. Stellungnahme", instruction: finalQuestion, prompts: ["Sprich 60–90 Sekunden: Position → Grund → Beispiel → Gegenargument → Schluss."], modelItems: models.slice(0, 2), teacherNote: teacherNoteFromFlow(flow, 3, "Correct after the full response and prioritise two or three high-value points."), minutes: interactionMinutes(slide, 3) || 12 },
  ];
  return [
    { title: "1. Zielstruktur anwenden", instruction: `Formuliere zwei eigene Sätze zum Thema „${topic}“.`, prompts: grammarItems.slice(0, 2).map((item) => `Nutze diese Struktur: ${item}`), modelItems: models.slice(0, 2), teacherNote: teacherNoteFromFlow(flow, 0, "Keep the first answers short and accurate."), minutes: interactionMinutes(slide, 0) || 6 },
    { title: "2. Satz-Upgrade", instruction: `Formuliere differenzierter: „${topic} hat positive und negative Seiten.“`, prompts: ["Nutze eine neue Kontrast-, Bedingungs- oder Folgestruktur aus der heutigen Grammatik."], modelItems: models.slice(0, 2), teacherNote: teacherNoteFromFlow(flow, 1, "Upgrade one sentence at a time; do not overload the structure."), minutes: interactionMinutes(slide, 1) || 8 },
    { title: "3. Argument aufbauen", instruction: argumentQuestion, prompts: ["Baue: Aussage → Grund → konkretes Beispiel → kurzer Gegenpunkt."], modelItems: models.slice(1, 3), teacherNote: teacherNoteFromFlow(flow, 2, "Require connected reasoning rather than a list of ideas."), minutes: interactionMinutes(slide, 2) || 10 },
    { title: "4. Sprechen", instruction: finalQuestion, prompts: ["Sprich 60–90 Sekunden und nutze mindestens zwei heutige Zielstrukturen."], modelItems: models.slice(0, 2), teacherNote: teacherNoteFromFlow(flow, 3, "Let the learner finish, then correct the target structures."), minutes: interactionMinutes(slide, 3) || 10 },
  ];
}

function lessonSummaryObjective(slide = {}) {
  const raw = String(slide.objective || "").trim();
  if (!raw) return `You can work confidently with the lesson topic “${cleanTopic(slide)}”.`;

  const withoutLearner = raw
    .replace(/^students?\s+can\s+/i, "")
    .replace(/^learners?\s+can\s+/i, "")
    .replace(/^students?\s+/i, "")
    .replace(/^learners?\s+/i, "");
  if (!withoutLearner) return `You can work confidently with the lesson topic “${cleanTopic(slide)}”.`;
  return `You can ${withoutLearner.charAt(0).toLowerCase()}${withoutLearner.slice(1)}`;
}

function buildLessonSummaryItems(slide = {}) {
  const support = buildTeacherSlideSupport(slide);
  const topic = cleanTopic(slide);
  const grammar = (Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : [])
    .map((item) => String(item || "").trim())
    .find(Boolean);
  const speakingQuestions = Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [];
  const items = [
    { label: "Main goal", detail: lessonSummaryObjective(slide) },
  ];

  if (grammar) {
    items.push({ label: "Language", detail: `You can use today’s target grammar accurately: ${grammar}` });
  }
  if (speakingQuestions.length) {
    items.push({ label: "Speaking", detail: `You can talk about “${topic}”, answer lesson questions and add useful reasons or details.` });
  }
  if (slide.wrapUpTaskDe) {
    items.push({ label: "Self-check", detail: String(slide.wrapUpTaskDe).trim() });
  }

  return items.slice(0, 4);
}

function buildAdvancedWeeklyChallenge(slide = {}) {
  const level = classroomLevel(slide);
  if (!["B2", "C1", "C2"].includes(level)) return null;

  const day = Math.max(1, Number(slide.dayNumber || String(slide.day || "").match(/\d+/)?.[0] || 1));
  const week = Math.min(7, Math.max(1, Math.ceil(day / 4)));
  const topic = cleanTopic(slide);
  const questions = (Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : []).filter(Boolean);
  const phrases = (Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []).filter(Boolean);
  const q1 = questions[0] || `Welche Bedeutung hat „${topic}“?`;
  const q2 = questions[1] || `Welche unterschiedlichen Perspektiven gibt es bei „${topic}“?`;
  const q3 = questions[2] || `Welche Lösung oder Schlussfolgerung ist bei „${topic}“ überzeugend?`;
  const phrasePrompt = phrases[0]
    ? `Nutze, wenn es sinnvoll ist: „${phrases[0]}“`
    : "Nutze ein präzises Redemittel aus der heutigen Lektion.";

  const plans = {
    B2: {
      1: ["Woche 1 · Abwägen & begründen", [
        { title: "Position", instruction: q1, prompts: ["Formuliere eine klare Position mit Grund.", "Ergänze ein konkretes Beispiel."], minutes: 2 },
        { title: "Gegenpunkt", instruction: q2, prompts: ["Nenne einen realistischen Gegenpunkt.", phrasePrompt], minutes: 2 },
        { title: "Abwägen", instruction: "Entscheide danach, welcher Punkt stärker wiegt.", prompts: ["Begründe deine Entscheidung in einem vollständigen B2-Satz."], minutes: 2 },
      ]],
      2: ["Woche 2 · Gespräch weiterentwickeln", [
        { title: "Beitrag", instruction: q1, prompts: ["Position → Grund → Beispiel."], minutes: 2 },
        { title: "Anknüpfen", instruction: "Reagiere zuerst auf den vorigen Beitrag und füge dann eine neue Idee hinzu.", prompts: [phrasePrompt], minutes: 2 },
        { title: "Nachfrage", instruction: q2, prompts: ["Stelle eine spontane Rückfrage und reagiere auf die Antwort."], minutes: 2 },
      ]],
      3: ["Woche 3 · Problemlösung unter Bedingungen", [
        { title: "Problem", instruction: q1, prompts: ["Wer ist betroffen?", "Was ist die konkrete Schwierigkeit?"], minutes: 2 },
        { title: "Lösung", instruction: q3, prompts: ["Schlage eine realistische Maßnahme vor.", "Nenne eine Bedingung für ihren Erfolg."], minutes: 2 },
        { title: "Nebenwirkung", instruction: "Prüfe eine mögliche negative Folge deiner Lösung.", prompts: [phrasePrompt], minutes: 2 },
      ]],
      4: ["Woche 4 · Interview & kritische Rückfrage", [
        { title: "Interview", instruction: q1, prompts: ["Höre bis zum Ende zu."], minutes: 2 },
        { title: "Neue Rückfrage", instruction: "Stelle eine kritische Rückfrage, die nicht auf der Folie steht.", prompts: ["Frage nach Folge, Bedingung, Beispiel oder Alternative."], minutes: 2 },
        { title: "Rollenwechsel", instruction: q2, prompts: ["Reagiere auf die vorige Antwort und tauscht danach die Rollen.", phrasePrompt], minutes: 3 },
      ]],
      5: ["Woche 5 · Aussage reparieren", [
        { title: "Unklar", instruction: "Formuliere eine zu allgemeine Aussage zum Thema präziser.", prompts: ["Ergänze Ursache, Folge oder Bedingung."], minutes: 2 },
        { title: "Missverständnis", instruction: q2, prompts: ["Dein Partner versteht dich anders: erkläre die Idee neu, ohne denselben Satz zu wiederholen."], minutes: 2 },
        { title: "Prüfen", instruction: "Fasse kurz zusammen, worauf ihr euch einigen könnt.", prompts: [phrasePrompt], minutes: 2 },
      ]],
      6: ["Woche 6 · 3-Minuten-Prüfungsantwort", [
        { title: "Planen", instruction: q1, prompts: ["Position → zwei Gründe → Beispiel → Gegenpunkt."], minutes: 1 },
        { title: "Sprechen", instruction: "Sprich bis zu 3 Minuten strukturiert und ohne abzulesen.", prompts: [phrasePrompt], minutes: 3 },
        { title: "Spontane Reaktion", instruction: "Ein Partner widerspricht oder fragt kritisch nach.", prompts: ["Antworte direkt und begründe deine Reaktion."], minutes: 2 },
      ]],
      7: ["Woche 7 · Überraschungsmission", [
        { title: "Karte A", instruction: q1, prompts: ["Antworte ohne vorbereiteten Text."], minutes: 2 },
        { title: "Karte B", instruction: q2, prompts: ["Wechsle die Perspektive und nenne ein Gegenargument.", phrasePrompt], minutes: 2 },
        { title: "Karte C", instruction: q3, prompts: ["Übertrage die Idee auf eine neue reale Situation."], minutes: 2 },
      ]],
    },
    C1: {
      1: ["Woche 1 · Position differenzieren", [
        { title: "These", instruction: q1, prompts: ["Formuliere eine klare, aber nicht absolute Position."], minutes: 2 },
        { title: "Kriterien", instruction: q2, prompts: ["Nenne zwei Kriterien, nach denen du die Frage bewertest.", phrasePrompt], minutes: 2 },
        { title: "Einschränkung", instruction: "Formuliere eine Bedingung, unter der deine Position nicht gilt.", prompts: ["Nutze eine präzise Einschränkung."], minutes: 2 },
      ]],
      2: ["Woche 2 · Argument weiterentwickeln", [
        { title: "Anknüpfen", instruction: q1, prompts: ["Greife einen Gedanken des Partners auf, bevor du deinen eigenen entwickelst."], minutes: 2 },
        { title: "Vertiefen", instruction: q2, prompts: ["Ergänze Ursache, Folge und konkretes Beispiel.", phrasePrompt], minutes: 2 },
        { title: "Reaktion", instruction: "Antworte auf einen Einwand, ohne die Gegenposition zu vereinfachen.", prompts: ["Zeige Zustimmung, Einschränkung oder begründeten Widerspruch."], minutes: 2 },
      ]],
      3: ["Woche 3 · Fallanalyse", [
        { title: "Fall", instruction: `Übertrage „${topic}“ auf einen konkreten Fall.`, prompts: ["Wer ist betroffen?", "Welche Interessen geraten in Konflikt?"], minutes: 2 },
        { title: "Analyse", instruction: q2, prompts: ["Ordne Ursachen, Folgen und Verantwortlichkeiten.", phrasePrompt], minutes: 2 },
        { title: "Entscheidung", instruction: q3, prompts: ["Formuliere eine Lösung und nenne ihre wichtigste Grenze."], minutes: 2 },
      ]],
      4: ["Woche 4 · Interview & Prämissen prüfen", [
        { title: "Interview", instruction: q1, prompts: ["Höre auf die Begründung, nicht nur auf die Position."], minutes: 2 },
        { title: "Prämisse", instruction: "Stelle eine Rückfrage zur Annahme hinter der Antwort.", prompts: ["Frage z. B.: Wovon hängt das ab? Was setzt diese Aussage voraus?"], minutes: 2 },
        { title: "Rollenwechsel", instruction: q2, prompts: ["Reagiere auf die Prüfung deiner eigenen Annahme.", phrasePrompt], minutes: 3 },
      ]],
      5: ["Woche 5 · Register & Präzision reparieren", [
        { title: "Zu pauschal", instruction: "Formuliere eine pauschale Aussage differenzierter.", prompts: ["Verwende Abstufung, Bedingung oder Konzession."], minutes: 2 },
        { title: "Register", instruction: q2, prompts: ["Formuliere dieselbe Idee einmal neutral und einmal formell.", phrasePrompt], minutes: 2 },
        { title: "Kohärenz", instruction: "Verbinde zwei Aussagen logisch, ohne nur und oder aber zu verwenden.", prompts: ["Mache die beabsichtigte Beziehung eindeutig."], minutes: 2 },
      ]],
      6: ["Woche 6 · 3-Minuten-Verteidigung", [
        { title: "Position", instruction: q1, prompts: ["Plane These → Begründung → Beispiel → Gegenargument → Reaktion."], minutes: 1 },
        { title: "Verteidigen", instruction: "Sprich bis zu 3 Minuten und verteidige deine Position differenziert.", prompts: [phrasePrompt], minutes: 3 },
        { title: "Kritische Frage", instruction: "Beantworte eine nicht vorbereitete kritische Rückfrage.", prompts: ["Reagiere präzise statt nur die Ausgangsposition zu wiederholen."], minutes: 2 },
      ]],
      7: ["Woche 7 · Transfer-Synthese", [
        { title: "Perspektive 1", instruction: q1, prompts: ["Formuliere die stärkste Position dafür."], minutes: 2 },
        { title: "Perspektive 2", instruction: q2, prompts: ["Formuliere die stärkste Gegenposition.", phrasePrompt], minutes: 2 },
        { title: "Synthese", instruction: q3, prompts: ["Entwickle eine eigene Position, die beide Perspektiven sichtbar verarbeitet."], minutes: 2 },
      ]],
    },
    C2: {
      1: ["Woche 1 · Kriteriengeleitete Bewertung", [
        { title: "Problemkern", instruction: q1, prompts: ["Benenne die zentrale Spannung, bevor du bewertest."], minutes: 2 },
        { title: "Kriterien", instruction: q2, prompts: ["Lege zwei oder drei explizite Bewertungskriterien fest.", phrasePrompt], minutes: 2 },
        { title: "Nuance", instruction: "Formuliere ein Urteil mit klarer Reichweite und Einschränkung.", prompts: ["Vermeide absolute Aussagen ohne entsprechende Evidenz."], minutes: 2 },
      ]],
      2: ["Woche 2 · Steelman & Replik", [
        { title: "Steelman", instruction: q1, prompts: ["Formuliere die stärkste plausible Gegenposition zu deiner eigenen Sicht."], minutes: 2 },
        { title: "Replik", instruction: q2, prompts: ["Antworte auf diese starke Gegenposition, ohne sie zu verzerren.", phrasePrompt], minutes: 2 },
        { title: "Restproblem", instruction: "Nenne den Punkt, den deine Replik nicht vollständig löst.", prompts: ["Markiere bewusst die verbleibende Unsicherheit."], minutes: 2 },
      ]],
      3: ["Woche 3 · Evidenz-Audit", [
        { title: "Behauptung", instruction: q1, prompts: ["Trenne Behauptung, Annahme und Bewertung."], minutes: 2 },
        { title: "Evidenz", instruction: q2, prompts: ["Welche Evidenz wäre nötig, um die Aussage zu stützen oder zu widerlegen?", phrasePrompt], minutes: 2 },
        { title: "Schlussfolgerung", instruction: q3, prompts: ["Formuliere nur die Schlussfolgerung, die aus der verfügbaren Evidenz tatsächlich folgt."], minutes: 2 },
      ]],
      4: ["Woche 4 · Sokratisches Interview", [
        { title: "Position", instruction: q1, prompts: ["Antworte zunächst vollständig."], minutes: 2 },
        { title: "Prüffrage", instruction: "Der Partner prüft eine Annahme, Definition oder Konsequenz, die nicht auf der Folie steht.", prompts: ["Keine Wiederholung der Ausgangsfrage."], minutes: 2 },
        { title: "Revision", instruction: q2, prompts: ["Passe deine Position an, wenn die Rückfrage eine echte Schwäche zeigt.", phrasePrompt], minutes: 3 },
      ]],
      5: ["Woche 5 · Nuance & Register-Reparatur", [
        { title: "Zu absolut", instruction: "Schwäche eine überzogene Behauptung so ab, dass ihre Evidenzlage korrekt wiedergegeben wird.", prompts: ["Nutze epistemische Abstufung."], minutes: 2 },
        { title: "Registerwechsel", instruction: q2, prompts: ["Formuliere dieselbe Position für ein Gespräch und für einen formellen Diskussionsbeitrag.", phrasePrompt], minutes: 2 },
        { title: "Kohärenz", instruction: "Repariere einen unklaren logischen Übergang zwischen zwei Aussagen.", prompts: ["Benenne die beabsichtigte Beziehung explizit."], minutes: 2 },
      ]],
      6: ["Woche 6 · C2-Synthese unter Zeitdruck", [
        { title: "Plan", instruction: q1, prompts: ["Problemkern → Kriterien → Evidenz → Gegenposition → Synthese."], minutes: 1 },
        { title: "Synthese", instruction: "Sprich bis zu 3 Minuten ohne abzulesen und halte Register sowie logische Beziehungen stabil.", prompts: [phrasePrompt], minutes: 3 },
        { title: "Revision", instruction: "Reagiere auf eine kritische Rückfrage und revidiere einen Teil deiner Position, falls nötig.", prompts: ["Zeige, was bestehen bleibt und was du einschränkst."], minutes: 2 },
      ]],
      7: ["Woche 7 · Unvorbereitete Transferdebatte", [
        { title: "Transfer", instruction: q1, prompts: ["Übertrage die Argumentationslogik auf einen neuen Kontext."], minutes: 2 },
        { title: "Perspektivwechsel", instruction: q2, prompts: ["Vertrete kurz eine Position, die nicht deiner eigenen entspricht.", phrasePrompt], minutes: 2 },
        { title: "Synthese", instruction: q3, prompts: ["Formuliere abschließend eine differenzierte eigene Position mit Grenze oder Bedingung."], minutes: 2 },
      ]],
    },
  };

  const selected = plans[level]?.[week];
  if (!selected) return null;
  const [title, items] = selected;
  return {
    id: "weekly-challenge",
    type: "flow",
    kicker: `Woche ${week} · Challenge`,
    title,
    items,
    suggestedMinutes: items.reduce((total, item) => total + Number(item.minutes || 0), 0),
  };
}

function buildClassicStages(slide = {}, topicLabel = "") { const studentReference = getCurriculumParityReference(slide); return [
  { id: "intro", type: "intro", kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(), title: slide.title || "Lesson", topic: topicLabel || slide.topic || "", objective: slide.objective || "", duration: slide.estimatedDuration || "", studentReference },
  { id: "warmup", type: "list", kicker: "Warm-up", title: "Warm-up", items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [], suggestedMinutes: warmupSuggestedMinutes(slide), timingMode: PER_STUDENT_WARMUP_LEVELS.has(classroomLevel(slide)) ? "per-student" : "", timingLabel: warmupTimingLabel(slide, slide.warmupQuestionsDe?.length) },
  { id: "phrases", type: "list", kicker: "Redemittel", title: "Key phrases", items: Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : [] },
  { id: "questions", type: "numbered-list", kicker: "Sprechen", title: "Student questions", items: Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [] },
  { id: "wrapup", type: "task", kicker: "Abschluss", title: "Wrap-up task", body: slide.wrapUpTaskDe || "" },
]; }

function buildC2AnalyticalTask(slide = {}) {
  const day = Math.max(1, Number(slide.dayNumber || String(slide.day || "").match(/\d+/)?.[0] || 1));
  const perspectives = Array.isArray(slide.runtimePerspectivesDe) ? slide.runtimePerspectivesDe.filter(Boolean) : [];
  const grammar = Array.isArray(slide.grammarTeachDe) ? slide.grammarTeachDe.filter(Boolean) : [];
  const topic = cleanTopic(slide);
  const first = perspectives[0] || `Formuliere eine belastbare Position zu „${topic}“.`;
  const second = perspectives[1] || "Formuliere eine plausible Gegenposition.";
  const third = perspectives[2] || "Formuliere eine dritte Perspektive oder Einschränkung.";
  const modelItems = (Array.isArray(slide.speakingModels) ? slide.speakingModels : [])
    .map((item) => item?.modelAnswerDe)
    .filter(Boolean)
    .slice(0, 2);
  const mechanic = ((day - 1) % 7) + 1;

  const variants = {
    1: {
      title: "Kriterienmatrix",
      instruction: "Bewerte drei Positionen nach klaren Kriterien, bevor du dich festlegst.",
      prompts: [
        `Position A: ${first}`,
        `Position B: ${second}`,
        `Position C: ${third}`,
        "Lege zwei Bewertungskriterien fest und zeige, welche Position unter welcher Bedingung stärker wird.",
      ],
    },
    2: {
      title: "Evidenz-Audit",
      instruction: "Trenne Behauptung, notwendige Evidenz und zulässige Schlussfolgerung.",
      prompts: [
        `Prüfe diese Aussage: ${first}`,
        "Welche Daten oder Beobachtungen würden die Aussage stützen?",
        "Welche Evidenz würde sie relativieren?",
        "Formuliere anschließend eine abgestufte Schlussfolgerung.",
      ],
    },
    3: {
      title: "Präzisions- und Registerlabor",
      instruction: "Formuliere dieselbe Kernaussage einmal neutral, einmal akademisch verdichtet und einmal vorsichtig-diplomatisch.",
      prompts: [
        `Ausgangsaussage: ${first}`,
        ...grammar.slice(0, 2).map((item) => `Zielstruktur: ${item}`),
        "Erkläre, welche Version für eine Stellungnahme am überzeugendsten ist und warum.",
      ],
    },
    4: {
      title: "Quellen- und Distanzcheck",
      instruction: "Ordne Aussage, Quelle und Evidenzstatus sprachlich sauber voneinander.",
      prompts: [
        `Fremdaussage: ${first}`,
        "Formuliere sie als berichtete Aussage, ohne sie als Tatsache zu übernehmen.",
        `Setze anschließend einen begründeten Gegenpunkt: ${second}`,
        "Markiere abschließend, was belegt, plausibel oder noch offen ist.",
      ],
    },
    5: {
      title: "Stärkste Gegenposition",
      instruction: "Formuliere die Gegenposition so stark wie möglich und antworte darauf, ohne sie zu verzerren.",
      prompts: [
        `Ausgangsthese: ${first}`,
        `Stärkste Gegenposition: ${second}`,
        "Welche Annahme ist in beiden Positionen unterschiedlich?",
        "Formuliere eine Synthese mit Bedingung oder Grenze.",
      ],
    },
    6: {
      title: "Kausalitäts- und Folgenkarte",
      instruction: "Baue eine belastbare Kette aus Ursache, Mechanismus, Folge und Einschränkung.",
      prompts: [
        `Thema: ${topic}`,
        `Ausgangspunkt: ${first}`,
        "Welche Verbindung ist wirklich kausal, welche nur plausibel oder korrelativ?",
        "Formuliere die Schlussfolgerung so, dass sie nicht mehr behauptet als die Evidenz trägt.",
      ],
    },
    7: {
      title: "Synthese ohne Gleichmacherei",
      instruction: "Verbinde mehrere Perspektiven, ohne ihre Unterschiede zu verwischen.",
      prompts: [
        `Perspektive 1: ${first}`,
        `Perspektive 2: ${second}`,
        `Perspektive 3: ${third}`,
        "Formuliere eine Synthese: Was bleibt bestehen, was wird eingeschränkt, und welche Bedingung entscheidet?",
      ],
    },
  };

  const selected = variants[mechanic];
  return { ...selected, modelItems, minutes: 12 };
}

function buildC2WritingBridge(slide = {}) {
  const opinion = String(slide.writeType || "").toLowerCase() === "opinion";
  const prompt = String(slide.canonicalWritingPromptDe || slide.wrapUpTaskDe || "").trim();
  if (opinion) {
    return {
      title: "Write-Transfer · Stellungnahme planen",
      instruction: "Plane nur die Argumentationsarchitektur; schreibe die Prüfungsantwort erst im Write-Bereich.",
      prompts: [
        prompt,
        "1. These + zwei Bewertungskriterien",
        "2. Alle drei Perspektiven einordnen",
        "3. Stärkstes Gegenargument beantworten",
        "4. Differenzierte Synthese mit Bedingung oder Grenze",
      ],
      minutes: 8,
    };
  }
  return {
    title: "Write-Transfer · Umformung vorbereiten",
    instruction: "Plane die Transformation, ohne die fünf Prüfungsitems vorwegzunehmen.",
    prompts: [
      "Welche Bedeutung muss unverändert bleiben?",
      "Welche Zielstruktur passt zur heutigen Grammatik?",
      "Welche Kasus-, Rektion- oder Wortstellungsstelle ist fehleranfällig?",
      "Welche Register- oder Bedeutungsverschiebung musst du am Ende kontrollieren?",
    ],
    minutes: 8,
  };
}

function buildB1GrammarSupportItems(support = {}) {
  const rules = Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : [];
  const mistakes = Array.isArray(support.commonMistakesEn) ? support.commonMistakesEn : [];
  return rules.slice(0, 4).map((supportEn, index) => ({
    label: `Rule ${index + 1}`,
    supportEn: String(supportEn || "").trim(),
    attentionEn: String(mistakes[index] || "").trim(),
  })).filter((item) => item.supportEn);
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
  const topicFoundation = getPresenterTopicFoundation(slide);
  const studentReference = getCurriculumParityReference(slide);
  const level = classroomLevel(slide);
  const vocabularyStage = VOCABULARY_STAGE_LEVELS.has(level);
  const phraseItems = Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : [];
  const vocabularyItems = vocabularyStage ? buildVocabularyItems(slide, support) : [];
  const speakingStage = {
    id: "questions",
    type: "question-reveal",
    kicker: "Sprechen",
    title: advanced ? "Sprechtraining" : "Speaking questions",
    items: Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [],
    supportItems: [...new Set([
      ...(Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : []),
      ...(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []),
    ])].slice(0, 5),
    questionModels: Array.isArray(slide.speakingModels) ? slide.speakingModels : [],
    requiresQuestionModel: ["A2", "B1", "B2", "C1", "C2"].includes(level),
    suggestedMinutes: interactionMinutes(slide, 3) || 10,
  };
  const workbookStage = {
    id: "workbook",
    type: "workbook",
    kicker: "Workbook",
    title: advanced ? "Workbook-Verbindung" : "Workbook connection",
    items: workbookParts.map((part) => ({ label: part.label, detail: part.detailEn })),
    grammarUrl: slide.workbookConnection?.grammarUrl || "",
    workbookUrl: slide.workbookConnection?.workbookUrl || "",
    suggestedMinutes: interactionMinutes(slide, Math.max(0, flow.length - 1)) || 7,
  };

  if (level === "A2") {
    const knowledge = getA2PresenterKnowledge(normalizedAssignmentId(slide));
    const focusedPractice = getA2FocusedPractice(normalizedAssignmentId(slide));
    return [
      {
        id: "intro",
        type: "intro",
        kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(),
        title: slide.title || "Lesson",
        topic: topicLabel || slide.topic || "",
        objective: slide.objective || "",
        duration: slide.estimatedDuration || "",
        studentReference,
      },
      {
        id: "warmup",
        type: "list",
        kicker: "Warm-up",
        title: "Warm-up",
        items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],
        questionSupport: buildWarmupQuestionSupport(slide),
        suggestedMinutes: warmupSuggestedMinutes(slide),
        timingMode: PER_STUDENT_WARMUP_LEVELS.has(level) ? "per-student" : "",
        timingLabel: warmupTimingLabel(slide, slide.warmupQuestionsDe?.length),
      },
      ...(knowledge ? [{
        id: "knowledge",
        type: "knowledge",
        kicker: "Wissensimpuls",
        title: knowledge.title,
        textDe: knowledge.textDe,
        items: Array.isArray(knowledge.checks) ? knowledge.checks : [],
        instruction: "Lies zuerst für die Bedeutung. Beantworte danach die drei kurzen Checks.",
        suggestedMinutes: 5,
      }] : []),
      {
        id: "phrases",
        type: vocabularyStage ? "vocabulary" : "list",
        kicker: vocabularyStage ? "Wortschatz" : "Redemittel",
        title: vocabularyStage ? "Wortschatz für heute" : "Key phrases",
        items: vocabularyStage ? vocabularyItems : phraseItems,
        instruction: vocabularyStage ? vocabularyInstruction(level) : "",
        suggestedMinutes: vocabularyStage ? 5 : 0,
      },
      {
        id: "grammar",
        type: "list",
        kicker: "Grammatik",
        title: "Grammatik · Muster verstehen",
        items: grammarItems,
        suggestedMinutes: interactionMinutes(slide, 1) || 10,
      },
      {
        id: "examples",
        type: "list",
        kicker: "Beispiele",
        title: "Modellsätze",
        items: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [],
        suggestedMinutes: interactionMinutes(slide, 2) || 7,
      },
      ...(focusedPractice ? [{
        id: "practice",
        type: "flow",
        kicker: "Fokusübung",
        title: focusedPractice.title,
        items: [{
          ...focusedPractice,
          minutes: Number(focusedPractice.minutes || 6),
        }],
        suggestedMinutes: Number(focusedPractice.minutes || 6),
      }] : []),
      speakingStage,
      workbookStage,
    ];
  }

  if (level === "B1") {
    const knowledge = getB1PresenterKnowledge(normalizedAssignmentId(slide));
    const focusedPractice = getB1FocusedPractice(normalizedAssignmentId(slide));
    const b1GrammarItems = buildB1GrammarSupportItems(support);
    return [
      {
        id: "intro",
        type: "intro",
        kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(),
        title: slide.title || "Lesson",
        topic: topicLabel || slide.topic || "",
        objective: slide.objective || "",
        duration: slide.estimatedDuration || "",
        studentReference,
      },
      {
        id: "warmup",
        type: "list",
        kicker: "Warm-up",
        title: "Warm-up",
        items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],
        questionSupport: buildWarmupQuestionSupport(slide),
        suggestedMinutes: warmupSuggestedMinutes(slide),
        timingMode: PER_STUDENT_WARMUP_LEVELS.has(level) ? "per-student" : "",
        timingLabel: warmupTimingLabel(slide, slide.warmupQuestionsDe?.length),
      },
      ...(knowledge ? [{
        id: "knowledge",
        type: "knowledge",
        kicker: "Wissensimpuls",
        title: knowledge.title,
        textDe: knowledge.textDe,
        items: Array.isArray(knowledge.checks) ? knowledge.checks : [],
        instruction: "Lies für die Hauptidee. Beantworte danach zwei Textfragen und eine Denkfrage.",
        suggestedMinutes: 6,
      }] : []),
      {
        id: "phrases",
        type: vocabularyStage ? "vocabulary" : "list",
        kicker: "Wortschatz",
        title: "Kollokationen & Redemittel",
        items: vocabularyStage ? vocabularyItems : phraseItems,
        instruction: vocabularyStage
          ? "Achte auf feste Wortverbindungen und nutze mindestens eine davon später in deiner Antwort."
          : "",
        suggestedMinutes: 5,
      },
      {
        id: "grammar",
        type: "b1-grammar",
        kicker: "Grammatik im Kontext",
        title: "Regel verstehen · auf Deutsch anwenden",
        items: b1GrammarItems,
        suggestedMinutes: interactionMinutes(slide, 1) || 10,
      },
      {
        id: "examples",
        type: "list",
        kicker: "Modellsätze",
        title: "So klingt es auf B1",
        items: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [],
        suggestedMinutes: interactionMinutes(slide, 2) || 7,
      },
      ...(focusedPractice ? [{
        id: "practice",
        type: "flow",
        kicker: "Fokusaufgabe",
        title: focusedPractice.title,
        items: [{
          ...focusedPractice,
          minutes: Number(focusedPractice.minutes || 7),
        }],
        suggestedMinutes: Number(focusedPractice.minutes || 7),
      }] : []),
      {
        ...speakingStage,
        title: "Sprechen · anwenden und begründen",
        suggestedMinutes: 15,
      },
      workbookStage,
    ];
  }

  if (level === "C2") {
    const analyticalTask = buildC2AnalyticalTask(slide);
    const writingBridge = buildC2WritingBridge(slide);
    return [
      {
        id: "intro",
        type: "intro",
        kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(),
        title: slide.title || "Lesson",
        topic: topicLabel || slide.topic || "",
        objective: slide.objective || "",
        duration: slide.estimatedDuration || "",
        studentReference,
      },
      {
        id: "warmup",
        type: "list",
        kicker: "Warm-up",
        title: "Warm-up · Position aktivieren",
        items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],
        questionSupport: buildWarmupQuestionSupport(slide),
        suggestedMinutes: 5,
        timingMode: "per-student",
        timingLabel: warmupTimingLabel(slide, slide.warmupQuestionsDe?.length),
      },
      ...(topicFoundation ? [{
        id: "foundation",
        type: "foundation",
        ...topicFoundation,
      }] : []),
      {
        id: "phrases",
        type: "vocabulary",
        kicker: "Kollokationen & Register",
        title: "Präzise Sprache für heute",
        items: vocabularyItems,
        instruction: "Nutze Kollokationen nicht dekorativ: wähle sie dort, wo sie die Argumentation präziser machen.",
        suggestedMinutes: 6,
      },
      {
        id: "grammar",
        type: "list",
        kicker: "C2-Grammatik",
        title: "Struktur nach Funktion wählen",
        items: grammarItems,
        suggestedMinutes: 10,
      },
      {
        id: "examples",
        type: "list",
        kicker: "Modellsätze",
        title: "Nuance, Evidenz und Register",
        items: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [],
        suggestedMinutes: 6,
      },
      {
        id: "analysis",
        type: "flow",
        kicker: "Analytische Fokusaufgabe",
        title: analyticalTask.title,
        items: [analyticalTask],
        suggestedMinutes: analyticalTask.minutes,
      },
      {
        ...speakingStage,
        title: "Seminargespräch · abwägen und synthetisieren",
        suggestedMinutes: 18,
      },
      {
        id: "writing",
        type: "flow",
        kicker: "Schreiben",
        title: writingBridge.title,
        items: [writingBridge],
        suggestedMinutes: writingBridge.minutes,
      },
      workbookStage,
    ];
  }

  const stages = [
    { id: "intro", type: "intro", kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(), title: slide.title || "Lesson", topic: topicLabel || slide.topic || "", objective: slide.objective || "", duration: slide.estimatedDuration || "", studentReference },
    { id: "warmup", type: "list", kicker: "Warm-up", title: advanced ? "Einstieg" : "Warm-up", items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [], questionSupport: buildWarmupQuestionSupport(slide), suggestedMinutes: warmupSuggestedMinutes(slide), timingMode: PER_STUDENT_WARMUP_LEVELS.has(level) ? "per-student" : "", timingLabel: warmupTimingLabel(slide, slide.warmupQuestionsDe?.length) },
    ...(topicFoundation ? [{ id: "foundation", type: "foundation", ...topicFoundation }] : []),
    {
      id: "phrases",
      type: vocabularyStage ? "vocabulary" : "list",
      kicker: vocabularyStage ? "Wortschatz" : "Redemittel",
      title: vocabularyStage ? "Wortschatz für heute" : (advanced ? "Redemittel" : "Key phrases"),
      items: vocabularyStage ? vocabularyItems : phraseItems,
      instruction: vocabularyStage ? vocabularyInstruction(level) : "",
      suggestedMinutes: vocabularyStage ? 5 : 0,
    },
    { id: "grammar", type: "list", kicker: "Grammatik", title: advanced ? "Neue Strukturen" : "Grammar focus", items: grammarItems, suggestedMinutes: interactionMinutes(slide, 1) || 10 },
    { id: "examples", type: "list", kicker: "Beispiele", title: advanced ? "Modellsätze" : "Model examples", items: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [], suggestedMinutes: interactionMinutes(slide, 2) || 8 },
    { id: "practice", type: "flow", kicker: "Übung", title: advanced ? "Geführte Übung" : "Guided practice", items: practiceItems },
    workbookStage,
    { id: "mistakes", type: "list", kicker: "Achtung", title: advanced ? "Typische Fehler" : "Common mistakes", items: mistakeItems },
    speakingStage,
    ...(!["A2", "B1", "B2", "C1", "C2"].includes(level) ? [{ id: "wrapup", type: "task", kicker: "Abschluss", title: advanced ? "Abschlussaufgabe" : "Wrap-up task", body: slide.wrapUpTaskDe || "", suggestedMinutes: 5 }] : []),
  ];
  if (Array.isArray(slide.grammarCheckQuestions) && slide.grammarCheckQuestions.length) {
    stages.push({
      id: "grammar-check",
      type: "question-reveal",
      kicker: "Grammatik-Check",
      title: slide.grammarCheckTitle || "Korrigiere den Satz",
      items: slide.grammarCheckQuestions,
      questionModels: Array.isArray(slide.grammarCheckModels) ? slide.grammarCheckModels : [],
      requiresQuestionModel: true,
      suggestedMinutes: Number(slide.grammarCheckMinutes || 10),
    });
  }
  const advancedWeeklyChallenge = buildAdvancedWeeklyChallenge(slide);
  if (advancedWeeklyChallenge) stages.push(advancedWeeklyChallenge);
  return stages;
}

export function getSpeakingQuestionModel(stage = {}, question = "") { return stage.questionModels?.find((item) => item.questionDe === question) || null; }
export function buildTeachingPresenterStages(slide = {}, topicLabel = "") {
  const presenterV2 = isTeachingPresenterV2Slide(slide);
  const stages = presenterV2 ? buildPresenterV2Stages(slide, topicLabel) : buildClassicStages(slide, topicLabel);
  const filtered = stages.filter((stage) => {
    if (stage.type === "intro") return Boolean(stage.title || stage.topic || stage.objective);
    if (stage.type === "task") return Boolean(stage.body);
    if (stage.type === "foundation") return Boolean(stage.intro || stage.example || stage.tension || stage.question || stage.simpleEnglish);
    if (stage.type === "knowledge") return Boolean(stage.textDe) && Array.isArray(stage.items) && stage.items.length > 0;
    return Array.isArray(stage.items) && stage.items.length > 0;
  });
  if (presenterV2) {
    const nextSteps = buildCourseBookBridgeItems(slide);
    const studentReference = getCurriculumParityReference(slide);
    const summaryItems = buildLessonSummaryItems(slide);
    if (summaryItems.length) {
      filtered.push({
        id: "lesson-summary",
        type: "summary",
        kicker: "Abschluss",
        title: "Lesson summary",
        subtitle: "You should now be able to…",
        items: summaryItems,
        nextSteps,
        studentReference,
      });
    }
  }
  return filtered;
}
export function clampPresenterIndex(index, stageCount) { const lastIndex = Math.max(0, Number(stageCount || 0) - 1); return Math.min(lastIndex, Math.max(0, Number(index || 0))); }
