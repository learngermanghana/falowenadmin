import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
const knowledgePath = new URL("../src/data/a2PresenterKnowledge.js", import.meta.url);

const presenter = fs.readFileSync(presenterPath, "utf8");
const knowledge = fs.readFileSync(knowledgePath, "utf8");

const requiredPresenterMarkers = [
  'getA2PresenterKnowledge',
  'getA2FocusedPractice',
  'id: "knowledge"',
  'type: "knowledge"',
  'title: "Grammatik · Muster verstehen"',
  'id: "practice"',
  'id: "questions"',
  'id: "workbook"',
];

for (const marker of requiredPresenterMarkers) {
  if (!presenter.includes(marker)) throw new Error(`A2 teaching-spine marker missing: ${marker}`);
}

if (presenter.includes("A2_ACTIONABLE_PRACTICE")) {
  throw new Error("Legacy multi-stage A2 actionable practice bank must not return.");
}

const assignments = knowledge.match(/"A2-[0-9]+\.[0-9]+":\s*\{/g) || [];
if (assignments.length !== 28) {
  throw new Error(`A2 knowledge bank must contain 28 lessons; found ${assignments.length}`);
}

console.log("A2 presenter teaching spine verified: Wissensimpuls + grammar + one focused practice + speaking + workbook.");
