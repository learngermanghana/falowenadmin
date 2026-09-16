import fs from "node:fs";

const checksPath = new URL("../src/data/a1GrammarChecks.js", import.meta.url);
let checksSource = fs.readFileSync(checksPath, "utf8");

const oldDay5Checks = `  "A1-1.3": [
    check("What is an indefinite article in German?", "ein or eine used when a noun is not yet specific or is being introduced."),
    check("How do you know whether to use ein or eine in the nominative?", "Use ein with masculine and neuter nouns, and eine with feminine nouns."),
    check("Why is noun gender important when learning German vocabulary?", "Because gender affects articles and later also case and adjective endings."),
    check("What is the basic word order of a simple German self-introduction sentence?", "Usually subject + conjugated verb + the remaining information."),
  ],`;

const newDay5Checks = `  "A1-1.3": [
    check("What are der, die and das?", "They are the definite articles used with German nouns."),
    check("Which article goes with Tisch, Lampe and Auto?", "der Tisch, die Lampe, das Auto."),
    check("Why should you learn a noun together with der, die or das?", "Because the article helps you remember the noun's gender."),
    check("What is the basic word order of a simple German self-introduction sentence?", "Usually subject + conjugated verb + the remaining information."),
  ],`;

if (!checksSource.includes(newDay5Checks)) {
  if (!checksSource.includes(oldDay5Checks)) {
    throw new Error("A1 Day 5 grammar-check anchor missing.");
  }
  checksSource = checksSource.replace(oldDay5Checks, newDay5Checks);
  fs.writeFileSync(checksPath, checksSource);
}

const presenterPath = new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url);
let presenterSource = fs.readFileSync(presenterPath, "utf8");

