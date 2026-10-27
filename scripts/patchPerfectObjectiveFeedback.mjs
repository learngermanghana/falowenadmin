import fs from "node:fs";

const target = new URL("../src/utils/naturalMarkingFeedback.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const before = '  const tip = writingTip(submissionText, result);\n  if (tip) sentences.push(tip);';
const after = [
  '  const perfectObjectiveOnly = objectiveTotal > 0',
  '    && objectiveScore === 100',
  '    && (result.writingScore === null || result.writingScore === undefined)',
  '    && (result.writingScorePercent === null || result.writingScorePercent === undefined);',
  '  const tip = perfectObjectiveOnly ? "" : writingTip(submissionText, result);',
  '  if (tip) sentences.push(tip);',
].join("\n");

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error("Perfect objective feedback anchor changed; update patchPerfectObjectiveFeedback.mjs");
  }
  source = source.replace(before, after);
}

fs.writeFileSync(target, source);
console.log("Perfect objective-only scores no longer receive unnecessary writing correction advice.");
