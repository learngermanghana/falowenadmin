import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

execFileSync(process.execPath, ["scripts/patchInlineObjectiveSectionAnswers.mjs"], { stdio: "inherit" });
const { computeObjectiveScore } = await import("../src/utils/objectiveMarking.js");

const REFERENCE = {
  assignmentKey: "A2-inline-objective-test",
  expectedParts: ["teil2", "teil3", "teil4"],
  writingParts: ["teil2"],
  parts: {
    teil3: {
      answers: [
        { questionKey: "Answer1", correctLetter: "A", correctText: "Die Krankenschwester" },
        { questionKey: "Answer2", correctLetter: "B", correctText: "Weil er fur seine Kinder kampft" },
        { questionKey: "Answer3", correctLetter: "C", correctText: "Ihr Einsatz fur andere" },
        { questionKey: "Answer4", correctLetter: "B", correctText: "Sie sind nicht beruhmt" },
        { questionKey: "Answer5", correctLetter: "B", correctText: "Dass Mut in kleinen Taten liegt" },
        { questionKey: "Answer6", correctLetter: "B", correctText: "Ein alleinerziehender Vater" },
        { questionKey: "Answer7", correctLetter: "B", correctText: "Wahre Helden sind diejenigen, die im Alltag still wirken" },
      ],
    },
    teil4: {
      answers: [
        { questionKey: "Answer1", correctLetter: "B", correctText: "Er beginnt seine Arbeit als Hausmeister" },
        { questionKey: "Answer2", correctLetter: "B", correctText: "Weil sie den Schultag reibungslos macht" },
        { questionKey: "Answer3", correctLetter: "C", correctText: "Die Heizung fallt aus" },
        { questionKey: "Answer4", correctLetter: "C", correctText: "Er behebt da Problem, Sofort" },
        { questionKey: "Answer5", correctLetter: "A", correctText: "Erschopft aber zufrieden" },
      ],
    },
  },
};

const RUTH_SUBMISSION = `Teil 2 · Schreiben

Betreff: Präsentation über Erfolgsgeschichten

Sehr geehrte Frau Wolmer,

es tut mir leid, aber ich kann leider nicht an der Präsentation über Erfolgsgeschichten teilnehmen, weil ich an diesem Tag einen wichtigen Arzttermin habe. Könnte ich meine Präsentation bitte an einem anderen Tag halten?

Mit freundlichen Grüßen
Ruth

Teil 3: Lesen: 1A, 2B, 3C, 4B, 5B, 6B, 7B

Teil 4: Hören: 1B, 2B, 3C, 4C, 5A`;

test("Ruth compact inline Teil 3 and Teil 4 answers score 12/12", () => {
  const result = computeObjectiveScore(REFERENCE, RUTH_SUBMISSION);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  assert.equal(result.details["teil3.1"].student, "A");
  assert.equal(result.details["teil3.7"].student, "B");
  assert.equal(result.details["teil4.1"].student, "B");
  assert.equal(result.details["teil4.5"].student, "A");
  assert.ok(Object.values(result.details).every((detail) => detail.correct === true));
});

test("compact headings also work without colons between Teil and skill", () => {
  const submission = `Teil 2 Schreiben\nHallo. Das ist ein Schreibtext.\n\nTeil 3 Lesen 1A 2B 3C 4B 5B 6B 7B\nTeil 4 Hören 1B 2B 3C 4C 5A`;
  const result = computeObjectiveScore(REFERENCE, submission);

  assert.equal(result.correctCount, 12);
  assert.equal(result.totalCount, 12);
});
