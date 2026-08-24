import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const before = [
  'function splitSubmissionIntoSections(text = "") {',
  '  const sections = [];',
  '  const source = String(text || "");',
].join("\n");

const after = [
  'function splitSubmissionIntoSections(text = "") {',
  '  const sections = [];',
  '  const rawSource = String(text || "");',
  '  const qSectionAliasRegex = /(^|\\n)[ \\t]*q(?:uestion)?[ \\t]*([1-4])(?:\\.[ \\t]*\\d+(?=[ \\t]+\\d{1,3}\\s*[).:])|\\.[ \\t]*(?=\\d{1,3}\\s*[).:])|(?=[ \\t]*(?:\\n|$)))[ \\t]*/gi;',
  '  const sourceWithQAliases = rawSource.replace(',
  '    qSectionAliasRegex,',
  '    (_match, prefix, partNumber) => prefix + "Teil " + partNumber + "\\n",',
  '  );',
  '  const source = sourceWithQAliases !== rawSource',
  '    && /^\\s*\\d{1,3}\\s*[).:]/.test(sourceWithQAliases)',
  '    && /(?:^|\\n)Teil 2\\n/i.test(sourceWithQAliases)',
  '      ? "Teil 1\\n" + sourceWithQAliases',
  '      : sourceWithQAliases;',
].join("\n");

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error("splitSubmissionIntoSections anchor changed; update patchQSectionAliasHeadings.mjs");
  }
  source = source.replace(before, after);
}

fs.writeFileSync(target, source);
console.log("Objective section parsing now recognises nested Q2/Q3 aliases and preserves the implicit first section.");
