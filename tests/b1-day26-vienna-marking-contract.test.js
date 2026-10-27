import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getB1WritingTaskSpec } from "../src/data/b1WritingTaskSpecs.js";
import { evaluateB1WritingTaskEvidence } from "../src/utils/b1WritingTaskEvidence.js";

test("B1 Day 26 rubric is a formal Vienna booking inquiry", () => {
  const spec = getB1WritingTaskSpec("B1-9.26");
  assert.equal(spec.textType, "formal_email");
  assert.equal(spec.register, "formal");
  assert.equal(spec.recipient, "customer_service");
  assert.match(spec.taskText, /TraumReisen GmbH/);
  assert.match(spec.taskText, /40–50/);
  assert.equal(spec.taskPoints.length, 3);
  const text = `Sehr geehrte Damen und Herren,
ich interessiere mich für Ihre Städtereise nach Wien. Könnten Sie mir die genauen Reisedaten, die Hotelkategorie und Informationen zu den Ausflügen mitteilen? Bitte senden Sie mir ein verbindliches Angebot zu.
Mit freundlichen Grüßen
Leo`;
  assert.deepEqual(evaluateB1WritingTaskEvidence(spec, text).map(x=>x.status), ["met","met","met"]);
  assert.deepEqual(evaluateB1WritingTaskEvidence(spec, "Hallo Max, meine Reise hatte Verspätung. Liebe Grüße").map(x=>x.status), ["missing","missing","missing"]);
});

test("Vienna excursion evidence accepts singular, plural and dative plural without weakening the three required questions", () => {
  const spec = getB1WritingTaskSpec("B1-9.26");
  const variants = [
    "zum Ausflug",
    "über die Ausflüge",
    "zu den Ausflügen",
  ];

  for (const expression of variants) {
    const email = `Sehr geehrte Damen und Herren, ich interessiere mich für Ihre Städtereise nach Wien. Könnten Sie mir die Reisedaten, die Hotelkategorie und Informationen ${expression} mitteilen? Bitte senden Sie mir ein verbindliches Angebot zu. Mit freundlichen Grüßen`;
    assert.deepEqual(
      evaluateB1WritingTaskEvidence(spec, email).map((point) => point.status),
      ["met", "met", "met"],
      `Complete inquiry must count ${expression}`,
    );
  }

  const noExcursionQuestion = "Sehr geehrte Damen und Herren, ich interessiere mich für Ihre Städtereise nach Wien. Wie lauten die Reisedaten und die Hotelkategorie? Bitte senden Sie mir ein verbindliches Angebot zu.";
  assert.deepEqual(
    evaluateB1WritingTaskEvidence(spec, noExcursionQuestion).map((point) => point.status),
    ["met", "missing", "met"],
    "The required excursion question must still be present",
  );
});

test("the stored reading key and fallback snapshot agree on seven questions while Hören stays unchanged", () => {
  const read=(f)=>JSON.parse(readFileSync(new URL(f,import.meta.url),"utf8"));
  const d=read("../src/data/answers_dictionary.json")["B1 9.26 Reiseprobleme und Lösungen"];
  const snap=read("../src/data/courseMarkingSnapshot.json").answerKeys["B1 9.26 Reiseprobleme und Lösungen"];
  const expected=["A","B","X","D","E","F","H"];
  assert.deepEqual(Object.values(d.answers.teil3).map(x=>x.slice(0,1)),expected);
  assert.deepEqual(snap.answers.teil3,d.answers.teil3);
  assert.deepEqual(Object.values(d.answers.teil4).map(x=>x.slice(0,1)),["A","B","B","B","A"]);
  assert.match(d.partGrading.teil2.instruction,/FORMAL/);
  assert.match(d.partGrading.teil3.instruction,/seven Anzeigen/);
});