const compactMarker = "A1_COMPACT_DEDUPED_PRESENTER";
if (!presenterSource.includes(compactMarker)) {
  const filterAnchor = `  ].filter((stage) => {
    if (stage.type === "intro") return true;
    return Array.isArray(stage.items) && stage.items.length > 0;
  });
}`;

  const helper = `
function normalizeA1StageItem(value = "") {
  return cleanText(String(value || "")
    .replace(/^Rule\\s+\\d+\\s*:\\s*/i, "")
    .replace(/^\\d+\\.\\s*/, ""))
    .toLocaleLowerCase("de-DE");
}

function dedupeA1PresenterStages(stages = [], slide = {}) {
  // A1_COMPACT_DEDUPED_PRESENTER: every presenter stage must add a distinct
  // teaching purpose. These generated stages repeat content that already appears
  // elsewhere in the same lesson and therefore do not need their own slide.
  const redundantStageIds = new Set([
    "speak-first",          // built from model examples + key phrases
    "one-minute-knowledge",// built from the same grammar focus as rule
    "can-do",              // generic self-check repeated by workbook + exit check
  ]);

  // Day 5 is intentionally a short consolidation lesson. It does not need a
  // milestone checkpoint or extra model/sentence slides after the same material
  // has already been practised through articles, dialogue and the class check.
  const day5RedundantStageIds = new Set([
    "pronunciation",
    "examples",
    "sentence-build",
    "checkpoint",
  ]);

  const seenItemKeys = new Set();
  const seenStageSignatures = new Set();
  const crossStageDedupIds = new Set([
    "phrases",
    "pronunciation",
    "rule",
    "examples",
    "mini-dialogue",
    "mistakes",
  ]);

  const result = [];
  for (const stage of stages) {
    if (!stage) continue;
    if (redundantStageIds.has(stage.id)) continue;
    if (Number(slide.dayNumber) === 5 && day5RedundantStageIds.has(stage.id)) continue;

    if (stage.type === "intro") {
      result.push(stage);
      continue;
    }

    if (!Array.isArray(stage.items) || stage.items.length === 0) continue;

    const withinStage = [];
    const withinStageKeys = new Set();
    for (const item of stage.items) {
      const key = normalizeA1StageItem(typeof item === "string" ? item : JSON.stringify(item));
      if (!key || withinStageKeys.has(key)) continue;
      withinStageKeys.add(key);
      withinStage.push(item);
    }

    let items = withinStage;
    if (crossStageDedupIds.has(stage.id)) {
      items = withinStage.filter((item) => {
        const key = normalizeA1StageItem(typeof item === "string" ? item : JSON.stringify(item));
        if (!key || seenItemKeys.has(key)) return false;
        seenItemKeys.add(key);
        return true;
      });
    }

    if (!items.length) continue;

    const signature = items
      .map((item) => normalizeA1StageItem(typeof item === "string" ? item : JSON.stringify(item)))
      .filter(Boolean)
      .sort()
      .join("||");
    if (signature && seenStageSignatures.has(signature)) continue;
    if (signature) seenStageSignatures.add(signature);

    result.push({ ...stage, items });
  }

  return result;
}
`;

  if (!presenterSource.includes(filterAnchor)) {
    throw new Error("A1 presenter stage filter anchor missing. Run patchA1LanguageFirstFlow first.");
  }

  const filterReplacement = `  ];

  return dedupeA1PresenterStages(stages.filter((stage) => {
    if (stage.type === "intro") return true;
    return Array.isArray(stage.items) && stage.items.length > 0;
  }), slide);
}`;

  // Convert the anonymous returned array into a named list so the generic
  // deduplication policy can inspect the complete lesson before rendering it.
  const returnArrayAnchor = `  return [\n`;
  const stageListIndex = presenterSource.indexOf("function stageList(slide, topicLabel)");
  if (stageListIndex < 0) {
    throw new Error("A1 presenter stageList function missing.");
  }
  const returnArrayIndex = presenterSource.indexOf(returnArrayAnchor, stageListIndex);
  if (returnArrayIndex < 0) {
    throw new Error("A1 presenter stage array anchor missing.");
  }
  presenterSource = `${presenterSource.slice(0, returnArrayIndex)}  const stages = [\n${presenterSource.slice(returnArrayIndex + returnArrayAnchor.length)}`;
  presenterSource = presenterSource.replace(filterAnchor, filterReplacement);

  const stageListFunctionIndex = presenterSource.indexOf("function stageList(slide, topicLabel)");
  presenterSource = `${presenterSource.slice(0, stageListFunctionIndex)}${helper}\n${presenterSource.slice(stageListFunctionIndex)}`;

  const verboseFlowText = "Recall → speak first → 1-minute knowledge → useful language → grammar pattern → sentence building → mini-dialogue → class challenge → error correction → can-do check → workbook transfer → exit check.";
  const compactFlowText = "Recall → useful language → grammar pattern → focused practice → class challenge → error correction → workbook transfer → exit check. Extra stages appear only when they add a distinct teaching purpose.";
  presenterSource = presenterSource.replace(verboseFlowText, compactFlowText);

  fs.writeFileSync(presenterPath, presenterSource);
}

const finalChecks = fs.readFileSync(checksPath, "utf8");
const finalPresenter = fs.readFileSync(presenterPath, "utf8");

if (/"A1-1\\.3"[\\s\\S]{0,900}(indefinite article|in the nominative|ein or eine)/i.test(finalChecks)) {
  throw new Error("A1 Day 5 still contains premature indefinite-article/nominative teaching.");
}
if (!finalChecks.includes('check("What are der, die and das?"')) {
  throw new Error("A1 Day 5 definite-article replacement is missing.");
}
if (!finalPresenter.includes(compactMarker)) {
  throw new Error("A1 presenter-wide deduplication policy is missing.");
}
if (!finalPresenter.includes('"speak-first",          // built from model examples + key phrases')) {
  throw new Error("A1 duplicate speak-first stage guard is missing.");
}
if (!finalPresenter.includes('"one-minute-knowledge",// built from the same grammar focus as rule')) {
  throw new Error("A1 duplicate one-minute stage guard is missing.");
}

console.log("A1 presenter deduplication is enabled across all lessons; Day 5 remains scoped to der/die/das.");

await import("./patchA1Lesson9Clarity.mjs");