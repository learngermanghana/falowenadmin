import fs from "node:fs";

const slidesPath = new URL("../src/data/teachingSlides.js", import.meta.url);
let source = fs.readFileSync(slidesPath, "utf8");

const marker = "A1_TOPIC_SPECIFIC_TEMPLATE_FALLBACK";
if (!source.includes(marker)) {
  const importAnchor = 'import { getSlideQuestionSet } from "./teachingSlideQuestionDictionary.js";';
  const importReplacement = `${importAnchor}\nimport { A1_TOPIC_TEACHER_SUPPORT } from "./a1TopicTeacherSupport.js";`;
  if (!source.includes(importAnchor)) throw new Error("A1 topic-support import anchor missing.");
  source = source.replace(importAnchor, importReplacement);

  const setupAnchor = `  const questionSet = getSlideQuestionSet(entry.assignment_id, topicContext);\n\n  return {`;
  const setupReplacement = `  const questionSet = getSlideQuestionSet(entry.assignment_id, topicContext);\n  // A1_TOPIC_SPECIFIC_TEMPLATE_FALLBACK\n  const a1Support = levelLabel === "A1" ? A1_TOPIC_TEACHER_SUPPORT[entry.assignment_id] : null;\n  const a1Models = Array.isArray(a1Support?.modelExamplesDe) ? a1Support.modelExamplesDe.filter(Boolean) : [];\n  const a1Mistakes = Array.isArray(a1Support?.commonMistakesEn) ? a1Support.commonMistakesEn.filter(Boolean) : [];\n\n  return {`;
  if (!source.includes(setupAnchor)) throw new Error("A1 template setup anchor missing.");
  source = source.replace(setupAnchor, setupReplacement);

  const objectiveAnchor = `    objective: \`Students can communicate about \${entry.en.toLowerCase()} with clear \${levelLabel} sentence patterns.\`,`;
  const objectiveReplacement = `    objective: a1Support\n      ? \`Students can use the core language for \${entry.en.toLowerCase()} in short, accurate A1 sentences and answer simple questions on the same topic.\`\n      : \`Students can communicate about \${entry.en.toLowerCase()} with clear \${levelLabel} sentence patterns.\`,`;
  if (!source.includes(objectiveAnchor)) throw new Error("A1 generic objective anchor missing.");
  source = source.replace(objectiveAnchor, objectiveReplacement);

  const phrasesAnchor = `    keyPhrasesDe: [\n      \`\${entry.de}: wichtige Redemittel\`,\n      "Ich denke, dass ...",\n      "Kannst du das bitte wiederholen?",\n      "Ich brauche ein Beispiel.",\n    ],`;
  const phrasesReplacement = `    keyPhrasesDe: a1Support\n      ? a1Models\n      : [\n        \`\${entry.de}: wichtige Redemittel\`,\n        "Ich denke, dass ...",\n        "Kannst du das bitte wiederholen?",\n        "Ich brauche ein Beispiel.",\n      ],`;
  if (!source.includes(phrasesAnchor)) throw new Error("A1 generic useful-language anchor missing.");
  source = source.replace(phrasesAnchor, phrasesReplacement);

  const notesAnchor = `    teacherNotesEn: [\n      \`Keep the lesson focused on high-frequency \${levelLabel} language for \${entry.en}.\`,\n      "Model one full exchange before pair speaking.",\n      "Use short correction slots after each speaking phase.",\n    ],`;
  const notesReplacement = `    teacherNotesEn: a1Support\n      ? [\n        \`Keep this A1 lesson tightly focused on \${entry.en}; do not add grammar from later lessons.\`,\n        a1Models.length\n          ? \`Model the target with these lesson examples first: \${a1Models.slice(0, 2).join(" / ")}\`\n          : \`Model two short examples for \${entry.de} before student production.\`,\n        a1Mistakes.length\n          ? \`Correct the lesson's main error explicitly: \${a1Mistakes[0]}\`\n          : \`Correct only errors that affect today's \${entry.de} target.\`,\n      ]\n      : [\n        \`Keep the lesson focused on high-frequency \${levelLabel} language for \${entry.en}.\`,\n        "Model one full exchange before pair speaking.",\n        "Use short correction slots after each speaking phase.",\n      ],`;
  if (!source.includes(notesAnchor)) throw new Error("A1 generic teacher-note anchor missing.");
  source = source.replace(notesAnchor, notesReplacement);

  const flowAnchor = `    interactionFlow: [\n      { phase: "Input", detailEn: "8 min: activate vocabulary and useful sentence frames." },\n      { phase: "Guided pairs", detailEn: "12 min: students use prompts with controlled answers." },\n      { phase: "Free practice", detailEn: "12 min: switch partners and expand answers." },\n      { phase: "Reflection", detailEn: "8 min: class feedback + correction recap." },\n    ],`;
  const flowReplacement = `    interactionFlow: a1Support\n      ? [\n        { phase: "Input", detailEn: \`8 min: introduce \${entry.de} through the lesson's own model sentences.\` },\n        { phase: "Guided practice", detailEn: \`12 min: learners change one detail in the \${entry.de} models and say complete sentences.\` },\n        { phase: "Topic questions", detailEn: \`12 min: learners answer the lesson questions using only today's target language.\` },\n        { phase: "Correction", detailEn: \`8 min: correct the specific \${entry.de} errors identified for this lesson.\` },\n      ]\n      : [\n        { phase: "Input", detailEn: "8 min: activate vocabulary and useful sentence frames." },\n        { phase: "Guided pairs", detailEn: "12 min: students use prompts with controlled answers." },\n        { phase: "Free practice", detailEn: "12 min: switch partners and expand answers." },\n        { phase: "Reflection", detailEn: "8 min: class feedback + correction recap." },\n      ],`;
  if (!source.includes(flowAnchor)) throw new Error("A1 generic interaction-flow anchor missing.");
  source = source.replace(flowAnchor, flowReplacement);
}

fs.writeFileSync(slidesPath, source);

const finalSource = fs.readFileSync(slidesPath, "utf8");
if (!finalSource.includes(marker)) throw new Error("A1 topic-specific template marker missing.");
if (!finalSource.includes('A1_TOPIC_TEACHER_SUPPORT[entry.assignment_id]')) {
  throw new Error("Generated A1 slides are not reading topic-specific teacher support.");
}

console.log("Generated A1 lessons now use topic-specific examples, notes and practice instead of the generic template.");