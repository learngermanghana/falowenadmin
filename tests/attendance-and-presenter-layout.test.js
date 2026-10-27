import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("presenter Common mistakes stage has a dedicated non-clipping layout", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");

  assert.match(presenter, /presenter-stage-\$\{stage\.id\}/);
  assert.match(css, /\.presenter-stage-mistakes\s*\{/);
  assert.match(css, /justify-content:\s*flex-start/);
  assert.match(css, /\.presenter-stage-mistakes\s*>\s*h1/);
  assert.match(css, /overflow:\s*visible/);
});

test("bulk attendance repair uses grouped responsive layout classes", () => {
  const panel = fs.readFileSync("src/components/BulkAttendanceRepairPanel.jsx", "utf8");
  const css = fs.readFileSync("src/components/BulkAttendanceRepairPanel.css", "utf8");

  assert.match(panel, /bulk-attendance-columns/);
  assert.match(panel, /bulk-attendance-column/);
  assert.match(panel, /bulk-attendance-actionbar/);
  assert.match(panel, /bulk-attendance-primary-action/);
  assert.match(css, /grid-template-columns:\s*repeat\(2,/);
  assert.match(css, /@media \(max-width: 760px\)/);
});
