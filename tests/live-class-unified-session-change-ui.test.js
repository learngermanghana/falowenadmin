import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const liveClassesPath = new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url);
const sessionEditorPath = new URL("../src/components/LiveClassSessionEditor.jsx", import.meta.url);
const compatibilityPath = new URL("../src/pages/LiveClassesPageCompat.jsx", import.meta.url);
const attendancePath = new URL("../src/pages/CanonicalAttendancePage.jsx", import.meta.url);
const schedulePath = new URL("../src/pages/ClassScheduleSetupPage.jsx", import.meta.url);

async function source(path) {
  return readFile(path, "utf8");
}

test("Live Classes shares the canonical Session Editor for move and cancel", async () => {
  const page = await source(liveClassesPath);
  const editor = await source(sessionEditorPath);
  assert.match(page, /import LiveClassSessionEditor/);
  assert.match(page, /openSessionChange\(session, action = "reschedule"\)/);
  assert.match(page, /openSessionChange\(session, "cancel"\)/);
  assert.match(page, /initialAction={sessionChange.action}/);
  assert.match(page, /klass={dashboard.klass}/);
  assert.match(page, /session={editingSession}/);
  assert.match(editor, /const cancelling = sessionChange.action === "cancel"/);
  assert.match(editor, /<option value="following">Recalculate from this lesson onward<\/option>/);
  assert.match(editor, /<option value="single">Move only this session<\/option>/);
  assert.match(editor, /cancelSession\(/);
  assert.match(editor, /rescheduleSession\(/);
  assert.match(editor, /classId: klass.id \|\| klass.classRecordId/);
});

test("legacy compatibility page delegates to the safe unified workflow", async () => {
  const text = await source(compatibilityPath);
  assert.match(text, /LiveClassesPageV2\.jsx/);
  assert.doesNotMatch(text, /window\.prompt/);
  assert.doesNotMatch(text, />Reschedule</);
});

test("Attendance and Class Schedule show the shared session change", async () => {
  const attendance = await source(attendancePath);
  const schedule = await source(schedulePath);
  assert.match(attendance, /This lesson was cancelled in Live Classes/);
  assert.match(schedule, /Latest individual session change/);
  assert.match(schedule, /Open matching attendance/);
});
