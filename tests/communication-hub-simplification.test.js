import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("communication hub exposes one workflow at a time", () => {
  const hub = read("src/pages/CommunicationHubPage.jsx");
  assert.match(hub, />\s*Messages\s*</);
  assert.match(hub, />\s*Email Automations\s*</);
  assert.match(hub, />\s*System Health\s*</);
  assert.match(hub, />\s*Send message\s*</);
  assert.match(hub, />\s*Class change\s*</);
  assert.match(hub, /messageMode === "send" \? <CommunicationMessagesPage \/> : <CommunicationLiveClassActions \/>/);
  assert.doesNotMatch(hub, /<TargetedCommunicationPanel/);
  assert.doesNotMatch(hub, /<CommunicationPage/);
});

test("send-message page has one audience chooser and shared history", () => {
  const messages = read("src/pages/CommunicationMessagesPage.jsx");
  assert.match(messages, /Who should receive it\?/);
  assert.match(messages, /Everyone, a level, one class, or one student/);
  assert.match(messages, /Students matching a condition/);
  assert.match(messages, /<TargetedCommunicationPanel embedded showHistory=\{false\} \/>/);
  assert.match(messages, /<CommunicationPage embedded \/>/);
  assert.match(messages, /<CommunicationHistoryPanel \/>/);
});

test("legacy send engines can render inside the unified composer", () => {
  const broadcast = read("src/pages/CommunicationPage.jsx");
  const targeted = read("src/components/TargetedCommunicationPanel.jsx");
  assert.match(broadcast, /CommunicationPage\(\{ embedded = false \}\)/);
  assert.match(targeted, /TargetedCommunicationPanel\(\{ embedded = false, showHistory = true \}\)/);
  assert.match(targeted, /\{showHistory \? \(/);
});


test("shared communication history refreshes after failed persisted send attempts", () => {
  const broadcast = read("src/pages/CommunicationPage.jsx");
  const targeted = read("src/components/TargetedCommunicationPanel.jsx");

  assert.match(broadcast, /let historyMayHaveChanged = false/);
  assert.match(broadcast, /historyMayHaveChanged = true;[\s\S]*saveAnnouncementRow/);
  assert.match(
    broadcast,
    /finally \{[\s\S]*historyMayHaveChanged[\s\S]*falowen:communication-sent/,
  );

  assert.match(targeted, /let historyMayHaveChanged = false/);
  assert.match(targeted, /historyMayHaveChanged = true;[\s\S]*saveAnnouncementBatch/);
  assert.match(
    targeted,
    /finally \{[\s\S]*historyMayHaveChanged[\s\S]*falowen:communication-sent/,
  );
});
