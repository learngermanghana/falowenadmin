import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("Students hub restores Leads as a first-class tab", () => {
  const hub = read("src/pages/StudentHubPage.jsx");

  assert.match(hub, /StudentLeadsPanel/);
  assert.match(hub, /if \(value === "leads"\) return "leads"/);
  assert.match(hub, /onClick=\{\(\) => selectTab\("leads"\)\}/);
  assert.match(hub, />\s*Leads\s*<\/button>/);
  assert.match(hub, /activeTab === "leads"[\s\S]{0,160}<StudentLeadsPanel/);
  assert.match(hub, /nextTab === "activity" \|\| nextTab === "leads"/);
});

test("existing lead entry points still target the Students Leads tab", () => {
  const dashboard = read("src/pages/DashboardPage.jsx");
  const notification = read("src/components/LeadHomepageNotification.jsx");

  assert.match(dashboard, /to="\/students\?tab=leads"/);
  assert.match(notification, /to="\/students\?tab=leads"/);
});

test("production patch owns Leads at StudentHubPage rather than the old directory page", () => {
  const patch = read("scripts/patchStudentLeadsTab.mjs");
  const repair = read("scripts/repairAnswersJson.mjs");

  assert.match(patch, /StudentHubPage\.jsx/);
  assert.doesNotMatch(patch, /StudentDirectoryPage\.jsx/);
  assert.match(patch, /StudentLeadsPanel/);
  assert.match(patch, /nextTab === "activity" \|\| nextTab === "leads"/);
  assert.match(repair, /patchStudentLeadsTab\.mjs/);
});
