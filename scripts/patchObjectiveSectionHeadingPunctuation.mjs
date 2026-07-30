import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const before = '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|part)[ \\t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[:;]?[ \\t]*(?=\\n|$)/gi;';
const after = '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|part)[ \\t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[.:;]?[ \\t]*(?=\\n|$)/gi;';

if (source.includes(before)) {
  source = source.replace(before, after);
} else if (!source.includes(after)) {
  throw new Error("objective section-heading parser changed; update patchObjectiveSectionHeadingPunctuation.mjs");
}

fs.writeFileSync(target, source);
console.log("Objective section headings now accept a trailing full stop, colon, or semicolon.");
