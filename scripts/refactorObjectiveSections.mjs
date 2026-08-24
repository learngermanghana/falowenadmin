import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const importLine = 'import { parseSubmissionSections } from "./submissionSections.js";';
if (!source.includes(importLine)) {
  source = source.replace(
    'import answersDictionary from "../data/answers_dictionary.json" with { type: "json" };',
    'import answersDictionary from "../data/answers_dictionary.json" with { type: "json" };\n' + importLine,
  );
}

const start = source.indexOf('function partMarkerToPartId(');
const end = source.indexOf('function splitIntoAnswerBlocks(', start);
if (start < 0 || end < 0) {
  throw new Error("Could not locate legacy submission section parser block");
}

source = source.slice(0, start)
  + 'const splitSubmissionIntoSections = parseSubmissionSections;\n\n'
  + source.slice(end);

fs.writeFileSync(target, source);
console.log("Objective marking now uses the shared normalized submission section parser.");
