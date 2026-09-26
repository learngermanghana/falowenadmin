import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("Students keeps Needs attention inside the existing student area", () => {
  const app = read("src/App.jsx");
  const hub = read("src/pages/StudentHubPage.jsx");
  const directory = read("src/pages/StudentDirectoryPage.jsx");

  assert.match(app, /<Link to="\/students"[^>]*>Students<\/Link>/);
  assert.doesNotMatch(app, />Needs attention<\/Link>/);
  assert.doesNotMatch(app, />Interventions<\/Link>/);
  assert.match(directory, /"Needs attention"/);
  assert.match(directory, /"Trials & unpaid"/);
  assert.match(directory, /"Archived"/);
  assert.match(directory, /searchParams\.get\("view"\)/);
  assert.match(hub, /StudentDirectoryPage/);
});

test("Dashboard links its compact learning-attention summary into Students", () => {
  const dashboard = read("src/pages/DashboardPage.jsx");

  assert.match(dashboard, /title="Learning attention"/);
  assert.match(dashboard, /to="\/students\?view=attention"/);
  assert.match(dashboard, /summarizeStudentAttention\(students\)/);
});

test("Student detail includes the read-only Learning status panel", () => {
  const directory = read("src/pages/StudentDirectoryPage.jsx");
  const panel = read("src/components/StudentLearningStatusPanel.jsx");

  assert.match(directory, /<StudentLearningStatusPanel student=\{selectedStudent\} \/>/);
  assert.match(panel, /Learning status/);
  assert.match(panel, /No intervention write is created here/);
  assert.match(panel, /Current lesson/);
  assert.match(panel, /Last learning activity/);
  assert.match(panel, /Tutor review/);
});

test("attention UI reuses the loaded student records instead of adding a write service", () => {
  const directory = read("src/pages/StudentDirectoryPage.jsx");
  const dashboard = read("src/pages/DashboardPage.jsx");
  const utility = read("src/utils/studentAttention.js");

  assert.match(directory, /summarizeStudentAttention\(students\)/);
  assert.match(dashboard, /summarizeStudentAttention\(students\)/);
  assert.doesNotMatch(utility, /setDoc|updateDoc|addDoc|writeBatch|serverTimestamp/);
});
