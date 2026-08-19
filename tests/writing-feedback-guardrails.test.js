import test from "node:test";
import assert from "node:assert/strict";
import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

const baseResult = {
  studentName: "Millicent G.Titriku",
  level: "A2",
  assignmentKey: "A2-2.4",
  objectiveScore: 90,
  objectiveTotal: 10,
  writingScorePercent: 80,
  taskCompletion: {
    completed: 4,
    total: 4,
    missing: [],
  },
  objectiveDetails: {
    "teil3.1": { partId: "teil3", question: 1, correct: true },
    "teil3.2": { partId: "teil3", question: 2, correct: true },
    "teil3.3": { partId: "teil3", question: 3, correct: true },
    "teil3.4": { partId: "teil3", question: 4, correct: true },
    "teil3.5": { partId: "teil3", question: 5, correct: true },
    "teil4.1": { partId: "teil4", question: 1, correct: true },
    "teil4.2": { partId: "teil4", question: 2, correct: true },
    "teil4.3": { partId: "teil4", question: 3, correct: false },
    "teil4.4": { partId: "teil4", question: 4, correct: true },
    "teil4.5": { partId: "teil4", question: 5, correct: true },
  },
  wrongAnswers: [{ partId: "teil4", question: 3 }],
};

test("removes generic add-one-more-detail advice from completed A2 writing", () => {
  const submission = `Sehr geehrter Herr Asadu,\n\nich schreibe Ihnen, weil ich Sie gern zu einem gemeinsamen Wochenende einladen möchte.\n\nWir könnten am Samstag zusammen ins Kino gehen und einen neuen Film anschauen. Danach könnten wir zusammen etwas essen und über den Film sprechen.\n\nHaben Sie am Samstag um 15 Uhr Zeit? Wir könnten uns am Bahnhof treffen.\n\nKönnten Sie bitte Sandwiches und Getränke mitbringen?\n\nIch freue mich auf Ihre Antwort.\n\nMit freundlichen Grüßen\nMillicent Titriku`;

  const feedback = buildNaturalStudentFeedback({
    ...baseResult,
    writingStrengths: ["Your invitation is clear and polite, effectively expressing your desire to meet"],
    nextStep: "Next step: add one more clear detail to \"Ich freue mich auf Ihre Antwort.\".",
  }, submission);

  assert.doesNotMatch(feedback, /add one more (?:clear )?detail/i);
  assert.match(feedback, /Teil 3 is excellent|review question 3/i);
});

test("does not tell students to capitalize the first line after a comma salutation", () => {
  const submission = `Lieber Alex,\n\nich habe am Wochenende Zeit und möchte gern etwas mit dir zusammen machen.\n\nHast du am Wochenende frei? Welche Aktivität möchtest du machen?\n\nViele Grüße\nMillicent`;

  const feedback = buildNaturalStudentFeedback({
    ...baseResult,
    assignmentKey: "A2-2.5",
    writingStrengths: ["The letter is friendly and invites collaboration"],
    nextStep: "Review exact wording: Start this sentence with a capital letter: \"ich habe am Wochenende Zeit und möchte gern etwas mit dir zusammen …\".",
  }, submission);

  assert.doesNotMatch(feedback, /Start this sentence with a capital letter/i);
});


test("removes an unclosed-quote capitalization warning after a formal comma salutation", () => {
  const submission = `Teil 2
Sehr geehrte Damen und Herren,

ich schreibe, weil ich eine Wohnung in der Stadt suche. Haben Sie eine Wohnung frei?

Mit freundlichen Grüßen
Joel

Teil 3
1) b
2) c

Teil 4
1) c`;

  const feedback = buildNaturalStudentFeedback({
    ...baseResult,
    studentName: "Joel Darko",
    assignmentKey: "A2-3.7",
    objectiveScore: 100,
    objectiveCorrect: 12,
    objectiveTotal: 12,
    writingScorePercent: 84,
    writingStrengths: ["Your sentence “ich schreibe, weil ich eine Wohnung in der Stadt suche” clearly communicates the purpose of the message"],
    nextStep: "Review exact wording: Start this sentence with a capital letter: \"ich schreibe, weil ich eine Wohnung in der Stadt suche.",
  }, submission);

  assert.doesNotMatch(feedback, /capital letter|Write “Ich schreibe/i);
  assert.match(feedback, /Teil 4 is excellent|all answers correct/i);
});
