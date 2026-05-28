import test from "node:test";
import assert from "node:assert/strict";
import { autoMarkSubmission } from "../src/utils/autoMarking.js";

test("objective auto-mark accepts option letter only", () => {
  const result = autoMarkSubmission({
    referenceEntry: {
      format: "objective",
      answers: {
        Answer1: "B) Um sieben Uhr",
        Answer2: "C) In Berlin",
      },
    },
    submissionText: "Answer1: B\nAnswer2: C",
  });

  assert.equal(result.score, 100);
});

test("objective auto-mark accepts answer text without option letter", () => {
  const result = autoMarkSubmission({
    referenceEntry: {
      format: "objective",
      answers: {
        Answer1: "B) Um sieben Uhr",
        Answer2: "C) In Berlin",
      },
    },
    submissionText: "Answer1: um sieben uhr\nAnswer2: In Berlin",
  });

  assert.equal(result.score, 100);
});

test("objective auto-mark catches partial correctness", () => {
  const result = autoMarkSubmission({
    referenceEntry: {
      format: "objective",
      answers: {
        Answer1: "B) Um sieben Uhr",
        Answer2: "C) In Berlin",
      },
    },
    submissionText: "Answer1: B\nAnswer2: A",
  });

  assert.equal(result.score, 50);
  assert.match(result.feedback, /1\/2/);
});

test("smart router splits A2 submission and routes Schreiben to writing, Lesen/Hören to objective keys", () => {
  const result = autoMarkSubmission({
    referenceEntry: {
      assignmentKey: "A2-Mock-1",
      level: "A2",
      answers: {
        teil3: { Answer1: "B", Answer2: "richtig" },
        teil4: { Answer1: "A", Answer2: "falsch" },
      },
    },
    submission: { assignmentKey: "A2-Mock-1", level: "A2" },
    submissionText: `Teil 2 Schreiben
Hallo Anna,
ich komme heute später, weil ich arbeiten muss. Kannst du bitte warten? Viele Gruesse

Teil 3 Lesen
1: b
2: R

Teil 4 Hören
1: A
2: false`,
  });

  assert.equal(result.level, "A2");
  assert.equal(result.objectiveCorrect, 4);
  assert.equal(result.objectiveTotal, 4);
  assert.equal(result.detectedParts.find((part) => part.partId === "teil2").partType, "writing");
  assert.equal(result.status, "marked");
});

test("A1 letter-like submission uses A1 writing rubric", () => {
  const result = autoMarkSubmission({
    referenceEntry: { assignmentKey: "A1-letter", level: "A1" },
    submission: { level: "A1", assignmentKey: "A1-letter" },
    submissionText: "Hallo Maria,\nich bin krank. Ich komme heute nicht. Wir sehen uns morgen. Viele Gruesse\nAma",
  });

  assert.equal(result.parts[0].partType, "writing");
  assert.equal(result.parts[0].result.level, "A1");
});
