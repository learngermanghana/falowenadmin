import test from "node:test";
import assert from "node:assert/strict";

import {
  compareCourseDictionaryEntries,
  courseDictionary,
} from "../src/data/courseDictionary.js";
import {
  getCourseSessionCount,
  getCourseSessionGroups,
} from "../src/data/courseSessionGroups.js";
import {
  canonicalDictionarySelection,
  dictionaryEntriesForSelection,
} from "../src/utils/liveClassDictionarySelection.js";

for (const level of ["A2", "B1"]) {
  test(`${level} exposes orientation as selectable Day 0 curriculum`, () => {
    const orientationId = `${level}-Tutorial`;
    const entries = Object.values(courseDictionary[level]).sort(compareCourseDictionaryEntries);
    const groups = getCourseSessionGroups(level);

    assert.equal(entries[0]?.assignment_id, orientationId);
    assert.equal(entries[0]?.chapter, "0");
    assert.match(entries[0]?.en || "", /orientation/i);

    assert.deepEqual(canonicalDictionarySelection(entries, [orientationId.toUpperCase()]), [orientationId]);
    assert.deepEqual(
      dictionaryEntriesForSelection(entries, [orientationId]).map((entry) => entry.assignment_id),
      [orientationId],
    );

    assert.equal(getCourseSessionCount(level), 29);
    assert.equal(groups[0]?.day, 0);
    assert.deepEqual(groups[0]?.assignmentIds, [orientationId]);
    assert.equal(groups[1]?.day, 1);
    assert.deepEqual(groups[1]?.assignmentIds, [`${level}-1.1`]);
    assert.equal(groups.at(-1)?.assignmentIds[0], `${level}-10.28`);
  });
}
