import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertScoreUpsertReceipt,
  buildScoreUpsertPayload,
  canonicalAssignmentId,
  collapseStudentResultRows,
  studentResultKey,
} from "../src/utils/studentResultUpsert.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("Nabi duplicate results collapse to the newest A2-7.18 row", () => {
  const older = {
    sheetRowNumber: 12,
    studentCode: "NABIFRANCIS921",
    assignment: "A2 • Day 18: Die Bank anrufen 7.18 • Chapter 7.18",
    assignmentId: "A2-7.18",
    score: 70,
    comments: "Older feedback",
    date: "Tue Jul 28 2026 09:19:00 GMT+0100 (West Africa Time)",
  };
  const newer = {
    sheetRowNumber: 19,
    studentCode: "NABIFRANCIS921",
    assignment: "A2 • Day 18: Die Bank anrufen 7.18 • Chapter 7.18",
    assignmentId: "A2-7.18",
    score: 90,
    comments: "Latest feedback",
    date: "Tue Jul 28 2026 10:43:10 GMT+0100 (West Africa Time)",
  };

  const result = collapseStudentResultRows([older, newer]);

  assert.equal(result.rawCount, 2);
  assert.equal(result.duplicateCount, 1);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].score, 90);
  assert.equal(result.rows[0].comments, "Latest feedback");
  assert.deepEqual(result.rows[0].duplicateSheetRowNumbers, [12]);
  assert.equal(result.rows[0].canonicalResultKey, "NABIFRANCIS921__A2-7.18");
});

test("result identity ignores harmless formatting differences", () => {
  const left = studentResultKey({ studentCode: "nabi-francis 921", assignmentId: "a2_7_18" });
  const right = studentResultKey({ studentcode: "NABIFRANCIS921", assignment_id: "A2-7.18" });

  assert.equal(left, "NABIFRANCIS921__A2-7.18");
  assert.equal(left, right);
  assert.equal(canonicalAssignmentId({ assignment: "A2 • Day 18 • A2-7_18" }), "A2-7.18");
});

test("bulk upsert keeps only the latest incoming result for one identity", () => {
  const payload = buildScoreUpsertPayload([
    { studentCode: "NABIFRANCIS921", assignmentId: "A2-7.18", score: 70, comments: "Old" },
    { studentCode: "NABIFRANCIS921", assignmentId: "A2-7.18", score: 90, comments: "New" },
  ], {
    token: "test-token",
    sheetName: "Key",
    now: new Date("2026-07-28T10:43:10+01:00"),
  });

  assert.equal(payload.action, "upsertScoreRows");
  assert.equal(payload.mode, "upsert");
  assert.equal(payload.remove_duplicate_rows, true);
  assert.deepEqual(payload.dedupe_columns, ["studentcode", "assignment_id"]);
  assert.equal(payload.rows.length, 1);
  assert.equal(payload.rows[0].score, 90);
  assert.equal(payload.rows[0].comments, "New");
  assert.equal(payload.rows[0].dedupe_id, "NABIFRANCIS921__A2-7.18");
});

test("override refuses a legacy append-only webhook acknowledgement", () => {
  assert.throws(
    () => assertScoreUpsertReceipt({ ok: true, count: 1 }),
    /append-only/i,
  );
  assert.doesNotThrow(() => assertScoreUpsertReceipt({
    ok: true,
    action: "upsertScoreRows",
    updated: 1,
    duplicatesRemoved: 1,
  }));
});

test("student results service requires verified upsert and has no no-cors append fallback", () => {
  const serviceSource = read("src/services/studentResultsService.js");
  const utilitySource = read("src/utils/studentResultUpsert.js");
  assert.match(serviceSource, /assertScoreUpsertReceipt/);
  assert.match(utilitySource, /action:\s*"upsertScoreRows"/);
  assert.doesNotMatch(serviceSource, /mode:\s*"no-cors"/);
  assert.match(serviceSource, /collapseStudentResultRows/);
});

test("Apps Script updates matches and deletes older duplicate rows", () => {
  const source = read("docs/apps-script/score-results-upsert.gs");
  assert.match(source, /body\.action !== "upsertScoreRows"/);
  assert.match(source, /findMatchingRows_/);
  assert.match(source, /setValues/);
  assert.match(source, /sheet\.deleteRow\(rowNumber\)/);
  assert.match(source, /duplicatesRemoved/);
  assert.match(source, /if \(!matches\.length\)/);
});
