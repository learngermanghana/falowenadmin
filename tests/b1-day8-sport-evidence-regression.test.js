import test from "node:test";
import assert from "node:assert/strict";

import { canonicalCourseReference } from "../src/utils/canonicalCourseReference.js";
import {
  applyQuestionAwareWritingGuard,
  enrichOptionsWithQuestionAwareWritingTask,
  resolveQuestionAwareWritingTask,
} from "../src/utils/questionAwareWritingMarking.js";
import { evaluateB1WritingTaskEvidence } from "../src/utils/b1WritingTaskEvidence.js";
import { markingConsistencyWarnings } from "../src/utils/markingQuality.js";
import { writingDepthSentences } from "../src/utils/writingFeedbackDepth.js";

const submission = `TEIL 2
Liebe Forum-Mitglieder,
heute möchte ich über das Thema „Sind regelmäßige Sporteinheiten der Schlüssel zu einem gesunden Leben?“ sprechen. Ich bin überzeugt davon, dass dieses Thema unser Leben stark beeinflusst. Sport spielt eine wirklich wichtige Rolle im Alltag. Ich stimme Max zu. Sowohl Sport als auch gute Ernährung sind ziemlich essenziell, um fit zu bleiben. Einerseits bietet Sport im Alltag viele Vorteile, ein Beispiel dafür ist, dass er einem viel Energie gibt, um aktiv zu bleiben. Außerdem reduzieren Sport und Ernährung das Risiko für Krankheiten wie hohen Blutdruck, instabilen Blutzuckerspiegel usw. Zusätzlich tragen Sporteinheiten und gute Ernährung zum Stressabbau bei. Andererseits gibt es auch einige Nachteile. Ein Grund dafür ist, dass Sport manchmal viel Zeit in Anspruch nimmt. Obwohl regelmäßiges Training gut ist, kann man sich auch verletzen. Leider muss ich sagen, dass ich selten Sport mache, aber ich würde gerne häufig Sport treiben, wie Joggen, Tennis und Fußball spielen. Zusammenfassend lässt sich sagen, dass regelmäßige Sporteinheiten und gute Ernährung ziemlich wichtig sind, um ein gesundes Leben zu führen.
TEIL 3
1. A
2. B
3. B
4. C
5. B
6. C
7. C
TEIL 4
1. B
2. A
3. B
4. C
5. B`;

function publishedOptions(text = submission) {
  return enrichOptionsWithQuestionAwareWritingTask({
    referenceEntry: canonicalCourseReference("B1-3.8"),
    submission: { assignmentKey: "B1-3.8", level: "B1" },
    submissionText: text,
  });
}

function originalResult() {
  return {
    assignmentKey: "B1-3.8",
    level: "B1",
    score: 93,
    finalScore: 93,
    objectiveScore: 100,
    writingScore: 86,
    writingScorePercent: 86,
    confidence: 0.94,
    status: "marked",
    feedback: "Your position and arguments are well developed. Teil 3: 7/7 correct. Teil 4: 5/5 correct.",
    taskCompletion: { completed: 1, total: 5, missing: ["Explain your own sporting habits"] },
    reviewReasons: [{
      code: "missing_task_points",
      message: "Missing personal sport habit.",
      source: "previous_marking",
    }],
  };
}

test("current learner B1 Day 8 sport prompt uses four published requirements, not one combined pseudo-point", () => {
  const task = resolveQuestionAwareWritingTask(publishedOptions());
  assert.equal(task.source, "learner-coursebook");
  assert.match(task.taskSituationDe, /Max sagt/);
  assert.match(task.rubricVersion, /^learner-/);
  assert.equal(task.semanticEvidenceRuleSet, "B1-3.8-published");
  assert.equal(task.taskPoints.length, 4);
  assert.match(task.taskPoints[3], /personal exercise habits/);
  assert.doesNotMatch(task.taskPoints.join(" "), /end with a clear conclusion/i);
});

test("actual B1 Day 8 forum answer meets all four published points with grounded excerpts", () => {
  const task = resolveQuestionAwareWritingTask(publishedOptions());
  const evidence = evaluateB1WritingTaskEvidence(task, submission.split("TEIL 3")[0]);
  assert.deepEqual(evidence.map((item) => item.status), ["met", "met", "met", "met"]);
  assert.match(evidence[0].evidence, /Ich bin überzeugt|Ich stimme Max zu/i);
  assert.match(evidence[1].evidence, /Sport.*Vorteile/i);
  assert.match(evidence[2].evidence, /Ernährung.*fit/i);
  assert.match(evidence[3].evidence, /selten Sport mache|gerne häufig Sport treiben/i);
});

test("corrects missing task evidence without altering the independent language score or overall score", () => {
  const result = applyQuestionAwareWritingGuard(originalResult(), publishedOptions(), submission);
  assert.equal(result.taskCompletion.completed, 4);
  assert.equal(result.taskCompletion.total, 4);
  assert.deepEqual(result.missingTaskPoints, []);
  assert.equal(result.taskPointEvidence.length, 4);
  assert.equal(result.taskPointEvidence.every((item) => item.status === "met"), true);
  assert.equal(result.writingDimensions.taskFulfilment, 100);
  assert.equal(result.writingScore, 86);
  assert.equal(result.finalScore, 93);
  assert.doesNotMatch(JSON.stringify(result.reviewReasons), /missing_task_points|Missing personal sport habit/);
  assert.equal(result.status, "marked");
  assert.doesNotMatch(markingConsistencyWarnings(result, { text: submission, assignmentId: "B1-3.8" }).join(" "), /no task-point evidence|Task evidence for/);
  assert.equal(result.writingStructureReview.checks.find((item) => item.label === "Own opinion").status, "observed");
});

test("a superficial answer still fails genuine published requirements", () => {
  const short = "TEIL 2\nLiebe Forum-Mitglieder,\nSport ist wichtig. Gute Ernährung ist gesund.";
  const result = applyQuestionAwareWritingGuard(originalResult(), publishedOptions(short), short);
  assert.ok(result.taskPointEvidence.length === 4);
  assert.ok(result.missingTaskPoints.length >= 2);
  assert.equal(result.status, "needs_review");
  assert.equal(result.shouldSendAutomatically, false);
});

test("changed learner prompts must not be marked using stale Day 8 evidence rules", () => {
  const existing = canonicalCourseReference("B1-3.8");
  const changed = {
    ...existing,
    questionAwareWritingTask: {
      ...existing.questionAwareWritingTask,
      taskSituationDe: "Schreiben Sie über den Besuch in einem Fitnessstudio.",
      taskText: "Schreiben Sie über den Besuch in einem Fitnessstudio.",
      taskPointsDe: ["Schreiben Sie über den Besuch in einem Fitnessstudio."],
    },
  };
  const task = resolveQuestionAwareWritingTask({ referenceEntry: changed });
  assert.equal(task.semanticEvidenceRuleSet, undefined);
});

test("B1 feedback acknowledges an explicit Max agreement instead of asking to state a position", () => {
  const feedback = writingDepthSentences({
    level: "B1",
    assignmentKey: "B1-3.8",
    writingScore: 86,
  }, submission, "B1").join(" ");
  assert.doesNotMatch(feedback, /state the position explicitly|state your position/i);
});
