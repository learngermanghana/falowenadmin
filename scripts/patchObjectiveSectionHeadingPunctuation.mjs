import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const markerBefore = '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|part)[ \\t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[:;]?[ \\t]*(?=\\n|$)/gi;';
const markerAfter = '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|part)[ \\t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[.:;]?[ \\t]*(?=\\n|$)/gi;';
const markerWithCommonTypo = '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|tiel|part)[ \\t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[.:;]?[ \\t]*(?=\\n|$)/gi;';
const markerWithInlineAnswers = '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|tiel|part)[ \\t]*([1-4])(?:[ \\t]*(?:[.:;|·•–-][ \\t]*)?(?:lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing))?|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[.:;]?[ \\t]*/gi;';

if (source.includes(markerBefore)) {
  source = source.replace(markerBefore, markerAfter);
} else if (!source.includes(markerAfter) && !source.includes(markerWithCommonTypo) && !source.includes(markerWithInlineAnswers)) {
  throw new Error("objective section-heading parser changed; update patchObjectiveSectionHeadingPunctuation.mjs");
}

const lineSplitting = '.split(/\\r?\\n/)';
const compactOptionSplitting = '.split(/\\r?\\n|,(?=\\s*\\d{1,3}\\s*[A-FX](?:\\b|[).,:;–-]))/i)';
if (source.includes(lineSplitting)) {
  source = source.split(lineSplitting).join(compactOptionSplitting);
} else if (!source.includes(compactOptionSplitting)) {
  throw new Error("objective compact option-list splitting changed; update patchObjectiveSectionHeadingPunctuation.mjs");
}

fs.writeFileSync(target, source);
console.log("Objective section headings accept punctuation and compact comma-separated option lists.");
