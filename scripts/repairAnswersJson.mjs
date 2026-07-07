import fs from "node:fs";

const filePath = new URL("../src/data/answers_dictionary.json", import.meta.url);
let source = fs.readFileSync(filePath, "utf8");

function removeTrailingCommasOutsideStrings(value) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === ",") {
      let lookahead = index + 1;
      while (lookahead < value.length && /\s/.test(value[lookahead])) lookahead += 1;
      if (value[lookahead] === "}" || value[lookahead] === "]") {
        continue;
      }
    }

    output += char;
  }

  return output;
}

function describeJsonError(error, value) {
  const positionMatch = String(error?.message || "").match(/position\s+(\d+)/i);
  if (!positionMatch) return String(error?.message || error);

  const position = Number(positionMatch[1]);
  const before = value.slice(0, position);
  const line = before.split("\n").length;
  const column = position - before.lastIndexOf("\n");
  const context = value.split("\n").slice(Math.max(0, line - 3), line + 2).join("\n");
  return `${error.message}\nNear line ${line}, column ${column}:\n${context}`;
}

source = source
  .replace(
    '"Answer3": "B) Maria trägt oft eine schwarze Brille"\n        "Answer4"',
    '"Answer3": "B) Maria trägt oft eine schwarze Brille",\n        "Answer4"',
  )
  .replace(
    '"Answer4": "B) Jonas ist groß und sportlich"\n        "Answer5"',
    '"Answer4": "B) Jonas ist groß und sportlich",\n        "Answer5"',
  );

source = removeTrailingCommasOutsideStrings(source);

try {
  JSON.parse(source);
} catch (error) {
  throw new SyntaxError(describeJsonError(error, source));
}

fs.writeFileSync(filePath, source);
console.log("answers_dictionary.json is valid JSON.");

const liveClassesPath = new URL("../src/pages/LiveClassesPage.jsx", import.meta.url);
let liveClassesSource = fs.readFileSync(liveClassesPath, "utf8");
const oldProgressCall = "calculateClassProgress(dashboard?.sessions || [])";
const newProgressCall = "calculateClassProgress(dashboard?.sessions || [], new Date(), dashboard?.klass || {})";

if (liveClassesSource.includes(oldProgressCall)) {
  liveClassesSource = liveClassesSource.replace(oldProgressCall, newProgressCall);
} else if (!liveClassesSource.includes(newProgressCall)) {
  throw new Error("Could not find the Live Classes progress calculation to update.");
}

fs.writeFileSync(liveClassesPath, liveClassesSource);
console.log("Live Classes progress now uses the cohort start and graduation dates.");

await import("./applyMarkingManualSelectionFix.mjs");
