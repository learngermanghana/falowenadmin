import fs from "node:fs";

const target = new URL("../src/utils/autoMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const marker = "// A1 BOOLEAN OPTION NORMALIZATION";
const before = `  const expected = normalizeAnswer(meta.raw);\n  const student = normalizeAnswer(studentRaw);\n  if (!expected || !student) return { status: \"wrong\" };\n  if (expected === student) return { status: \"correct\", reason: \"Exact answer match\" };`;
const after = `  const expected = normalizeAnswer(meta.raw);\n  const student = normalizeAnswer(studentRaw);\n  if (!expected || !student) return { status: \"wrong\" };\n\n  ${marker}\n  // A1 true/false tasks are rendered as option A = Wahr/Richtig and B = Falsch.\n  // Normalize only when the reference itself is boolean so ordinary A/B multiple-choice\n  // questions keep their existing option-letter semantics.\n  if ((expected === \"R\" || expected === \"F\") && (student === \"A\" || student === \"B\")) {\n    const booleanOption = student === \"A\" ? \"R\" : \"F\";\n    return booleanOption === expected\n      ? { status: \"correct\", reason: \"Boolean option letter normalized\" }\n      : { status: \"wrong\" };\n  }\n\n  if (expected === student) return { status: \"correct\", reason: \"Exact answer match\" };`;

if (!source.includes(marker)) {
  if (!source.includes(before)) {
    throw new Error("autoMarking valuesMatch anchor changed; update patchA1BooleanOptionNormalization.mjs");
  }
  source = source.replace(before, after);
  fs.writeFileSync(target, source, "utf8");
}

console.log("A1 boolean A/B option normalization applied.");
