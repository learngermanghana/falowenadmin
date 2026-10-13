import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateWritingStructureReview } from "../src/utils/writingStructureReview.js";
import { getA1WritingTaskSpec } from "../src/data/a1WritingTaskSpecs.js";
import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { getB1WritingTaskSpec } from "../src/data/b1WritingTaskSpecs.js";
import { applyQuestionAwareWritingGuard, enrichOptionsWithQuestionAwareWritingTask } from "../src/utils/questionAwareWritingMarking.js";

const informal = `Hallo Felix,
ich hoffe, du hast eine gute Woche. Am Samstag möchte ich mit dir etwas unternehmen. Wir könnten uns um 14 Uhr am Bahnhof treffen, weil ich am Nachmittag frei habe. Hast du Zeit?

Viele Grüße
Ama`;
const formal = `Sehr geehrte Damen und Herren,
ich interessiere mich für einen Tisch in Ihrem Restaurant. Können wir am Samstag um 19 Uhr für vier Personen reservieren? Haben Sie auch vegetarische Gerichte und was kostet das Menü? Vielen Dank für Ihre Rückmeldung.
Mit freundlichen Grüßen
Mina Mensah`;
const opinion = `Heutzutage sprechen viele Menschen über Sport und Gesundheit. Ich finde regelmäßigen Sport sinnvoll, weil wir dadurch gesünder bleiben. Einerseits hilft Sport, Stress abzubauen; andererseits kann zu viel Training anstrengend sein. Zum Beispiel gehe ich dreimal pro Woche joggen. Insgesamt bin ich der Meinung, dass Sport und gute Ernährung zusammengehören.`;

test("A2 formal and informal reviews accept natural alternatives to memorized starter phrases", () => {
  const informalTask = getA2WritingTaskSpec("A2-1.1");
  const informalReview = evaluateWritingStructureReview(informalTask, informal);
  assert.equal(informalReview.kind, "informal");
  assert.equal(informalReview.advisoryOnly, true);
  assert.equal(informalReview.templateOpeningsOptional, true);
  assert.equal(informalReview.checks.find(x => x.label === "Appropriate salutation").status, "observed");
  assert.equal(informalReview.checks.find(x => x.label === "Appropriate closing").status, "observed");
  assert.ok(!informal.includes("Ich schreibe dir, weil"));
  assert.ok(!informalReview.checks.some(x=>/Erstens|Zweitens/.test(x.label)));
  const formalTask = getA2WritingTaskSpec("A2-3.8");
  const formalReview = evaluateWritingStructureReview(formalTask, formal);
  assert.equal(formalReview.kind, "formal");
  assert.equal(formalReview.checks.find(x => x.label === "Appropriate salutation").status, "observed");
  assert.equal(formalReview.checks.find(x => x.label === "Appropriate closing").status, "observed");
  assert.ok(!formal.includes("Ich hoffe, es geht Ihnen gut."));
});

test("B1 opinion essay is not required to have a letter greeting/signature or exact fixed expression", () => {
  const task = getB1WritingTaskSpec("B1-3.8");
  const review = evaluateWritingStructureReview(task, opinion);
  assert.equal(review.kind, "opinion");
  assert.ok(review.checks.some(x=>x.label === "Own opinion" && x.status === "observed"));
  assert.ok(review.checks.some(x=>x.label === "Arguments, reasons and examples" && x.status === "observed"));
  assert.ok(!review.checks.some(x=>/salutation|closing/i.test(x.label)));
  assert.equal(review.advisoryOnly, true);
  assert.ok(review.teacherNote.includes("not require exact essay phrases"));
});

test("A1 short messages do not need connector/paragraph checks and A1-12.3 reviews both separate letters", () => {
  const single = evaluateWritingStructureReview(getA1WritingTaskSpec("A1-13"), "Liebe Bina, leider kann ich nicht kommen. Es regnet. Treffen wir uns am Montag? Liebe Grüße, Ama");
  assert.equal(single.kind,"informal");
  assert.ok(!single.checks.some(x => x.label === "Readable organization"));
  const combined = evaluateWritingStructureReview(getA1WritingTaskSpec("A1-12.3"), `Teil 1: Hallo Anna, Alles Gute! Feierst du? Kann meine Familie kommen? Viele Grüße, Awa
Teil 2: Sehr geehrte Damen und Herren, Wann beginnt der Kurs? Wie viel kostet er? Kann ich online bezahlen? Mit freundlichen Grüßen, Awa`);
  assert.equal(combined.kind,"mixed");
  assert.ok(combined.checks.some(x => x.label === "Informal letter in Teil 1"));
  assert.ok(combined.checks.some(x => x.label === "Formal letter in Teil 2"));
});

test("the existing writing score is not changed by an advisory structure review", () => {
  const options = enrichOptionsWithQuestionAwareWritingTask({
    referenceEntry: {assignmentKey:"B1-1.2",level:"B1",writingParts:["teil2"]},
    submission: {assignmentKey:"B1-1.2",level:"B1"},
  });
  const text = `Teil 2
Liebe Ruth,
ich möchte dir von meiner Freundin erzählen. Wir haben uns im Deutschkurs kennengelernt. Sie ist besonders, weil sie mir immer hilft. Treffen wir uns am Samstag um 15 Uhr im Café?
Liebe Grüße
Awa`;
  const result = applyQuestionAwareWritingGuard({
    level:"B1",assignmentKey:"B1-1.2",writingScore:85,writingScorePercent:85,
    objectiveScore:87,score:86,finalScore:86,feedback:"You wrote about your friendship.",
    taskCompletion:{completed:3,total:3,missing:[]},status:"marked",
  },options,text);
  assert.equal(result.writingScore,85);
  assert.equal(result.writingScorePercent,85);
  assert.equal(result.writingStructureReview?.advisoryOnly,true);
  assert.equal(result.writingStructureReview?.kind,"informal");
});

test("no artificial score deductions, additional API calls or insecure marking access", () => {
  const page=fs.readFileSync(new URL("../src/pages/MarkingPage.jsx",import.meta.url),"utf8");
  const guard=fs.readFileSync(new URL("../src/utils/questionAwareWritingMarking.js",import.meta.url),"utf8");
  const prompt=fs.readFileSync(new URL("../functions/index.js",import.meta.url),"utf8");
  assert.match(page,/data-writing-structure-review/);
  assert.match(page,/Different correct phrases are accepted/);
  assert.match(guard,/writingStructureReview: evaluateWritingStructureReview/);
  assert.match(prompt,/Erstens/);
  assert.match(prompt,/never double-deduct/i);
});
