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

test("session groups keep dictionary casing used by selector option values", () => {
  const groups = getCourseSessionGroups("A1");
  assert.deepEqual(groups[0].assignmentIds, ["A1-Tutorial"]);
  assert.deepEqual(groups[3].assignmentIds, ["A1-1.1-practice", "A1-1.2"]);
});

test("group lookup remains case insensitive after preserving canonical casing", () => {
  const group = findCourseSessionGroup("A1", ["A1-1.1-PRACTICE"]);
  assert.equal(group?.day, 3);
  assert.deepEqual(group?.assignmentIds, ["A1-1.1-practice", "A1-1.2"]);
});
