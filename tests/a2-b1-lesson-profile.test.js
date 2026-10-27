import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getA2B1AdminLessonProfile } from "../src/data/a2B1LessonProfile.js";

test("A2 and B1 expose canonical profiles for all 28 days", () => {
  for (const level of ["A2", "B1"]) {
    for (let day = 1; day <= 28; day += 1) {
      const profile = getA2B1AdminLessonProfile(level, day);
      assert.ok(profile, `${level} Day ${day}`);
      assert.equal(profile.sections.reading.submitRequired, true);
      assert.equal(profile.sections.speaking.mode, "practice");
    }
  }
});

test("critical A2 lesson contracts match Falowen student workbook rules", () => {
  const day24 = getA2B1AdminLessonProfile("A2", 24);
  assert.deepEqual(day24.requiredSubmissionParts.map((part) => part.partId), ["teil2", "teil3", "teil4"]);
  assert.equal(day24.sections.part4.contentType, "listening");

  const day25 = getA2B1AdminLessonProfile("A2", 25);
  assert.deepEqual(day25.requiredSubmissionParts.map((part) => part.partId), ["teil3"]);
  assert.equal(day25.sections.writing.visible, false);
  assert.equal(day25.sections.part4.visible, false);

  const day27 = getA2B1AdminLessonProfile("A2", 27);
  assert.deepEqual(day27.requiredSubmissionParts.map((part) => part.partId), ["teil3", "teil4"]);
  assert.equal(day27.sections.writing.visible, false);
});

test("critical B1 lesson contracts preserve reading fallback and self-check rules", () => {
  const day22 = getA2B1AdminLessonProfile("B1", 22);
  assert.deepEqual(day22.requiredSubmissionParts.map((part) => [part.partId, part.label]), [
    ["teil3", "Lesen"],
    ["teil4", "Lesen"],
  ]);
  assert.equal(day22.sections.writing.visible, false);
  assert.equal(day22.sections.part4.contentType, "reading");

  const day23 = getA2B1AdminLessonProfile("B1", 23);
  assert.deepEqual(day23.requiredSubmissionParts.map((part) => part.partId), ["teil2", "teil3"]);
  assert.equal(day23.sections.part4.visible, false);

  const day25 = getA2B1AdminLessonProfile("B1", 25);
  assert.deepEqual(day25.requiredSubmissionParts.map((part) => part.partId), ["teil3"]);
  assert.equal(day25.sections.part4.mode, "self-check");
});

test("presenter renders the canonical workbook contract", () => {
  const source = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  assert.match(source, /getA2B1AdminLessonProfileForSlide/);
  assert.match(source, /Workbook contract/);
  assert.match(source, /teacherContract\.submission/);
  assert.match(source, /teacherContract\.part4/);
});
