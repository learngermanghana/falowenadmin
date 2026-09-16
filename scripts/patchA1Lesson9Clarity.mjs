import fs from "node:fs";

const presenterPath = new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url);
let presenterSource = fs.readFileSync(presenterPath, "utf8");

const recallMarker = "A1_LESSON_9_TOPIC_RECALL";
if (!presenterSource.includes(recallMarker)) {
  const anchor = `function buildRetrievalChecks(slide = {}) {
  const day = Number(slide.dayNumber || 0);
  if (day <= 1) return [];

  const bank = [`;

  const replacement = `function buildRetrievalChecks(slide = {}) {
  const day = Number(slide.dayNumber || 0);
  if (day <= 1) return [];

  // A1_LESSON_9_TOPIC_RECALL: recall belongs only near the start of A1-9.
  // It revisits Modalverben and Goethe A1 Sprechen Teil 3, the lessons directly
  // before A1-9. The later class challenge must test today's food/negation topic.
  const assignmentId = cleanText(slide.assignmentId).toUpperCase();
  if (assignmentId === "A1-9") {
    return [
      makeCheck(
        "Make one polite Goethe Teil 3 request with können + bitte.",
        "For example: Kannst du mir bitte den Stift geben?",
        "Recall the polite request pattern from the previous Goethe speaking lesson.",
      ),
      makeCheck(
        "Your partner says: ‘Kannst du mir bitte den Stift geben?’ How do you react politely?",
        "For example: Ja, gern. / Ja, natürlich.",
        "A short appropriate reaction is enough.",
      ),
      makeCheck(
        "Make one sentence with können, müssen or möchten.",
        "For example: Ich kann Deutsch sprechen. / Wir müssen heute lernen. / Ich möchte Wasser trinken.",
        "Recall the modal-verb lesson immediately before the Goethe speaking lesson.",
      ),
    ];
  }

  const bank = [`;

  if (!presenterSource.includes(anchor)) {
    throw new Error("A1 lesson 9 retrieval anchor missing. Run patchA1LanguageFirstFlow first.");
  }
  presenterSource = presenterSource.replace(anchor, replacement);
}

const promptMarker = "A1_PHRASE_APPLICATION_CLARITY";
if (!presenterSource.includes(promptMarker)) {
  const anchor = `    ...(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []).map((phrase) => makeCheck(
      \`Use this language in a new sentence: “\${phrase}”\`,
      \`Accept a new correct sentence that follows the pattern in “\${phrase}”.\`,
      "Do not accept simple repetition when the learner can reasonably personalise the phrase.",
    )),`;

  const replacement = `    ...(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []).map((phrase) => makeCheck(
      // A1_PHRASE_APPLICATION_CLARITY
      \`Change one clear detail in this model and say the new complete sentence: “\${phrase}”\`,
      "Keep the same sentence pattern, but change one clear detail such as the person, action, food/object, time or place.",
      "The learner should produce a different complete sentence, not simply repeat the model.",
    )),`;

  if (!presenterSource.includes(anchor)) {
    throw new Error("A1 phrase-application prompt anchor missing.");
  }
  presenterSource = presenterSource.replace(anchor, replacement);
}

fs.writeFileSync(presenterPath, presenterSource);

const slidesPath = new URL("../src/data/teachingSlides.js", import.meta.url);
let slidesSource = fs.readFileSync(slidesPath, "utf8");

const slideMarker = "A1_LESSON_9_TOPIC_LANGUAGE";
if (!slidesSource.includes(slideMarker)) {
  const helperAnchor = `\nfunction buildLevelSlides(level) {`;
  const helper = `
function enhanceA1Lesson9TopicLanguage(slide) {
  // A1_LESSON_9_TOPIC_LANGUAGE
  const assignmentId = String(slide.assignmentId || "").trim().toUpperCase();
  if (assignmentId !== "A1-9") return slide;

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
      "Keep the useful language at A1 level: short food sentences learners can immediately personalise.",
      "Contrast kein with a noun and nicht with a verb or adjective using concrete examples before asking for rules.",
      "Do not introduce opinion clauses with dass in this lesson.",
      "Use familiar food vocabulary so the grammar, not new vocabulary, remains the main challenge.",
    ],
  };
}
`;

  if (!slidesSource.includes(helperAnchor)) {
    throw new Error("A1 lesson 9 teaching-slide helper anchor missing.");
  }
  slidesSource = slidesSource.replace(helperAnchor, `${helper}${helperAnchor}`);

  const a1Anchor = `const a1Slides = buildLevelSlides("A1").map((slide) => curatedSlidesByAssignment[slide.assignmentId] || slide);`;
  const a1Replacement = `const a1Slides = buildLevelSlides("A1")
  .map((slide) => curatedSlidesByAssignment[slide.assignmentId] || slide)
  .map(enhanceA1Lesson9TopicLanguage);`;

  if (!slidesSource.includes(a1Anchor)) {
    throw new Error("A1 lesson list anchor missing for A1-9 topic-language patch.");
  }
  slidesSource = slidesSource.replace(a1Anchor, a1Replacement);
}

