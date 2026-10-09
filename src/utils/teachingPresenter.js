import { buildTeacherSlideSupport } from "../data/teacherSlideSupport.js";
import { B1_DAY18_CAREER_CHALLENGES } from "../data/b1Day18CareerChallenge.js";
import { getB1TeacherChallenge } from "../data/b1TeacherChallenges.js";
import { getA2TeacherChallenge } from "../data/a2TeacherChallenges.js";
import { getA2WarmupFollowUp } from "../data/a2WarmupFollowUps.js";
import { getA2VocabularyQuestion } from "../data/a2VocabularyQuestions.js";
import { getB1WarmupFollowUp } from "../data/b1WarmupFollowUps.js";
import { getB1VocabularyQuestion } from "../data/b1VocabularyQuestions.js";
import { getA2B1KnowledgeAnswers } from "../data/a2B1KnowledgeAnswers.js";
import { getA2FocusedPractice, getA2PresenterKnowledge } from "../data/a2PresenterKnowledge.js";
import { getB1FocusedPractice, getB1PresenterKnowledge } from "../data/b1PresenterKnowledge.js";
import { getPresenterTopicFoundation } from "../data/presenterTopicFoundations.js";
import { getSpeakingDifficultySelection } from "../data/presenterSpeakingDifficulty.js";
import { buildA2B1SpeakingCoaching } from "../data/a2B1SpeakingCoaching.js";
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
    followUpDe: level === "A2" ? getA2WarmupFollowUp(slide.assignmentId, question) : level === "B1" ? getB1WarmupFollowUp(slide.assignmentId, question) : (["B2", "C1", "C2"].includes(level) ? advancedWarmupFollowUpDe(question, level) : warmupFollowUpDe(question)),
    difficulty: warmupDifficulty(index, questions.length),
  }));
}

