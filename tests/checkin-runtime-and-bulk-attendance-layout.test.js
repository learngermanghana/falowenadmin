import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("CheckinDisplay initializes effectiveAssignmentId before any effect can capture it", () => {
  const page = fs.readFileSync("src/pages/CheckinDisplayPage.jsx", "utf8");
  const declaration = page.indexOf("const effectiveAssignmentId =");
  const firstEffect = page.indexOf("useEffect(() =>");

  assert.ok(declaration > 0, "effectiveAssignmentId declaration missing");
  assert.ok(firstEffect > 0, "CheckinDisplay useEffect missing");
  assert.ok(
    declaration < firstEffect,
    "effectiveAssignmentId must be initialized before the first effect to avoid temporal-dead-zone runtime failures",
  );
});

test("Bulk attendance panel imports and uses its scoped layout stylesheet", () => {
  const panel = fs.readFileSync("src/components/BulkAttendanceRepairPanel.jsx", "utf8");
  const css = fs.readFileSync("src/components/BulkAttendanceRepairPanel.css", "utf8");

  assert.match(panel, /import "\.\/BulkAttendanceRepairPanel\.css";/);
  assert.match(panel, /bulk-attendance-row-copy/);
  assert.match(panel, /bulk-attendance-actionnote/);
  assert.match(css, /\.bulk-attendance-repair \.bulk-attendance-toolbar button/);
  assert.match(css, /\.bulk-attendance-row-copy/);
  assert.match(css, /@media \(max-width: 980px\)/);
});
