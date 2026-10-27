import test from "node:test";
import assert from "node:assert/strict";

import { parseSubmissionSections } from "../src/utils/submissionSections.js";

test("normalizes Q2 and Q3.1 aliases while preserving implicit Teil 1", () => {
  const sections = parseSubmissionSections(`
1. B) Ärztin
2. A) Weil sie keine Zeit hat
3. B) Um 8 Uhr
4. C) Viele verschiedene Fächer
5. C) Einen Sprachkurs besuchen
Q2. 1. B) Falsch
2. B) Falsch
3. B) Falsch
4. B) Falsch
5. B) Falsch
Q3.1 1. A) Richtig
2. B) Falsch
3. A) Richtig
4. B) Falsch
5. A) Richtig
`);

  assert.deepEqual(sections.map((section) => section.partId), ["teil1", "teil2", "teil3"]);
  assert.match(sections[0].text, /1\. B\) Ärztin/);
  assert.match(sections[1].text, /1\. B\) Falsch/);
  assert.match(sections[2].text, /1\. A\) Richtig/);
});

test("recognizes standard, misspelled and descriptive headings", () => {
  const sections = parseSubmissionSections(`
Tiel 1: Lesen
1. A
Teil 2 - Schreiben
Hallo Anna, ich komme später.
Teil 3 · Lesen
1. B
Teil 4: Hören
1. C
`);

  assert.deepEqual(sections.map((section) => section.partId), ["teil1", "teil2", "teil3", "teil4"]);
});

test("leaves unlabelled submissions as one main section", () => {
  const sections = parseSubmissionSections("1. A 2. B 3. C");
  assert.equal(sections.length, 1);
  assert.equal(sections[0].partId, "main");
});
