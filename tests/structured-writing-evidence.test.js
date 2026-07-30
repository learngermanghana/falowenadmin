import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const FRED_SUBMISSION = `Hallo Carmen,

ich hoffe, es geht dir gut.
Ich schreibe dir, weil ich dich zu einem Campingausflug einladen möchte.

Mein ideales Wochenende wäre ein Campingausflug, bei dem wir wandern und die Natur genießen können. Außerdem können wir im Wald zelten und abends die Sterne beobachten.

Falls es regnet, bleiben wir zu Hause oder gehen stattdessen ins Museum.

Kannst du bitte eine Flasche Wasser mitbringen?
Du kannst dich auf viel Spaß freuen, denn wir wollen in den Wald gehen und Beeren pflücken.

Ich freue mich auf deine Antwort.

Viele Grüße
Fred

Lesen
1.b
2.c
3.c
4.a
5.a`;

test("Fred A2 feedback uses preserved OpenAI writing evidence instead of generic coaching", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Fred Baah-Acheamfour",
    level: "A2",
    assignmentKey: "A2-8.21",
    objectiveScore: 80,
    objectiveCorrect: 4,
    objectiveTotal: 5,
    wrongAnswers: [{ partId: "teil3", question: 1 }],
    writingScore: 82,
    hasRegisteredWriting: true,
    writingStrengths: [
      "Your invitation gives concrete plans such as “wandern”, “im Wald zelten” and “die Sterne beobachten”",
    ],
    taskCompletion: { completed: 4, total: 4, missing: [] },
    corrections: [],
    nextStep: "Avoid repeating “Campingausflug” by using “Campingwochenende” once",
  }, FRED_SUBMISSION);

  assert.match(feedback, /4 of 5 objective answers are correct/);
  assert.match(feedback, /In Teil 3, review 1/);
  assert.match(feedback, /wandern.*im Wald zelten.*Sterne beobachten/);
  assert.match(feedback, /all 4 task points/);
  assert.match(feedback, /Campingwochenende/);
  assert.doesNotMatch(feedback, /Check verb position, articles and every task point/);
  assert.doesNotMatch(feedback, /pleasant weekend/i);
  assert.ok(feedback.split(/\s+/).length <= 60);
});

test("production patch preserves structured fields in both OpenAI normalizers", () => {
  const functionsSource = read("functions/index.js");
  const browserSource = read("src/services/markingServiceBase.js");
  const patchSource = read("scripts/patchStructuredWritingEvidence.mjs");
  const packageSource = read("package.json");
  const firebaseConfig = read("firebase.json");
  const deployWorkflow = read(".github/workflows/deploy-firebase.yml");

  for (const source of [functionsSource, browserSource]) {
    assert.match(source, /writingStrengths:/);
    assert.match(source, /taskCompletion:/);
    assert.match(source, /missingTaskPoints:/);
    assert.match(source, /writingNextStep:/);
  }

  assert.match(functionsSource, /Return writingStrengths as one or two short evidence-based strengths/);
  assert.match(functionsSource, /Never invent a correction merely to fill a field/);
  assert.match(patchSource, /Structured OpenAI writing evidence is preserved/);
  assert.match(packageSource, /patchStructuredWritingEvidence\.mjs/);
  assert.match(firebaseConfig, /node scripts\/patchStructuredWritingEvidence\.mjs/);
  assert.match(deployWorkflow, /scripts\/patchStructuredWritingEvidence\.mjs/);
  assert.match(deployWorkflow, /grep -F 'writingStrengths:' functions\/index\.js/);
});
