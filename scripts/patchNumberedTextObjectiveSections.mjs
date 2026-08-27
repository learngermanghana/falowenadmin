import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "src/utils/autoMarking.js");
let content = fs.readFileSync(file, "utf8");

function replaceOnce(needle, replacement, label) {
  if (content.includes(replacement)) return;
  if (!content.includes(needle)) throw new Error(`Could not find ${label}`);
  content = content.replace(needle, replacement);
}

function replaceAny(needles, replacement, label) {
  if (content.includes(replacement)) return;
  const needle = needles.find((candidate) => content.includes(candidate));
  if (!needle) throw new Error(`Could not find ${label}`);
  content = content.replace(needle, replacement);
}

replaceAny(
  [
    'const markerRegex = /(?:^|\\n)\\s*((?:teil|part)\\s*(?:[1-4]|eins|zwei|drei|vier|one|two|three|four)\\b[^\\n]*|(?:schreiben|lesen|h[oö]ren|hoeren|writing|reading|listening)\\b[^\\n]*)\\s*:?\\s*(?=\\n|$)/gi;',
    'const markerRegex = /(?:^|\\n)\\s*((?:teil|part)\\s*(?:[1-4]|iv|iii|ii|i|eins|zwei|drei|vier|one|two|three|four)\\b[^\\n]*|(?:schreiben|lesen|h[oö]ren|hoeren|writing|reading|listening)\\b[^\\n]*)\\s*:?\\s*(?=\\n|$)/gi;',
  ],
  'const markerRegex = /(?:^|\\n)\\s*((?:teil|part)\\s*\\(?\\s*(?:[1-4]|iv|iii|ii|i|eins|zwei|drei|vier|one|two|three|four)(?=\\s|\\)|:|$)\\s*\\)?[^\\n]*|(?:schreiben|lesen|h[oö]ren|hoeren|writing|reading|listening)\\b[^\\n]*)\\s*:?\\s*(?=\\n|$)/gi;',
  "part heading parser",
);

replaceOnce(
  'const textAnswer = trimmed.match(/^(?:answer|antwort|frage|aufgabe|task|exercise|nr\\.?|q)?\\s*(\\d{1,3})\\s*[).:–-]\\s*(.+)$/i);',
  'const textAnswer = trimmed.match(/^(?:answer|antwort|frage|aufgabe|task|exercise|nr\\.?|q)?\\s*(?:\\d{1,3}\\s*[.]\\s*)?(\\d{1,3})\\s*[).:–-]\\s*(.+)$/i);',
  "numbered text answer parser",
);

replaceOnce(
  '    if (numbered && isObjectiveOptionAnswer(numbered.answer)) return count + 1;',
  '    if (numbered && String(numbered.answer || "").trim()) return count + 1;',
  "objective evidence counter",
);

replaceOnce(
  '  const parts = splitSubmissionIntoParts(text).filter((part) => part.partId !== "unknown");\n  const objectiveParts = parts.filter((part) => countObjectiveAnswerEvidence(part.text) > 0);',
  '  const parts = splitSubmissionIntoParts(text).filter((part) => part.partId !== "unknown");\n  const objectiveParts = parts.filter((part) => countObjectiveAnswerEvidence(part.text) > 0);',
  "objective part selection",
);

fs.writeFileSync(file, content, "utf8");
console.log("Patched numbered text objective sections.");
