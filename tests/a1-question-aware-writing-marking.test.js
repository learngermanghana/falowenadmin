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

test("A1 has six canonical question-aware tutor-marked writing tasks", () => {
  const specs = getA1WritingTaskSpecs();
  assert.equal(specs.length, 6);
  assert.equal(new Set(specs.map((spec) => spec.assignmentKey)).size, 6);
  for (const key of ["A1-1.1", "A1-1.2", "A1-3", "A1-12.3", "A1-13", "A1-14.1"]) {
    const spec = getA1WritingTaskSpec(key);
    assert.ok(spec, key);
    assert.equal(spec.level, "A1");
    assert.equal(spec.rubricVersion, A1_WRITING_RUBRIC_VERSION);
    assert.ok(spec.taskPoints.length >= 3);
  }
});

test("A1 letter-writing prompts expose exactly three content points per email", () => {
  const intro = getA1WritingTaskSpec("A1-12.3");
  const weather = getA1WritingTaskSpec("A1-13");
  const health = getA1WritingTaskSpec("A1-14.1");

  assert.equal(intro.taskPoints.length, 6, "A1-12.3 has two letters with three content points each");
  assert.equal(intro.taskPoints.filter((point) => point.startsWith("Teil 1:")).length, 3);
  assert.equal(intro.taskPoints.filter((point) => point.startsWith("Teil 2:")).length, 3);
  assert.equal(weather.taskPoints.length, 3);
  assert.equal(health.taskPoints.length, 3);

  const allContentPoints = [...intro.taskPoints, ...weather.taskPoints, ...health.taskPoints].join("\n");
  assert.doesNotMatch(allContentPoints, /greeting|closing|name/i);
  assert.match(intro.taskText, /exactly three content points/i);
  assert.match(weather.taskText, /exactly three content points/i);
  assert.match(health.taskText, /exactly three content points/i);
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

test("A1-14.1 is the third letter-writing step and accepts simple learned health language such as Ich bin krank", () => {
  const task = getA1WritingTaskSpec("A1-14.1");
  const source = `teil2
Lieber Felix,
ich kann leider nicht zu deinem Geburtstag kommen. Ich bin krank.
Können wir uns nächste Woche treffen?
Viele Grüße
Mary`;
  const evidence = evaluateA1WritingTaskEvidence(task, source);

  assert.match(task.taskText, /Third A1 letter-writing step after A1-12\.3 and A1-13/i);
  assert.equal(task.taskPoints.length, 3);
  assert.equal(evidence.length, 3);
  assert.ok(evidence.every((item) => item.status === "met"), JSON.stringify(evidence, null, 2));
  assert.match(evidence[1].evidence, /krank/i);
});

test("A1-14.1 does not accept a non-health excuse for the health writing point", () => {
  const task = getA1WritingTaskSpec("A1-14.1");
  const evidence = evaluateA1WritingTaskEvidence(task, `teil2
Lieber Felix,
ich kann leider nicht zu deinem Geburtstag kommen. Mein Bus fährt nicht.
Können wir uns nächste Woche treffen?
Liebe Grüße
Ama`);

  assert.equal(evidence.length, 3);
  assert.equal(evidence[1].status, "missing");
  assert.match(evidence[1].label, /health reason/i);
});

test("A1-1.1 checks the exact five self-introduction points", () => {
  const task = getA1WritingTaskSpec("A1-1.1");
  const evidence = evaluateA1WritingTaskEvidence(task, `teil2
Hallo!
Ich heiße Ama.
Ich komme aus Ghana.
Ich wohne in Accra.
Tschüss!`);

  assert.equal(evidence.length, 5);
  assert.ok(evidence.every((item) => item.status === "met"));
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
  assert.equal(evidence.length, 6);
  assert.ok(evidence.every((item) => item.status === "met"), JSON.stringify(evidence, null, 2));
});

test("A1-12.3 does not let a party statement borrow the family question mark", () => {
  const task = getA1WritingTaskSpec("A1-12.3");
  const evidence = evaluateA1WritingTaskEvidence(task, `teil1
Lieber Jerome,
Herzlichen Glückwunsch zum Geburtstag.
Es gibt eine Geburtstagsfeier. Kann meine Familie mitkommen?
Viele Grüße
Samuel

teil2
Sehr geehrte Damen und Herren,
Wann beginnt der Kurs? Wie viel kostet der Kurs? Kann ich online bezahlen?
Mit freundlichen Grüßen
Samuel Kumar`);

  assert.equal(evidence.length, 6);
  assert.equal(evidence[1].status, "missing");
  assert.equal(evidence[2].status, "met");
  assert.match(evidence[1].label, /party/i);
});

test("A1-12.3 keeps a terminal date period as a sentence boundary", () => {
  const task = getA1WritingTaskSpec("A1-12.3");
  const evidence = evaluateA1WritingTaskEvidence(task, `teil1
Lieber Jerome,
Herzlichen Glückwunsch zum Geburtstag.
Es gibt eine Geburtstagsfeier am 12.10. Kann meine Familie mitkommen?
Viele Grüße
Samuel

teil2
Sehr geehrte Damen und Herren,
Wann beginnt der Kurs? Wie viel kostet der Kurs? Kann ich online bezahlen?
Mit freundlichen Grüßen
Samuel Kumar`);

  assert.equal(evidence.length, 6);
  assert.equal(evidence[1].status, "missing");
  assert.equal(evidence[2].status, "met");
  assert.match(evidence[1].label, /party/i);
});

test("A1-12.3 keeps opening delimiters after dates inside genuine questions", () => {
  const task = getA1WritingTaskSpec("A1-12.3");
  const variants = [
    "Ist eine Geburtstagsfeier am 12.10. (Samstag) geplant?",
    "Ist eine Geburtstagsfeier am 12.10. [Samstag] geplant?",
    "Ist eine Geburtstagsfeier am 12.10. {Samstag} geplant?",
  ];

  for (const partyQuestion of variants) {
    const evidence = evaluateA1WritingTaskEvidence(task, `teil1
Lieber Jerome,
Herzlichen Glückwunsch zum Geburtstag.
${partyQuestion}
Kann meine Familie mitkommen?
Viele Grüße
Samuel

teil2
Sehr geehrte Damen und Herren,
Wann beginnt der Kurs? Wie viel kostet der Kurs? Kann ich online bezahlen?
Mit freundlichen Grüßen
Samuel Kumar`);

    assert.equal(evidence[1].status, "met", partyQuestion);
    assert.equal(evidence[2].status, "met", partyQuestion);
    assert.match(evidence[1].evidence, /Geburtstagsfeier/i);
  }
});

test("A1-12.3 preserves dates and abbreviations inside genuine party questions", () => {
  const task = getA1WritingTaskSpec("A1-12.3");
  const variants = [
    "Ist eine Geburtstagsfeier am 12.10. geplant?",
    "Ist eine Geburtstagsfeier z. B. am Samstag geplant?",
  ];

  for (const partyQuestion of variants) {
    const evidence = evaluateA1WritingTaskEvidence(task, `teil1
Lieber Jerome,
Herzlichen Glückwunsch zum Geburtstag.
${partyQuestion}
Kann meine Familie mitkommen?
Viele Grüße
Samuel

teil2
Sehr geehrte Damen und Herren,
Wann beginnt der Kurs? Wie viel kostet der Kurs? Kann ich online bezahlen?
Mit freundlichen Grüßen
Samuel Kumar`);

    assert.equal(evidence[1].status, "met", partyQuestion);
    assert.equal(evidence[2].status, "met", partyQuestion);
    assert.match(evidence[1].evidence, /Geburtstagsfeier/i);
  }
});

test("A1-12.3 accepts Samuel's clear party and course-cost questions despite A1 spelling errors", () => {
  const submission = `TEIL 1
Lieber Jerome,
Ich hoffe, dass es dir gut geht. Ich schreibe dir, weil ich dir zum Geburtstag gratulieren möchte.Gibt es eine Geburtstagfeier?Kann meine Familie mitkommen? Ich werde Kekse und Geschenke für deinen Geburtstag mitbringen.

Viele Grüße,
Samuel.

TEIL 2
Sehr geehrte Damen und Herren,
Ich hoffe,dass es Ihnen gut geht.Ich schreibe Ihnen, weil Ich den Deutschkurz besuchen möchte. Wann beginnt der Kurs? Wie veil kostet der Kurs? Kann Ich online bezahlen?
Mit freundlichen Grüßen,
Samuel Kumar.`;

  const task = getA1WritingTaskSpec("A1-12.3");
  const evidence = evaluateA1WritingTaskEvidence(task, submission);

  assert.equal(evidence.length, 6);
  assert.ok(evidence.every((item) => item.status === "met"), JSON.stringify(evidence, null, 2));
  assert.match(evidence[1].evidence, /Geburtstagfeier/i);
  assert.match(evidence[4].evidence, /Wie veil kostet der Kurs/i);

  const guarded = applyQuestionAwareWritingGuard({
    assignmentKey: "A1-12.3",
    level: "A1",
    writingScore: 70,
    writingScorePercent: 70,
    score: 70,
    finalScore: 70,
    status: "marked",
    shouldSendAutomatically: true,
    taskCompletion: {
      completed: 4,
      total: 6,
      missing: [
        "Teil 1: Ask whether there is a party",
        "Teil 2: Ask how much the course costs",
      ],
    },
    missingTaskPoints: [
      "Teil 1: Ask whether there is a party",
      "Teil 2: Ask how much the course costs",
    ],
    reviewReasons: [{
      code: "missing_task_points",
      message: "Required writing points are missing: Teil 1: Ask whether there is a party; Teil 2: Ask how much the course costs.",
      source: "question_aware_writing",
    }],
    corrections: [{
      partId: "teil2",
      from: "Wie veil kostet der Kurs?",
      to: "Wie viel kostet der Kurs?",
      reason: "Spelling error in 'viel'.",
    }],
    parts: [],
  }, {
    referenceEntry: referenceEntry("A1-12.3"),
    submission: { assignmentId: "A1-12.3", level: "A1" },
  }, submission);

  assert.deepEqual(guarded.missingTaskPoints || [], []);
  assert.equal(guarded.taskCompletion.completed, 6);
  assert.equal(guarded.taskCompletion.total, 6);
  assert.equal(guarded.writingDimensions.taskFulfilment, 100);
  assert.equal(guarded.writingScore, 70, "task fulfilment repair must not inflate the language score");
  assert.equal((guarded.reviewReasons || []).some((item) => item.code === "missing_task_points"), false);
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

test("A1-13 recovers a missing writing score instead of falling back to objective-only 100", () => {
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
Hallo, David

Ich schreibe dir, weil es regnet und ich kann nicht zu deiner Geburstagsfeier kommen.
Bielleicht können wir uns möchste Woche treffen.
Es regnen sehr stark.

Liebe Grüße.

Andrews`;

  const guarded = applyQuestionAwareWritingGuard(
    {
      assignmentKey: "A1-13",
      level: "A1",
      objectiveScore: 100,
      objectiveCorrect: 9,
      objectiveTotal: 9,
      score: 100,
      finalScore: 100,
      writingScore: null,
      writingScorePercent: null,
      status: "marked",
      shouldSendAutomatically: true,
      corrections: [],
      parts: [],
    },
    { referenceEntry: referenceEntry("A1-13"), submission: { assignmentId: "A1-13", level: "A1" } },
    submission,
  );

  assert.ok(Number(guarded.writingScore) > 0);
  assert.ok(guarded.finalScore < 100);
  assert.equal(guarded.taskCompletion.completed, 2);
  assert.equal(guarded.taskCompletion.total, 3);
  assert.equal(guarded.missingTaskPoints.length, 1);
  assert.match(guarded.missingTaskPoints[0], /wedding/i);
  assert.equal(guarded.status, "needs_review");
  assert.equal(guarded.shouldSendAutomatically, false);
  assert.equal(guarded.ai?.recoveredMissingWritingScore, true);
});

test("A1-13 counts intended heavy rain as task evidence even when the verb form is wrong", () => {
  const task = getA1WritingTaskSpec("A1-13");
  const evidence = evaluateA1WritingTaskEvidence(task, `Teil 3
Hallo David,
ich kann nicht zu deiner Geburtstagsfeier kommen.
Es regnen sehr stark.
Vielleicht können wir uns nächste Woche treffen.
Liebe Grüße
Andrews`);

  assert.equal(evidence[1].status, "met");
  assert.match(evidence[1].evidence, /regnen sehr stark/i);
});

test("legacy flat A1 objective manifests stay unchanged and gain Schreiben only at marking time", () => {
  for (const id of ["A1-1.1", "A1-1.2"]) {
    const entry = referenceEntry(id);
    assert.equal(entry.format, "objective", id);
    assert.deepEqual(entry.expectedParts, ["main"], id);
    assert.deepEqual(entry.referenceAnswerParts, ["main"], id);
    assert.equal(entry.writingParts, undefined, id);

    const enriched = enrichOptionsWithQuestionAwareWritingTask({
      referenceEntry: entry,
      submission: { assignmentId: id, level: "A1" },
    });
    const task = enriched.referenceEntry.questionAwareWritingTask;
    assert.deepEqual(task.partIds, ["teil2"], id);
    assert.equal(task.rubricVersion, A1_WRITING_RUBRIC_VERSION, id);
    assert.deepEqual(enriched.referenceEntry.expectedParts, ["main", "teil2"], id);
    assert.deepEqual(enriched.referenceEntry.writingParts, ["teil2"], id);
    assert.deepEqual(enriched.referenceEntry.aiGradedParts, ["teil2"], id);
    assert.equal(enriched.referenceEntry.partGrading?.teil2?.gradingMode, "ai_written_response", id);
    assert.deepEqual(enriched.referenceEntry.referenceAnswerParts, ["main"], id);
  }
});

test("A1-14.1 appointment reading remains objective despite historical health letter specs", () => {
  const entry = referenceEntry("A1-14.1");
  assert.deepEqual(entry.expectedParts, ["teil1", "teil2", "teil3"]);
  assert.deepEqual(entry.referenceAnswerParts, ["teil1", "teil2", "teil3"]);
  assert.deepEqual(entry.writingParts, []);
  assert.deepEqual(entry.aiGradedParts, []);
  assert.equal(entry.partGrading.teil2.gradingMode, "answer_key");
  const options = { referenceEntry: entry, submission: { assignmentKey: "A1-14.1", level: "A1", questionAwareWritingTask: getA1WritingTaskSpec("A1-14.1") } };
  assert.equal(resolveQuestionAwareWritingTask(options), null);
  assert.equal(enrichOptionsWithQuestionAwareWritingTask(options), options);
});
