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

test("registered A1 writing replaces invented reread advice with an exact correction", () => {
  const result = {
    studentName: "Samuel Kumar",
    level: "A1",
    assignmentKey: "A1-1.1",
    objectiveTotal: 4,
    objectiveCorrect: 4,
    objectiveScore: 100,
    finalScore: 100,
    writingScore: null,
    writingScorePercent: null,
    hasRegisteredWriting: true,
    nextStep: "Reread “Ich heiße Kumar Samuel.Ich komme aus Ghana und wohne in Accra” and improve one wording choice before submitting",
    wrongAnswers: [],
    objectiveDetails: {
      1: { correct: true },
      2: { correct: true },
      3: { correct: true },
      4: { correct: true },
    },
  };
  const submission = `TEIL 1
1. Anna/C
2. Italien/A
3. In einem Café/A
4. Berlin/A

TEIL 2
Guten Morgen, Freunde und Kollegen. Ich heiße Kumar Samuel. Ich komme aus Ghana und wohne in Accra. Auf Widersehen!`;

  const feedback = buildNaturalStudentFeedback(result, submission);

  assert.match(feedback, /Write “Auf Wiedersehen” instead of “Auf Widersehen”/);
  assert.doesNotMatch(feedback, /improve one wording choice|Reread “Ich heiße/i);
});
