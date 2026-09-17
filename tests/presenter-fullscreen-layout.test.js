import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("fullscreen presenter keeps long content inside a scrollable bounded grid row", () => {
  const css = read("src/components/TeachingSlidePresenter.css");
  assert.match(css, /\.presenter-stage\s*\{[\s\S]*grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto/);
  assert.match(css, /\.presenter-content\s*\{[\s\S]*min-height:\s*0/);
  assert.match(css, /\.presenter-content\s*\{[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /\.presenter-content\s*\{[\s\S]*justify-content:\s*safe center/);
  assert.match(css, /\.presenter-shell:fullscreen[\s\S]*\.presenter-stage/);
});

test("presenter with student picker keeps content as minmax zero row", () => {
  const css = read("src/components/PresenterStudentPicker.css");
  assert.match(css, /grid-template-rows:\s*auto\s+auto\s+minmax\(0,\s*1fr\)\s+auto/);
});

test("tablet and phone portrait presenter fills the available viewport instead of staying 16 by 9", () => {
  const css = read("src/components/TeachingSlidePresenter.css");
  assert.match(css, /@media \(max-width:\s*900px\) and \(orientation:\s*portrait\)/);
  assert.match(css, /@media \(max-width:\s*900px\) and \(orientation:\s*portrait\)[\s\S]*\.presenter-stage\s*\{[\s\S]*height:\s*100dvh/);
  assert.match(css, /@media \(max-width:\s*900px\) and \(orientation:\s*portrait\)[\s\S]*\.presenter-stage\s*\{[\s\S]*aspect-ratio:\s*auto/);
  assert.match(css, /@media \(max-width:\s*900px\) and \(orientation:\s*portrait\)[\s\S]*\.presenter-shell\s*\{[\s\S]*place-items:\s*stretch/);
});
