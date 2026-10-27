import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
const knowledgePath = new URL("../src/data/b1PresenterKnowledge.js", import.meta.url);

const presenter = fs.readFileSync(presenterPath, "utf8");
const knowledge = fs.readFileSync(knowledgePath, "utf8");

for (const marker of [
  "getB1PresenterKnowledge",
  "getB1FocusedPractice",
  'if (level === "B1")',
  'id: "grammar-check"',
  'type: "grammar-check"',
  'title: "Kollokationen & Redemittel"',
]) {
  if (!presenter.includes(marker)) throw new Error(`B1 teaching-spine marker missing: ${marker}`);
}

if (presenter.includes("B1_ACTIONABLE_PRACTICE") || presenter.includes('id: "b1-grammar-check"')) {
  throw new Error("Legacy B1 multi-stage actionable drill stack must not return.");
}

const assignments = knowledge.match(/"B1-[0-9]+\.[0-9]+":\s*\{/g) || [];
if (assignments.length !== 28) {
  throw new Error(`B1 knowledge bank must contain 28 lessons; found ${assignments.length}`);
}

console.log("B1 teaching spine verified: knowledge + short grammar diagnostic + one focused task + speaking + workbook.");
