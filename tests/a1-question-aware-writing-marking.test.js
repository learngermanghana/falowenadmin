import test from "node:test";
import assert from "node:assert/strict";

import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import {
  A1_LETTER_WRITING_ASSIGNMENTS,
  A1_WRITING_RUBRIC_VERSION,
  getA1WritingTaskSpec,
  getA1WritingTaskSpecs,
  isA1LetterWritingAssignment,
} from "../src/data/a1WritingTaskSpecs.js";
import { evaluateA1WritingTaskEvidence } from "../src/utils/a1WritingTaskEvidence.js";
import {
  applyQuestionAwareWritingGuard,
  enrichOptionsWithQuestionAwareWritingTask,
  resolveQuestionAwareWritingTask,
} from "../src/utils/questionAwareWritingMarking.js";

function referenceEntry(id) {
  const entry = Object.values(answersDictionary)
    .find((value) => String(value?.assignment_id || value?.assignmentId || "").trim().toUpperCase() === id);
  assert.ok(entry, `Missing answer dictionary entry for ${id}`);
  return entry;
}

function baseResult(writingScore = 80, objectiveScore = 100) {
  return {
    assignmentKey: "A1-13",
    level: "A1",
    writingScore,
    writingScorePercent: writingScore,
    objectiveScore,
    objectiveCorrect: 9,
    objectiveTotal: 9,
    score: Math.round((writingScore + objectiveScore) / 2),
    finalScore: Math.round((writingScore + objectiveScore) / 2),
    status: "marked",
    shouldSendAutomatically: true,
    corrections: [],
    parts: [],
  };
}

test("A1 letter writing is limited to 12.3, 13 and 14.1", () => {
  assert.deepEqual(A1_LETTER_WRITING_ASSIGNMENTS, ["A1-12.3", "A1-13", "A1-14.1"]);
  for (const key of ["A1-12.3", "A1-13", "A1-14.1"]) {
    assert.equal(isA1LetterWritingAssignment(key), true, key);
    assert.equal(getA1WritingTaskSpec(key)?.letterWriting, true, key);
  }
  for (const key of ["A1-1.1", "A1-1.2", "A1-3", "A1-12.1", "A1-12.2"]) {
    assert.equal(isA1LetterWritingAssignment(key), false, key);
    if (getA1WritingTaskSpec(key)) assert.equal(getA1WritingTaskSpec(key)?.letterWriting, false, key);
  }
});

test("A1 question-aware writing only covers the real writing tasks", () => {
  const specs = getA1WritingTaskSpecs();
  assert.equal(specs.length, 4);
  assert.deepEqual(
    specs.map((spec) => spec.assignmentKey),
    ["A1-3", "A1-12.3", "A1-13", "A1-14.1"],
  );
  for (const key of ["A1-3", "A1-12.3", "A1-13", "A1-14.1"]) {
    const spec = getA1WritingTaskSpec(key);
    assert.ok(spec, key);
    assert.equal(spec.level, "A1");
    assert.equal(spec.rubricVersion, A1_WRITING_RUBRIC_VERSION);
    assert.ok(spec.taskPoints.length >= 3);
  }
  assert.equal(getA1WritingTaskSpec("A1-1.1"), null);
  assert.equal(getA1WritingTaskSpec("A1-1.2"), null);
  assert.equal(getA1WritingTaskSpec("A1-12.2"), null);
});

test("raw A1 dictionary IDs resolve the exact question and A1-simple grading instruction", () => {
  const task = resolveQuestionAwareWritingTask({
    referenceEntry: referenceEntry("A1-13"),
    submission: { level: "A1" },
  });

  assert.equal(task.assignmentKey, "A1-13");
  assert.deepEqual(task.partIds, ["teil3"]);
  assert.equal(task.taskPoints.length, 3);
  assert.match(task.taskText, /Bina/i);
  assert.match(task.taskText, /weather/i);
  assert.match(task.gradingInstruction, /simple correct task-appropriate German/i);
  assert.match(task.gradingInstruction, /Do not require advanced connectors/i);
});

test("A1-13 reads Schreiben from Teil 3 after objective Teile and keeps an 80 language score", () => {
  const submission = `TEIL 1
1. A
2. B
3. A
4. A
5. B
6. B

TEIL 2
1. A
2. B
3. B

TEIL 3
Liebe Bina,

ich schreibe dir, weil ich leider nicht zu deiner Hochzeit kommen kann.
Es gibt einen starken Sturm und viel Schnee.
Vielleicht können wir uns nächste Woche treffen?

Viele Grüße
Momodou`;

  const guarded = applyQuestionAwareWritingGuard(
    baseResult(80, 100),
    { referenceEntry: referenceEntry("A1-13"), submission: { assignmentId: "A1-13", level: "A1" } },
    submission,
  );

  assert.equal(guarded.writingScore, 80);
  assert.equal(guarded.finalScore, 90);
  assert.deepEqual(guarded.missingTaskPoints || [], []);
  assert.equal(guarded.taskCompletion.completed, 3);
  assert.equal(guarded.taskCompletion.total, 3);
  assert.ok(guarded.taskPointEvidence.every((item) => item.status === "met"));
  assert.equal(guarded.markingRubricVersion, A1_WRITING_RUBRIC_VERSION);
});

