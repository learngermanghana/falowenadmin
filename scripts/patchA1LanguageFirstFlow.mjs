import fs from "node:fs";

const presenterPath = new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url);
const source = fs.readFileSync(presenterPath, "utf8");

const marker = "const A1_GRAMMAR_CHECK_FLOW_VERSION = 3;";

if (!source.includes(marker)) {
  throw new Error("A1 grammar-diagnostic presenter flow is missing. Update A1GrammarPresenter.jsx instead of regenerating the old language-first flow.");
}

if (source.includes('id: "speak-first"') || source.includes('id: "mini-dialogue"') || source.includes('id: "one-minute-knowledge"')) {
  throw new Error("A1 Presenter still contains teaching-first stages that duplicate the grammar page.");
}

if (!source.includes('id: "quick-check"') || !source.includes('id: "grammar-check"') ||
    !source.includes('id: "mini-mission"') || !source.includes('id: "listen-respond"') ||
    !source.includes('id: "exit-check"')) {
  throw new Error("A1 grammar checks and classroom speaking stages are incomplete.");
}
if (source.includes('id: "sentence-build"') || source.includes('id: "workbook",')) {
  throw new Error("Retired A1 sentence-build and workbook bridge stages must stay removed.");
}

console.log("A1 grammar-diagnostic presenter flow is build-safe.");
