import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const submission = `Teil I
1) Was mag der Autor besonders gerne?
Ans B
2) was mag der Bruder des Autors nicht?
Ans C
3) warum kauft der Autor kein Fleisch?
Ans B
4) was der vater des Autors nicht?
Ans C
5) was essen der Autor und seine schwester nicht?
Ans B
6) was mag der Hund des Autors?
Ans A
7) was mag die Mutter des Autors sehr?
Ans A
8) was backen sie oft am wochenende?
Ans C
9) Welche zutat mögen alle im kucken?
Ans C
10) wer mag keine karotten?
Ans B.

Teil 2
1) was isst Anna besonders gerne?
Ans A
2) was isst Anna Bruder zum Frühstück?
Ans B
3) was mag Anna Bruder nicht?
Ans D
4) was mag Annas Vater nicht?
Ans A
5) was backen sie manchmal am wochenende?
Ans C.

Teil 3
1) Was mögen sie gerne essen?
Ans ich esse gerne reis und Gemüse.
2) was mögen sie nicht essen?
Ich esse nicht gern Fufu.
3) was essen sie zum Frühstück mittagessen und Abendessen
Zum Frühstück essen Ich Brotmit Butter und Tee.
Zum mittagessen ich esse jollofreis mit Hähnchen
Zum Abendessen ich esse Brot mit Eier.`;

test("A1-9 accepts Ans-prefixed option letters and scores only the genuinely wrong choices", () => {
  const result = computeObjectiveScore("A1-9", submission);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 12);
  assert.equal(Math.round((result.correctCount / result.totalCount) * 100), 80);

  const wrong = Object.entries(result.details)
    .filter(([, detail]) => detail.correct === false)
    .map(([question]) => Number(question));
  assert.deepEqual(wrong, [3, 6, 12]);

  assert.equal(result.details[1].student, "B");
  assert.equal(result.details[10].student, "B");
  assert.equal(result.details[15].student, "C");
});
