import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/pages/DashboardPage.jsx", import.meta.url), "utf8");

test("class progress bars use paid or active students within each class", () => {
  assert.match(source, /const progress = pct\(row\.paid, row\.count\)/);
  assert.doesNotMatch(source, /pct\(row\.count, analytics\.totalStudents\)/);
  assert.match(source, /style=\{\{ width: `\$\{progress\}%` \}\}/);
});

test("class progress bars explain and expose their percentage", () => {
  assert.match(source, /role="progressbar"/);
  assert.match(source, /aria-valuenow=\{progress\}/);
  assert.match(source, /\{row\.paid\} of \{row\.count\} paid\/active · \{progress\}%/);
});
