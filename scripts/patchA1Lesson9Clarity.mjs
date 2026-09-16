import fs from "node:fs";

function patchOnce(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`${label} anchor missing.`);
  return source.replace(from, to);
}

// 1) Presenter: recall stays early; later application prompts are explicit.
const presenterPath = new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url);
let presenter = fs.readFileSync(presenterPath, "utf8");

if (!presenter.includes("A1_LESSON_9_TOPIC_RECALL")) {
  const from = `function buildRetrievalChecks(slide = {}) {
  const day = Number(slide.dayNumber || 0);
  if (day <= 1) return [];

  const bank = [`;
  const to = `function buildRetrievalChecks(slide = {}) {
  const day = Number(slide.dayNumber || 0);
  if (day <= 1) return [];

  // A1_LESSON_9_TOPIC_RECALL
  const assignmentId = cleanText(slide.assignmentId).toUpperCase();
  if (assignmentId === "A1-9") {
    return [
      makeCheck("Make one polite Goethe Teil 3 request with können + bitte.", "For example: Kannst du mir bitte den Stift geben?", "Recall only; this belongs near the start of the lesson."),
      makeCheck("Your partner says: ‘Kannst du mir bitte den Stift geben?’ How do you react politely?", "For example: Ja, gern. / Ja, natürlich.", "Recall only."),
      makeCheck("Make one sentence with können, müssen or möchten.", "For example: Ich kann Deutsch sprechen. / Wir müssen heute lernen. / Ich möchte Wasser trinken.", "Recall the previous modal-verb lesson."),
    ];
  }

  const bank = [`;
  presenter = patchOnce(presenter, from, to, "A1-9 recall");
}

if (!presenter.includes("A1_PHRASE_APPLICATION_CLARITY")) {
  const from = `    ...(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []).map((phrase) => makeCheck(
      \`Use this language in a new sentence: “\${phrase}”\`,
      \`Accept a new correct sentence that follows the pattern in “\${phrase}”.\`,
      "Do not accept simple repetition when the learner can reasonably personalise the phrase.",
    )),`;
  const to = `    ...(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []).map((phrase) => makeCheck(
      // A1_PHRASE_APPLICATION_CLARITY
      \`Change one clear detail in this model and say the new complete sentence: “\${phrase}”\`,
      "Keep the same pattern, but change one clear detail such as the person, action, food/object, time or place.",
      "Produce a different complete sentence rather than repeating the model.",
    )),`;
  presenter = patchOnce(presenter, from, to, "A1 phrase application");
}
fs.writeFileSync(presenterPath, presenter);

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
  "A1-4.7": [`;
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
  "A1-4.7": [`;
  checks = patchOnce(checks, anchor, override, "A1-9 understanding override");
}
fs.writeFileSync(checksPath, checks);

const finalSlides = fs.readFileSync(slidesPath, "utf8");
const finalChecks = fs.readFileSync(checksPath, "utf8");
if (!finalSlides.includes("A1_LESSON_9_TOPIC_LANGUAGE") || finalSlides.includes('"Ich denke, dass ..."') && !finalSlides.includes('"Ich esse keinen Käse."')) {
  throw new Error("A1-9 topic-language validation failed.");
}
const challengeBlock = finalChecks.match(/A1_LESSON_9_CURRENT_TOPIC_CHALLENGE[\s\S]*?"A1-4\.7"/)?.[0] || "";
if (!challengeBlock || /direction|location|route|geradeaus/i.test(challengeBlock)) {
  throw new Error("A1-9 class challenge contains unrelated material.");
}

console.log("A1-9: recall is early; the later class challenge tests only food and negation.");

await import("./patchA1TopicSpecificFallback.mjs");