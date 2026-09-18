import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { c2CourseEntries } from "../src/data/c2PresenterSlides.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function update(relativePath, transform) {
  const filePath = path.join(root, relativePath);
  const before = fs.readFileSync(filePath, "utf8");
  const after = transform(before);
  if (after !== before) fs.writeFileSync(filePath, after, "utf8");
}

function mustReplace(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`C2 patch anchor missing: ${label}`);
  return source.replace(from, to);
}

update("src/data/courseDictionary.js", (source) => {
  if (source.includes("  C2: {")) return source;
  const anchor = "  },\n};\n\nfunction dictionarySortValue(entry = {}) {";
  if (!source.includes(anchor)) throw new Error("C2 dictionary insertion anchor missing");
  const entries = c2CourseEntries
    .map((entry) => `    ${JSON.stringify(entry.assignment_id)}: { assignment_id: ${JSON.stringify(entry.assignment_id)}, chapter: ${JSON.stringify(entry.chapter)}, de: ${JSON.stringify(entry.de)}, en: ${JSON.stringify(entry.en)} },`)
    .join("\n");
  return source.replace(anchor, `  },\n  C2: {\n${entries}\n  },\n};\n\nfunction dictionarySortValue(entry = {}) {`);
});

update("src/data/teachingSlides.js", (source) => {
  let next = source;
  if (!next.includes('import { c2PresenterSlides } from "./c2PresenterSlides.js";')) {
    const importAnchor = 'import { c1PresenterSlides } from "./c1PresenterSlides.js";';
    if (!next.includes(importAnchor)) throw new Error("C2 teachingSlides import anchor missing");
    next = next.replace(importAnchor, importAnchor + '\nimport { c2PresenterSlides } from "./c2PresenterSlides.js";');
  }

  if (!next.includes("...c2PresenterSlides")) {
    const exportPattern = /export const teachingSlides = \[([^\n]+)\];/;
    const match = next.match(exportPattern);
    if (!match) throw new Error("C2 teachingSlides export anchor missing");
    const body = match[1];
    const updatedBody = body.replace(/\.\.\.c1PresenterSlides\s*$/, "...c1PresenterSlides, ...c2PresenterSlides");
    if (updatedBody === body) throw new Error("C2 teachingSlides C1 tail anchor missing");
    next = next.replace(match[0], `export const teachingSlides = [${updatedBody}];`);
  }
  return next;
});

