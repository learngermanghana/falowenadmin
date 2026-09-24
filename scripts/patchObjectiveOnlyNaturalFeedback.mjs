import fs from "node:fs";

const target = new URL("../src/utils/naturalMarkingFeedback.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const earlyGuard = 'function writingTip(submissionText = "", result = {}) {\n  if (result.hasRegisteredWriting === false) return "";';
if (!source.includes(earlyGuard)) {
  const legacyGuard = 'function writingTip(submissionText = "", result = {}) {\n  if (result.hasRegisteredWriting !== true) return "";';
  if (source.includes(legacyGuard)) {
    source = source.replace(legacyGuard, earlyGuard);
  } else {
    const anchor = 'function writingTip(submissionText = "", result = {}) {';
    if (!source.includes(anchor)) throw new Error("objective-only writing-tip guard anchor changed; update patchObjectiveOnlyNaturalFeedback.mjs");
    source = source.replace(anchor, earlyGuard);
  }
}

const oldLine = '  return looksLikeFreeText(text) ? "Your free-text response is clear; read it through once more before submitting to catch small language mistakes." : "";';
const newLine = '  return result.hasRegisteredWriting === true && looksLikeFreeText(text) ? "Your free-text response is clear; read it through once more before submitting to catch small language mistakes." : "";';

if (!source.includes(newLine)) {
  if (!source.includes(oldLine)) throw new Error("objective-only natural feedback anchor changed; update patchObjectiveOnlyNaturalFeedback.mjs");
  source = source.replace(oldLine, newLine);
}

fs.writeFileSync(target, source);
console.log("Objective-only assignments no longer receive any writing-tip feedback.");
