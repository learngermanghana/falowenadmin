import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url), "utf8");

test("Live Classes communication shows reminder and attendance delivery outcomes", () => {
  assert.match(page, /Email delivery status/);
  assert.match(page, /Class about-to-start reminder/);
  assert.match(page, /Attendance summary email/);
  assert.match(page, /classReminderEmailLastStatus/);
  assert.match(page, /attendanceConfirmationEmailLastStatus/);
  assert.match(page, /Last successful send/);
  assert.match(page, /Emails sent/);
});
