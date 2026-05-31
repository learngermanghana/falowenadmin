import test from "node:test";
import assert from "node:assert/strict";
import { autoMarkSubmission, checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

test("deterministic parser scores Anzeige A-F-X answers without AI", () => {
  const result = checkDeterministicObjectiveAnswers({
    referenceEntry: {
      answers: `teil3:
Answer1. Anzeige: f
Answer2. Anzeige: c
Answer3. Anzeige: X
Answer4. Anzeige: b
Answer5. Anzeige: a`,
    },
    submissionText: `Lesen

1. F
2. C
3. C
4. E
5. A`,
  });

  assert.equal(result.objectiveScore, 60);
  assert.equal(result.objectiveCorrect, 3);
  assert.equal(result.objectiveTotal, 5);
  assert.deepEqual(result.wrongAnswers.map(({ question, expected, student }) => ({ question, expected, student })), [
    { question: 3, expected: "X", student: "C" },
    { question: 4, expected: "B", student: "E" },
  ]);
  assert.equal(result.detectedParts[0].summary, "teil3: 5 objective answers found, 3 correct, 2 wrong");
});

test("deterministic parser scores numbered Anzeige answers", () => {
  const result = checkDeterministicObjectiveAnswers({
    referenceEntry: {
      format: "objective",
      answers: `1 Anzeige A
2 Anzeige B
3 Anzeige B
4 Anzeige A
5 Anzeige A`,
    },
    submissionText: `1 Anzeige A
2 Anzeige B
3 Anzeige B
4 Anzeige A
5 Anzeige B`,
  });

  assert.equal(result.objectiveScore, 80);
  assert.equal(result.objectiveCorrect, 4);
  assert.equal(result.objectiveTotal, 5);
  assert.deepEqual(result.wrongAnswers.map(({ question, expected, student }) => ({ question, expected, student })), [
    { question: 5, expected: "A", student: "B" },
  ]);
});

test("deterministic parser supports German body-part vocabulary pairs", () => {
  const result = checkDeterministicObjectiveAnswers({
    referenceEntry: {
      format: "objective",
      answers: `Head Kopf
Arm Arm
Leg Bein
Eye Auge
Nose Nase
Ear Ohr
Mouth Mund
Hand Hand
Foot Fuß
Stomach/Belly Bauch`,
    },
    submissionText: `Head Kopf
Arm Arm
Leg Beine
Eye Auge
Nose Nase
Ear Ohr
Mouth Mund
Hand Hand
Foot Fuß
Stomach Magen`,
  });

  assert.equal(result.objectiveCorrect, 8);
  assert.equal(result.objectiveTotal, 10);
  assert.equal(result.objectiveScore, 80);
  assert.deepEqual(result.wrongAnswers.map(({ question, expected, student }) => ({ question, expected, student })), [
    { question: 3, expected: "BEIN", student: "Beine" },
    { question: 10, expected: "BAUCH", student: "Magen" },
  ]);
});

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

test("A1 14.1 deterministic checker extracts Anzeige and body-part vocabulary answers", () => {
  const referenceEntry = {
    assignmentKey: "A1-14.1",
    level: "A1",
    format: "objective",
    answers: {
      Answer1: "Frage 1: Anzeige A",
      Answer2: "Frage 2: Anzeige B",
      Answer3: "Frage 3: Anzeige B",
      Answer4: "Frage 4: Anzeige A",
      Answer5: "Frage 5: Anzeige A",
      Answer6: "a. Head – Kopf",
      Answer7: "b. Arm – Arm",
      Answer8: "c. Leg – Bein",
      Answer9: "d. Eye – Auge",
      Answer10: "e. Nose – Nase",
      Answer11: "f. Ear – Ohr",
      Answer12: "g. Mouth – Mund",
      Answer13: "h. Hand – Hand",
      Answer14: "i. Foot – Fuß",
      Answer15: "j. Stomach / Belly – Bauch",
    },
  };

  const result = checkDeterministicObjectiveAnswers({
    referenceEntry,
    submissionText: `1 Anzeige A
2.Anzeige B
3 Anzeige B
4 Anzeige A
5 Anzeige B
Head - Kopf
Arm - Arm
Leg - Beine
Eye - Auge
Nose - Nase
Ear - Ohr
Mouth - Mund
Hand - Hand
Foot - fuss
Stomach - Magen`,
  });

  assert.equal(result.objectiveCorrect, 12);
  assert.equal(result.objectiveTotal, 15);
  assert.equal(result.objectiveScore, 80);
  assert.equal(result.wrongAnswers.length, 3);
  assert.deepEqual(result.detectedParts[0], { partId: "main", partType: "objective", correct: 12, total: 15 });
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

import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { normalizeAnswerDictionary, normalizeSingleAnswer } from "../src/utils/answerKeyNormalizer.js";

test("normalizes option-letter answer metadata for registry import", () => {
  const normalized = normalizeSingleAnswer("Answer1", "B) Tanzen", 0);

  assert.deepEqual(normalized.acceptedAnswers.slice(0, 3), ["B", "Tanzen", "B Tanzen"]);
  assert.equal(normalized.questionNumber, "1");
  assert.equal(normalized.correctLetter, "B");
  assert.equal(normalized.correctText, "Tanzen");
});

test("objective matching accepts stem and close spelling but flags conflicting option plus text", () => {
  const referenceEntry = {
    format: "objective",
    answers: { Answer1: "B) Tanzen", Answer2: "B) Tanzen", Answer3: "B) Tanzen" },
  };

  const result = autoMarkSubmission({
    referenceEntry,
    submissionText: "1: Tanz\n2: tansen\n3: A Tanzen",
  });

  assert.equal(result.objectiveCorrect, 2);
  assert.equal(result.status, "needs_review");
  assert.match(result.parts[0].result.needsReview[0].reason, /Conflicting option letter/);
});

test("objective matching treats correct option letter as primary over wrong text", () => {
  const result = autoMarkSubmission({
    referenceEntry: { assignmentKey: "A1-3", level: "A1", format: "objective", answers: { Answer1: "B) Tanzen" } },
    submission: { assignmentKey: "A1-3", level: "A1" },
    submissionText: "1: B Schwimmen",
  });

  assert.equal(result.objectiveCorrect, 1);
  assert.equal(result.status, "marked");
});

test("normalizes uploaded A2/B1 dictionary entries with Teil 3 and Teil 4 parts", () => {
  const registry = normalizeAnswerDictionary(answersDictionary);
  const a2 = registry.find((entry) => entry.assignmentKey === "A2-1.1");
  const b1 = registry.find((entry) => entry.assignmentKey === "B1-1.1");

  assert.ok(a2.parts.teil3.answerCount > 0);
  assert.ok(a2.parts.teil4.answerCount > 0);
  assert.ok(b1.parts.teil3.answerCount > 0);
  assert.ok(b1.parts.teil4.answerCount > 0);
});


test("marking proxy combines deterministic objective score with Schreiben feedback", async () => {
  const { default: handler } = await import("../api/router.js");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      result: {
        score: 100,
        finalScore: 100,
        objectiveScore: 100,
        objectiveCorrect: 12,
        objectiveTotal: 12,
        feedback: "Objective-only placeholder from upstream AI.",
        parts: [],
        status: "marked",
      },
    }),
  });

  const req = {
    method: "POST",
    url: "/marking/ai",
    headers: { host: "localhost", "content-type": "application/json" },
    body: {
      assignmentKey: "A2-1.1",
      level: "A2",
      submission: { name: "Melchizedek", assignmentKey: "A2-1.1", level: "A2" },
      referenceEntry: {
        assignmentKey: "A2-1.1",
        level: "A2",
        expectedParts: ["teil3", "teil4"],
        parts: {
          teil3: { answers: ["B", "B", "C", "C", "B", "A", "B"].map((correctLetter, index) => ({ questionNumber: String(index + 1), correctLetter })) },
          teil4: { answers: ["B", "C", "B", "A", "B"].map((correctLetter, index) => ({ questionNumber: String(index + 1), correctLetter })) },
        },
      },
      submissionText: `Teil 2:
Lieber Felix,
Wie geht es dir? Ich hoffe, es geht dir gut.
Ich schreibe dir, weil ich Accra und Kumasi vergleiche und auch Pizza und Hamburger sowie Fußball und Tennis vergleiche.
Zuerst finde ich Accra interessanter als Kumasi, weil Accra viel schöner und sauberer ist.
Meiner Meinung nach ist Pizza besser als Hamburger, weil sie leckerer ist.
Zum Schluss, Fußball macht mehr Spaß als Tennis, weil es spannender ist.
Ich freue mich auf deine Antwort.
Viele Grüße,
Melchizedek.

Teil 3:
1. B
2. B
3. C
4. C
5. B
6. A
7. B

Teil 4:
1. B
2. C
3. B
4. A
5. B`,
    },
  };

  let statusCode = 0;
  let jsonBody;
  const res = {
    status(code) { statusCode = code; return this; },
    json(body) { jsonBody = body; return body; },
    send(body) { jsonBody = body; return body; },
    setHeader() {},
  };

  try {
    await handler(req, res);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const result = jsonBody.result;
  assert.equal(statusCode, 200);
  assert.equal(result.objectiveScore, 100);
  assert.equal(result.objectiveCorrect, 12);
  assert.equal(result.objectiveTotal, 12);
  assert.ok(result.writingScore > 0);
  assert.ok(result.finalScore < 100);
  assert.ok(result.parts.some((part) => part.partType === "writing"));
  assert.match(result.feedback, /Writing marked/);
  assert.match(result.feedback, /12 of 12 objective questions/);
});
