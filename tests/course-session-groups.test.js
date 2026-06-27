import test from "node:test";
import assert from "node:assert/strict";
import {
  findCourseSessionGroup,
  getCourseSessionCount,
  getCourseSessionGroups,
} from "../src/data/courseSessionGroups.js";

test("A1 has 29 curriculum tasks but 25 attendance days", () => {
  const groups = getCourseSessionGroups("A1");
  assert.equal(getCourseSessionCount("A1"), 25);
  assert.equal(groups.reduce((total, group) => total + group.assignmentIds.length, 0), 29);
});

test("same-day A1 tasks share one attendance session", () => {
  assert.deepEqual(
    findCourseSessionGroup("A1", "A1-0.2")?.assignmentIds,
    ["A1-0.2", "A1-1.1"],
  );
  assert.deepEqual(
    findCourseSessionGroup("A1", "A1-1.2")?.assignmentIds,
    ["A1-1.1-PRACTICE", "A1-1.2"],
  );
  assert.deepEqual(
    findCourseSessionGroup("A1", "A1-9")?.assignmentIds,
    ["A1-9", "A1-10"],
  );
  assert.deepEqual(
    findCourseSessionGroup("A1", "A1-12.2")?.assignmentIds,
    ["A1-12.1", "A1-12.2"],
  );
});

test("A1-1.1-practice and A1-1.3 stay on different attendance days", () => {
  const day3 = findCourseSessionGroup("A1", "A1-1.1-practice");
  const day5 = findCourseSessionGroup("A1", "A1-1.3");
  assert.equal(day3?.day, 3);
  assert.equal(day5?.day, 5);
  assert.notEqual(day3?.key, day5?.key);
});
