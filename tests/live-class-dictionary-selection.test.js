import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { courseDictionary } from "../src/data/courseDictionary.js";
import { getCourseSessionDictionary, resolveCourseDictionaryLevel } from "../src/data/courseSessionGroups.js";
import {
  buildDictionarySelectionTopic,
  canonicalDictionarySelection,
  dictionaryEntriesForSelection,
  filterSessionDictionaryEntries,
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

test("all A1, A2 and B1 assignments are browsable without any session records", () => {
  const expected = [
    ["A1", 25, "A1-Tutorial", 23, "A1-5.10"],
    ["A2", 29, "A2-ORIENTATION", 28, "A2-10.28"],
    ["B1", 29, "B1-ORIENTATION", 28, "B1-10.28"],
  ];
  for (const [level, count, orientation, lastDay, lastAssignment] of expected) {
    const dictionary = getCourseSessionDictionary(resolveCourseDictionaryLevel({ name: `German ${level} Klasse` }));
    assert.equal(dictionary.length, count);
    assert.deepEqual(new Set(dictionary.map(row => row.assignment_id)),
      new Set([orientation, ...Object.values(courseDictionary[level]).map(row => row.assignment_id)]));
    assert.deepEqual(filterSessionDictionaryEntries(dictionary, "Day 0").map(row => row.assignment_id), [orientation]);
    assert.deepEqual(filterSessionDictionaryEntries(dictionary, `Day ${lastDay}`).map(row => row.assignment_id), [lastAssignment]);
    assert.equal(filterSessionDictionaryEntries(dictionary, "").length, count);
  }
  assert.deepEqual(filterSessionDictionaryEntries(getCourseSessionDictionary("A1"), "day 1 greetings")
    .map(row => row.assignment_id), ["A1-0.1"]);
});

test("Live Classes and Attendance use the complete course dictionary", () => {
  for (const page of ["LiveClassesPageV2", "CanonicalAttendancePageV3"]) {
    const source = readFileSync(new URL(`../src/pages/${page}.jsx`, import.meta.url), "utf8");
    assert.match(source, /getCourseSessionDictionary\(/);
    assert.match(source, /<SessionDictionaryPicker\s+entries=\{dictionaryEntries\}/);
  }
});
