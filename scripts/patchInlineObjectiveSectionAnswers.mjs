import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const after = '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|tiel|part)[ \\t]*([1-4])(?:[ \\t]*(?:[.:;|·•–-][ \\t]*)?(?:lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing))?|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[.:;]?[ \\t]*/gi;';

if (!source.includes(after)) {
  const markerLine = source.match(/^\s*const markerRegex = \/.*\/gi;\s*$/m)?.[0];
  if (!markerLine) {
    throw new Error("Inline objective section parser could not find markerRegex in objectiveMarking.js.");
  }
  source = source.replace(markerLine, after);
}

fs.writeFileSync(target, source);
console.log("Objective marking accepts compact same-line Teil/Lesen/Hören answer sections.");
