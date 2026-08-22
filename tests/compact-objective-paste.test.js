import test from "node:test";
import assert from "node:assert/strict";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

test("deterministic checker expands compact pasted B1 Teil 3 and Teil 4 answer rows", () => {
  const result = checkDeterministicObjectiveAnswers({
    referenceEntry: {
      assignmentKey: "B1-2.5",
      level: "B1",
      answers: `teil3: Answer1. B) Am Samstag um 14:00 Uhr
teil3: Answer2. B) Hell und geraumig
teil3: Answer3. B) Die Badewanne
teil3: Answer4. B) Zwei Monatsmieten
teil3: Answer5. A) Ab dem ersten des nachsten Monats
teil3: Answer6. B) Ein Jahr
teil3: Answer7. C) Sie entschied sich, die Wohnung zu mieten
teil4: Answer1. A) Am fruhen Morgen
teil4: Answer2. B) Der Vermieter spart Zeit
teil4: Answer3. B) Auf das Umfeld und die Nachbarschaft
teil4: Answer4. C) Weil die Wohung schnell vergeben sein konnte
teil4: Answer5. B) Gehaltsnachweise und Mieterselbstauskunft`,
    },
    submissionText: `Teil 2 : Schreiben

Sehr geehrte Damen und Herren,

ich habe Ihre Wohnungsanzeige im Internet gesehen und interessiere mich sehr für die angebotene Wohnung. Gern würde ich sie persönlich besichtigen. Wäre ein Termin am Freitag um 16 Uhr möglich? Alternativ könnte ich am Samstagvormittag kommen.

Bitte bestätigen Sie mir den Termin und teilen Sie mir die genaue Adresse mit. Außerdem möchte ich gern wissen, welche Unterlagen ich zur Besichtigung mitbringen soll.

Vielen Dank im Voraus. Ich freue mich auf Ihre Rückmeldung.

Mit freundlichen Grüßen
Ruth

Teil 3 : Lesen
1B 2B 3B 4B 5A 6B 7C

Teil 4 : Hören
1A 2B 3B 4C 5B`,
  });

  assert.equal(result.objectiveScore, 100);
  assert.equal(result.objectiveCorrect, 12);
  assert.equal(result.objectiveTotal, 12);
  assert.deepEqual(result.wrongAnswers, []);
});

test("compact splitting preserves numbered free-text answers", () => {
  const result = checkDeterministicObjectiveAnswers({
    referenceEntry: {
      format: "objective",
      answers: {
        Answer1: "B) Berlin",
        Answer2: "10 Euro",
      },
    },
    submissionText: "1: B\n2: 10 Euro",
  });

  assert.equal(result.objectiveScore, 100);
  assert.equal(result.objectiveCorrect, 2);
  assert.equal(result.objectiveTotal, 2);
});
