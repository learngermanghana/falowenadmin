import test from "node:test";
import assert from "node:assert/strict";
import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

function questionNumber(detailKey = "", fallback = 1) {
  const match = String(detailKey).match(/(\d+)$/);
  return match ? Number(match[1]) : fallback;
}

function canonicalSubmissionFromDetails(details = {}, marker = ".") {
  const groups = [];
  const byPart = new Map();

  Object.entries(details).forEach(([key, detail], index) => {
    const partId = String(detail?.partId || "main");
    if (!byPart.has(partId)) {
      const group = { partId, answers: [] };
      byPart.set(partId, group);
      groups.push(group);
    }
    byPart.get(partId).answers.push({
      number: questionNumber(key, index + 1),
      answer: detail?.expectedDisplay || detail?.rawExpected || detail?.expected || "",
    });
  });

  return groups.map((group) => {
    const heading = group.partId === "main"
      ? ""
      : `Teil ${Number(group.partId.replace("teil", "")) || group.partId}\n`;
    const answers = group.answers
      .map(({ number, answer }) => `${number}${marker} ${String(answer)}`)
      .join("\n");
    return `${heading}${answers}`.trim();
  }).filter(Boolean).join("\n\n");
}

test("every objective assignment key accepts multipart-aware canonical perfect submissions", () => {
  const covered = [];
  const failures = [];

  for (const assignmentId of Object.keys(answersDictionary || {})) {
    const baseline = computeObjectiveScore(assignmentId, "");
    if (!baseline.totalCount || !Object.keys(baseline.details || {}).length) continue;

    const variants = [
      canonicalSubmissionFromDetails(baseline.details, "."),
      canonicalSubmissionFromDetails(baseline.details, ")"),
    ];

    for (const [variantIndex, submission] of variants.entries()) {
      const result = computeObjectiveScore(assignmentId, submission);
      if (result.totalCount !== baseline.totalCount || result.correctCount !== baseline.totalCount) {
        failures.push({
          assignmentId,
          variant: variantIndex + 1,
          expectedTotal: baseline.totalCount,
          actualTotal: result.totalCount,
          correctCount: result.correctCount,
          wrong: Object.entries(result.details || {})
            .filter(([, detail]) => !detail.correct)
            .map(([key, detail]) => ({ key, student: detail.student, expected: detail.expectedDisplay || detail.expected })),
        });
      }
    }
    covered.push(assignmentId);
  }

  assert.equal(covered.length > 0, true, "No objective assignments were discovered in answers_dictionary.json");
  assert.deepEqual(failures, [], `Canonical objective goldens failed:\n${JSON.stringify(failures, null, 2)}`);
});