fs.writeFileSync(slidesPath, slidesSource);

const understandingPath = new URL("../src/data/a1PresenterUnderstandingChecks.js", import.meta.url);
let understandingSource = fs.readFileSync(understandingPath, "utf8");

const challengeMarker = "A1_LESSON_9_CURRENT_TOPIC_CHALLENGE";
if (!understandingSource.includes(challengeMarker)) {
  const anchor = `const A1_PRESENTER_UNDERSTANDING_OVERRIDES = {
  "A1-4.7": [`;
  const replacement = `const A1_PRESENTER_UNDERSTANDING_OVERRIDES = {
  // A1_LESSON_9_CURRENT_TOPIC_CHALLENGE: this pool is used by the later
  // class challenge. It deliberately excludes recall, directions and locations.
  "A1-9": [
    check(
      "What is the basic difference between kein and nicht?",
      "Use kein with a noun phrase such as kein Brot / keine Milch / keinen Käse. Use nicht to negate a verb, adjective or the wider statement.",
    ),
    check(
      "Make this sentence negative: ‘Ich esse Käse.’",
      "For example: Ich esse keinen Käse.",
    ),
    check(
      "Make this sentence negative: ‘Wir haben Milch.’",
      "Wir haben keine Milch.",
    ),
    check(
      "Make this sentence negative: ‘Die Suppe ist warm.’",
      "Die Suppe ist nicht warm.",
    ),
    check(
      "Make this sentence negative: ‘Ich koche heute.’",
      "Ich koche heute nicht.",
    ),
    check(
      "Choose kein or nicht: ‘Ich trinke ___ Kaffee.’ Explain your choice.",
      "keinen: Ich trinke keinen Kaffee. Kaffee is the noun being negated, and it is masculine accusative here.",
    ),
    check(
      "Choose kein or nicht: ‘Das Essen ist ___ lecker.’ Explain your choice.",
      "nicht: Das Essen ist nicht lecker. The adjective lecker is being negated.",
    ),
    check(
      "Why do we say ‘keine Milch’ but ‘keinen Käse’?",
      "kein changes with the noun. Milch is feminine, so keine; Käse is masculine accusative after essen, so keinen.",
    ),
    check(
      "Say one food you do not eat using kein/keine/keinen.",
      "For example: Ich esse keinen Fisch. / Ich esse keine Wurst. Accept another correct food sentence.",
    ),
    check(
      "Say one food or drink you do not have using kein/keine/keinen.",
      "For example: Ich habe keinen Kaffee. / Ich habe keine Milch. Accept another correct sentence.",
    ),
    check(
      "Say one sentence with nicht about food or cooking.",
      "For example: Die Suppe ist nicht heiß. / Ich koche heute nicht.",
    ),
    check(
      "Correct this sentence: ‘Ich esse nicht Käse.’",
      "In this meaning use kein: Ich esse keinen Käse.",
    ),
  ],
  "A1-4.7": [`;

  if (!understandingSource.includes(anchor)) {
    throw new Error("A1 understanding override anchor missing for A1-9 challenge patch.");
  }
  understandingSource = understandingSource.replace(anchor, replacement);
}

fs.writeFileSync(understandingPath, understandingSource);

const finalPresenter = fs.readFileSync(presenterPath, "utf8");
const finalSlides = fs.readFileSync(slidesPath, "utf8");
const finalUnderstanding = fs.readFileSync(understandingPath, "utf8");

if (!finalPresenter.includes(recallMarker)) {
  throw new Error("A1-9 topic-specific recall patch is missing.");
}
if (!finalPresenter.includes(promptMarker)) {
  throw new Error("A1 participation prompt clarity patch is missing.");
}
if (!finalSlides.includes(slideMarker)) {
  throw new Error("A1-9 topic-specific useful language patch is missing.");
}
if (!finalSlides.includes('"Ich esse keinen Käse."')) {
  throw new Error("A1-9 food/negation useful language is missing.");
}
if (!finalUnderstanding.includes(challengeMarker)) {
  throw new Error("A1-9 current-topic class challenge is missing.");
}
if (/A1_LESSON_9_CURRENT_TOPIC_CHALLENGE[\s\S]{0,5000}(direction|location)/i.test(finalUnderstanding)) {
  throw new Error("A1-9 class challenge still contains direction/location material.");
}

console.log("A1-9 recall stays at the start; later class questions test only food and negation, with clearer prompts.");