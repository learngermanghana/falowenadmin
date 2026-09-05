import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "src", "utils", "autoMarking.js");
let source = fs.readFileSync(target, "utf8");

const splitBefore = `function splitSubmissionIntoParts(submissionText = "") {
  const text = String(submissionText || "").trim();
  if (!text) return [{ partId: "unknown", title: "Unknown", text: "", confidence: 0 }];`;

const splitAfter = `function splitSubmissionIntoParts(submissionText = "") {
  const text = String(submissionText || "")
    .trim()
    // Some B1 workbook submissions repeat \"Teil 2\" for Lesen/Hören and
    // place compact objective answers on the same line. Normalize only this
    // middle-dot workbook format so legacy exam headings such as
    // \"Teil 2. Lesen Sie ...\" keep their original meaning.
    .replace(/(^|\\n)([ \\t]*(?:teil|part)[ \\t]*)2([ \\t]*·[ \\t]*(?:lesen|reading)\\b)/gi, "$1$23$3")
    .replace(/(^|\\n)([ \\t]*(?:teil|part)[ \\t]*)2([ \\t]*·[ \\t]*(?:h[oö]ren|hoeren|listening)\\b)/gi, "$1$24$3")
    .replace(/((?:teil|part)[ \\t]*[34][ \\t]*·[ \\t]*(?:lesen|reading|h[oö]ren|hoeren|listening)\\b)[ \\t]+(?=\\d{1,3}[ \\t]*[A-FX](?:\\b|[).,:;–-]))/gi, "$1\\n");
  if (!text) return [{ partId: "unknown", title: "Unknown", text: "", confidence: 0 }];`;

if (source.includes(splitBefore)) {
  source = source.replace(splitBefore, splitAfter);
} else if (!source.includes("Some B1 workbook submissions repeat")) {
  throw new Error("Could not locate splitSubmissionIntoParts insertion point");
}

const tokenBefore = `.flatMap((line) => line.split(/[,;]+/))`;
const tokenAfter = `.flatMap((line) => line.split(/[,;·•|]+/))`;

if (source.includes(tokenBefore)) {
  source = source.replace(tokenBefore, tokenAfter);
} else if (!source.includes(tokenAfter)) {
  throw new Error("Could not locate compact objective separator parser");
}

fs.writeFileSync(target, source);
console.log("Patched B1-3.9 smart marking section and compact objective parsing.");
