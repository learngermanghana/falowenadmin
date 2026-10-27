import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { normalizeAnswerKeyEntry } from "../src/utils/answerKeyNormalizer.js";
import { familyRecordingReference, GRAMMAR_REVISION } from "../src/utils/a1FamilyRecordingReference.js";

const source = Object.entries(dictionary).find(([, entry]) => entry.assignment_id === "A1-3");
const grammarAnswers = {
  Answer1: "gern",
  Answer2: "Magst",
  Answer3: "gern",
  Answer4: "mögen",
  Answer5: "gern",
  Answer6: "mag",
};

test("A1-3 normalized marking reference retains the exact six-blank workbook revision", () => {
  assert.ok(source, "A1-3 must be present in the dictionary");
  const [key, entry] = source;
  const normalized = normalizeAnswerKeyEntry(key, entry);
  assert.deepEqual(normalized.workbookRevisions?.[GRAMMAR_REVISION]?.answers?.teil3, grammarAnswers);
  // Registry documents pass through JSON serialization before the background worker reads them.
  const registryReference = JSON.parse(JSON.stringify(normalized));
  const transcript = "Meine Mutter heißt Ama.";
  const submissionText = [
    "TEIL 1",
    "1. Es kostet 20 Euro.",
    "2. Sie kostet 15 Euro.",
    "3. Es kostet 25.000 Euro.",
    "4. Er kostet 50 Euro.",
    "",
    "TEIL 2",
    transcript,
    "",
    "TEIL 3",
    ...Object.entries(grammarAnswers).map(([number, answer]) => `${number.replace("Answer", "")}. ${answer}`),
  ].join("\n");
  const marked = familyRecordingReference(registryReference, {
    workbookRevision: GRAMMAR_REVISION,
    submissionText,
    recordings: [{ sectionKey: "teil-2", transcript, audioUrl: "https://example.com/family.webm" }],
  }, "A1-3");
  assert.equal(marked.parts.teil3.answerCount, 6);
  assert.equal(marked.totalAnswers, 10);
});

test("both Firestore registry writers include normalized workbook revisions", () => {
  for (const path of [
    "src/services/answerKeySyncService.js",
    "src/services/markingServiceBase.js",
  ]) {
    const service = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(
      service,
      /rawAnswers:\s*entry\.rawAnswers,\s*\.\.\.\(entry\.workbookRevisions\s*\?\s*\{\s*workbookRevisions:\s*entry\.workbookRevisions\s*\}/,
      `${path} must persist workbookRevisions alongside rawAnswers`,
    );
  }
});
