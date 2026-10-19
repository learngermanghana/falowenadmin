import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getStudioCourseCatalog, getStudioCourseContext, STUDIO_COURSE_LEVELS } from "../src/utils/hoerenCourseCatalog.js";
import { validateCourseLessonContext, courseLessonPrompt } from "../functions/hoerenCurriculumContext.js";
import { validateScriptRequest } from "../functions/hoerenStudioApi.js";

test("every Falowen level has a title-based dictionary independent of student publication", () => {
  assert.deepEqual(STUDIO_COURSE_LEVELS, ["A1", "A2", "B1", "B2", "C1", "C2"]);
  for (const level of STUDIO_COURSE_LEVELS) {
    const rows = getStudioCourseCatalog(level, []);
    assert.ok(rows.length >= 20, level + " has a complete teaching dictionary");
    assert.ok(rows.every(row => row.assignmentKey && row.title && row.germanTitle && row.label.includes(row.title)), level);
    assert.ok(rows.every(row => row.publishable === false));
  }
});

test("B1 exposes all 28 named chapters even when only earlier lessons can publish", () => {
  const rows = getStudioCourseCatalog("B1", [
    { level: "B1", assignmentKey: "B1-1.1", day: 1, title: "Old API title", route: "/campus/course/example" },
    { level: "B1", assignmentKey: "B1-6.18", day: 18, title: "Old API title", route: "/campus/course/example18" },
  ]);
  assert.equal(rows.length, 28);
  assert.equal(rows[0].title, "Traumwelten");
  assert.equal(rows.at(-1).assignmentKey, "B1-10.28");
  assert.equal(rows.at(-1).germanTitle, "Klimafreundlich leben");
  assert.equal(rows.at(-1).publishable, false);
  assert.equal(rows.find(row => row.assignmentKey === "B1-6.18").publishable, true);
  assert.equal(rows.find(row => row.assignmentKey === "B1-6.18").publishDay, 18);
  assert.equal(rows.find(row => row.assignmentKey === "B1-1.1").title, "Traumwelten");
  assert.equal(rows.find(row => row.assignmentKey === "B1-1.1").publishRoute, "/campus/course/example");
});

test("teacher curriculum title and chapter are sent to the Gemini prompt", () => {
  const lesson = getStudioCourseContext(getStudioCourseCatalog("B1").at(-1));
  assert.deepEqual(lesson, {
    assignmentKey: "B1-10.28",
    chapter: "10.28",
    title: "Klimafreundlich leben",
    englishTitle: "Living in a Climate-Friendly Way",
  });
  assert.deepEqual(validateCourseLessonContext(lesson, "B1"), lesson);
  const request = validateScriptRequest({
    mode:"course", level:"B1", type:"dialogue", topic:"Klimafreundlich im Büro arbeiten",
    lessonContext: lesson,
  });
  assert.equal(request.lessonContext.assignmentKey, lesson.assignmentKey);
  const prompt = courseLessonPrompt({ level:"B1", type:"dialogue", topic:"Klimafreundlich im Büro arbeiten", kind:"multiple-choice", lessonContext:lesson });
  assert.match(prompt, /Klimafreundlich leben/);
  assert.match(prompt, /B1-10\.28/);
  assert.match(prompt, /Living in a Climate-Friendly Way/);
  assert.match(prompt, /5 objects/);
  assert.throws(() => validateCourseLessonContext(lesson, "A2"), /match the level/);
  assert.throws(() => validateCourseLessonContext({ ...lesson, title:"Bad\nPrompt" }, "B1"), /valid title/);
});

test("UI picks from dictionary titles, not only publishable days", () => {
  const page = readFileSync(new URL("../src/pages/HoerenStudioPage.jsx", import.meta.url), "utf8");
  assert.match(page, /getStudioCourseCatalog\(level, courseLessons\)/);
  assert.match(page, /Dictionary lesson title/);
  assert.match(page, /filteredCatalog\.map/);
  assert.match(page, /getStudioCourseContext\(selectedCourseEntry\)/);
  assert.match(page, /selectedCourseEntry\?\.publishable/);
  assert.doesNotMatch(page, /Select day<\/option>/);
});
