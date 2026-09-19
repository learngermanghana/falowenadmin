import test from "node:test";
import assert from "node:assert/strict";

import { insertC2DictionaryEntries } from "../scripts/lib/c2DictionaryPatch.mjs";

const C2_SAMPLE = [
  {
    assignment_id: "C2-1.1",
    chapter: "1.1",
    de: "Kreislaufwirtschaft und Wegwerfgesellschaft",
    en: "Kreislaufwirtschaft und Wegwerfgesellschaft",
  },
];

test("C2 dictionary insertion survives generated C1 Object.fromEntries syntax", () => {
  const source = [
    'import { C1_CANONICAL_TITLES } from "./c1CanonicalCurriculum.js";',
    "",
    "export const courseDictionary = {",
    '  A2: { "A2-1.1": { assignment_id: "A2-1.1", chapter: "1.1", de: "Small Talk", en: "Small Talk" } },',
    "  C1: Object.fromEntries(",
    "    C1_CANONICAL_TITLES.map((title, index) => {",
    "      const day = index + 1;",
    "      const assignmentId = 'C1 ' + day;",
    "      return [assignmentId, { assignment_id: assignmentId, chapter: String(day), de: title, en: title }];",
    "    }),",
    "  ),",
    "};",
    "",
    "function dictionarySortValue(entry = {}) {",
    "  return entry.chapter;",
    "}",
    "",
  ].join("\n");

  const patched = insertC2DictionaryEntries(source, C2_SAMPLE);

  assert.match(patched, /C1: Object\.fromEntries\(/);
  assert.match(patched, /C2: \{/);
  assert.match(patched, /"C2-1\.1"/);
  assert.ok(patched.indexOf("C1: Object.fromEntries") < patched.indexOf("C2: {"));
  assert.ok(patched.indexOf("C2: {") < patched.indexOf("function dictionarySortValue"));
  assert.equal((patched.match(/C2: \{/g) || []).length, 1);

  const secondPass = insertC2DictionaryEntries(patched, C2_SAMPLE);
  assert.equal(secondPass, patched, "C2 insertion must remain idempotent");
});

test("C2 dictionary insertion fails clearly when the top-level dictionary boundary is absent", () => {
  assert.throws(
    () => insertC2DictionaryEntries("export const courseDictionary = {", C2_SAMPLE),
    /function boundary missing|top-level closing boundary missing/,
  );
});
