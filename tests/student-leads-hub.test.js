import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("Students page is focused on student records only", () => {
  const hub = read("src/pages/StudentHubPage.jsx");

  assert.match(hub, /StudentDirectoryPage/);
  assert.doesNotMatch(hub, /StudentLeadsPanel/);
  assert.doesNotMatch(hub, /StudentActivityPage/);
  assert.doesNotMatch(hub, /Student Activity/);
  assert.doesNotMatch(hub, /useSearchParams/);
});

test("Leads have a dedicated admin page", () => {
  const leads = read("src/pages/LeadsPage.jsx");
  const app = read("src/App.jsx");

  assert.match(leads, /StudentLeadsPanel/);
  assert.match(leads, /Manage prospective students/);
  assert.match(app, /path="\/leads"/);
  assert.match(app, /<LeadsPage/);
  assert.match(app, /to="\/leads"[\s\S]{0,180}>Leads<\/Link>/);
});

test("lead entry points use the dedicated Leads route", () => {
  const dashboard = read("src/pages/DashboardPage.jsx");
  const notification = read("src/components/LeadHomepageNotification.jsx");

  assert.match(dashboard, /to="\/leads"/);
  assert.match(notification, /to="\/leads"/);
  assert.doesNotMatch(dashboard, /students\?tab=leads/);
  assert.doesNotMatch(notification, /students\?tab=leads/);
});

test("Student Activity stays retired and mock timing monitor is in navigation", () => {
  const app = read("src/App.jsx");
  const timedAttempts = read("src/pages/TimedAssignmentAttemptsPage.jsx");

  assert.match(app, /to="\/timed-attempts"[\s\S]{0,180}>Mock Monitoring & Timers<\/Link>/);
  assert.match(app, /TimedAssignmentAttemptsPage = lazy/);
  assert.match(app, /path="\/timed-attempts"[\s\S]{0,160}<TimedAssignmentAttemptsPage/);
  assert.match(app, /path="\/student-activity"[\s\S]{0,160}Navigate to="\/students"/);
  assert.match(timedAttempts, /Timed assignment attempts/);
  assert.match(timedAttempts, /Reset timed attempt/);
});

test("build repair no longer patches Leads back into Students", () => {
  const repair = read("scripts/repairAnswersJson.mjs");
  assert.doesNotMatch(repair, /patchStudentLeadsTab\.mjs/);
});
