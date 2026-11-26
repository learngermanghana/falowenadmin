import test from "node:test";
import assert from "node:assert/strict";
import { C1_ACADEMIC_DAYS, getC1AcademicDay, C1_EXAM_FORMAT, C1_EXAM_PREPARATION } from "../src/data/c1AcademicCurriculum.js";
import { getC1CanonicalLesson } from "../src/data/c1CanonicalCurriculum.js";
test("academic C1 layer retains 28 assignment identities", () => {
  assert.equal(C1_ACADEMIC_DAYS.length, 28);
  for (let day = 1; day <= 28; day += 1) {
    const item = getC1AcademicDay(day);
    assert.equal(item.day, day); assert.equal(item.vocabulary.length, 4); assert.ok(item.example && item.task); assert.ok(item.part >= 1 && item.part <= C1_EXAM_FORMAT[item.skill].parts); assert.deepEqual(getC1CanonicalLesson(day).academic, item);
  }
  assert.equal(getC1AcademicDay(29), null); assert.deepEqual(C1_EXAM_PREPARATION.map(x => x.day), [29,30]);
});
