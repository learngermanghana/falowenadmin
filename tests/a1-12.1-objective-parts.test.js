import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const josephineSubmission = `
1.b)Ärztin
2.a)Weil sie keine zeit hat
3.b)I'm 8 Uhr
4.c)Viele verschiedene Fächer
5.c)Einen sprachkurs besuchen

Teil2
1.b)Falsch
2.b)Falsch
3.a)Richtig
4.b)Falsch
5.b)Falsch

Teil3
1.a)Richtig
2.b)Falsch
3.a)Richtig
4.a)Richtig
5.a) Richtig
`;

const deborahSubmission = `
Teil 1. Lesen Sie den Aufsatz und wählen Sie die richtige Antwort.
1. B) Ärztin
2. A) Weil sie keine Zeit hat
3. B) Um 8 Uhr
4. C) Viele verschiedene Fächer
5. C) Einen Sprachkurs besuchen

Teil 2. Lesen Sie die Anzeigen und beantworten Sie die Fragen
1. B) Falsch
2. B) Falsch
3. B) Falsch
4. B) Falsch
5. B) Falsch

Teil 3. Hören
1. A) Richtig
2. B) Falsch
3. A) Richtig
4. B) Falsch
5. A) Richtig
`;

test("A1-12.1 keeps objective Teil 2 and scores Josephine 13 of 15", () => {
  const result = computeObjectiveScore("A1-12.1", josephineSubmission);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 13);
  assert.equal(result.details["teil2.3"].correct, false);
  assert.equal(result.details["teil3.2"].correct, false);
  assert.equal(Object.values(result.details).filter((detail) => detail.partId === "teil2").length, 5);
});

test("A1-12.1 keeps objective Teil 2 and scores Deborah 13 of 15", () => {
  const result = computeObjectiveScore("A1-12.1", deborahSubmission);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 13);
  assert.equal(result.details["teil3.2"].correct, false);
  assert.equal(result.details["teil3.4"].correct, false);
  assert.equal(Object.values(result.details).filter((detail) => detail.partId === "teil2").length, 5);
});

test("registered A2 writing Teil 2 remains excluded from objective scoring", () => {
  const result = computeObjectiveScore("A2-1.1", `
Teil 2:
Hallo Anna,
ich komme heute später, weil ich arbeiten muss.

Teil 3:
1. C
2. B
3. A
4. B
5. B
6. B
7. C

Teil 4:
1. B
2. A
3. A
4. B
5. C
`);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  assert.equal(Object.values(result.details).filter((detail) => detail.partId === "teil2").length, 0);
});
