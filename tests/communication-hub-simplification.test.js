import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("Communication route is rebuilt with exactly four focused workflow tabs", () => {
  const hub = read("src/pages/CommunicationHubPage.jsx");
  const workspace = read("src/pages/CommunicationWorkspacePage.jsx");
  assert.match(hub, /<CommunicationWorkspacePage\s*\/>/);
  assert.doesNotMatch(hub, /CommunicationMessagesPage|CommunicationLiveClassActions|messageMode/);
  assert.match(workspace, /id: "bulk", label: "Bulk messages"/);
  assert.match(workspace, /id: "student", label: "One student"/);
  assert.match(workspace, /id: "documents", label: "Documents"/);
  assert.match(workspace, /id: "promotions", label: "Class promotions"/);
  assert.equal((workspace.match(/id: "(bulk|student|documents|promotions)", label:/g) || []).length, 4);
  assert.match(workspace, /<Link to="\/live-classes"/);
  assert.doesNotMatch(workspace, /label: "Cancel class"|label: "Class change"/);
});

test("broadcasts preserve the existing announcement worker and its audience contract", () => {
  const workspace = read("src/pages/CommunicationWorkspacePage.jsx");
  const service = read("src/services/communicationService.js");
  assert.match(workspace, /saveAnnouncementRow/);
  assert.match(workspace, /className: audience === "all" && language === "all" \? "all"/);
  assert.match(workspace, /Promise\.allSettled\(rows\.map/);
  assert.match(workspace, /rows\.length \+ " class broadcasts accepted/);
  assert.match(workspace, /notifyHistory\(\)/);
  assert.match(service, /dispatchIntegrationEvent/);
});

test("personal message resolves an actual student email, not a bulk audience", () => {
  const workspace = read("src/pages/CommunicationWorkspacePage.jsx");
  assert.match(workspace, /listAllStudents/);
  assert.match(workspace, /studentEmail\(selectedStudent\)/);
  assert.match(workspace, /deliveryMode: row\.email \? "individual" : "auto"/);
  assert.match(workspace, /Send to this student/);
});

test("documents are user-reviewed downloads, not fabricated course certificates", () => {
  const workspace = read("src/pages/CommunicationWorkspacePage.jsx");
  assert.match(workspace, /function downloadWord\(\)/);
  assert.match(workspace, /function printDocument\(\)/);
  assert.match(workspace, /escapeHtml/);
  assert.match(workspace, /before official use/);
  assert.doesNotMatch(workspace, /attachCertificate: true/);
});

test("promotion uses only future classes with scoped recipients and explicit confirmation", () => {
  const workspace = read("src/pages/CommunicationWorkspacePage.jsx");
  assert.match(workspace, /const isUpcoming/);
  assert.match(workspace, /upcomingClasses\.find/);
  assert.match(workspace, /languageOf\(klass\) === languageOf\(upcomingClass\)/);
  assert.match(workspace, /Confirm & send/);
});

test("attendance settings and integration health remain accessible outside the four tabs", () => {
  const hub = read("src/pages/CommunicationHubPage.jsx");
  assert.match(hub, /<details>/);
  assert.match(hub, /Email Automations/);
  assert.match(hub, /AttendanceConfirmationAutomationPanel/);
  assert.match(hub, /AttendanceFailedDeliveryRetryPanel/);
  assert.match(hub, /System Health/);
  assert.match(hub, /IntegrationEventPanel/);
});
