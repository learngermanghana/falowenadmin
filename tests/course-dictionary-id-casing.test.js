import test from "node:test";
import assert from "node:assert/strict";
import {
  getCourseDictionaryEntry,
  getUnifiedTopicLabel,
} from "../src/data/courseDictionary.js";
import {
  findCourseSessionGroup,
  getCourseSessionGroups,
} from "../src/data/courseSessionGroups.js";

test("dictionary lookup resolves stored uppercase IDs to canonical A1 entries", () => {
  assert.equal(getCourseDictionaryEntry("A1-TUTORIAL")?.assignment_id, "A1-Tutorial");
  assert.equal(getCourseDictionaryEntry("A1-1.1-PRACTICE")?.assignment_id, "A1-1.1-practice");
  assert.equal(getUnifiedTopicLabel("A1-TUTORIAL"), "0. Orientation and Tutorial");
});

test("A2 and B1 Day 0 orientation IDs resolve with canonical selector casing", () => {
  assert.equal(getCourseDictionaryEntry("A2-TUTORIAL")?.assignment_id, "A2-Tutorial");
  assert.equal(getCourseDictionaryEntry("B1-TUTORIAL")?.assignment_id, "B1-Tutorial");
  assert.equal(getUnifiedTopicLabel("A2-TUTORIAL"), "0. Einführung und Orientierung");
  assert.equal(getUnifiedTopicLabel("B1-TUTORIAL"), "0. Einführung und Orientierung");
});

test("session groups keep dictionary casing used by selector option values", () => {
  const groups = getCourseSessionGroups("A1");
  assert.deepEqual(groups[0].assignmentIds, ["A1-Tutorial"]);
  assert.deepEqual(groups[3].assignmentIds, ["A1-1.1-practice", "A1-1.2"]);
});

test("A2 and B1 orientation entries appear first in Live Classes and Attendance selectors", () => {
  assert.deepEqual(getCourseSessionGroups("A2")[0].assignmentIds, ["A2-Tutorial"]);
  assert.deepEqual(getCourseSessionGroups("B1")[0].assignmentIds, ["B1-Tutorial"]);
});

test("group lookup remains case insensitive after preserving canonical casing", () => {
  const group = findCourseSessionGroup("A1", ["A1-1.1-PRACTICE"]);
  assert.equal(group?.day, 3);
  assert.deepEqual(group?.assignmentIds, ["A1-1.1-practice", "A1-1.2"]);
});