test("A1-13 does not accept a non-weather excuse for the Wetter task", () => {
  const submission = `Teil 1
1. A
2. B
3. A
4. A
5. B
6. B

Teil 2
1. A
2. B
3. B

Teil 3
Liebe Bina,
ich kann leider nicht zu deiner Hochzeit kommen. Ich bin krank.
Vielleicht können wir uns nächste Woche treffen?
Viele Grüße
Ama`;

  const guarded = applyQuestionAwareWritingGuard(
    baseResult(92, 100),
    { referenceEntry: referenceEntry("A1-13"), submission: { assignmentId: "A1-13", level: "A1" } },
    submission,
  );

  assert.equal(guarded.writingScore, 80);
  assert.ok(guarded.missingTaskPoints.some((point) => /weather reason/i.test(point)));
  assert.equal(guarded.taskCompletion.completed, 2);
  assert.equal(guarded.taskCompletion.total, 3);
});

test("A1-14.1 accepts simple learned health language such as Ich bin krank", () => {
  const task = getA1WritingTaskSpec("A1-14.1");
  const source = `teil2
Lieber Felix,
ich kann leider nicht zu deinem Geburtstag kommen. Ich bin krank.
Können wir uns nächste Woche treffen?
Viele Grüße
Mary`;
  const evidence = evaluateA1WritingTaskEvidence(task, source);

  assert.equal(evidence.length, 3);
  assert.ok(evidence.every((item) => item.status === "met"));
  assert.match(evidence[1].evidence, /krank/i);
});



test("A1-3 treats workbook family ideas as support, not five compulsory checklist items", () => {
  const task = getA1WritingTaskSpec("A1-3");
  const evidence = evaluateA1WritingTaskEvidence(task, `teil2
Meine Familie ist klein. Meine Mutter heißt Adwoa und sie ist Lehrerin.
Mein Vater heißt Kwame. Wir wohnen in Accra.`);

  assert.equal(evidence.length, 4);
  assert.ok(evidence.every((item) => item.status === "met"));
});

test("A1-12.3 checks the informal and formal letters separately", () => {
  const task = getA1WritingTaskSpec("A1-12.3");
  const source = `teil1
Liebe Anna,
ich schreibe dir, weil du Geburtstag hast. Herzlichen Glückwunsch!
Gibt es eine Feier? Kann meine Familie mitkommen?
Liebe Grüße
Ama

teil2
Sehr geehrte Damen und Herren,
ich schreibe Ihnen, weil ich einen Deutschkurs besuchen möchte.
Wann beginnt der Kurs? Wie viel kostet der Kurs? Kann ich online bezahlen?
Mit freundlichen Grüßen
Ama Mensah`;

  const evidence = evaluateA1WritingTaskEvidence(task, source);
  assert.equal(evidence.length, 10);
  assert.ok(evidence.every((item) => item.status === "met"), JSON.stringify(evidence, null, 2));
});

test("complete A1 task evidence does not inflate the examiner's language score", () => {
  const submission = `Teil 3
Liebe Bina,
ich kann leider nicht zu deiner Hochzeit kommen. Es regnet sehr stark.
Vielleicht können wir uns nächste Woche treffen?
Viele Grüße
Ama`;

  const guarded = applyQuestionAwareWritingGuard(
    baseResult(80, 100),
    { referenceEntry: referenceEntry("A1-13"), submission: { assignmentId: "A1-13", level: "A1" } },
    submission,
  );

  assert.equal(guarded.writingScore, 80);
  assert.equal(guarded.finalScore, 90);
});

test("objective-only A1 days never gain runtime writing metadata", () => {
  for (const id of ["A1-1.1", "A1-1.2", "A1-12.2"]) {
    const entry = referenceEntry(id);
    const enriched = enrichOptionsWithQuestionAwareWritingTask({
      referenceEntry: entry,
      submission: { assignmentId: id, level: "A1" },
    });
    assert.deepEqual(enriched.referenceEntry || entry, entry, id);
    assert.equal(enriched.referenceEntry?.questionAwareWritingTask, undefined, id);
    assert.equal(enriched.referenceEntry?.writingParts, undefined, id);
  }
});

test("A1-14.1 gains its real letter-writing metadata only at marking time", () => {
  const entry = referenceEntry("A1-14.1");
  assert.equal(entry.format, "objective");
  assert.deepEqual(entry.expectedParts, ["main"]);
  assert.deepEqual(entry.referenceAnswerParts, ["main"]);
  assert.equal(entry.writingParts, undefined);

  const enriched = enrichOptionsWithQuestionAwareWritingTask({
    referenceEntry: entry,
    submission: { assignmentId: "A1-14.1", level: "A1" },
  });
  const task = enriched.referenceEntry.questionAwareWritingTask;
  assert.deepEqual(task.partIds, ["teil2"]);
  assert.equal(task.letterWriting, true);
  assert.deepEqual(enriched.referenceEntry.expectedParts, ["main", "teil2"]);
  assert.deepEqual(enriched.referenceEntry.writingParts, ["teil2"]);
  assert.deepEqual(enriched.referenceEntry.aiGradedParts, ["teil2"]);
  assert.equal(enriched.referenceEntry.partGrading?.teil2?.gradingMode, "ai_written_response");
  assert.deepEqual(enriched.referenceEntry.referenceAnswerParts, ["main"]);
});
