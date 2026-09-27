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

if (!source.includes('id: "quick-check"') || !source.includes('id: "grammar-check"') || !source.includes('id: "sentence-build"')) {
  throw new Error("A1 grammar-diagnostic stages are incomplete.");
}

console.log("A1 grammar-diagnostic presenter flow is build-safe.");
