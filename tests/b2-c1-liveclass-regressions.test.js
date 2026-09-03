import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { courseDictionary, getCourseDictionaryEntry, getUnifiedTopicLabel } from "../src/data/courseDictionary.js";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { parseAssignmentChapter as parseBrowserChapter } from "../src/utils/assignmentChapter.js";

const require = createRequire(import.meta.url);
const { parseAssignmentChapter: parseFunctionChapter } = require("../functions/assignmentChapter.js");

test("B2 is registered in the live-class course dictionary", () => {
  const entries = Object.values(courseDictionary.B2 || {});
  assert.equal(entries.length, 28);
  assert.equal(entries[0].assignment_id, "B2-1.1");
  assert.ok(entries.some((entry) => entry.assignment_id === "B2-7.28"));
  const groups = getCourseSessionGroups("B2");
  assert.equal(groups.length, 28);
  assert.equal(groups[0].assignmentIds[0], "B2-1.1");
  assert.equal(groups[27].assignmentIds[0], "B2-7.28");
});

test("C1 space-delimited assignment IDs resolve through the dictionary", () => {
  assert.equal(getCourseDictionaryEntry("C1 1")?.chapter, "1");
  assert.equal(getCourseDictionaryEntry("c1 28")?.chapter, "28");
  assert.match(getUnifiedTopicLabel("C1 1"), /^1\./);
});

test("browser and Firebase chapter parsers support hyphen and C1 space formats", () => {
  for (const parser of [parseBrowserChapter, parseFunctionChapter]) {
    assert.equal(parser("B2-7.28"), "7.28");
    assert.equal(parser("C1 28"), "28");
    assert.equal(parser("A1-Tutorial"), "Tutorial");
    assert.equal(parser(""), "");
  }
});

test("attendance entry points use the shared chapter parsers", () => {
  for (const path of ["src/pages/CanonicalAttendancePageV2.jsx", "src/pages/CanonicalAttendancePageV3.jsx"]) {
    const source = fs.readFileSync(path, "utf8");
    assert.match(source, /parseAssignmentChapter\(assignmentId\)/);
    assert.doesNotMatch(source, /assignmentId\.split\("-"\)/);
  }
  const functionsIndex = fs.readFileSync("functions/index.js", "utf8");
  const autoOpen = fs.readFileSync("functions/classSessionAutoCheckin.js", "utf8");
  assert.match(functionsIndex, /require\("\.\/assignmentChapter\.js"\)/);
  assert.match(autoOpen, /require\("\.\/assignmentChapter\.js"\)/);
});
