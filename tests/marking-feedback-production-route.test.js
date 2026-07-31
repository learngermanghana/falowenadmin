import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { enforceRegisteredWritingScore } from "../src/utils/naturalMarkingFeedback.js";
import { reconcileFinalDeterministicFeedback } from "../src/utils/finalDeterministicFeedback.js";
import { normalizeBrowserMarkingResult } from "../src/utils/markingResultNormalization.js";

const submission = `Herren,

ich hoffe, es geht Ihnen gut.
Ich schreibe Ihnen, weil ich einen Termin beim Arzt bekommen möchte. Wann kann ich zu Ihnen kommen?
Ich möchte auch wissen, wie viel die Behandlung kostet. Zahlt meine Krankenversicherung die Behandlung?
Welche Untersuchungen oder Behandlungen empfehlen Sie?
Ich freue mich auf Ihre Antwort.
Mit freundlichen Grüßen
Diana Atteh

Teil 3
1.B
2.A
3.B
4.C
5.A

Teil 4
1.B
2.A
3.A
4.B
5.A`;

const referenceEntry = {
  assignmentKey: "A2-health-integration",
  level: "A2",
  writingParts: [{ partId: "teil2" }],
  answers: {
    teil3: { Answer1: "B", Answer2: "A", Answer3: "B", Answer4: "C", Answer5: "A" },
    teil4: {
      Answer1: "B) Mehr Obst und Gemüse essen",
      Answer2: "C) 30 Minuten",
      Answer3: "A) Der Besuch eines Fitnessstudios",
      Answer4: "B) Um Krankheiten frühzeitig zu erkennen",
      Answer5: "A) Yoga und Pilates",
    },
  },
};

function productionRoute(rawAi, previous = {}) {
  const payload = { assignmentKey: referenceEntry.assignmentKey, level: "A2", referenceEntry };
  // Firebase and browser have separate normalizers in production. Starting with
  // raw model JSON here is important: aliases and duplicated structured fields
  // must survive both boundaries before the authority filter sees them.
  const firebaseResult = normalizeBrowserMarkingResult(rawAi, payload);
  const browserResult = normalizeBrowserMarkingResult(firebaseResult, payload);
  const writingEnforced = enforceRegisteredWritingScore({
    ...previous,
    ...browserResult,
    hasRegisteredWriting: true,
    registeredWritingPart: { partId: "teil2" },
  });
  const objective = computeObjectiveScore(referenceEntry, submission, referenceEntry);
  const reconciled = reconcileFinalDeterministicFeedback(writingEnforced, objective, submission);
  return { firebaseResult, browserResult, objective, saved: reconciled };
}

const staleObjectiveAdvice = "Focus on improving your objective answers, especially for questions 1, 3, and 4 in Teil 3, where you selected incorrect options.";

test("raw Diana AI response reaches a render/save-ready authoritative result", () => {
  const route = productionRoute({
    studentName: "Diana Esi Atteh",
    score: 80,
    finalScore: 80,
    objectiveCorrect: 6,
    objectiveTotal: 10,
    writingScore: 70,
    writingScorePercent: 70,
    status: "marked",
    writingStrengths: ["The letter is polite and clearly states the purpose of the request."],
    taskCompletion: { completed: 1, total: 1 },
    nextStep: staleObjectiveAdvice,
    corrections: [{ from: "Herren,", to: "Sehr geehrte Damen und Herren,", partId: "teil2" }],
    feedback: `Solid work. ${staleObjectiveAdvice}`,
  });

  assert.equal(route.objective.correctCount, 9);
  assert.equal(route.objective.totalCount, 10);
  assert.equal(route.saved.objectiveCorrect, 9);
  assert.equal(route.saved.objectiveTotal, 10);
  assert.equal(route.saved.objectiveScore, 90);
  assert.equal(route.saved.finalScore, 80);
  assert.deepEqual(route.saved.wrongAnswers.map((row) => `${row.partId}.${row.question}`), ["teil4.2"]);
  assert.equal(route.saved.nextStep, "");
  assert.equal(route.saved.writingNextStep, "");
  assert.equal(route.saved.taskCompletion, null, "AI task totals are not assignment metadata");
  assert.equal(route.saved.aiOriginalFeedback, `Solid work. ${staleObjectiveAdvice}`);
  assert.match(route.saved.feedback, /Teil 3 is excellent/i);
  assert.match(route.saved.feedback, /Teil 4.*review.*2/i);
  assert.match(route.saved.feedback, /appointment|treatment costs|purpose of the request/i);
  assert.match(route.saved.feedback, /Sehr geehrte Damen und Herren/i);
  assert.doesNotMatch(route.saved.feedback, /questions? 1, 3,? and 4|improving your objective answers|incorrect options/i);
  assert.ok(route.saved.feedback.split(/\s+/).length <= 60);
});