function warmupPresentationMinutes(slide = {}) {
  const level = classroomLevel(slide);
  if (["A2", "B1"].includes(level)) return 5;
  return PER_STUDENT_WARMUP_LEVELS.has(level) ? 5 : (interactionMinutes(slide, 0) || 5);
}
function warmupSuggestedMinutes(slide = {}) { return warmupPresentationMinutes(slide); }
function warmupTimingLabel(slide = {}, questionCount = 0) {
  if (!PER_STUDENT_WARMUP_LEVELS.has(classroomLevel(slide))) return "";
  const count = Number(questionCount || 0);
  const level = classroomLevel(slide);
  if (["A2", "B1"].includes(level)) {
    return `Teacher-paced${count ? ` · ${count} warm-up question${count === 1 ? "" : "s"}` : ""} · use Activity timer`;
  }
  const minutes = warmupPresentationMinutes(slide);
  return `${minutes} min per student${count ? ` · ${count} warm-up question${count === 1 ? "" : "s"}` : ""}`;
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
function buildAdvancedGrammarItems(slide = {}, support = {}) { if (classroomLevel(slide) === "C2" && Array.isArray(slide.grammarTeachDe) && slide.grammarTeachDe.length) return slide.grammarTeachDe; const source = Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : []; if (["B2", "C1"].includes(classroomLevel(slide)) && source.length) return source; return [...new Set(source.flatMap(advancedGrammarItemsDe))]; }
function buildAdvancedMistakes(slide = {}) { if (classroomLevel(slide) === "C1") return ["Komplexe Strukturen nur verwenden, wenn Wortstellung und Bezug eindeutig bleiben.", "Abstrakte Aussagen immer mit Beispiel, Folge oder betroffener Gruppe konkretisieren.", "Ein Gegenargument nicht nur nennen, sondern anschließend darauf reagieren."]; return ["Nicht nur Ideen aufzählen: Aussage → Grund → Beispiel.", "Bei Nebensätzen auf die Verbendstellung achten.", "Nicht denselben Konnektor ständig wiederholen; die neue Zielstruktur bewusst variieren."]; }
function teacherNoteFromFlow(flow = [], index = 0, fallback = "") { return String(flow[index]?.detailEn || fallback).trim(); }

const VOCABULARY_STAGE_LEVELS = new Set(["A2", "B1", "B2", "C1", "C2"]);
const VOCABULARY_LIMITS = Object.freeze({ A2: 7, B1: 9, B2: 6, C1: 6, C2: 6 });

function vocabularyInstruction(level = "") {
  if (level === "B2") return "Verwende mindestens zwei Ausdrücke in einer begründeten Antwort und verbinde sie mit einem konkreten Beispiel.";
  if (level === "C1") return "Verwende mindestens drei Ausdrücke präzise und achte auf Register, Kollokation und logische Verknüpfung.";
  if (level === "C2") return "Verwende mindestens drei Ausdrücke idiomatisch und präzise; baue sie nur dort ein, wo sie Argumentation und Register tatsächlich verbessern.";
  return "Verwende mindestens zwei Wörter oder Ausdrücke in eigenen Sätzen.";
}


const VOCABULARY_CLOZE_RULES = [
  { pattern: /\bTermine?n?\b/i, clue: "Verabredungen oder feste Zeiten" },
  { pattern: /\bplan(?:en|t|e|st)?\b/i, clue: "organisieren oder vorbereiten" },
  { pattern: /\bVerfügbarkeit\b/i, clue: "freie Zeit oder Möglichkeit" },
  { pattern: /\bPflicht\b/i, clue: "etwas, das man machen muss" },
  { pattern: /\bverplan(?:en|t|e|st)?\b/i, clue: "die Zeit komplett im Voraus einteilen" },
  { pattern: /\bflexibel\b/i, clue: "anpassungsfähig" },
  { pattern: /\bsinnvoll\b/i, clue: "vernünftig oder nützlich" },
  { pattern: /\bwichtig\b/i, clue: "bedeutend" },
  { pattern: /\bschwierig\b/i, clue: "nicht einfach" },
  { pattern: /\bMöglichkeit(?:en)?\b/i, clue: "Option oder Chance" },
  { pattern: /\bVorteil(?:e)?\b/i, clue: "positive Seite" },
  { pattern: /\bNachteil(?:e)?\b/i, clue: "negative Seite" },
  { pattern: /\bProblem(?:e)?\b/i, clue: "Schwierigkeit" },
  { pattern: /\bLösung(?:en)?\b/i, clue: "Antwort auf ein Problem" },
  { pattern: /\bverbesser(?:n|t|e|st)?\b/i, clue: "besser machen" },
  { pattern: /\breduzier(?:en|t|e|st)?\b/i, clue: "verringern" },
  { pattern: /\berhöh(?:en|t|e|st)?\b/i, clue: "steigern" },
  { pattern: /\bschütz(?:en|t|e|st)?\b/i, clue: "bewahren" },
  { pattern: /\bvermeid(?:en|et|e|est)?\b/i, clue: "verhindern oder nicht tun" },
  { pattern: /\bunterstütz(?:en|t|e|st)?\b/i, clue: "helfen oder fördern" },
  { pattern: /\bVerantwortung\b/i, clue: "Zuständigkeit oder Pflicht" },
  { pattern: /\bnachhaltig(?:e|en|er|es)?\b/i, clue: "langfristig umweltfreundlich" },
  { pattern: /\beffizient(?:e|en|er|es)?\b/i, clue: "wirksam mit wenig Aufwand" },
  { pattern: /\bwirksam(?:e|en|er|es)?\b/i, clue: "effektiv" },
  { pattern: /\bbeurteil(?:en|t|e|st)?\b/i, clue: "bewerten" },
  { pattern: /\bbewert(?:en|et|e|est)?\b/i, clue: "einschätzen oder beurteilen" },
  { pattern: /\bberücksichtig(?:en|t|e|st)?\b/i, clue: "beachten" },
  { pattern: /\bermöglich(?:en|t|e|st)?\b/i, clue: "möglich machen" },
  { pattern: /\berforderlich\b/i, clue: "notwendig" },
  { pattern: /\bausreichend\b/i, clue: "genug" },
  { pattern: /\bwesentlich\b/i, clue: "zentral oder sehr wichtig" },
  { pattern: /\berheblich\b/i, clue: "deutlich oder beträchtlich" },
  { pattern: /\bzunehmend\b/i, clue: "immer mehr" },
  { pattern: /\blangfristig\b/i, clue: "auf lange Sicht" },
  { pattern: /\bkurzfristig\b/i, clue: "für kurze Zeit" },
  { pattern: /\bgrundsätzlich\b/i, clue: "im Prinzip" },
  { pattern: /\bbedingt\b/i, clue: "nur teilweise oder unter Bedingungen" },
  { pattern: /\bkritisch\b/i, clue: "skeptisch oder problematisch" },
  { pattern: /\bdennoch\b/i, clue: "trotzdem" },
  { pattern: /\bhingegen\b/i, clue: "dagegen oder im Gegensatz dazu" },
  { pattern: /\bvermutlich\b/i, clue: "wahrscheinlich" },
  { pattern: /\bfolglich\b/i, clue: "deshalb" },
  { pattern: /\bsofern\b/i, clue: "wenn oder vorausgesetzt, dass" },
  { pattern: /\bKernaussage(?:n)?\b/i, clue: "wichtigste Aussage" },
  { pattern: /\bSpannung(?:en)?\b/i, clue: "Konflikt oder Gegensatz" },
  { pattern: /\bRessourcenschonung\b/i, clue: "sparsamer Umgang mit Rohstoffen" },
  { pattern: /\bReparierbarkeit\b/i, clue: "Möglichkeit, etwas zu reparieren" },
  { pattern: /\bWiederverwendung\b/i, clue: "noch einmal benutzen" },
  { pattern: /\bWegwerfmentalität\b/i, clue: "Dinge schnell wegwerfen statt lange nutzen" },
  { pattern: /\bSuffizienz\b/i, clue: "mit weniger Ressourcen auskommen" },
  { pattern: /\bRohstoffverbrauch\b/i, clue: "Nutzung von natürlichen Materialien" },
  { pattern: /\bAnreiz(?:e)?\b/i, clue: "Motivation oder Vorteil, der zu etwas bewegt" },
  { pattern: /\bLanglebigkeit\b/i, clue: "lange Nutzungsdauer" },
  { pattern: /\bpräzise\b/i, clue: "genau" },
  { pattern: /\bdifferenziert(?:e|en|er|es)?\b/i, clue: "mit mehreren Seiten genau betrachtet" },
  { pattern: /\bplausibel\b/i, clue: "nachvollziehbar oder glaubwürdig" },
  { pattern: /\bEvidenz\b/i, clue: "Belege oder Nachweise" },
  { pattern: /\bAnnahme(?:n)?\b/i, clue: "Voraussetzung, die man zunächst für wahr hält" },
  { pattern: /\brelativier(?:en|t|e|st)?\b/i, clue: "einschränken oder weniger absolut machen" },
  { pattern: /\bkontraproduktiv\b/i, clue: "mit einer Wirkung entgegen dem eigentlichen Ziel" },
  { pattern: /\bAbwägung(?:en)?\b/i, clue: "Vergleich von Vor- und Nachteilen" },
  { pattern: /\bZusammenhang(?:e|änge)?\b/i, clue: "Verbindung oder Beziehung" },
  { pattern: /\bAuswirkung(?:en)?\b/i, clue: "Folgen" },
  { pattern: /\bMaßnahme(?:n)?\b/i, clue: "konkrete Handlung zur Lösung eines Problems" },
];

function buildVocabularyGapItems(items = [], level = "", assignmentId = "") {
  const sourceItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      term: String(item?.term || "").trim(),
      example: String(item?.example || "").trim(),
    }))
    .filter((item) => item.term);

  const uniqueTerms = [...new Set(sourceItems.map((item) => item.term))];
  if (uniqueTerms.length < 3) return [];

  const challenges = [];
  for (const item of sourceItems) {
    const selectedRule = VOCABULARY_CLOZE_RULES.find((rule) => rule.pattern.test(item.term));
    const termMatch = selectedRule ? item.term.match(selectedRule.pattern) : null;
    const exampleMatch = selectedRule && item.example ? item.example.match(selectedRule.pattern) : null;

    let sentence = "";
    let mode = "match";
    const normalizedLevel = String(level || "").toUpperCase();
    const isA2 = normalizedLevel === "A2";
    const isB1 = normalizedLevel === "B1";

    if (isA2) {
      sentence = getA2VocabularyQuestion(assignmentId, item.term);
      if (!sentence) continue; // Do not show generic or mismatched question text.
      mode = "situation";
    } else if (isB1) {
      sentence = getB1VocabularyQuestion(assignmentId, item.term);
      if (!sentence) continue; // No generic fallback for B1; exact lesson phrase only.
      mode = "situation";
    } else if (normalizedLevel === "C2" && item.example && item.example.toLocaleLowerCase("de-DE").includes(item.term.toLocaleLowerCase("de-DE"))) {
      const start = item.example.toLocaleLowerCase("de-DE").indexOf(item.term.toLocaleLowerCase("de-DE"));
      sentence = item.example.slice(0, start) + "______" + item.example.slice(start + item.term.length);
      mode = "precision-cloze";
    } else if (exampleMatch?.[0]) {
      sentence = item.example.replace(exampleMatch[0], "______");
      mode = "cloze";
    } else if (item.example) {
      sentence = item.example;
      mode = "match";
    } else if (termMatch?.[0] && item.term !== termMatch[0]) {
      sentence = item.term.replace(termMatch[0], "______");
      mode = "cloze";
    } else {
      continue;
    }

    const distractors = uniqueTerms.filter((term) => term !== item.term).slice(0, 2);
    if (distractors.length < 2) continue;

    const baseOptions = [item.term, ...distractors];
    const rotation = challenges.length % 3;
    const options = [...baseOptions.slice(rotation), ...baseOptions.slice(0, rotation)];

    challenges.push({
      sentence,
      promptLabel: isA2 || isB1 ? "Sprechsituation" : "",
      answer: item.term,
      options,
      term: item.term,
      mode,
      modelExample: (isA2 || isB1) && item.example ? item.example : "",
      followUp: isA2
        ? "Antworte jetzt laut auf die Frage und benutze die passende Formulierung."
        : (isB1 ? "Antworte auf die Frage mit dem passenden Redemittel und begründe danach kurz deine Formulierung." : ""),
    });

    if (challenges.length >= 4) break;
  }

  return challenges;
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

  return phrases.map((rawTerm, index) => {
    const c2Parts = level === "C2" ? rawTerm.split(/\s+—\s+/, 2) : [rawTerm];
    const term = String(c2Parts[0] || rawTerm).trim();
    const embeddedExample = String(c2Parts[1] || "").trim();
    const comparableTerm = term.toLocaleLowerCase("de-DE");
    const preferredExample = examples.find((example) => {
      if (usedExamples.has(example) || example.toLocaleLowerCase("de-DE") === comparableTerm) return false;
      const keywords = comparableTerm
        .replace(/[.…?!,:;()/"']/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 5);
      return keywords.some((word) => example.toLocaleLowerCase("de-DE").includes(word));
    });
    const example = embeddedExample || preferredExample || "";

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
  const level = classroomLevel(slide);
  if (level === "C2") {
    const grammarFocus = String(slide.grammarTeachDe?.[0] || "")
      .replace(/^Zielstruktur:\s*/i, "")
      .replace(/\.$/, "")
      .trim();
    const skillTarget = String(slide.skillTarget || grammarFocus || "die heutige C2-Zielstruktur kontrolliert einsetzen").trim();
    const analysisTitle = String(slide.analyticalTask?.title || "die heutige Fallanalyse").trim();
    const transferDetail = String(slide.writeType || "").toLowerCase() === "reformulation"
      ? "Du kannst die heutige Umformung vorbereiten, ohne Bedeutung, Evidenzgrad oder Register zu verändern."
      : "Du kannst eine Position mit zwei tragenden Argumenten und einem relevanten Einwand für den Write-Bereich vorbereiten.";
    return [
      { label: "Sprache", detail: `Du kannst ${skillTarget.charAt(0).toLowerCase()}${skillTarget.slice(1)}` },
      { label: "Analyse", detail: `Du kannst die Entscheidung aus „${analysisTitle}“ mit klaren Kriterien, Grenzen oder Evidenz begründen.` },
      { label: "Transfer", detail: transferDetail },
    ];
  }

  const support = buildTeacherSlideSupport(slide);
  const grammar = (Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : [])
    .map((item) => String(item || "").trim())
    .find(Boolean);
  const speakingQuestions = Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [];
  const isA2B1 = level === "A2" || level === "B1";
  const items = [
    { label: "Main goal", detail: lessonSummaryObjective(slide) },
  ];

  if (isA2B1) {
    // Turn the closing slide into an actual check of this day's taught language,
    // not another generic "You can talk about..." summary. Keep one page.
    const keyPhrases = [...new Set((slide.keyPhrasesDe || [])
      .map((phrase) => String(phrase || "").trim())
      .filter(Boolean))];
    if (keyPhrases.length) {
      items.push({
        label: "Redemittel",
        detail: `Wende zwei Formulierungen aus der heutigen Stunde passend an: „${keyPhrases[0]}“${keyPhrases[1] ? ` und „${keyPhrases[1]}“` : ""}.`,
      });
    } else if (grammar) {
      items.push({ label: "Grammatik", detail: `Überprüfe die Zielstruktur anhand des heutigen Beispiels: ${grammar}` });
    }
    const speaking = speakingQuestions[speakingQuestions.length - 1];
    if (speaking) {
      items.push({
        label: "Sprechprobe",
        detail: `Antworte ohne Hilfestellung auf die konkrete Abschlussfrage: „${String(speaking).trim()}“`,
      });
    }
  } else {
    if (grammar) items.push({ label: "Language", detail: `You can use today’s target grammar accurately: ${grammar}` });
    if (speakingQuestions.length) {
      items.push({ label: "Speaking", detail: `You can talk about “${cleanTopic(slide)}”, answer lesson questions and add useful reasons or details.` });
    }
  }
  if (slide.wrapUpTaskDe) {
    items.push({ label: isA2B1 ? "Selbstcheck" : "Self-check", detail: String(slide.wrapUpTaskDe).trim() });
  }

  return items.slice(0, 4);
}

function buildAdvancedWeeklyChallenge() { return null; }

function buildClassicStages(slide = {}, topicLabel = "") { const studentReference = getCurriculumParityReference(slide); return [
  { id: "intro", type: "intro", kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(), title: slide.title || "Lesson", topic: topicLabel || slide.topic || "", objective: slide.objective || "", duration: slide.estimatedDuration || "", studentReference },
  { id: "warmup", type: "list", kicker: "Warm-up", title: "Warm-up", items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [], suggestedMinutes: warmupSuggestedMinutes(slide), timingMode: PER_STUDENT_WARMUP_LEVELS.has(classroomLevel(slide)) ? "per-student" : "", timingLabel: warmupTimingLabel(slide, slide.warmupQuestionsDe?.length) },
  { id: "phrases", type: "list", kicker: "Redemittel", title: "Key phrases", items: Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : [] },
  { id: "questions", type: "numbered-list", kicker: "Sprechen", title: "Student questions", items: Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [] },
  { id: "wrapup", type: "task", kicker: "Abschluss", title: "Wrap-up task", body: slide.wrapUpTaskDe || "" },
]; }

function buildC2GrammarApplication(slide = {}, grammarItems = [], modelItems = []) {
  const curated = slide.grammarApplication;
  if (curated?.prompt && curated?.task) {
    return {
      title: curated.title || "Jetzt anwenden",
      instruction: String(curated.instruction || "Nutze die Zielstruktur, um ein konkretes sprachliches Problem zu lösen."),
      prompt: String(curated.prompt),
      task: String(curated.task),
      answer: String(curated.answer || ""),
      teacherHint: String(curated.teacherHint || ""),
    };
  }

  const focus = String(grammarItems[0] || "").replace(/^Zielstruktur:\s*/i, "").replace(/\.$/, "").trim();
  const rules = grammarItems.slice(1);
  const models = Array.isArray(modelItems) ? modelItems.filter(Boolean) : [];
  const text = [focus, ...rules].join(" ");
  const reformulationPrep = slide.reformulationPrep || null;

  if (/Nominalstil|Verbalstil/i.test(text)) {
    const verbal = rules.find((item) => /^Verbal:/i.test(String(item))) || "Verbal: Forschende prüfen die Ergebnisse erneut.";
    const nominal = rules.find((item) => /^Nominal:/i.test(String(item))) || models.find((item) => /Überprüfung/i.test(String(item))) || "";
    return {
      title: "Jetzt anwenden",
      instruction: "Der Student macht aus dem Verbalstil einen passenden Nominalstil und erklärt danach den Unterschied.",
      prompt: verbal.replace(/^Verbal:\s*/i, ""),
      task: "Formuliere diesen Satz im Nominalstil. Danach: Wann ist der Verbalstil besser?",
      answer: nominal.replace(/^Nominal:\s*/i, ""),
      teacherHint: "Erwartung: Nominalstil verdichtet den Prozess; Verbalstil ist besser, wenn Akteur und Handlung sichtbar bleiben sollen.",
    };
  }

  if (/Thema|Rhema|Vorfeld/i.test(text)) {
    const source = rules.find((item) => /^Neutral:/i.test(String(item))) || rules[1] || "";
    const target = rules.find((item) => /^Fokus:/i.test(String(item))) || models[0] || "";
    return {
      title: "Jetzt anwenden",
      instruction: "Der Student verändert nur den Informationsfokus, nicht die Grundbedeutung.",
      prompt: source.replace(/^Neutral:\s*/i, ""),
      task: "Formuliere den Satz so um, dass die wichtigste Information im Vordergrund steht. Erkläre kurz, was jetzt fokussiert wird.",
      answer: target.replace(/^Fokus:\s*/i, ""),
      teacherHint: "Nicht komplizierter machen. Entscheidend ist, welche Information zuerst bzw. besonders hervorgehoben wird.",
    };
  }

  if (/Konjunktiv|indirekte Rede/i.test(text)) {
    return {
      title: "Jetzt anwenden",
      instruction: "Markiere eine fremde Aussage sprachlich als fremd, statt sie als eigene Tatsache zu übernehmen.",
      prompt: String(reformulationPrep?.source || "Die Quelle sagt: „Die Ergebnisse sind eindeutig.“"),
      task: "Formuliere den Ausgangssatz als indirekte Rede. Sage danach kurz, warum diese Form hier sinnvoll ist.",
      answer: models[0] || rules[1] || "",
      teacherHint: "Erwartung: Quelle und eigene Position bleiben getrennt; der Evidenzstatus wird nicht künstlich verstärkt.",
    };
  }

  const source = String(reformulationPrep?.source || models[0] || rules[1] || rules[0] || "");
  return {
    title: "Jetzt anwenden",
    instruction: "Der Student benutzt die Zielstruktur aktiv, statt die Regel nur vorzulesen.",
    prompt: source,
    task: `Bilde einen neuen Satz zum heutigen Thema mit der Zielstruktur „${focus || "heutige Struktur"}“. Erkläre anschließend in einem Satz, welche Funktion die Struktur erfüllt.`,
    answer: models[1] || models[0] || "",
    teacherHint: "Bewerte zuerst Funktion und Bedeutung, danach Form. C2 bedeutet nicht: möglichst kompliziert, sondern präzise und kontrolliert.",
  };
}

function buildC2AnalyticalTask(slide = {}) {
  const curated = slide.analyticalTask;
  const prompts = curated?.title && Array.isArray(curated.prompts) && curated.prompts.length
    ? curated.prompts.filter(Boolean).slice(0, 3)
    : (() => {
        const topic = cleanTopic(slide);
        const foundation = getPresenterTopicFoundation(slide) || {};
        return [
          foundation.example ? `Fall: ${foundation.example}` : `Fall: Entwickle ein konkretes Beispiel zu „${topic}“.`,
          foundation.tension ? `Prüfe die Kernspannung: ${foundation.tension}` : "Lege zwei nachvollziehbare Bewertungskriterien fest.",
          foundation.question ? `Beantworte abschließend: ${foundation.question}` : "Formuliere eine begründete Entscheidung mit einer klaren Einschränkung.",
        ];
      })();

  return {
    title: String(curated?.title || "Fallanalyse · Entscheidung begründen"),
    instruction: String(curated?.instruction || "Arbeite am Fall und begründe deine Entscheidung mit Kriterien, Evidenz und einer klaren Grenze."),
    prompts,
    casePrompt: prompts[0] || "",
    checkPrompt: prompts[1] || "",
    decisionPrompt: prompts[2] || "",
    progressiveReveal: true,
    rubric: ["Logik", "Evidenz", "Sprache / Register"],
    modelItems: [],
    minutes: Number(curated?.minutes || 14),
  };
}

function buildC2WritingBridge(slide = {}) {
  const opinion = String(slide.writeType || "").toLowerCase() === "opinion";
  const prompt = String(slide.canonicalWritingPromptDe || slide.wrapUpTaskDe || "").trim();
  if (opinion) {
    return {
      title: "Write-Transfer · Stellungnahme vorbereiten",
      instruction: "Prüfungsnah vorbereiten: noch nicht ausformulieren. Sichere zuerst These, zwei tragende Argumente und einen relevanten Einwand.",
      prompts: [
        `Aufgabe: ${prompt}`,
        "Argumente: Notiere zwei tragende Gründe; jeder Grund braucht einen konkreten Bezug, ein Beispiel oder eine nachvollziehbare Folge.",
        "Einwand: Notiere eine ernst zu nehmende Einschränkung oder Gegenposition und entscheide, wie du darauf reagieren wirst.",
      ],
      minutes: 6,
    };
  }

  const prep = slide.reformulationPrep || {};
  const source = String(prep.source || "").trim();
  const cue = String(prep.cue || "").trim();
  return {
    title: "Write-Transfer · Umformung vorbereiten",
    instruction: "Prüfungsnah vorbereiten: noch nicht vollständig lösen. Sichere zuerst Ausgangssatz, Ziel und Kontrollpunkt.",
    prompts: [
      source ? `Ausgangssatz: ${source}` : "Ausgangssatz: Lies den Satz im Write-Bereich genau.",
      cue ? `Vorgabe: ${cue}.` : "Vorgabe: Nutze die heutige Zielstruktur, ohne die Aussage zu verstärken oder abzuschwächen.",
      "Kontrollpunkt: Bedeutung erhalten. Danach Evidenzgrad, Register, Kasus, Wortstellung und Bezüge prüfen.",
    ],
    minutes: 6,
  };
}

function b2GrammarSupportEn(grammarItems = []) {
  const text = (Array.isArray(grammarItems) ? grammarItems : []).join(" ");
  if (/indem|dadurch, dass|um \.\.\. zu|damit|wodurch|sodass/i.test(text)) return "Distinguish method, purpose and consequence. Choose the connector that matches the logical relationship, then check verb position.";
  if (/Passiv|Modalpassiv/i.test(text)) return "Use passive when the process or requirement matters more than the actor. Keep the modal verb and participle structure complete.";
  if (/Nominalisierung/i.test(text)) return "Nominalisation can make formal B2 arguments more compact, but the meaning and actor should remain clear.";
  if (/je \.\.\. desto/i.test(text)) return "Use je … desto to connect two changing factors. The je-clause is subordinate; the desto-clause keeps normal main-clause verb position.";
  if (/obwohl|trotz|zwar \.\.\. jedoch|dennoch/i.test(text)) return "Use concession to acknowledge a counterpoint without abandoning your main argument. Check whether you need a clause or a noun phrase.";
  if (/Relativsätze/i.test(text)) return "Relative clauses add precise information. With a preposition, place the preposition before the relative pronoun and use the required case.";
  if (/Konjunktiv II/i.test(text)) return "Use Konjunktiv II for hypothetical proposals, cautious recommendations and unreal conditions, not just to sound more formal.";
  if (/laut|zufolge|nach Angaben|indirekte Rede/i.test(text)) return "Separate source information from your own position. Mark who says what before you evaluate the claim.";
  if (/während|wohingegen/i.test(text)) return "Use contrast connectors when two sides are genuinely being compared. Make the comparison criterion clear.";
  if (/falls|sofern/i.test(text)) return "Use falls/sofern for conditions. The condition should state what must be true before the result or recommendation follows.";
  return "Use the target structure to make cause, contrast, condition, purpose or consequence clearer. Accuracy matters more than complexity.";
}

function b2GrammarAttentionEn(grammarItems = []) {
  const text = (Array.isArray(grammarItems) ? grammarItems : []).join(" ");
  if (/Relativsätze/i.test(text)) return "Watch the case after the preposition in relative clauses.";
  if (/Passiv|Modalpassiv/i.test(text)) return "Do not use passive automatically when the actor is important for responsibility.";
  if (/je \.\.\. desto/i.test(text)) return "Keep both halves complete; do not mix je … desto with a normal comparative sentence.";
  if (/obwohl|trotz|zwar \.\.\. jedoch/i.test(text)) return "Do not combine connectors mechanically; choose one structure and keep its word order correct.";
  return "Check connector meaning and verb position before adding another advanced structure.";
}

function buildB2FocusedTask(slide = {}, foundation = null) {
  const day = Math.max(1, Number(slide.dayNumber || String(slide.day || "").match(/\d+/)?.[0] || 1));
  const topic = cleanTopic(slide);
  const foundationData = foundation || getPresenterTopicFoundation(slide) || {};
  const tension = String(foundationData.tension || "");
  const question = String(foundationData.question || slide.studentQuestionsDe?.[4] || `Welche Position vertrittst du zu „${topic}“?`);
  const intro = String(foundationData.intro || "");
  const example = String(foundationData.example || "");
  const grammar = Array.isArray(slide.teacherSupport?.grammarFocusEn)
    ? slide.teacherSupport.grammarFocusEn.filter(Boolean)
    : [];
  const [left, right] = tension.split("↔").map((part) => part.trim());
  const modelItems = (Array.isArray(slide.speakingModels) ? slide.speakingModels : [])
    .map((item) => item?.modelAnswerDe)
    .filter(Boolean)
    .slice(0, 2);
  const mechanic = ((day - 1) % 8) + 1;

  const variants = {
    1: {
      title: "Kriterienvergleich",
      instruction: "Vergleiche zwei Möglichkeiten nach denselben Kriterien und entscheide erst danach.",
      prompts: [
        `Seite A: ${left || "erste Möglichkeit"}`,
        `Seite B: ${right || "zweite Möglichkeit"}`,
        "Lege zwei Kriterien fest, z. B. Kosten, Wirkung, Zugang oder Umsetzbarkeit.",
        "Formuliere am Ende eine begründete Entscheidung mit einer Einschränkung.",
      ],
    },
    2: {
      title: "Problem → Ursache → Lösung",
      instruction: "Ordne das Thema als Problemkette und schlage eine realistische Lösung vor.",
      prompts: [
        `Ausgangslage: ${intro}`,
        "Was ist das konkrete Problem?",
        "Welche Ursache ist besonders wichtig?",
        `Welche Lösung wäre realistisch? Beziehe die Leitfrage ein: ${question}`,
      ],
    },
    3: {
      title: "Zwei Positionen vergleichen",
      instruction: "Formuliere zwei plausible Positionen und vergleiche ihre stärksten Argumente.",
      prompts: [
        `Position A: ${left || "stärker individuelle Verantwortung"}`,
        `Position B: ${right || "stärker gesellschaftliche Verantwortung"}`,
        "Welches Argument ist auf jeder Seite am stärksten?",
        "Wo liegt ein sinnvoller Kompromiss oder eine klare Grenze?",
      ],
    },
    4: {
      title: "Informationslücke",
      instruction: "Arbeitet mit zwei Rollen. Zeige immer nur eine Rollenkarte. Die andere Person schaut weg, bis ihre Karte geöffnet wird.",
      roleCards: [
        {
          id: "A",
          title: "Rolle A · nur für Person A",
          content: `Du kennst das Problem: ${intro}`,
          task: "Frage Person B nach einem konkreten Beispiel und anschließend nach einer praktikablen Maßnahme.",
        },
        {
          id: "B",
          title: "Rolle B · nur für Person B",
          content: `Du kennst ein konkretes Beispiel: ${example || "Nutze ein eigenes konkretes Beispiel zum Thema."}`,
          task: "Frage Person A nach dem Hauptproblem und nenne anschließend einen möglichen Nachteil der vorgeschlagenen Maßnahme.",
        },
      ],
      prompts: [
        "Beginnt mit einer Frage und lest die Rollenkarte nicht laut vor.",
        "Tauscht die fehlenden Informationen nur durch Fragen aus.",
        "Prüft gemeinsam, welche Maßnahme praktikabel ist und welcher mögliche Nachteil berücksichtigt werden muss.",
        "Einigt euch danach auf eine Lösung und begründet sie gemeinsam.",
      ],
    },
    5: {
      title: "Empfehlung mit Bedingungen",
      instruction: "Formuliere eine Empfehlung, aber nenne klar, unter welchen Bedingungen sie sinnvoll ist.",
      prompts: [
        `Leitfrage: ${question}`,
        `Zielkonflikt: ${tension || "Nutzen ↔ Aufwand"}`,
        "Formuliere eine Hauptempfehlung.",
        "Ergänze mindestens eine Bedingung mit falls, sofern oder wenn.",
      ],
    },
    6: {
      title: "Aussage reparieren",
      instruction: "Mache eine zu allgemeine Aussage präziser, differenzierter und grammatisch stärker.",
      prompts: [
        `Schwache Aussage: „Bei ${topic} gibt es viele Vorteile und Nachteile.“`,
        "Ersetze die allgemeine Formulierung durch einen konkreten Vorteil und einen konkreten Nachteil.",
        grammar[0] ? `Nutze diese Zielstruktur: ${grammar[0]}` : "Nutze eine passende B2-Struktur.",
        "Ergänze ein Beispiel oder eine Bedingung.",
      ],
    },
    7: {
      title: "Mini-Fallstudie",
      instruction: "Analysiere einen konkreten Fall und leite daraus eine begründete Maßnahme ab.",
      prompts: [
        `Fall: ${example || intro}`,
        "Wer ist direkt betroffen?",
        "Welcher Zielkonflikt oder welches praktische Problem entsteht?",
        `Welche Maßnahme würdest du empfehlen? ${question}`,
      ],
    },
    8: {
      title: "Diskussionsreaktion",
      instruction: "Reagiere auf eine Position, bevor du deine eigene weiterentwickelst.",
      prompts: [
        `Aussage: ${question}`,
        "Beginne mit Zustimmung, Einschränkung oder Widerspruch.",
        "Nenne einen Grund und ein konkretes Beispiel.",
        "Schließe mit einer realistischen Alternative oder Konsequenz.",
      ],
    },
  };

  const selected = variants[mechanic];
  return {
    ...selected,
    prompts: Array.isArray(selected.prompts) ? selected.prompts.slice(0, 3) : [],
    modelItems,
    minutes: 11,
  };
}

function c1GrammarSupportEn(grammarTitle = "") {
  const title = String(grammarTitle || "");
  if (/Relativsätze mit Präposition/i.test(title)) return "Keep the preposition before the relative pronoun and use the case required by that preposition.";
  if (/Partizip I und Partizip II|Partizipialattribute/i.test(title)) return "Participial attributes behave like adjectives: keep the reference clear and give the participle the correct adjective ending.";
  if (/Konjunktiv I|indirekte Rede/i.test(title)) return "Use Konjunktiv I to report someone else's statement with distance; it does not make the statement true.";
  if (/konditionale|Voraussetzung/i.test(title)) return "Separate condition from purpose: falls/sofern/vorausgesetzt, dass express a condition; damit/um ... zu express purpose.";
  if (/kausale|konsekutive|Ursache|Folge/i.test(title)) return "Make the logical relation explicit: cause, consequence and concession are not interchangeable.";
  if (/konzessive|adversative|Abwägung|Vergleich/i.test(title)) return "Use contrast structures to show the exact relationship between two positions, not just to add another idea.";
  if (/Nominalisierung|Nominalstil|Präpositionalstil/i.test(title)) return "Nominal style can make formal writing denser, but avoid chains of nouns that hide who does what.";
  if (/Passiv|Modalpassiv|Zustandspassiv/i.test(title)) return "Choose passive when the process or result matters more than the actor; name the actor when responsibility is important.";
  if (/Zukunft|Futur|Hypothesen/i.test(title)) return "Distinguish a future plan from a prediction or hypothesis and use modal language to show uncertainty.";
  if (/wissenschaftlich|Quellenbezug|vorsichtige Bewertung/i.test(title)) return "Separate source, evidence, interpretation and your own evaluation; qualify claims that the evidence cannot fully support.";
  if (/Adjektivdeklination/i.test(title)) return "The adjective ending depends on article, case, gender and number; check the whole noun phrase, not the adjective in isolation.";
  if (/formelle Sprache|Register/i.test(title)) return "Match register to purpose and audience; formal language should be precise, not unnecessarily complicated.";
  return "Use the target structure because it makes the logical relationship clearer, not simply because it sounds more advanced.";
}

function buildC1FocusedTask(slide = {}) {
  const meta = slide.canonicalLearnerLesson || {};
  const day = Math.max(1, Number(meta.day || slide.dayNumber || 1));
  const title = String(meta.title || cleanTopic(slide));
  const question = String(meta.coreQuestion || slide.studentQuestionsDe?.[4] || `Welche Position vertrittst du zu „${title}“?`);
  const tension = String(meta.tension || "");
  const angles = Array.isArray(meta.angles) ? meta.angles.filter(Boolean) : [];
  const points = Array.isArray(meta.points) ? meta.points.filter(Boolean) : [];
  const intro = String(meta.foundationIntro || "");
  const example = String(meta.foundationExample || "");
  const grammarTitle = String(meta.grammarTitle || "");
  const speakingModels = (Array.isArray(slide.speakingModels) ? slide.speakingModels : [])
    .map((item) => item?.modelAnswerDe)
    .filter(Boolean)
    .slice(0, 2);
  const [left, right] = tension.split("↔").map((part) => part.trim());
  const mechanic = ((day - 1) % 8) + 1;

  const variants = {
    1: {
      title: "Position + Begründung",
      instruction: "Formuliere eine klare Position und begründe sie mit einem Kriterium, einem Beispiel und einer Einschränkung.",
      prompts: [
        question,
        angles[0] ? `Berücksichtige: ${angles[0]}` : "Lege ein klares Bewertungskriterium fest.",
        example ? `Nutze oder bewerte dieses Beispiel: ${example}` : "Ergänze ein konkretes Beispiel.",
        `Verwende die Zielgrammatik gezielt: ${grammarTitle}`,
      ],
    },
    2: {
      title: "Perspektiven vergleichen",
      instruction: "Vergleiche zwei Perspektiven nach demselben Kriterium und zeige anschließend, welche unter welcher Bedingung stärker wiegt.",
      prompts: [
        `Perspektive A: ${angles[0] || left || "individuelle Interessen"}`,
        `Perspektive B: ${angles[1] || right || "gesellschaftliche Interessen"}`,
        angles[2] ? `Zusätzlicher Faktor: ${angles[2]}` : "Nenne einen zusätzlichen Faktor.",
        "Nutze mindestens eine präzise adversative oder konzessive Verknüpfung.",
      ],
    },
    3: {
      title: "Paraphrasieren ohne Bedeutungsverlust",
      instruction: "Formuliere die Kernaussage in eigenen Worten. Kürze, aber erhalte Ursache, Einschränkung und zentrale Aussage.",
      prompts: [
        `Ausgangstext: ${intro}`,
        "Schreibe oder sage die Aussage in höchstens zwei Sätzen neu.",
        "Markiere anschließend, welche Information auf keinen Fall verloren gehen durfte.",
        `Baue, wenn sinnvoll, die heutige Zielstruktur ein: ${grammarTitle}`,
      ],
    },
    4: {
      title: "Registerwechsel",
      instruction: "Überführe eine direkte Alltagssaussage in sachliches C1-Deutsch und erkläre zwei sprachliche Änderungen.",
      prompts: [
        `Alltagssatz: „Ich finde, ${title} ist ein wichtiges Thema und man sollte einfach etwas dagegen tun.“`,
        "Formuliere eine neutrale, formelle Version.",
        "Erkläre, wie du Bewertung, Präzision oder Verantwortlichkeit sprachlich verändert hast.",
        meta.mistake ? `Kontrolliere besonders: ${meta.mistake}` : "Kontrolliere Register und Satzbezüge.",
      ],
    },
    5: {
      title: "Kurz zusammenfassen & einordnen",
      instruction: "Fasse die Information knapp zusammen und trenne anschließend Inhalt von deiner eigenen Einordnung.",
      prompts: [
        `Kurzquelle: ${intro} ${example}`,
        "Fasse die Quelle in zwei Sätzen zusammen, ohne sie zu kommentieren.",
        "Ergänze danach genau einen Satz mit deiner Einordnung.",
        "Kennzeichne sprachlich klar, wo Zusammenfassung endet und Bewertung beginnt.",
      ],
    },
    6: {
      title: "Gegenargument ernst nehmen",
      instruction: "Formuliere die stärkste plausible Gegenposition und reagiere darauf, ohne sie abzuwerten oder zu vereinfachen.",
      prompts: [
        points[0] || question,
        `Gegenperspektive: ${angles[1] || right || "Welche Einwände könnte eine andere Gruppe haben?"}`,
        "Antworte zuerst mit einer teilweisen Anerkennung, dann mit deiner begründeten Einschränkung.",
        `Nutze die Zielgrammatik: ${grammarTitle}`,
      ],
    },
    7: {
      title: "Mediation · für ein anderes Publikum",
      instruction: "Vermittle denselben Inhalt für eine Person, die das Thema nicht kennt. Vereinfache die Form, aber nicht die Bedeutung.",
      prompts: [
        `Ausgangsinformation: ${intro}`,
        "Erkläre das Problem in drei klaren Sätzen für einen neuen Kollegen oder Kursteilnehmer.",
        example ? `Baue dieses Beispiel verständlich ein: ${example}` : "Baue ein konkretes Beispiel ein.",
        "Nenne anschließend einen Begriff, den du bewusst vereinfacht oder umformuliert hast.",
      ],
    },
    8: {
      title: "Strukturierte Mini-Debatte",
      instruction: "Führe eine kurze Debatte mit Eröffnung, Gegenposition, Reaktion und Schluss.",
      prompts: [
        `Leitfrage: ${question}`,
        `Seite A: ${left || angles[0] || "erste Perspektive"}`,
        `Seite B: ${right || angles[1] || "zweite Perspektive"}`,
        "Schluss: Formuliere eine Position, die den stärksten Einwand sichtbar berücksichtigt.",
      ],
    },
  };

  const selected = variants[mechanic];
  return {
    ...selected,
    prompts: Array.isArray(selected.prompts) ? selected.prompts.slice(0, 3) : [],
    modelItems: speakingModels,
    minutes: 12,
  };
}

function buildC1WritingBridge(slide = {}) {
  const meta = slide.canonicalLearnerLesson || {};
  const question = String(meta.coreQuestion || slide.studentQuestionsDe?.[4] || cleanTopic(slide));
  return {
    title: "Schreibbrücke · Position vorbereiten",
    instruction: "Plane nur eine klare Position. Den vollständigen Absatz schreibst du anschließend im Write-Bereich.",
    prompts: [
      `Leitfrage: ${question}`,
      "Wähle deine Position und notiere zwei tragende Stichpunkte.",
      "Optional: Welches Gegenargument solltest du später berücksichtigen?",
    ],
    minutes: 6,
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

const KNOWLEDGE_REFERENCE_STOPWORDS = new Set([
  "aber", "alle", "auch", "aus", "bei", "beim", "das", "dass", "dem", "den", "der", "des",
  "die", "drei", "eine", "einen", "einer", "eines", "ein", "für", "hat", "haben", "hier",
  "ist", "kann", "man", "mit", "muss", "nach", "nicht", "oder", "sind", "soll", "text",
  "und", "vom", "von", "warum", "was", "welche", "welcher", "welches", "wenn", "wie", "wird",
  "wo", "zwei", "zum", "zur", "vier", "nenne", "nennt", "laut", "passt", "braucht",
]);

function knowledgeReferenceTokens(value = "") {
  return String(value || "")
    .toLocaleLowerCase("de")
    .replace(/[^a-zäöüß0-9\s-]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4 && !KNOWLEDGE_REFERENCE_STOPWORDS.has(item));
}

function buildKnowledgeReferenceAnswer(question = "", textDe = "") {
  const text = String(textDe || "").trim();
  if (!text) return "Im Wissensimpuls steht keine Referenzantwort.";

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return text;

  const keywords = knowledgeReferenceTokens(question);
  const scored = sentences.map((sentence, index) => {
    const normalized = sentence.toLocaleLowerCase("de");
    const score = keywords.reduce((total, keyword) => {
      if (normalized.includes(keyword)) return total + 3;
      const stem = keyword.slice(0, Math.min(6, keyword.length));
      return stem.length >= 4 && normalized.includes(stem) ? total + 1 : total;
    }, 0);
    return { sentence, index, score };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const best = scored[0];
  const listQuestion = /\b(welche|nenne|nennt|zwei|drei|vier|bereiche|faktoren|informationen|wörter|formen|gründe|maßnahmen|teile|kriterien)\b/i.test(question);
  const selected = new Set([best.index]);

  if (listQuestion) {
    const nextIndex = best.index < sentences.length - 1 ? best.index + 1 : best.index - 1;
    if (nextIndex >= 0) selected.add(nextIndex);
  } else {
    const second = scored[1];
    if (second && second.score > 0 && second.score >= Math.max(2, best.score * 0.65)) selected.add(second.index);
  }

  return [...selected]
    .sort((a, b) => a - b)
    .map((index) => sentences[index])
    .join(" ");
}

function buildKnowledgeAnswerItems(knowledge = {}, assignmentId = "") {
  const curated = getA2B1KnowledgeAnswers(assignmentId);
  const checks = Array.isArray(knowledge.checks) ? knowledge.checks : [];
  if (Array.isArray(curated) && curated.length === checks.length
      && curated.every((answer) => typeof answer === "string" && answer.trim())) {
    return curated;
  }
  // Earlier heuristics remain for any non-curated level; never fabricate a
  // confident answer if A2/B1 source content is unexpectedly missing.
  if (/^(A2|B1)-/.test(String(assignmentId || "").toUpperCase())) {
    return checks.map(() => "Keine geprüfte Musterantwort verfügbar. Bitte den Text gemeinsam prüfen.");
  }

  const explicit = Array.isArray(knowledge.answers) ? knowledge.answers : [];
  return checks.map((question, index) => {
    const curated = String(explicit[index] || "").trim();
    return curated || buildKnowledgeReferenceAnswer(question, knowledge.textDe);
  });
}

function buildA2B1GrammarCheckStage(slide = {}, support = {}, level = "") {
  const curatedItems = Array.isArray(slide.grammarCheckItems)
    ? slide.grammarCheckItems.filter((item) => item?.prompt && item?.answer).slice(0, 3)
    : [];
  if (curatedItems.length === 3) {
    return {
      id: "grammar-check",
      type: "grammar-check",
      kicker: "Grammatik-Check",
      title: "Grammatik im Thema anwenden",
      instruction: "Die Grammatik wurde bereits erklärt. Stelle die Fragen direkt im heutigen Thema. Der Schüler antwortet in 1–2 Sätzen; prüfe die Zielgrammatik in der Antwort, statt nach dem Regelnamen zu fragen.",
      items: curatedItems.map((item, index) => ({
        id: item.id || ["recognise-rule", "fix-error", "build-sentence"][index],
        label: item.label || `${index + 1} · Im Thema anwenden`,
        prompt: item.prompt,
        example: item.example || "",
        answerLabel: item.answerLabel || "Musterantwort",
        answer: item.answer,
        note: item.note || "",
      })),
      suggestedMinutes: level === "B1" ? 7 : 6,
    };
  }

  const rules = Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn.filter(Boolean) : [];
  const models = Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe.filter(Boolean) : [];
  const questions = Array.isArray(slide.studentQuestionsDe)
    ? slide.studentQuestionsDe.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const questionModels = Array.isArray(slide.speakingModels) ? slide.speakingModels : [];

  const preferredIndexes = questions.length <= 3
    ? questions.map((_, index) => index)
    : [0, Math.floor((questions.length - 1) / 2), questions.length - 1];
  const selectedIndexes = [...new Set(preferredIndexes)].slice(0, 3);
  while (selectedIndexes.length < Math.min(3, questions.length)) {
    const nextIndex = selectedIndexes.length;
    if (!selectedIndexes.includes(nextIndex)) selectedIndexes.push(nextIndex);
    else break;
  }

  const fallbackPrompts = [
    `Antworte in 1–2 Sätzen zum heutigen Thema „${cleanTopic(slide)}“.`,
    "Führe die Situation mit einem passenden zweiten Gedanken weiter.",
    "Formuliere eine eigene passende Antwort und benutze die Grammatik der Stunde.",
  ];
  const labels = [
    "1 · Im Thema anwenden",
    "2 · Situation weiterführen",
    "3 · Selbstständig formulieren",
  ];
  const stableIds = ["recognise-rule", "fix-error", "build-sentence"];

  const items = Array.from({ length: 3 }, (_, index) => {
    const questionIndex = selectedIndexes[index];
    const prompt = questionIndex != null ? questions[questionIndex] : fallbackPrompts[index];
    const matchingModel = questionModels.find((item) => (
      String(item?.questionDe || "").trim() === String(prompt || "").trim()
    ));
    // Lesson authors provide studentQuestionsDe and speakingModels in the same
    // order, but occasionally paraphrase a question in speakingModels. Prefer
    // that indexed answer over an unrelated sample grammar sentence.
    const indexedModel = questionModels.length === questions.length
      ? questionModels[questionIndex]?.modelAnswerDe
      : "";
    const modelAnswer = String(matchingModel?.modelAnswerDe || indexedModel || models[questionIndex] || models[index] || models[0] || "").trim();
    const teacherFocus = String(rules[questionIndex] || rules[index] || rules[0] || "").trim();

    return {
      id: stableIds[index],
      label: labels[index],
      prompt,
      answerLabel: "Musterantwort",
      answer: modelAnswer || "Offene Antwort. Prüfe, ob die Zielgrammatik der Stunde korrekt im Kontext benutzt wird.",
      note: teacherFocus ? `Teacher focus: ${teacherFocus}` : "Prüfe nur die Zielgrammatik der heutigen Stunde.",
    };
  });

  return {
    id: "grammar-check",
    type: "grammar-check",
    kicker: "Grammatik-Check",
    title: "Grammatik im Thema anwenden",
    instruction: "Die Grammatik wurde bereits erklärt. Stelle die Fragen direkt im heutigen Thema. Der Schüler antwortet in 1–2 Sätzen; prüfe die Zielgrammatik in der Antwort, statt nach dem Regelnamen zu fragen.",
    items,
    suggestedMinutes: level === "B1" ? 7 : 6,
  };
}

function buildPresenterTeacherPurpose(stage = {}, level = "") {
  const id = String(stage?.id || "");
  const type = String(stage?.type || "");

  if (id === "intro") return {
    student: "Lernziel und Thema verstehen.",
    teacher: "Rahmen setzen; noch keine neue Erklärung beginnen.",
  };
  if (id === "warmup") return {
    student: "Vorwissen aktivieren und kurz antworten.",
    teacher: "Vorbereitung geben, zuhören und nur gezielt korrigieren.",
  };
  if (id === "knowledge") return {
    student: "Kurz lesen und die Verständnisfragen mündlich beantworten.",
    teacher: "Erst antworten lassen; nur kuratierte Antworten als Schlüssel nutzen.",
  };
  if (id === "phrases") return {
    student: "Schlüsselwortschatz erkennen und passend auswählen.",
    teacher: "Wörter zuerst abrufen lassen; Lösung erst danach zeigen.",
  };
  if (id === "grammar-check") return {
    student: "Die bereits gelernte Grammatik in echten Fragen zum heutigen Thema anwenden.",
    teacher: "Nicht neu unterrichten. Frage direkt stellen, Antwort vollständig hören und nur die Zielgrammatik prüfen; dann Correct oder Needs review markieren.",
  };
  if (["practice", "focus", "analysis"].includes(id)) return {
    student: "Eine zentrale Aufgabe konzentriert bearbeiten.",
    teacher: "Denkzeit geben und nur den wichtigsten sprachlichen Punkt korrigieren.",
  };
  if (id === "questions") return {
    student: level === "B2" || level === "C1" || level === "C2"
      ? "Eine Kernfrage vertieft beantworten."
      : "Die Grammatik in einer kurzen Antwort anwenden.",
    teacher: "Antwort zuerst vollständig hören; danach gezielt rückmelden.",
  };
  if (id === "writing") return {
    student: "Nur die Schreibidee oder Struktur vorbereiten.",
    teacher: "Nicht die komplette Prüfungsantwort auf der Folie schreiben lassen.",
  };
  if (id === "workbook") return {
    student: "Die Unterrichtsidee in die Falowen-Aufgabe übertragen.",
    teacher: "Zum passenden Workbook wechseln; die Folie ist nur die Brücke.",
  };
  if (id === "lesson-summary") return {
    student: "Die wichtigsten Lernpunkte sichern.",
    teacher: "Kurz prüfen, was sitzt und was als Needs review weitergeführt wird.",
  };
  if (type === "foundation") return {
    student: "Den Problemkern und die Leitfrage verstehen.",
    teacher: "Kontext geben, aber die spätere Position nicht vorwegnehmen.",
  };
  if (type.includes("grammar")) return {
    student: "Die Funktion der Zielstruktur verstehen.",
    teacher: "Nur die Kernfunktion sichern; Details nicht erneut vollständig unterrichten.",
  };
  return {
    student: "Die Aufgabe bearbeiten.",
    teacher: "Auf das Lernziel fokussieren und unnötige Zusatzaufgaben vermeiden.",
  };
}

const A2_B1_WEEKLY_PRACTICE_PROFILES = Object.freeze({
  1: Object.freeze({ variant: "sentence-jumble", family: "Jumbled sentences & sorting", label: "Satzbau · Wörter ordnen" }),
  2: Object.freeze({ variant: "sorting-match", family: "Jumbled sentences & sorting", label: "Ordnen & zuordnen" }),
  3: Object.freeze({ variant: "information-gap", family: "Information gaps & matching", label: "Informationslücke" }),
  4: Object.freeze({ variant: "sorting-match", family: "Information gaps & matching", label: "Matching & Reihenfolge" }),
  5: Object.freeze({ variant: "error-detective", family: "Error detective & transformation", label: "Fehlerdetektiv" }),
  6: Object.freeze({ variant: "transformation", family: "Error detective & transformation", label: "Satz-Transformation" }),
  7: Object.freeze({ variant: "scenario-task", family: "Scenarios & decisions", label: "Szenario" }),
  8: Object.freeze({ variant: "decision-task", family: "Scenarios & decisions", label: "Entscheidung" }),
  9: Object.freeze({ variant: "exam-challenge", family: "Exam-style challenge", label: "Prüfungsnah" }),
  10: Object.freeze({ variant: "exam-challenge", family: "Exam-style challenge", label: "Prüfungsnah · Transfer" }),
});

function a2B1PresenterWeek(slide = {}) {
  const assignmentId = normalizedAssignmentId(slide);
  const match = assignmentId.match(/^(?:A2|B1)-(\d+)\./);
  if (match) return Math.min(10, Math.max(1, Number(match[1]) || 1));
  const day = Number(slide.dayNumber || slide.day || 1);
  return Math.min(10, Math.max(1, Math.ceil(day / 3)));
}

function explicitA2B1PracticeVariant(focusedPractice = {}) {
  const title = String(focusedPractice?.title || "").trim();
  if (/informationslücke/i.test(title)) return "information-gap";
  if (/fehlerdetektiv|aussage reparieren/i.test(title)) return "error-detective";
  if (/sortier|ordnen|ordnet|reihenfolge|rekonstruier|priorisier|zuordnen|zeitlinie|argumentkette|wirkungskette/i.test(title)) return "sorting-match";
  if (/mini-fallstudie|verbraucherfall|situation.*gefühl|problem.*ursache/i.test(title)) return "scenario-task";
  if (/entscheidung|regel bewerten|zwei profile|lebensform für|werte in einer situation/i.test(title)) return "decision-task";
  if (/antwort verstärken|antwort-upgrade|mach es höflicher|direkt.*professionell|verbinde mit|beschreibung verbessern|urlaubsplan verbinden/i.test(title)) return "transformation";
  if (/mini-wissensquiz|welches wort passt|finde das muster|behauptung prüfen|tipp, pflicht oder möglichkeit/i.test(title)) return "quick-check";
  return "";
}

function practiceVariantLabel(variant = "", fallback = "") {
  const labels = {
    "sentence-jumble": "Satzbau · Wörter ordnen",
    "sorting-match": "Ordnen & zuordnen",
    "information-gap": "Informationslücke",
    "error-detective": "Fehlerdetektiv",
    transformation: "Satz-Transformation",
    "scenario-task": "Szenario",
    "decision-task": "Entscheidung",
    "exam-challenge": "Prüfungsnahe Aufgabe",
    "quick-check": "Schnellcheck",
  };
  return labels[variant] || fallback || "Fokusaufgabe";
}

function buildSentenceJumbles(focusedPractice = {}, support = {}, level = "A2") {
  const candidates = [
    ...(Array.isArray(focusedPractice?.modelItems) ? focusedPractice.modelItems : []),
    ...(Array.isArray(support?.modelExamplesDe) ? support.modelExamplesDe : []),
  ];
  const maxWords = level === "B1" ? 12 : 10;
  const seen = new Set();
  const rows = [];

  for (const raw of candidates) {
    const answer = String(raw || "").trim().replace(/\s+/g, " ");
    if (!answer || seen.has(answer)) continue;
    seen.add(answer);
    const words = answer
      .replace(/[.!?]+$/g, "")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);
    if (words.length < 4 || words.length > maxWords) continue;

    const shift = Math.max(1, Math.min(words.length - 1, Math.floor(words.length / 3)));
    const scrambledWords = [...words.slice(shift), ...words.slice(0, shift)];
    if (scrambledWords.join(" ") === words.join(" ")) continue;

    rows.push({
      id: `jumble-${rows.length + 1}`,
      words: scrambledWords,
      answer,
    });
    if (rows.length >= 2) break;
  }

  return rows;
}

function buildInformationGapRoleCards(focusedPractice = {}) {
  if (Array.isArray(focusedPractice?.roleCards) && focusedPractice.roleCards.length) return focusedPractice.roleCards;
  const prompts = Array.isArray(focusedPractice?.prompts) ? focusedPractice.prompts.filter(Boolean) : [];
  if (prompts.length < 2) return [];

  const explicitA = prompts.find((prompt) => /^A\s*:/i.test(String(prompt)));
  const explicitB = prompts.find((prompt) => /^B\s*:/i.test(String(prompt)));
  const first = explicitA || prompts[0];
  const second = explicitB || prompts[1];

  return [
    {
      id: "A",
      title: "Rolle A · nur für Person A",
      content: String(first).replace(/^A\s*:\s*/i, ""),
      task: "Frage Person B nach der fehlenden Information. Verrate deine Karte nicht vollständig.",
    },
    {
      id: "B",
      title: "Rolle B · nur für Person B",
      content: String(second).replace(/^B\s*:\s*/i, ""),
      task: "Frage Person A nach der fehlenden Information. Verrate deine Karte nicht vollständig.",
    },
  ];
}

export function getA2B1PracticeVariant(slide = {}, focusedPractice = {}) {
  const weekNumber = a2B1PresenterWeek(slide);
  const profile = A2_B1_WEEKLY_PRACTICE_PROFILES[weekNumber] || A2_B1_WEEKLY_PRACTICE_PROFILES[1];
  const explicitVariant = explicitA2B1PracticeVariant(focusedPractice);
  const variant = explicitVariant || profile.variant;
  return {
    variant,
    weekNumber,
    weekFamily: profile.family,
    variantLabel: practiceVariantLabel(variant, profile.label),
    source: explicitVariant ? "lesson-override" : "weekly-profile",
  };
}

function buildA2B1FocusedPracticeStage(slide = {}, focusedPractice = null, support = {}, level = "A2") {
  if (!focusedPractice) return null;
  const profile = getA2B1PracticeVariant(slide, focusedPractice);
  const defaultMinutes = level === "B1" ? 7 : 6;
  const item = {
    ...focusedPractice,
    minutes: Number(focusedPractice.minutes || defaultMinutes),
  };

  if (profile.variant === "sentence-jumble") {
    item.jumbles = buildSentenceJumbles(focusedPractice, support, level);
  }
  if (profile.variant === "information-gap") {
    item.roleCards = buildInformationGapRoleCards(focusedPractice);
  }

  return {
    id: "practice",
    type: "flow",
    variant: profile.variant,
    variantLabel: profile.variantLabel,
    variantSource: profile.source,
    weekNumber: profile.weekNumber,
    weekFamily: profile.weekFamily,
    kicker: level === "B1" ? "Fokusaufgabe" : "Fokusübung",
    title: focusedPractice.title,
    items: [item],
    suggestedMinutes: Number(focusedPractice.minutes || defaultMinutes),
  };
}

function buildProgressiveSpeakingStage(slide = {}, speakingStage = {}, level = "") {
  const questions = Array.isArray(speakingStage.items) ? speakingStage.items.filter(Boolean) : [];
  if (!questions.length) return speakingStage;

  const curated = getSpeakingDifficultySelection(normalizedAssignmentId(slide));
  const fallbackIndexes = [0, Math.floor((questions.length - 1) / 2), questions.length - 1];
  const indexes = (curated?.indexes || fallbackIndexes)
    .map(Number)
    .filter((index, position, values) => Number.isInteger(index) && index >= 0 && index < questions.length && values.indexOf(index) === position)
    .slice(0, 3);

  const questionModels = Array.isArray(speakingStage.questionModels) ? speakingStage.questionModels : [];
  const selectedQuestions = indexes.map((index) => questions[index]).filter(Boolean);
  const selectedModels = selectedQuestions
    .map((question) => questionModels.find((item) => item?.questionDe === question))
    .filter(Boolean);
  const labels = (curated?.labels || ["Easy", "Neutral", "Difficult"]).slice(0, selectedQuestions.length);

  return {
    ...speakingStage,
    title: level === "B1" ? "Sprechen · 3 Stufen" : "Sprechen · 3 Fragen",
    instruction: "Nach Warm-up und Grammatik: eine leichte, eine neutrale und eine schwierigere Frage.",
    items: selectedQuestions,
    questionModels: selectedModels,
    coachingItems: selectedQuestions.map((question) =>
      (Array.isArray(speakingStage.coachingItems) ? speakingStage.coachingItems : [])
        .find((item) => item?.questionDe === question) || null),
    questionLevels: labels,
    difficultySource: curated ? "curated" : "fallback",
    difficultyIndexes: indexes,
    suggestedMinutes: level === "B1" ? 10 : 9,
  };
}

function buildAdvancedDiscussionStage(slide = {}, speakingStage = {}, level = "") {
  const questions = Array.isArray(speakingStage.items) ? speakingStage.items.filter(Boolean) : [];
  const centralQuestion = questions.length ? questions[questions.length - 1] : "";
  const matchingModel = (Array.isArray(speakingStage.questionModels) ? speakingStage.questionModels : [])
    .find((item) => item?.questionDe === centralQuestion);
  const instructionByLevel = {
    B2: "Nimm Stellung und begründe einen Hauptpunkt. Ein Gegenpunkt ist optional.",
    C1: "Nimm Stellung und verbinde höchstens zwei Perspektiven. Du musst die These nicht neu formulieren.",
    C2: "Nimm differenziert Stellung und verbinde höchstens zwei Perspektiven. Du musst die These nicht reformulieren.",
  };

  return {
    ...speakingStage,
    title: level === "C2" ? "Seminargespräch · eine Frage vertiefen" : "Diskussion · eine Frage vertiefen",
    instruction: instructionByLevel[level] || "",
    items: centralQuestion ? [centralQuestion] : [],
    questionModels: matchingModel ? [matchingModel] : [],
    supportItems: Array.isArray(speakingStage.supportItems) ? speakingStage.supportItems.slice(0, 3) : [],
    suggestedMinutes: level === "B2" ? 10 : 12,
  };
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
    coachingItems: buildA2B1SpeakingCoaching(slide, Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : []),
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
    const focusedPractice = slide.presenterFocusedPractice || getA2FocusedPractice(normalizedAssignmentId(slide));
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
        answerItems: buildKnowledgeAnswerItems(knowledge, slide.assignmentId),
        instruction: "Lest den kurzen Text 1 Minute. Beantwortet danach die Fragen mündlich.",
        suggestedMinutes: 5,
      }] : []),
      {
        id: "phrases",
        type: vocabularyStage ? "vocabulary" : "list",
        kicker: vocabularyStage ? "Wortschatz" : "Redemittel",
        title: vocabularyStage ? "Wortschatz für heute" : "Key phrases",
        items: vocabularyStage ? vocabularyItems : phraseItems,
        challengeItems: vocabularyStage ? buildVocabularyGapItems(vocabularyItems, level, slide.assignmentId) : [],
        instruction: vocabularyStage ? vocabularyInstruction(level) : "",
        suggestedMinutes: vocabularyStage ? 5 : 0,
      },
      buildA2B1GrammarCheckStage(slide, support, level),
      ...(() => {
        const challenge = getA2TeacherChallenge(normalizedAssignmentId(slide));
        if (challenge) return [{
          id: "scenario-challenge",
          type: "scenario-challenge",
          kicker: "Mitmach-Challenge · " + challenge.eyebrow,
          title: challenge.title,
          instruction: "Die Lehrkraft zeigt eine Situation und deckt die Modellantwort erst nach der mündlichen Antwort auf.",
          grammar: challenge.grammar,
          items: challenge.scenarios,
          teacherPurpose: {
            student: challenge.goal,
            teacher: "Pick students, listen before revealing examples, and move through scenarios. No student login or submission.",
          },
          suggestedMinutes: 8,
        }];
        const practiceStage = buildA2B1FocusedPracticeStage(slide, focusedPractice, support, level);
        return practiceStage ? [practiceStage] : [];
      })(),
      Array.isArray(slide.presenterSpeakingRounds) && slide.presenterSpeakingRounds.length
        ? {
            id: "questions",
            type: "flow",
            kicker: "Sprechen",
            title: "Restaurant-Rollenspiel · 3 Runden",
            variant: "scenario-task",
            variantLabel: "Progressives Rollenspiel",
            weekNumber: a2B1PresenterWeek(slide),
            weekFamily: "Scenarios & decisions",
            items: slide.presenterSpeakingRounds,
            suggestedMinutes: slide.presenterSpeakingRounds.reduce((sum, item) => sum + Number(item?.minutes || 0), 0) || 13,
          }
        : buildProgressiveSpeakingStage(slide, speakingStage, level),
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
        answerItems: buildKnowledgeAnswerItems(knowledge, slide.assignmentId),
        instruction: "Lies für die Hauptidee. Beantworte danach zwei Textfragen und eine Denkfrage.",
        suggestedMinutes: 6,
      }] : []),
      {
        id: "phrases",
        type: vocabularyStage ? "vocabulary" : "list",
        kicker: "Wortschatz",
        title: "Kollokationen & Redemittel",
        items: vocabularyStage ? vocabularyItems : phraseItems,
        challengeItems: vocabularyStage ? buildVocabularyGapItems(vocabularyItems, level, slide.assignmentId) : [],
        instruction: vocabularyStage
          ? "Achte auf feste Wortverbindungen und nutze mindestens eine davon später in deiner Antwort."
          : "",
        suggestedMinutes: 5,
      },
      buildA2B1GrammarCheckStage(slide, support, level),
      ...(() => {
        // Day 18 replaces "Berufsweg priorisieren" with the interactive career challenge.
        // Keep one practice slot only; never add a second career activity slide.
        if (normalizedAssignmentId(slide) === "B1-6.18") {
          return [{
            id: "career-challenge",
            type: "career-challenge",
            kicker: "Mitmach-Challenge · um ... zu",
            title: "Mein Weg zum Wunschberuf",
            instruction: "Die Lehrkraft zeigt einen zufälligen Beruf. Die Lernenden antworten laut mit um ... zu; nur die Lehrkraft deckt das Beispiel auf und wechselt den Beruf.",
            items: B1_DAY18_CAREER_CHALLENGES,
            teacherPurpose: {
              student: "Say why each career step helps reach the goal, using um ... zu + Infinitiv.",
              teacher: "Share this screen, ask the question aloud, listen first, then optionally reveal a model. No student login or submission.",
            },
            suggestedMinutes: 8,
          }];
        }
        // Keep exactly one practice slot; the scenario activity replaces its
        // original focused-practice slide, never adding another page.
        const challenge = getB1TeacherChallenge(normalizedAssignmentId(slide));
        if (challenge) return [{
          id: "scenario-challenge",
          type: "scenario-challenge",
          kicker: "Mitmach-Challenge · " + challenge.eyebrow,
          title: challenge.title,
          instruction: "Die Lehrkraft präsentiert eine Situation, lässt Lernende antworten und zeigt die Modellantwort erst danach.",
          grammar: challenge.grammar,
          items: challenge.scenarios,
          teacherPurpose: {
            student: challenge.goal,
            teacher: "Share the slide, pick students, listen to oral answers, then optionally reveal models. No student login or submission.",
          },
          suggestedMinutes: 8,
        }];
        const practiceStage = buildA2B1FocusedPracticeStage(slide, focusedPractice, support, level);
        return practiceStage ? [practiceStage] : [];
      })(),
      buildProgressiveSpeakingStage(slide, speakingStage, level),
      workbookStage,
    ];
  }

  if (level === "B2") {
    const focusTask = buildB2FocusedTask(slide, topicFoundation);
    const grammarSupportEn = b2GrammarSupportEn(grammarItems);
    const grammarAttentionEn = b2GrammarAttentionEn(grammarItems);
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
        title: "Warm-up · Thema aktivieren",
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
        kicker: "Kollokationen & Redemittel",
        title: "Sprache für das Thema",
        items: vocabularyItems,
        challengeItems: buildVocabularyGapItems(vocabularyItems, level),
        instruction: "Nutze mindestens zwei thematische Kollokationen und ein passendes Verknüpfungsmittel in deiner späteren Antwort.",
        suggestedMinutes: 6,
      },
      {
        id: "grammar",
        type: "b2-grammar",
        kicker: "Grammatik im Kontext",
        title: "Logische Beziehung klar ausdrücken",
        items: grammarItems,
        supportEn: grammarSupportEn,
        attentionEn: grammarAttentionEn,
        modelItems: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe.slice(0, 2) : [],
        suggestedMinutes: 9,
      },
      {
        id: "focus",
        type: "flow",
        kicker: "B2-Fokusaufgabe",
        title: focusTask.title,
        items: [focusTask],
        suggestedMinutes: focusTask.minutes,
      },
      buildAdvancedDiscussionStage(slide, speakingStage, level),
      workbookStage,
    ];
  }

  if (level === "C1") {
    const focusTask = buildC1FocusedTask(slide);
    const writingBridge = buildC1WritingBridge(slide);
    const grammarSupportEn = c1GrammarSupportEn(slide.canonicalLearnerLesson?.grammarTitle || "");
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
        title: "Warm-up · Thema aktivieren",
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
        kicker: "Kollokationen & Argumentationssprache",
        title: "Präzise Sprache für das Thema",
        items: vocabularyItems,
        challengeItems: buildVocabularyGapItems(vocabularyItems, level),
        instruction: "Nutze mindestens zwei thematische Kollokationen und ein Argumentationsmittel später in deiner Antwort.",
        suggestedMinutes: 6,
      },
      {
        id: "grammar",
        type: "c1-grammar",
        kicker: "Grammatik im Kontext",
        title: "Struktur kontrollieren · Funktion verstehen",
        items: grammarItems,
        supportEn: grammarSupportEn,
        attentionDe: String(slide.canonicalLearnerLesson?.mistake || ""),
        modelItems: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe.slice(0, 2) : [],
        suggestedMinutes: 10,
      },
      {
        id: "focus",
        type: "flow",
        kicker: "C1-Fokusaufgabe",
        title: focusTask.title,
        items: [focusTask],
        suggestedMinutes: focusTask.minutes,
      },
      buildAdvancedDiscussionStage(slide, speakingStage, level),
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
        skillTarget: slide.skillTarget || "",
        progressionLabel: slide.progressionLabel || "",
        studentReference,
      },
      {
        id: "warmup",
        type: "list",
        kicker: "Warm-up",
        title: "Warm-up · Position aktivieren",
        items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],
        questionSupport: [],
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
        challengeItems: buildVocabularyGapItems(vocabularyItems, level),
        instruction: "Nutze Kollokationen nicht dekorativ: wähle sie dort, wo sie die Argumentation präziser machen.",
        suggestedMinutes: 6,
      },
      {
        id: "grammar",
        type: "c2-grammar",
        kicker: "C2-Grammatik",
        title: "Verstehen → anwenden → begründen",
        items: grammarItems,
        modelItems: [],
        skillTarget: slide.skillTarget || "",
        application: buildC2GrammarApplication(
          slide,
          grammarItems,
          Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe.slice(0, 2) : [],
        ),
        suggestedMinutes: 10,
      },
      {
        id: "analysis",
        type: "c2-analysis",
        kicker: slide.examMode ? "Prüfungsmodus · Analyse" : "Analytische Fokusaufgabe",
        title: analyticalTask.title,
        instruction: analyticalTask.instruction,
        items: [analyticalTask],
        casePrompt: analyticalTask.casePrompt,
        checkPrompt: analyticalTask.checkPrompt,
        decisionPrompt: analyticalTask.decisionPrompt,
        progressiveReveal: true,
        rubric: analyticalTask.rubric,
        suggestedMinutes: analyticalTask.minutes,
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
  const level = classroomLevel(slide);
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
        kicker: level === "C2" ? "C2 · Kurzcheck" : "Abschluss",
        title: level === "C2" ? "Was du jetzt können solltest" : "Lesson summary",
        subtitle: level === "C2" ? "Du kannst jetzt … · Sprache · Analyse · Transfer." : "You should now be able to…",
        items: summaryItems,
        nextSteps,
        studentReference,
      });
    }
  }
  return filtered.map((stage) => ({
    ...stage,
    examMode: Boolean(level === "C2" && slide.examMode),
    teacherPurpose: stage.teacherPurpose || buildPresenterTeacherPurpose(stage, level),
  }));
}
export function clampPresenterIndex(index, stageCount) { const lastIndex = Math.max(0, Number(stageCount || 0) - 1); return Math.min(lastIndex, Math.max(0, Number(index || 0))); }
