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

test("ordinary non-mock result rows do not inherit final mock practice labels", () => {
  assert.match(source, /const hasFinalMockMetadata = Boolean\(attemptType \|\| hasSectionScores\);/);
  assert.match(source, /if \(!hasFinalMockMetadata\) return "";/);
  assert.doesNotMatch(source, /attemptType === "practice" \|\| attemptNumber > 1/);
  assert.match(source, /finalMockBreakdown\(row\) \|\| "—"/);
  assert.match(source, /finalMockAttemptLabel\(row\) \?/);
});

test("final mock retries still use attempt number after final mock metadata is established", () => {
  assert.match(source, /const hasSectionScores = Boolean\(/);
  assert.match(source, /row\.sectionScores/);
  assert.match(source, /if \(attemptType === "practice" \|\| attemptNumber > 1\) return `Practice attempt \$\{attemptNumber\}`;/);
});
