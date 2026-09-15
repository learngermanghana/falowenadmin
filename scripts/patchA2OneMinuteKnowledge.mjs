import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);

// Compatibility cleanup only. The presenter source now owns the A2 warm-up and
// Day 19 interactive stages directly, so this build hook must never rewrite
// those stages or fail when their implementation changes.
let source = fs.readFileSync(presenterPath, "utf8");

const knowledgeStage = `    {\n      id: "knowledge",\n      type: "task",\n      kicker: "1 Minute",\n      title: "1-Minute-Wissen",\n      body: slide.knowledgeTextDe || "",\n      suggestedMinutes: 1,\n    },\n`;

while (source.includes(knowledgeStage)) {
  source = source.replace(knowledgeStage, "");
}

fs.writeFileSync(presenterPath, source);
console.log("A2 presenter compatibility cleanup complete; interactive stages are source-owned.");
