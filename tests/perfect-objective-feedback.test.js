import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

execFileSync(process.execPath, ["scripts/patchPerfectObjectiveFeedback.mjs"], { stdio: "inherit" });
const { buildNaturalStudentFeedback } = await import("../src/utils/naturalMarkingFeedback.js");

test("perfect objective-only work does not receive unnecessary writing correction advice", () => {
  const result = {
    studentName: "MATEY RUTH",
    objectiveTotal: 4,
    objectiveCorrect: 4,
    objectiveScore: 100,
    finalScore: 100,
    writingScore: null,
    writingScorePercent: null,
    wrongAnswers: [],
    objectiveDetails: {
      1: { correct: true },
      2: { correct: true },
      3: { correct: true },
      4: { correct: true },
    },
  };

  const submission = `1. C(Anna)\n2. A(Italien)\n3. A (einem cafe)\n4. A (Berlin)\n\nHallo, Guten Tag\nMein name ist Ruth Matey\nIch Komme aus Ghana\nIch Wohne in Accra.\nDanke, Tschüss`;
  const feedback = buildNaturalStudentFeedback(result, submission);

  assert.match(feedback, /4 of 4 objective questions correctly/i);
  assert.doesNotMatch(feedback, /reread|read it through|improve one wording choice|small language mistakes/i);
});
