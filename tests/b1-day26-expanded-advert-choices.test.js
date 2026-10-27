import test from "node:test";
import assert from "node:assert/strict";
import { extractChoiceAnswers, compareAnswers, computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { parseSubmissionSections } from "../src/utils/submissionSections.js";

test("B1 Day 26 parses A-H and unmatched X in numbered multi-part responses", () => {
  const submission = `TEIL 3
1. A
2. B
3. X
4. D
5. E
6. F
7. H`;
  const sections = parseSubmissionSections(submission);
  assert.ok(sections.some(section => section.partId === "teil3"));
  const answers = extractChoiceAnswers(submission);
  assert.deepEqual(Object.values(answers).slice(0,7), ["A","B","X","D","E","F","H"]);
  assert.equal(compareAnswers({1:"A",2:"B",3:"X",4:"D",5:"E",6:"F",7:"H"},answers).correctCount,7);
});

test("the objective grader awards credit for a correct H and X, including labelled options", () => {
  const ref={ format:"objective", answers:{ Answer1:"H) Hunde-Tagesbetreuung", Answer2:"X) Keine passende Anzeige" } };
  const output=computeObjectiveScore(ref, "1. H\n2. X");
  assert.equal(output.correctCount,2);
  assert.equal(output.totalCount,2);
});
