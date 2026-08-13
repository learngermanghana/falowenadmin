import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const anchor = 'function isWritingPart(referenceEntry = {}, partId = "main") {\n  const normalizedPartId = normalizePartId(partId);';
const replacement = 'function isWritingPart(referenceEntry = {}, partId = "main") {\n  const normalizedPartId = normalizePartId(partId);\n  const rawAnswers = referenceEntry.rawAnswers || referenceEntry.answers || {};\n  const answerValues = Object.values(rawAnswers).map((value) => String(value || "").trim().toLowerCase());\n  const writingPlaceholder = answerValues.length > 0 && answerValues.every((value) => /^(read|see|check) (the )?(comment|comments|instructions?)( for (the )?answers?)?$/.test(value));\n  if (normalizedPartId === "main" && writingPlaceholder) return true;';

if (!source.includes(replacement)) {
  if (!source.includes(anchor)) throw new Error("A1 writing placeholder anchor changed");
  source = source.replace(anchor, replacement);
}

fs.writeFileSync(target, source);
console.log("A1 placeholder answer keys no longer create objective questions.");
