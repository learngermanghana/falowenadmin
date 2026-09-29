import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Presentation view remains full-canvas with only compact navigation", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");

  assert.match(presenter, /Presentation view/);
  assert.match(presenter, /aria-label="Restore presenter controls"/);
  assert.doesNotMatch(presenter, />Show marking</);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-topbar/);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-student-picker/);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-footer/);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-content/);
});

test("quick participation marking exposes Correct, Needs review, Skip and Absent without speaking rubric boxes", () => {
  const picker = fs.readFileSync("src/components/PresenterStudentPicker.jsx", "utf8");
  const toolbarStart = picker.indexOf('<div className="presenter-student-actions"');
  const toolbarEnd = picker.indexOf("</div>", toolbarStart);
  const toolbar = picker.slice(toolbarStart, toolbarEnd);

  assert.match(toolbar, />Correct</);
  assert.match(toolbar, />Needs review</);
  assert.match(toolbar, />Skip</);
  assert.match(toolbar, />Absent</);
  assert.doesNotMatch(toolbar, />Needs help</);
  assert.doesNotMatch(toolbar, /Language clear|Grammar controlled|Task completed/);
  assert.doesNotMatch(picker, />\s*Presenter absent\s*<\/button>/);
});
