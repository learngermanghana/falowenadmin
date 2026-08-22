import fs from "node:fs";

const filePath = new URL("../src/data/answers_dictionary.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

const entry = Object.values(data).find((candidate) => String(candidate?.assignment_id || candidate?.assignmentId || "").toUpperCase() === "B1-2.4");
if (!entry) {
  throw new Error("B1-2.4 answer-key entry was not found in answers_dictionary.json");
}

const teil3 = entry.answers?.teil3;
const teil4 = entry.answers?.teil4;
if (!teil3 || !teil4) {
  throw new Error("B1-2.4 must contain Teil 3 and Teil 4 objective answer groups");
}

// The live Falowen B1 Day 2.4 assignment contains five Lesen questions and five Hören questions.
// Remove the two stale Lesen answers that made Admin score the assignment as 12 objective questions.
delete teil3.Answer6;
delete teil3.Answer7;

const teil3Keys = Object.keys(teil3).filter((key) => /^Answer\d+$/i.test(key));
const teil4Keys = Object.keys(teil4).filter((key) => /^Answer\d+$/i.test(key));
if (teil3Keys.length !== 5 || teil4Keys.length !== 5) {
  throw new Error(`B1-2.4 objective key mismatch: expected 5 Teil 3 + 5 Teil 4 answers, found ${teil3Keys.length} + ${teil4Keys.length}`);
}

fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
console.log("B1-2.4 answer key aligned to the live assignment: 5 Teil 3 + 5 Teil 4 objective questions (10 total).");
