import fs from "node:fs";

const filePath = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
const remove = new Set([
  "node scripts/patchObjectiveWritingPartDetection.mjs",
  "node scripts/patchObjectiveAnswerTimeParsing.mjs",
  "node scripts/patchObjectivePromptAnswerParsing.mjs",
  "node scripts/patchA1PricePreferenceMarking.mjs",
  "node scripts/patchObjectiveSectionHeadingPunctuation.mjs",
  "node scripts/patchObjectiveGrammarConsistency.mjs",
  "node scripts/patchInlineObjectiveSectionAnswers.mjs",
  "node scripts/patchNumberedTextObjectiveSections.mjs",
  "node scripts/patchReorderedObjectiveGroups.mjs",
  "node scripts/patchSequentialMultipartIsolation.mjs",
  "node scripts/patchMultipartObjectiveAnswerBlocks.mjs",
]);

for (const key of ["predev", "prebuild", "pretest"]) {
  if (!pkg.scripts?.[key]) continue;
  pkg.scripts[key] = pkg.scripts[key]
    .split(" && ")
    .filter((step) => !remove.has(step.trim()))
    .join(" && ");
}

fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log("Removed legacy objectiveMarking patch execution from dev/build/test lifecycle scripts.");
