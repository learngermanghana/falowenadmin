import fs from "node:fs";

const replacements = [
  {
    path: new URL("../src/utils/objectiveMarking.js", import.meta.url),
    pairs: [
      ['(?:\\\\s*[().:-]|\\\\s+|$)', '(?:\\\\s*[().:/-]|\\\\s+|$)'],
      ['(?:\\\\s*[().:-]|\\\\s+)', '(?:\\\\s*[().:/-]|\\\\s+)'],
    ],
  },
  {
    path: new URL("../src/utils/autoMarking.js", import.meta.url),
    pairs: [
      ['(?:\\s*[).:-]|\\s+|$)', '(?:\\s*[).:/-]|\\s+|$)'],
      ['(?:\\s*[).:-]|\\s+)', '(?:\\s*[).:/-]|\\s+)'],
    ],
  },
  {
    path: new URL("../api/router.js", import.meta.url),
    pairs: [
      ['(?:\\\\s*[().:-]|\\\\s+|$)', '(?:\\\\s*[().:/-]|\\\\s+|$)'],
      ['(?:\\\\s*[().:-]|\\\\s+)', '(?:\\\\s*[().:/-]|\\\\s+)'],
    ],
  },
];

for (const target of replacements) {
  let source = fs.readFileSync(target.path, "utf8");
  for (const [legacy, updated] of target.pairs) {
    if (source.includes(updated)) continue;
    if (!source.includes(legacy)) throw new Error(`Slash option parsing anchor changed in ${target.path.pathname}`);
    source = source.replace(legacy, updated);
  }
  fs.writeFileSync(target.path, source);
}

console.log("Slash-separated objective option letters are parsed deterministically.");
