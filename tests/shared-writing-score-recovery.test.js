import test from "node:test";
import assert from "node:assert/strict";
import { recoverZeroWritingScore } from "../src/utils/finalDeterministicFeedback.js";

const dianaSubmission = `Liebe Anna,\n\nwie geht es dir? Ich hoffe, dir geht es gut. Ich möchte dich gern zum Mittagessen einladen, weil wir uns lange nicht gesehen haben.\n\nWir treffen uns am Samstag, den 15. August, um 13 Uhr im Restaurant „Bella“. Ich freue mich sehr, dich zu sehen und mit dir zu essen.\n\nDu musst nichts mitbringen. Ich möchte dich zum Essen einladen. Bitte komm pünktlich.\n\nLiebe Grüße\nDiana\n   Teil \n1.C\n2.A\n3.C\n4.B\n5.C`;

test("zero writing recovery normalizes maxWritingScore to 100", () => {
  const recovered = recoverZeroWritingScore({
    level: "A2",
    assignmentKey: "A2-8.22",
    objectiveScore: 80,
    writingScore: 0,
    writingScorePercent: 0,
    maxWritingScore: 20,
    finalScore: 40,
    score: 40,
  }, dianaSubmission);

  assert.equal(recovered.ai?.recoveredZeroWritingScore, true);
  assert.equal(recovered.maxWritingScore, 100);
  assert.equal(recovered.writingScore, recovered.writingScorePercent);
  assert.ok(recovered.writingScore > 0 && recovered.writingScore <= 100);
  assert.equal(recovered.finalScore, Math.round((80 + recovered.writingScore) / 2));
});
