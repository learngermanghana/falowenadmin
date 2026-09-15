import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
const day16To20Path = new URL("../src/data/a2WorkbookAlignedSlidesDays16To20.js", import.meta.url);

// A2 lessons should begin by making the student speak, not by showing a
// one-minute reading passage. Keep this patch in the existing build hook so
// old build environments that still contain the knowledge stage are cleaned.
let source = fs.readFileSync(presenterPath, "utf8");

const knowledgeStage = `    {\n      id: "knowledge",\n      type: "task",\n      kicker: "1 Minute",\n      title: "1-Minute-Wissen",\n      body: slide.knowledgeTextDe || "",\n      suggestedMinutes: 1,\n    },\n`;

while (source.includes(knowledgeStage)) source = source.replace(knowledgeStage, "");

const oldWarmup = `    {\n      id: "warmup",\n      type: "list",\n      kicker: "Warm-up",\n      title: advanced ? "Einstieg" : "Warm-up",\n      items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],\n      suggestedMinutes: interactionMinutes(slide, 0) || 5,\n    },`;

const questionWarmup = `    {\n      id: "warmup",\n      type: "list",\n      kicker: "Warm-up",\n      title: normalizedAssignmentId(slide).startsWith("A2-") ? "Warm-up question" : (advanced ? "Einstieg" : "Warm-up"),\n      items: normalizedAssignmentId(slide).startsWith("A2-")\n        ? (Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe.slice(0, 1) : [])\n        : (Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : []),\n      suggestedMinutes: normalizedAssignmentId(slide).startsWith("A2-") ? 3 : (interactionMinutes(slide, 0) || 5),\n    },`;

if (source.includes(oldWarmup)) source = source.replace(oldWarmup, questionWarmup);
else if (!source.includes('title: normalizedAssignmentId(slide).startsWith("A2-") ? "Warm-up question"')) throw new Error("A2 question warm-up patch anchor missing");

fs.writeFileSync(presenterPath, source);

// Day 19 gets one extra actionable slide after the existing presenter stages.
// The tutor shows one incorrect shopping sentence at a time, asks the learner
// to correct it and explain whether oder or denn is required, then reveals the
// model answer. This checks meaning + word order instead of adding more reading.
let daySource = fs.readFileSync(day16To20Path, "utf8");
if (!daySource.includes('grammarCheckTitle: "Korrigiere den Satz · oder / denn"')) {
  const anchor = '    wrapUpTaskDe: "Schreibe 5 Sätze über dein Einkaufsverhalten. Benutze einmal oder und zweimal denn.",';
  const addition = `    grammarCheckTitle: "Korrigiere den Satz · oder / denn",\n    grammarCheckMinutes: 10,\n    grammarCheckQuestions: [\n      "Ich kaufe die Jacke, denn sie zu billig ist.",\n      "Möchtest du bar denn mit Karte bezahlen?",\n      "Ich kaufe online, denn ist es bequemer.",\n      "Kaufst du das rote Hemd denn das blaue Hemd?",\n      "Ich gehe heute einkaufen oder ich brauche Lebensmittel.",\n    ],\n    grammarCheckModels: [\n      { questionDe: "Ich kaufe die Jacke, denn sie zu billig ist.", modelAnswerDe: "Ich kaufe die Jacke, denn sie ist billig. Nach denn bleibt die normale Hauptsatzstellung: Subjekt + Verb." },\n      { questionDe: "Möchtest du bar denn mit Karte bezahlen?", modelAnswerDe: "Möchtest du bar oder mit Karte bezahlen? oder verbindet Alternativen." },\n      { questionDe: "Ich kaufe online, denn ist es bequemer.", modelAnswerDe: "Ich kaufe online, denn es ist bequemer. Nach denn steht das Subjekt vor dem Verb." },\n      { questionDe: "Kaufst du das rote Hemd denn das blaue Hemd?", modelAnswerDe: "Kaufst du das rote Hemd oder das blaue Hemd? oder zeigt eine Auswahl." },\n      { questionDe: "Ich gehe heute einkaufen oder ich brauche Lebensmittel.", modelAnswerDe: "Ich gehe heute einkaufen, denn ich brauche Lebensmittel. denn gibt einen Grund." },\n    ],\n${anchor}`;
  if (!daySource.includes(anchor)) throw new Error("A2 Day 19 grammar-check anchor missing");
  daySource = daySource.replace(anchor, addition);
  fs.writeFileSync(day16To20Path, daySource);
}

console.log("A2 presenter: question warm-up retained; Day 19 adds actionable oder/denn correction check.");
