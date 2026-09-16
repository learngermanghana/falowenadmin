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

const compactMarker = "A1_DAY5_COMPACT_PRESENTER";
if (!presenterSource.includes(compactMarker)) {
  const filterAnchor = `  ].filter((stage) => {
    if (stage.type === "intro") return true;
    return Array.isArray(stage.items) && stage.items.length > 0;
  });
}`;

  const filterReplacement = `  ].filter((stage) => {
    if (stage.type === "intro") return true;
    return Array.isArray(stage.items) && stage.items.length > 0;
  }).filter((stage) => {
    // A1_DAY5_COMPACT_PRESENTER: Day 5 is a consolidation lesson. Avoid repeating
    // the same content across speak-first/phrases, one-minute/rule, examples/
    // sentence-build, and checkpoint/can-do/exit stages.
    if (Number(slide.dayNumber) !== 5) return true;
    return ![
      "speak-first",
      "one-minute-knowledge",
      "pronunciation",
      "examples",
      "sentence-build",
      "checkpoint",
      "can-do",
    ].includes(stage.id);
  });
}`;

  if (!presenterSource.includes(filterAnchor)) {
    throw new Error("A1 Day 5 presenter stage filter anchor missing. Run patchA1LanguageFirstFlow first.");
  }
  presenterSource = presenterSource.replace(filterAnchor, filterReplacement);

  const fullFlowText = "Recall → speak first → 1-minute knowledge → useful language → grammar pattern → sentence building → mini-dialogue → class challenge → error correction → can-do check → workbook transfer → exit check.";
  const compactFlowText = `{Number(slide.dayNumber) === 5
                  ? "Recall → useful language → grammar pattern → mini-dialogue → class challenge → error correction → workbook transfer → exit check."
                  : "${fullFlowText}"}`;
  if (presenterSource.includes(fullFlowText)) {
    presenterSource = presenterSource.replace(fullFlowText, compactFlowText);
  }

  fs.writeFileSync(presenterPath, presenterSource);
}

const finalChecks = fs.readFileSync(checksPath, "utf8");
const finalPresenter = fs.readFileSync(presenterPath, "utf8");

if (/"A1-1\.3"[\s\S]{0,900}(indefinite article|in the nominative|ein or eine)/i.test(finalChecks)) {
  throw new Error("A1 Day 5 still contains premature indefinite-article/nominative teaching.");
}
if (!finalChecks.includes('check("What are der, die and das?"')) {
  throw new Error("A1 Day 5 definite-article replacement is missing.");
}
if (!finalPresenter.includes(compactMarker)) {
  throw new Error("A1 Day 5 compact presenter flow is missing.");
}

console.log("A1 Day 5 now stays with der/die/das and uses a compact, non-duplicative presenter flow.");
