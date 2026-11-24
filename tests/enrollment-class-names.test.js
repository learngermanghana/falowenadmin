import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {enrollmentClassNames} from "../src/utils/enrollmentClassNames.js";
const fixtures=[
  {
    "name": "A2 Dortmund Klasse",
    "language": "German",
    "levelId": "A2",
    "status": "active"
  },
  {
    "name": "A2 Dortmund Klasse",
    "language": "German",
    "levelId": "A2",
    "status": "upcoming"
  },
  {
    "name": "A2 Berlin Klasse",
    "language": "German",
    "levelId": "A2",
    "status": "upcoming"
  },
  {
    "name": "A2 Archived",
    "language": "German",
    "levelId": "A2",
    "status": "active",
    "archived": true
  },
  {
    "name": "A1 Hamburg Klasse",
    "language": "German",
    "levelId": "A1",
    "status": "active"
  },
  {
    "name": "A2 Swahili",
    "language": "Swahili",
    "levelId": "A2",
    "status": "active"
  },
  {
    "name": "A2 Inactive",
    "language": "German",
    "levelId": "A2",
    "status": "active",
    "active": false
  },
  {
    "name": "A2 Draft",
    "language": "German",
    "levelId": "A2",
    "status": "draft"
  }
];
test("enrollment class options are unique and restricted to open cohorts at the selected language and level",()=>{assert.deepEqual(enrollmentClassNames(fixtures,"german","A2"),["A2 Berlin Klasse","A2 Dortmund Klasse"]);assert.deepEqual(enrollmentClassNames(fixtures,"swahili","A2"),["A2 Swahili"]);assert.deepEqual(enrollmentClassNames(fixtures,"german","A1"),["A1 Hamburg Klasse"]);});
test("no matching classes does not invent names",()=>{assert.deepEqual(enrollmentClassNames(fixtures,"german","C2"),[]);assert.deepEqual(enrollmentClassNames(null,"german","A2"),[]);});
test("both enrollment forms reuse directory classes and preserve existing assignments",()=>{const component=readFileSync(new URL("../src/components/StudentLevelEnrollments.jsx",import.meta.url),"utf8");const page=readFileSync(new URL("../src/pages/StudentDirectoryPage.jsx",import.meta.url),"utf8");assert.equal((component.match(/<EnrollmentClassSelect /g)||[]).length,2);assert.ok(component.includes("existingName={row.className}"));assert.ok(component.includes('["program","level"].includes(key)'));assert.ok(page.includes('pushToast={pushToast} classes={classes}'));assert.ok(!component.includes("<label>Class<input"));});
