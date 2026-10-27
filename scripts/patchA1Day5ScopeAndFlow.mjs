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
const presenterSource = fs.readFileSync(presenterPath, "utf8");
const diagnosticMarker = "const A1_GRAMMAR_CHECK_FLOW_VERSION = 3;";

if (!presenterSource.includes(diagnosticMarker)) {
  throw new Error("A1 grammar-diagnostic presenter marker is missing.");
}
if (presenterSource.includes('id: "speak-first"') || presenterSource.includes('id: "mini-dialogue"')) {
  throw new Error("A1 Presenter must remain grammar-check focused outside the dedicated speaking-readiness lesson.");
}

const finalChecks = fs.readFileSync(checksPath, "utf8");
if (/"A1-1\\.3"[\\s\\S]{0,900}(indefinite article|in the nominative|ein or eine)/i.test(finalChecks)) {
  throw new Error("A1 Day 5 still contains premature indefinite-article/nominative teaching.");
}
if (!finalChecks.includes('check("What are der, die and das?"')) {
  throw new Error("A1 Day 5 definite-article replacement is missing.");
}

console.log("A1 Day 5 scope is correct and the grammar-diagnostic presenter is preserved.");

await import("./patchA1Lesson9Clarity.mjs");
