import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
let source = fs.readFileSync(presenterPath, "utf8");

// The old version of this patch created an A2/B1 "Mini-Präsentation" wrap-up.
// Warm-up and speaking practice now cover that purpose, so remove the legacy
// helper/mutation if this script is run against an already-patched worktree.
const helperStart = source.indexOf("function buildA2B1PresentationWrapup(");
const classicStart = source.indexOf("function buildClassicStages(");
if (helperStart >= 0 && classicStart > helperStart) {
  source = source.slice(0, helperStart) + source.slice(classicStart);
}

const legacyWrapupMutation = [
  '    const wrapupStage = stages.find((stage) => stage.id === "wrapup");',
  "    if (wrapupStage) {",
  '      wrapupStage.title = "Mini-Präsentation";',
  "      wrapupStage.body = buildA2B1PresentationWrapup(slide);",
  "      wrapupStage.suggestedMinutes = 6;",
  "    }",
  "",
].join("\n");
source = source.replace(legacyWrapupMutation, "");

const reflectionBlock = [
  '  const reflectiveCourse = ["A2", "B1"].includes(classroomLevel(slide));',
  "  if (reflectiveCourse) {",
  '    const grammarSource = stages.find((stage) => ["grammar-check", "b1-grammar-check"].includes(stage.id));',
  '    const grammarExample = String(grammarSource?.questionModels?.[0]?.modelAnswerDe || "").trim();',
  '    const grammarProblem = String(grammarSource?.items?.[0] || "").replace(/^Korrigiere:\\s*/i, "").trim();',
  "",
  "    const reflectionItems = [",
  '      "Welche Grammatik hast du heute gelernt? Erkläre die Regel mit eigenen Worten.",',
  "      grammarProblem",
  '        ? `Welchen Fehler musst du bei dieser Grammatik vermeiden? Schau auf den Satz: „${grammarProblem}“`',
  '        : "Welchen typischen Fehler musst du bei der heutigen Grammatik vermeiden?",',
  '      "Bilde einen neuen eigenen Satz mit der heutigen Grammatik.",',
  "    ];",
  "    const reflectionModels = [",
  "      {",
  "        questionDe: reflectionItems[0],",
  "        modelAnswerDe: grammarExample",
  '          ? `Nutze beim Erklären dieses korrekte Beispiel: „${grammarExample}“ und beschreibe, was sich an Wortstellung oder Form verändert.`',
  '          : "Erkläre die Regel in einem einfachen Satz und nenne danach ein korrektes Beispiel.",',
  "      },",
  "      {",
  "        questionDe: reflectionItems[1],",
  "        modelAnswerDe: grammarExample",
  '          ? `Vergleiche den Fehler mit der korrekten Form: „${grammarExample}“.`',
  '          : "Nenne den Fehler und erkläre kurz, wie du ihn korrigierst.",',
  "      },",
  "      {",
  "        questionDe: reflectionItems[2],",
  '        modelAnswerDe: "Eigenes Beispiel: Verwende dieselbe Grammatikstruktur mit neuen Wörtern und kontrolliere die Wortstellung.",',
  "      },",
  "    ];",
  "",
  '    const reflectionIndex = stages.findIndex((stage) => ["guided-action", "b1-guided-action"].includes(stage.id));',
  "    if (reflectionIndex >= 0) {",
  "      stages[reflectionIndex] = {",
  '        id: "learning-reflection",',
  '        type: "question-reveal",',
  '        kicker: "Lernreflexion",',
  '        title: "Was hast du heute gelernt?",',
  "        items: reflectionItems,",
  "        questionModels: reflectionModels,",
  "        requiresQuestionModel: true,",
  "        suggestedMinutes: 7,",
  "      };",
  "    }",
  "",
  '    const exitIndex = stages.findIndex((stage) => ["role-play", "b1-role-play"].includes(stage.id));',
  "    if (exitIndex >= 0) {",
  "      stages[exitIndex] = {",
  '        id: "learning-exit-ticket",',
  '        type: "question-reveal",',
  '        kicker: "Lern-Check",',
  '        title: "Was nimmst du mit?",',
  "        items: [",
  '          "Was kannst du nach dieser Lektion jetzt besser als vorher?",',
  '          "Welche Grammatik oder welches Redemittel möchtest du noch einmal üben?",',
  '          "Nenne einen Satz oder Ausdruck aus der Lektion, den du im echten Leben benutzen kannst.",',
  "        ],",
  "        questionModels: [],",
  "        requiresQuestionModel: false,",
  "        suggestedMinutes: 5,",
  "      };",
  "    }",
  "  }",
].join("\n");

if (!source.includes('id: "learning-reflection"')) {
  const functionStart = source.indexOf("function buildPresenterV2Stages(");
  if (functionStart < 0) throw new Error("Presenter V2 function missing");
  const returnIndex = source.indexOf("  return stages;", functionStart);
  if (returnIndex < 0) throw new Error("Presenter V2 return missing");
  source = source.slice(0, returnIndex) + reflectionBlock + "\n" + source.slice(returnIndex);
}

if (source.includes("Mini-Präsentation") || source.includes("buildA2B1PresentationWrapup(")) {
  throw new Error("Legacy A2/B1 mini-presentation code is still present");
}

fs.writeFileSync(presenterPath, source);
console.log("A2/B1 presenter: mini-presentation wrap-up removed; final learning reflection remains.");
