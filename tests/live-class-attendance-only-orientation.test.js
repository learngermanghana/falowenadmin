import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  compareCourseDictionaryEntries,
  courseDictionary,
  getCourseDictionaryEntry,
  getUnifiedTopicLabel,
} from "../src/data/courseDictionary.js";
import {
  getCourseSessionCount,
  getCourseSessionGroups,
} from "../src/data/courseSessionGroups.js";
import {
  canonicalDictionarySelection,
  dictionaryEntriesForSelection,
} from "../src/utils/liveClassDictionarySelection.js";

const packagePath = new URL("../package.json", import.meta.url);
const liveClassServicePath = new URL("../src/services/liveClassServiceBase.js", import.meta.url);
const cohortServicePath = new URL("../src/services/classCohortUpdateServiceBase.js", import.meta.url);
const groupedServicePath = new URL("../src/services/groupedCurriculumService.js", import.meta.url);
const teachingSlidesPath = new URL("../src/data/teachingSlides.js", import.meta.url);

for (const level of ["A2", "B1"]) {
  test(`${level} exposes a selectable attendance-only Day 0 orientation`, () => {
    const orientationId = `${level}-Tutorial`;
    const entries = Object.values(courseDictionary[level] || {}).sort(compareCourseDictionaryEntries);
    const orientation = entries.find((entry) => entry.assignment_id === orientationId);

    assert.ok(orientation);
    assert.equal(orientation.chapter, "0");
    assert.equal(orientation.attendanceOnly, true);
    assert.match(orientation.en, /orientation/i);
    assert.equal(entries[0].assignment_id, orientationId);
    assert.equal(getCourseDictionaryEntry(orientationId.toUpperCase())?.assignment_id, orientationId);
    assert.equal(getUnifiedTopicLabel(orientationId), "0. Einführung und Orientierung");
    assert.deepEqual(canonicalDictionarySelection(entries, [orientationId.toUpperCase()]), [orientationId]);
    assert.deepEqual(
      dictionaryEntriesForSelection(entries, [orientationId]).map((entry) => entry.assignment_id),
      [orientationId],
    );
  });

  test(`${level} keeps its established 28 automatic teaching lessons`, () => {
    const groups = getCourseSessionGroups(level);
    assert.equal(getCourseSessionCount(level), 28);
    assert.equal(groups[0]?.assignmentIds[0], `${level}-1.1`);
    assert.equal(groups.at(-1)?.assignmentIds[0], `${level}-10.28`);
    assert.equal(groups.some((group) => group.assignmentIds.includes(`${level}-Tutorial`)), false);
  });
}

test("all automatic curriculum builders exclude attendance-only entries", async () => {
  const [liveClassSource, cohortSource, groupedSource, teachingSource, packageSource] = await Promise.all([
    readFile(liveClassServicePath, "utf8"),
    readFile(cohortServicePath, "utf8"),
    readFile(groupedServicePath, "utf8"),
    readFile(teachingSlidesPath, "utf8"),
    readFile(packagePath, "utf8"),
  ]);

  for (const source of [liveClassSource, cohortSource, groupedSource, teachingSource]) {
    assert.match(source, /attendanceOnly\s*!==\s*true/);
  }
  assert.match(packageSource, /patchAttendanceOnlyOrientationCurriculum\.mjs/);
});