test("objective claims are rejected from strengths, nested fields, and original prose", () => {
  const route = productionRoute({
    writingScorePercent: 70,
    writingStrengths: ["Teil 3 questions 1, 3 and 4 were incorrect."],
    nextStep: staleObjectiveAdvice,
    writing: { strengths: ["You selected wrong options in Teil 3."], nextStep: "Review Teil 3 answers." },
    rubric: { nextStep: "Practise objective questions 1 and 3." },
    feedback: `${staleObjectiveAdvice} Your letter clearly asks about treatment costs and insurance.`,
  });
  assert.deepEqual(route.saved.writingStrengths, []);
  assert.deepEqual(route.saved.writing.strengths, []);
  assert.equal(route.saved.writing.nextStep, "");
  assert.equal(route.saved.rubric.nextStep, "");
  assert.match(route.saved.feedback, /treatment costs|appointment/i);
  assert.doesNotMatch(route.saved.feedback, /questions? 1, 3|wrong options|objective answers/i);
});

test("valid structured writing evidence and grounded corrections survive", () => {
  const route = productionRoute({
    writingScorePercent: 70,
    writingStrengths: ["The letter asks about treatment costs and health insurance."],
    nextStep: "Use a complete formal salutation.",
    corrections: [
      { from: "Herren,", to: "Sehr geehrte Damen und Herren,", partId: "teil2" },
      { from: "invented wording", to: "replacement", partId: "teil2" },
    ],
    feedback: "Your letter clearly asks about treatment costs and insurance.",
  });
  assert.deepEqual(route.saved.corrections.map((item) => item.from), ["Herren,"]);
  assert.match(route.saved.feedback, /treatment costs|health insurance/i);
});

test("fresh marking replaces stale structured student-facing evidence", () => {
  const route = productionRoute({
    writingScorePercent: 70,
    writingStrengths: ["The appointment request is clear."],
    nextStep: "Use a complete formal salutation.",
    corrections: [],
    feedback: "The appointment request is clear.",
  }, {
    feedback: staleObjectiveAdvice,
    nextStep: staleObjectiveAdvice,
    writingStrengths: ["Questions 1, 3 and 4 are wrong."],
  });
  assert.equal(route.saved.nextStep, "Use a complete formal salutation.");
  assert.deepEqual(route.saved.writingStrengths, ["The appointment request is clear."]);
  assert.doesNotMatch(route.saved.feedback, /questions? 1, 3|objective answers/i);

  const persistenceSource = fs.readFileSync(new URL("../src/services/markingServiceBase.js", import.meta.url), "utf8");
  assert.match(persistenceSource, /setDoc\(doc\(db, "markingResults", safeSubmissionId\), \{ \.\.\.payload, createdAt: now \}\);/);
});

test("production build reapplies authority filtering after the legacy smart-marking generator", () => {
  const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const smart = pkg.scripts.prebuild.indexOf("patchSmartMarkingNaturalFeedback.mjs");
  const authority = pkg.scripts.prebuild.indexOf("patchAuthoritativeWritingAdvice.mjs");
  assert.ok(smart >= 0 && authority > smart, pkg.scripts.prebuild);
});
