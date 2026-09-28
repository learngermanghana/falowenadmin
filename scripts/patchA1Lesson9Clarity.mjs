import fs from "node:fs";

function patchOnce(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`${label} anchor missing.`);
  return source.replace(from, to);
}

// 1) Presenter: normal A1 is grammar-diagnostic; lesson 9 topic specificity is handled in the check/data sources.
const presenterPath = new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url);
const presenter = fs.readFileSync(presenterPath, "utf8");
if (!presenter.includes("const A1_GRAMMAR_CHECK_FLOW_VERSION = 3;")) {
  throw new Error("A1-9 requires the grammar-diagnostic presenter flow.");
}

// 2) Slide data: A1-9 gets beginner food/negation language instead of generic dass phrases.
const slidesPath = new URL("../src/data/teachingSlides.js", import.meta.url);
let slides = fs.readFileSync(slidesPath, "utf8");

if (!slides.includes("A1_LESSON_9_TOPIC_LANGUAGE")) {
  const buildAnchor = `\nfunction buildLevelSlides(level) {`;
  const helper = `
function enhanceA1Lesson9TopicLanguage(slide) {
  // A1_LESSON_9_TOPIC_LANGUAGE
  if (String(slide.assignmentId || "").trim().toUpperCase() !== "A1-9") return slide;
  return {
    ...slide,
    objective: "Students talk about food and make simple negative sentences with kein and nicht.",
    keyPhrasesDe: [
      "Ich esse Brot.",
      "Ich esse keinen Käse.",
      "Ich trinke keinen Kaffee.",
      "Wir haben keine Milch.",
      "Die Suppe ist nicht warm.",
      "Ich koche heute nicht.",
    ],
    teacherNotesEn: [
      "Keep the useful language at A1 level and tied to food and negation.",
      "Contrast kein with nouns and nicht with verbs or adjectives using concrete examples.",
      "Do not introduce opinion clauses with dass in this lesson.",
    ],
  };
}
`;
  if (!slides.includes(buildAnchor)) throw new Error("A1-9 slide helper anchor missing.");
  slides = slides.replace(buildAnchor, `${helper}${buildAnchor}`);

  const a2Anchor = `const generatedA2Slides = buildLevelSlides("A2").map((slide) => curatedSlidesByAssignment[slide.assignmentId] || slide);`;
  if (!slides.includes(a2Anchor)) throw new Error("A1/A2 slide boundary anchor missing.");
  slides = slides.replace(a2Anchor, `const topicAlignedA1Slides = a1Slides.map(enhanceA1Lesson9TopicLanguage);\n${a2Anchor}`);

  const exportPattern = /export const teachingSlides = \[\.\.\.a1Slides,/;
  if (!exportPattern.test(slides)) throw new Error("Teaching slide export anchor missing.");
  slides = slides.replace(exportPattern, "export const teachingSlides = [...topicAlignedA1Slides,");
}
fs.writeFileSync(slidesPath, slides);

// 3) Late class challenge: only today's A1-9 knowledge, never recall/directions.
const checksPath = new URL("../src/data/a1PresenterUnderstandingChecks.js", import.meta.url);
let checks = fs.readFileSync(checksPath, "utf8");

if (!checks.includes("A1_LESSON_9_CURRENT_TOPIC_CHALLENGE")) {
  const anchor = `const A1_PRESENTER_UNDERSTANDING_OVERRIDES = {
`;
  const override = `const A1_PRESENTER_UNDERSTANDING_OVERRIDES = {
  // A1_LESSON_9_CURRENT_TOPIC_CHALLENGE
  "A1-9": [
    check("What is the basic difference between kein and nicht?", "Use kein with a noun phrase; use nicht for a verb, adjective or the wider statement."),
    check("Make this sentence negative: ‘Ich esse Käse.’", "Ich esse keinen Käse."),
    check("Make this sentence negative: ‘Wir haben Milch.’", "Wir haben keine Milch."),
    check("Make this sentence negative: ‘Die Suppe ist warm.’", "Die Suppe ist nicht warm."),
    check("Make this sentence negative: ‘Ich koche heute.’", "Ich koche heute nicht."),
    check("Choose kein or nicht: ‘Ich trinke ___ Kaffee.’", "keinen: Ich trinke keinen Kaffee."),
    check("Choose kein or nicht: ‘Das Essen ist ___ lecker.’", "nicht: Das Essen ist nicht lecker."),
    check("Why do we say ‘keine Milch’ but ‘keinen Käse’?", "Milch is feminine; Käse is masculine accusative after essen."),
    check("Say one food you do not eat using kein/keine/keinen.", "For example: Ich esse keinen Fisch. / Ich esse keine Wurst."),
    check("Say one food or drink you do not have using kein/keine/keinen.", "For example: Ich habe keinen Kaffee. / Ich habe keine Milch."),
    check("Say one sentence with nicht about food or cooking.", "For example: Die Suppe ist nicht heiß. / Ich koche heute nicht."),
    check("Correct this sentence: ‘Ich esse nicht Käse.’", "Ich esse keinen Käse."),
  ],
`;
  checks = patchOnce(checks, anchor, override, "A1-9 understanding override");
}
fs.writeFileSync(checksPath, checks);

const finalSlides = fs.readFileSync(slidesPath, "utf8");
const finalChecks = fs.readFileSync(checksPath, "utf8");
if (!finalSlides.includes("A1_LESSON_9_TOPIC_LANGUAGE") || finalSlides.includes('"Ich denke, dass ..."') && !finalSlides.includes('"Ich esse keinen Käse."')) {
  throw new Error("A1-9 topic-language validation failed.");
}
const challengeBlock = finalChecks.match(/A1_LESSON_9_CURRENT_TOPIC_CHALLENGE[\s\S]*?(?=\n\s*"A1-4"\s*:)/)?.[0] || "";
if (!challengeBlock || /direction|location|route|geradeaus/i.test(challengeBlock)) {
  throw new Error("A1-9 class challenge contains unrelated material.");
}

console.log("A1-9: the class grammar challenge stays focused on food and negation.");

await import("./patchA1TopicSpecificFallback.mjs");