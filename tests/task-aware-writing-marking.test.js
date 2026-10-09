import test from "node:test";
import assert from "node:assert/strict";
import { heuristicWritingMarker, objectiveMarker } from "../src/utils/autoMarking.js";

const task = {
  prompt: "Nennen Sie einen konkreten Tag und einen Treffpunkt. Fragen Sie, was Ihre Freundin lieber möchte. Bitten Sie um eine Antwort."
};
const incomplete = "Liebe Sandra, wir könnten zuerst in einem Supermarkt schöne Dinge kaufen. Danach gehen wir ins Kino. Viele Grüße, Max";
const complete = "Liebe Sandra, am Samstag treffen wir uns am Bahnhof. Wir könnten zuerst einkaufen und danach ins Kino gehen. Was möchtest du lieber machen? Ich freue mich auf deine Antwort. Viele Grüße, Max";

test("missing explicitly requested writing details reduce the score and are explained", () => {
  const marked = heuristicWritingMarker({level:"A2", assignmentKey:"A2-2.4", text:incomplete, referenceEntry:task});
  assert.equal(marked.taskCompletion.total, 4);
  assert.equal(marked.taskCompletion.completed, 0);
  assert.match(marked.feedback, /Missing task points/);
  assert.ok(marked.score < heuristicWritingMarker({level:"A2",assignmentKey:"A2-2.4",text:complete,referenceEntry:task}).score);
});

test("equivalent reply wording counts without exact Ich freue mich", () => {
  const result = heuristicWritingMarker({level:"A2",text:"Liebe Sandra, Bitte schreib mir bald. Viele Grüße, Max",referenceEntry:{prompt:"Bitten Sie um eine Antwort."}});
  assert.equal(result.taskCompletion.completed, 1);
  assert.equal(result.taskCompletion.total, 1);
});

test("a reply expression is not mandatory when absent from the instructions", () => {
  const result = heuristicWritingMarker({level:"A2",text:incomplete,referenceEntry:{prompt:"Schreiben Sie Sandra über zwei Aktivitäten."}});
  assert.equal(result.taskCompletion.total, 0);
  assert.doesNotMatch(result.feedback,/Missing task points/);
});

test("objective answer C is not accepted when the reviewed key is B", () => {
  const result = objectiveMarker({"2":"B) 20 Euro"},"2. C",{partId:"teil4"});
  assert.equal(result.score,0);
  assert.equal(result.wrong.length,1);
  assert.match(result.wrong[0].expected,/20 Euro/);
});
