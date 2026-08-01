import test from "node:test";
import assert from "node:assert/strict";

import { autoMarkSubmission } from "../src/utils/autoMarking.js";

const closingVariants = [
  "Liebe Grüße,",
  "VIELE vruBeg,",
  "mit fruenlihch GRUbEN",
];

for (const closing of closingVariants) {
  test(`writing feedback treats Cisco as the name after ${closing}`, () => {
    const result = autoMarkSubmission({
      referenceEntry: { assignmentKey: "A2-8.22", level: "A2" },
      submission: { assignmentKey: "A2-8.22", level: "A2" },
      submissionText: `TEIL 2

Hallo Felix,
wie geht es dir? Ich hoffe, es geht dir gut.

Ich schreibe dir, weil ich dich zum Mittagessen einladen möchte.
Es ist dein Geburtstag und ich möchte mit dir feiern.

Ich lade dich für Samstag, den 14. August, um 12:30 Uhr bei mir zu Hause ein.
Du musst nichts mitbringen.

Ich freue mich auf deine Antwort.
${closing}
Cisco.`,
    });

    assert.equal(result.parts[0].partType, "writing");
    assert.doesNotMatch(result.feedback, /Cisco/i);
    assert.doesNotMatch(result.improvementSummary, /Cisco/i);
    assert.equal(
      result.corrections.some((correction) => /Cisco/i.test(`${correction.submitted || ""} ${correction.suggestion || ""} ${correction.message || ""}`)),
      false,
    );
    assert.match(result.feedback, /Mittagessen|Geburtstag|mitbringen|Antwort/i);
  });
}

test("a normal Freundin sentence is not mistaken for a sign-off", () => {
  const result = autoMarkSubmission({
    referenceEntry: { assignmentKey: "A2-letter", level: "A2" },
    submission: { assignmentKey: "A2-letter", level: "A2" },
    submissionText: `TEIL 2

Hallo Felix,
Meine Freundin kommt gerne.
ich komme am Samstag.
Liebe Grüße
Cisco.`,
  });

  assert.equal(result.parts[0].partType, "writing");
  assert.equal(
    result.corrections.some((correction) => /ich komme am Samstag/i.test(`${correction.submitted || ""} ${correction.message || ""}`)),
    true,
  );
  assert.doesNotMatch(result.feedback, /Cisco/i);
});
