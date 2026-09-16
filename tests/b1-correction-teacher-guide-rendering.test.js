import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");

test("B1 correction answers show a teacher explanation section", () => {
  assert.match(presenter, /buildB1CorrectionTeacherGuide/);
  assert.match(presenter, /What to explain to students/);
  assert.match(presenter, /stage\.id === "b1-grammar-check"/);
});

test("B1 Day 12 während guide explains subordinate-clause inversion", () => {
  assert.match(presenter, /Während wir wanderten/);
  assert.match(presenter, /subordinate clause \(Nebensatz\)/);
  assert.match(presenter, /begann es \.\.\., not es begann/);
  assert.match(presenter, /While we were hiking, it began to rain/);
});

test("B1 Day 12 nachdem guide explains narrative tense sequence", () => {
  assert.match(presenter, /Plusquamperfekt/);
  assert.match(presenter, /Präteritum/);
  assert.match(presenter, /sind angekommen = have arrived/);
  assert.match(presenter, /waren angekommen = had arrived/);
  assert.match(presenter, /After we had arrived, we put up the tent/);
});
