import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const markingSource = fs.readFileSync(new URL("../src/pages/TutorMarkingSimplePage.jsx", import.meta.url), "utf8");
const communicationSource = fs.readFileSync(new URL("../src/components/AttendanceConfirmationAutomationPanel.jsx", import.meta.url), "utf8");

test("tutor marking route uses the simplified workspace", () => {
  assert.match(appSource, /TutorMarkingSimplePage/);
  assert.match(appSource, /<TutorMarkingSimplePage\s*\/>/);
  assert.doesNotMatch(appSource, /import TutorMarkingPage from/);
});

test("simplified workspace has one correction workflow and two final actions", () => {
  assert.equal((markingSource.match(/Corrections \(/g) || []).length, 1);
  assert.match(markingSource, /Add highlighted correction/);
  assert.match(markingSource, /Approve & send/);
  assert.match(markingSource, /Return with feedback/);
  assert.match(markingSource, /Tutor comment/);
  assert.doesNotMatch(markingSource, /Phrase-level mistakes/);
  assert.doesNotMatch(markingSource, /Quick comment/);
  assert.doesNotMatch(markingSource, /Feedback checklist/);
  assert.doesNotMatch(markingSource, /Tutor decision/);
});

test("attendance email panel rejects sheet-only class names and explains failures", () => {
  assert.match(communicationSource, /klass\.classRecordId \|\| klass\.id/);
  assert.doesNotMatch(communicationSource, /klass\.classRecordId \|\| klass\.id \|\| klass\.classId/);
  assert.match(communicationSource, /No usable Live Class record was found/);
  assert.match(communicationSource, /Classes could not be loaded/);
  assert.match(communicationSource, /This class’s settings could not be opened/);
  assert.match(communicationSource, /Reload classes/);
});
