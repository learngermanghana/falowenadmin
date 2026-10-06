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
  assert.doesNotMatch(page, /\\n\s+const scheduleInfo/);
});

test("Bulk attendance panel imports and uses its scoped layout stylesheet", () => {
  const panel = fs.readFileSync("src/components/BulkAttendanceRepairPanel.jsx", "utf8");
  const css = fs.readFileSync("src/components/BulkAttendanceRepairPanel.css", "utf8");

  assert.match(panel, /import "\.\/BulkAttendanceRepairPanel\.css";/);
  assert.doesNotMatch(panel, /\\nimport "\.\/BulkAttendanceRepairPanel\.css"/);
  assert.match(panel, /bulk-attendance-row-copy/);
  assert.match(panel, /bulk-attendance-actionnote/);
  assert.match(css, /\.bulk-attendance-repair \.bulk-attendance-toolbar button/);
  assert.match(css, /\.bulk-attendance-row-copy/);
  assert.match(css, /@media \(max-width: 980px\)/);
});


test("CheckinDisplay anchors the live Ghana clock to backend serverTime", () => {
  const page = fs.readFileSync("src/pages/CheckinDisplayPage.jsx", "utf8");
  assert.match(page, /resolveDisplayStatusApiUrl/);
  assert.match(page, /checkinStatus/);
  assert.match(page, /new URL\(statusApiUrl, window\.location\.origin\)/);
  assert.match(page, /data\?\.serverTime/);
  assert.match(page, /performance\.now\(\)/);
  assert.match(page, /serverClockAnchorRef\.current/);
  assert.match(page, /Could not synchronize authoritative attendance clock/);
});
