import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const candidates = [
  '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|part)[ \\t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[:;]?[ \\t]*(?=\\n|$)/gi;',
  '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|part)[ \\t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[.:;]?[ \\t]*(?=\\n|$)/gi;',
  '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|tiel|part)[ \\t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[.:;]?[ \\t]*(?=\\n|$)/gi;',
];
const after = '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|tiel|part)[ \\t]*([1-4])(?:[ \\t]*(?:[.:;|·•–-][ \\t]*)?(?:lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing))?|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[.:;]?[ \\t]*/gi;';

if (!source.includes(after)) {
  const before = candidates.find((candidate) => source.includes(candidate));
  if (!before) {
    throw new Error("Inline objective section parser anchor changed; update patchInlineObjectiveSectionAnswers.mjs.");
  }
  source = source.replace(before, after);
}

fs.writeFileSync(target, source);
console.log("Objective marking accepts compact same-line Teil/Lesen/Hören answer sections.");