update("src/utils/teachingPresenter.js", (source) => {
  let next = source;

  next = mustReplace(
    next,
    'const C1_PRESENTER_V2_ASSIGNMENTS = new Set(Array.from({ length: 28 }, (_, index) => `C1 ${index + 1}`));',
    'const C1_PRESENTER_V2_ASSIGNMENTS = new Set(Array.from({ length: 28 }, (_, index) => `C1 ${index + 1}`));\nconst C2_PRESENTER_V2_ASSIGNMENTS = new Set([...Array.from({ length: 28 }, (_, index) => `C2 ${index + 1}`), ...["C2-1.1","C2-1.2","C2-1.3","C2-1.4","C2-1.5","C2-1.6","C2-1.7","C2-2.1","C2-2.2","C2-2.3","C2-2.4","C2-2.5","C2-2.6","C2-2.7","C2-3.1","C2-3.2","C2-3.3","C2-3.4","C2-3.5","C2-4.1","C2-4.2","C2-4.3","C2-4.4","C2-4.5","C2-5.1","C2-5.2","C2-5.3","C2-5.4"]]);',
    "C2 presenter assignment set",
  );

  next = mustReplace(
    next,
    'function isAdvancedClassroomSlide(slide = {}) { return ["B2", "C1"].includes(classroomLevel(slide)); }',
    'function isAdvancedClassroomSlide(slide = {}) { return ["B2", "C1", "C2"].includes(classroomLevel(slide)); }',
    "C2 advanced classroom level",
  );

  next = mustReplace(
    next,
    'export function isC1PresenterV2Slide(slide = {}) { return C1_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide)); }',
    'export function isC1PresenterV2Slide(slide = {}) { return C1_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide)); }\nexport function isC2PresenterV2Slide(slide = {}) { return C2_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide)); }',
    "C2 presenter predicate",
  );

  next = mustReplace(
    next,
    'export function isTeachingPresenterV2Slide(slide = {}) { return isA1PresenterV2Slide(slide) || isA2PresenterV2Slide(slide) || isB1PresenterV2Slide(slide) || isB2PresenterV2Slide(slide) || isC1PresenterV2Slide(slide); }',
    'export function isTeachingPresenterV2Slide(slide = {}) { return isA1PresenterV2Slide(slide) || isA2PresenterV2Slide(slide) || isB1PresenterV2Slide(slide) || isB2PresenterV2Slide(slide) || isC1PresenterV2Slide(slide) || isC2PresenterV2Slide(slide); }',
    "C2 Presenter 2.0 gate",
  );

  if (!next.includes('slide.grammarTeachDe')) {
    const advancedGrammarAnchor = 'function buildAdvancedGrammarItems(slide = {}, support = {}) { if (normalizedAssignmentId(slide) === "B2-1.1")';
    const advancedGrammarReplacement = 'function buildAdvancedGrammarItems(slide = {}, support = {}) { if (classroomLevel(slide) === "C2" && Array.isArray(slide.grammarTeachDe) && slide.grammarTeachDe.length) return slide.grammarTeachDe; if (normalizedAssignmentId(slide) === "B2-1.1")';
    if (!next.includes(advancedGrammarAnchor)) throw new Error("C2 lesson-specific grammar anchor missing");
    next = next.replace(advancedGrammarAnchor, advancedGrammarReplacement);
  }

    if (!next.includes("C2 precision: Funktionsverbgefüge")) {
    const grammarAnchor = '  { pattern: /dass-clause|dass clause/i, de: "dass-Sätze: das konjugierte Verb steht am Ende des Nebensatzes." },\n];';
    const grammarReplacement = '  { pattern: /dass-clause|dass clause/i, de: "dass-Sätze: das konjugierte Verb steht am Ende des Nebensatzes." },\n  // C2 precision: Funktionsverbgefüge, Partizipialattribute, epistemische Abstufung and text cohesion.\n  { pattern: /funktionsverb|zur debatte stehen|in betracht ziehen|abwägung vornehmen|einfluss ausüben/i, de: "Funktionsverbgefüge gezielt verwenden: zur Debatte stehen · in Betracht ziehen · eine Abwägung vornehmen · Einfluss ausüben." },\n  { pattern: /partizipial|participial|expanded particip/i, de: "Erweiterte Partizipialattribute: komplexe Information vor dem Nomen verdichten, ohne den Bezug unklar zu machen." },\n  { pattern: /hedg|epistem|abstuf|dürfte|ließe sich|scheint|keineswegs|nur bedingt/i, de: "Aussagen abstufen: dürfte · ließe sich · scheint · spricht dafür · keineswegs · nur bedingt." },\n  { pattern: /cohesion|coherence|reference chain|paragraph-level/i, de: "Textkohärenz: Bezüge über mehrere Sätze eindeutig halten und Absätze logisch miteinander verzahnen." },\n];';
    if (!next.includes(grammarAnchor)) throw new Error("C2 advanced grammar rule anchor missing");
    next = next.replace(grammarAnchor, grammarReplacement);
  }

  if (!next.includes('classroomLevel(slide) === "C2"') || !next.includes("C2-Aussagen präzise abstufen")) {
    const mistakesAnchor = 'function buildAdvancedMistakes(slide = {}) { if (normalizedAssignmentId(slide) === "B2-1.1")';
    const mistakesReplacement = 'function buildAdvancedMistakes(slide = {}) { if (classroomLevel(slide) === "C2" && Array.isArray(slide.commonMistakesDe) && slide.commonMistakesDe.length) return slide.commonMistakesDe; if (classroomLevel(slide) === "C2") return ["C2-Aussagen präzise abstufen: keine absolute Behauptung, wenn die Evidenz nur eine Tendenz trägt.", "Prämisse, Beleg und Schlussfolgerung nicht vermischen; benenne ausdrücklich, was belegt und was daraus gefolgert wird.", "Die stärkste Gegenposition formulieren und darauf reagieren, statt ein leichtes Gegenargument zu konstruieren.", "Komplexe Syntax nur einsetzen, wenn Bezüge und Satzrhythmus eindeutig bleiben.", "Nominalstil und Funktionsverbgefüge gezielt einsetzen; Verständlichkeit bleibt wichtiger als Dichte."]; if (normalizedAssignmentId(slide) === "B2-1.1")';
    if (!next.includes(mistakesAnchor)) throw new Error("C2 mistakes anchor missing");
    next = next.replace(mistakesAnchor, mistakesReplacement);
  }

  if (!next.includes('if (level === "C2") return [')) {
    const practiceAnchor = '  if (level === "C1") return [';
    const practiceReplacement = `  if (level === "C2") return [
    { title: "1. Problemkern", instruction: firstQuestion, prompts: ["Formuliere zuerst die zugrunde liegende Spannung und nenne zwei Bewertungskriterien."], modelItems: models.slice(0, 1), teacherNote: teacherNoteFromFlow(flow, 0, "Frame the dilemma before allowing a final position."), minutes: interactionMinutes(slide, 0) || 7 },
    { title: "2. Präzisions-Upgrade", instruction: \`Formuliere differenzierter: „\${topic} ist gut oder schlecht.“\`, prompts: grammarItems.slice(0, 3).map((item) => \`Nutze diese Zielstruktur: \${item}\`), modelItems: models.slice(0, 2), teacherNote: teacherNoteFromFlow(flow, 1, "Require calibrated certainty and explicit logical relations."), minutes: interactionMinutes(slide, 1) || 10 },
    { title: "3. Prämisse und Evidenz", instruction: argumentQuestion, prompts: ["Welche Annahme steckt dahinter? Welche Evidenz wäre nötig? Welche Einschränkung bleibt?"], modelItems: models.slice(1, 3), teacherNote: teacherNoteFromFlow(flow, 2, "Separate evidence, inference and evaluation explicitly."), minutes: interactionMinutes(slide, 2) || 12 },
    { title: "4. Stärkste Gegenposition", instruction: counterQuestion, prompts: ["Formuliere die Gegenposition so stark wie möglich und reagiere anschließend darauf, ohne sie zu verzerren."], modelItems: models.slice(1, 3), teacherNote: teacherNoteFromFlow(flow, 3, "Do not accept token counterarguments; make the learner answer the strongest version."), minutes: interactionMinutes(slide, 3) || 12 },
    { title: "5. C2-Synthese", instruction: finalQuestion, prompts: ["Sprich 90–120 Sekunden: Problemkern → Kriterien → Argument → Evidenz/Beispiel → Gegenposition → Synthese."], modelItems: models.slice(0, 3), teacherNote: teacherNoteFromFlow(flow, 4, "Correct after the full response; prioritise logic, register and two high-value language points."), minutes: interactionMinutes(slide, 4) || 15 },
  ];
  if (level === "C1") return [`;
    if (!next.includes(practiceAnchor)) throw new Error("C2 practice anchor missing");
    next = next.replace(practiceAnchor, practiceReplacement);
  }

  next = next.replace(
    /requiresQuestionModel: \[[^\]]*\]\.includes\(String\(slide\.course \|\| ""\)\.toUpperCase\(\)\),/,
    'requiresQuestionModel: ["A2", "B1", "B2", "C1", "C2"].includes(String(slide.course || "").toUpperCase()),',
  );

  return next;
});

update("tests/b1-presenter-v2-days1-6.test.js", (source) => {
  let next = source;
  next = next.replace(
    'test("lessons outside A1, A2, B1, B2 and C1 remain on the classic presenter", () => {',
    'test("lessons outside A1, A2, B1, B2, C1 and C2 remain on the classic presenter", () => {',
  );
  next = next.replace('    course: "C2",', '    course: "D1",');
  next = next.replace('    assignmentId: "C2-1.1",', '    assignmentId: "D1-1.1",');
  next = next.replace('    title: "C2 lesson",', '    title: "D1 lesson",');
  return next;
});

console.log("C2 course dictionary, 28-day Presenter 2.0 curriculum, C2 precision practice and regression guards are patched.");
