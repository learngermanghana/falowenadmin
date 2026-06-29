import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const mobileCss = fs.readFileSync(new URL("../src/LiveClassesMobile.css", import.meta.url), "utf8");

test("loads the live classes mobile stylesheet", () => {
  assert.match(appSource, /import "\.\/LiveClassesMobile\.css";/);
});

test("turns session tables into stacked cards on phones", () => {
  assert.match(mobileCss, /@media \(max-width: 700px\)/);
  assert.match(mobileCss, /table tbody tr[\s\S]*display: grid/);
  assert.match(mobileCss, /table thead[\s\S]*display: none/);
  assert.match(mobileCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(mobileCss, /min-height: 44px/);
});

test("removes the desktop table minimum width on phones", () => {
  assert.match(mobileCss, /table[\s\S]*min-width: 0/);
});
