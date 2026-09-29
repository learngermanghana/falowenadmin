import test from "node:test";
import assert from "node:assert/strict";
import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { validateAnswerDictionary, validateAnswerEntry } from "../src/utils/answerKeyIntegrity.js";

test("committed answer dictionary has no blocking integrity errors", () => {
  const result = validateAnswerDictionary(answersDictionary);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
});

test("validator requires an explicit stable assignment id", () => {
  const result = validateAnswerEntry("Display Name Only", {
    expectedParts: ["main"],
    referenceAnswerParts: ["main"],
    answers: { Answer1: "A" },
  });
  assert.ok(result.errors.some((item) => item.code === "missing-assignment-id"));
});

test("validator catches missing and duplicate objective answer numbers", () => {
  const result = validateAnswerEntry("Synthetic", {
    assignment_id: "TEST-1",
    expectedParts: ["teil1"],
    referenceAnswerParts: ["teil1"],
    answerLayout: "multipart",
    answers: {
      teil1: {
        Answer1: "A",
        Answer3: "B",
        "Alt Answer3": "C",
      },
    },
  });
  assert.ok(result.warnings.some((item) => item.code === "missing-answer-number"));
  assert.ok(result.errors.some((item) => item.code === "duplicate-answer-number"));
});

test("validator catches part registration drift", () => {
  const result = validateAnswerEntry("Synthetic", {
    assignment_id: "TEST-2",
    expectedParts: ["teil2", "teil3"],
    referenceAnswerParts: ["teil3"],
    writingParts: ["teil2", "teil4"],
    aiGradedParts: ["teil2"],
    answers: { teil3: { Answer1: "A" } },
  });
  assert.ok(result.errors.some((item) => item.code === "part-outside-expected" && item.part === "teil4"));
});

test("validator rejects unknown answer matching modes", () => {
  const result = validateAnswerEntry("Synthetic", {
    assignment_id: "TEST-3",
    expectedParts: ["main"],
    referenceAnswerParts: ["main"],
    answerMatchingMode: "very_loose",
    answers: { Answer1: "Ich heiße Anna" },
  });
  assert.ok(result.errors.some((item) => item.code === "unknown-matching-mode"));
});

const answerEntryByAssignmentId = (assignmentId) =>
  Object.values(answersDictionary).find(
    (entry) => String(entry?.assignment_id || "").toUpperCase() === assignmentId.toUpperCase(),
  );

test("A2 Day 4 reference answers match the current Treffen am Samstag Lesen", () => {
  const entry = answerEntryByAssignmentId("A2-2.4");
  assert.deepEqual(entry?.answers?.teil3, {
    Answer1: "A) Im Stadtpark",
    Answer2: "C) Es soll regnen.",
    Answer3: "B) Neben der U-Bahn-Station Rathaus",
    Answer4: "C) Um 15:30 Uhr",
    Answer5: "B) Er reserviert einen Tisch.",
  });
});

test("B1 Day 7 keeps all twelve current Lesen answers", () => {
  const entry = answerEntryByAssignmentId("B1-3.7");
  assert.equal(Object.keys(entry?.answers?.teil3 || {}).length, 12);
  assert.equal(entry?.answers?.teil3?.Answer8, "F) Anzeige F");
  assert.equal(entry?.answers?.teil3?.Answer12, "E) Anzeige E");
});

test("B1 Day 11 current Lesen uses option A for the social-interaction risk question", () => {
  const entry = answerEntryByAssignmentId("B1-4.11");
  assert.equal(
    entry?.answers?.teil3?.Answer5,
    "A) Verlust echter sozialer Interaktion und Bewegung",
  );
});

test("B1 Day 19 keeps both preserved reading blocks in Teil 3 and Teil 4", () => {
  const entry = answerEntryByAssignmentId("B1-6.19");
  assert.deepEqual(Object.values(entry?.answers?.teil3 || {}), [
    "B) die umweltfreundliche Stromproduktion in Feldheim.",
    "A) ein ganzes Dorf von modernen Energien leben kann.",
    "C) muss die Bevölkerung dafür sein.",
  ]);
  assert.deepEqual(Object.values(entry?.answers?.teil4 || {}), [
    "B) es ein neues Tourismus-Angebot gibt.",
    "B) muss man nicht sportlich sein.",
    "C) mehr Velo-Touristen in die Region kommen.",
  ]);
});

test("B1 Day 22 keeps the visible five-plus-five Berlin and Bewerbung reading split", () => {
  const entry = answerEntryByAssignmentId("B1-7.22");
  assert.equal(Object.keys(entry?.answers?.teil3 || {}).length, 5);
  assert.equal(Object.keys(entry?.answers?.teil4 || {}).length, 5);
  assert.equal(entry?.answers?.teil3?.Answer1, "D) 500 Jahre");
  assert.equal(entry?.answers?.teil4?.Answer1, "D) im Supermarkt");
  assert.equal(
    entry?.answers?.teil4?.Answer5,
    "C) Man kann sich bei der nächsten offenen Stelle bewerben.",
  );
});

