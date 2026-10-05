import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
  path.join(root, "src/pages/StudentResultsComparePage.jsx"),
  "utf8",
);

test("Admin result table shows final mock attempt type and four-skill breakdown", () => {
  assert.match(source, /finalMockAttemptLabel/);
  assert.match(source, /attemptLabel/);
  assert.match(source, /attemptType/);
  assert.match(source, /First readiness attempt/);
  assert.match(source, /Practice attempt/);

  assert.match(source, /finalMockBreakdown/);
  assert.match(source, /sectionScores/);
  assert.match(source, /Lesen/);
  assert.match(source, /Hören/);
  assert.match(source, /Schreiben/);
  assert.match(source, /Sprechen/);
  assert.match(source, /"Breakdown"/);
  assert.match(source, /\/25/);
});

test("ordinary non-mock result rows still have safe fallbacks", () => {
  assert.match(source, /return "";/);
  assert.match(source, /finalMockBreakdown\(row\) \|\| "—"/);
  assert.match(source, /finalMockAttemptLabel\(row\) \?/);
});
