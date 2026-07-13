import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const liveClassesPath = new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url);
const attendancePath = new URL("../src/pages/CanonicalAttendancePage.jsx", import.meta.url);
const schedulePath = new URL("../src/pages/ClassScheduleSetupPage.jsx", import.meta.url);

async function source(path) {
  return readFile(path, "utf8");
}

test("Live Classes exposes one Change session workflow for move and cancel", async () => {
  const text = await source(liveClassesPath);
  assert.match(text, /Change session/);
  assert.match(text, /Move to another date or time/);
  assert.match(text, /Cancel without a new date/);
  assert.match(text, /cancelSession\(/);
  assert.match(text, /rescheduleSession\(/);
});

test("Attendance and Class Schedule show the shared session change", async () => {
  const attendance = await source(attendancePath);
  const schedule = await source(schedulePath);
  assert.match(attendance, /This lesson was cancelled in Live Classes/);
  assert.match(schedule, /Latest individual session change/);
  assert.match(schedule, /Open matching attendance/);
});
