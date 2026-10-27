import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("A2 Day 25 information gap uses concrete complementary roles", () => {
  const source = fs.readFileSync("src/data/a2PresenterKnowledge.js", "utf8");
  assert.match(source, /stressigen Morgen und freien Abend/);
  assert.match(source, /Mittagspause und ihren vollen Nachmittag/);
  assert.match(source, /Rolle A · Annas Morgen und Abend/);
  assert.match(source, /06:30 aufstehen/);
  assert.match(source, /Rolle B · Annas Mittag und Nachmittag/);
  assert.match(source, /17:00 ins Fitnessstudio gehen/);
  assert.match(source, /Fragt euch nach den fehlenden Zeiten und Aktivitäten/);
});
