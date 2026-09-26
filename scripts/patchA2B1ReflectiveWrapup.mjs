import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
const source = fs.readFileSync(presenterPath, "utf8");

if (!source.includes('if (level === "A2")') || !source.includes('if (level === "B1")')) {
  throw new Error("A2/B1 dedicated teaching spines are missing.");
}

if (source.includes("// a2-b1-weekly-challenge:start") || source.includes("// b1-weekly-challenge:start")) {
  throw new Error("Legacy A2/B1 weekly speaking challenge injection detected.");
}

if (source.includes('id: "learning-reflection"') || source.includes('id: "learning-exit-ticket"')) {
  throw new Error("Repeated A2/B1 reflection pages are still present.");
}

console.log("A2/B1 dedicated teaching spines verified; duplicate weekly speaking challenges remain disabled.");
