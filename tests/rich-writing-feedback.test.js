import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

function words(value = "") {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

test("A2 writing feedback evaluates the message beyond salutation and weil", () => {
  const submission = `Teil 2 Schreiben

Liebe Maria,

ich schreibe dir, weil ich am Samstag Zeit habe und gern etwas mit dir machen möchte. Am Vormittag muss ich noch arbeiten, aber ab 14 Uhr bin ich frei. Wir können uns am Bahnhof treffen und danach ins Café gehen. Hast du Zeit? Bitte schreib mir, ob 14 Uhr für dich passt.

Liebe Grüße
Anna`;

  const feedback = buildNaturalStudentFeedback({
    studentName: "Anna",
    level: "A2",
    assignmentKey: "A2-2.4",
    writingScore: 84,
    writingScorePercent: 84,
    objectiveTotal: 0,
  }, submission);

  assert.match(feedback, /develops the reason for writing|clear purpose/i);
  assert.match(feedback, /concrete details|relevant question|communicative goal/i);
  assert.match(feedback, /stronger A2 writing|sentence openings|developed detail/i);
  assert.doesNotMatch(feedback, /uses (?:the )?(?:greeting|connector) [“"]?(?:Liebe|Lieber|weil)/i);
  assert.ok(words(feedback) >= 55, feedback);
  assert.ok(words(feedback) <= 100, feedback);
});

test("B1 opinion feedback evaluates argument development, example and structure", () => {
  const submission = `Teil 2 · Schreiben : Sind persönliche Kontakte hilfreicher als Online-Portale?

Heutzutage ist die Wohnungssuche besonders in Großstädten sehr schwierig. Ich bin der Meinung, dass persönliche Kontakte hilfreicher sind, weil es weniger Konkurrenz gibt. Einerseits bieten Online-Portale viele Anzeigen, und man kann Wohnungen einfach vergleichen. Andererseits bewerben sich dort sehr viele Menschen. Bei einer Besichtigung in Hamburg waren einmal etwa dreißig Interessenten dabei. Durch persönliche Kontakte erfährt man oft früher von freien Wohnungen. Deshalb glaube ich, dass Kontakte bessere Chancen bieten. Zusammenfassend sollte man beide Methoden nutzen, aber persönliche Kontakte bevorzugen.`;

  const feedback = buildNaturalStudentFeedback({
    studentName: "Ruth",
    level: "B1",
    assignmentKey: "B1-2.4",
    writingScore: 86,
    writingScorePercent: 86,
    objectiveTotal: 0,
  }, submission);

  assert.match(feedback, /argument is developed|compare different sides/i);
  assert.match(feedback, /concrete example|specific situation/i);
  assert.match(feedback, /conclusion|argumentative structure|complete introduction/i);
  assert.match(feedback, /B1 range|develop one central reason|cause and consequence/i);
  assert.doesNotMatch(feedback, /connector [“"]?(?:und|weil)/i);
  assert.ok(words(feedback) >= 65, feedback);
  assert.ok(words(feedback) <= 120, feedback);
});
