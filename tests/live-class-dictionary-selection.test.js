import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDictionarySelectionTopic,
  canonicalDictionarySelection,
  dictionaryEntriesForSelection,
  toggleDictionarySelection,
} from "../src/utils/liveClassDictionarySelection.js";

const entries = [
  { assignment_id: "A1-Tutorial", chapter: "0", en: "Orientation and Tutorial", de: "Einführung und Orientierung" },
  { assignment_id: "A1-1.1-practice", chapter: "1.1", en: "Personal Information", de: "Persönliche Informationen" },
  { assignment_id: "A1-1.2", chapter: "1.2", en: "Present-Tense Practice", de: "Präsens üben" },
];

test("canonical selection preserves dictionary casing and multiple session items", () => {
  assert.deepEqual(
    canonicalDictionarySelection(entries, ["A1-TUTORIAL", "A1-1.1-PRACTICE", "A1-1.2"]),
    ["A1-Tutorial", "A1-1.1-practice", "A1-1.2"],
  );
});

test("checkbox toggling adds and removes dictionary items without replacing the full selection", () => {
  const added = toggleDictionarySelection(entries, ["A1-1.1-PRACTICE"], "A1-1.2");
  assert.deepEqual(added, ["A1-1.1-practice", "A1-1.2"]);
  assert.deepEqual(toggleDictionarySelection(entries, added, "A1-1.1-practice"), ["A1-1.2"]);
});

test("selected entries and grouped topic include every chosen dictionary item", () => {
  const ids = ["A1-1.1-practice", "A1-1.2"];
  assert.deepEqual(dictionaryEntriesForSelection(entries, ids).map((entry) => entry.assignment_id), ids);
  assert.equal(buildDictionarySelectionTopic({
    entries,
    assignmentIds: ids,
    levelId: "A1",
    existingTopic: "Day 3: old title",
  }), "Day 3: Personal Information + Present-Tense Practice");
});
