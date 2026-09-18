import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  destinationForType,
  eventIdFrom,
  validateCommunicationRows,
  validateScoreRows,
} from "../api/integration-hub.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("integration event types route to the correct worker", () => {
  assert.equal(destinationForType("score.upsert"), "scores");
  assert.equal(destinationForType("communication.send"), "communication");
  assert.equal(destinationForType("certificate.send"), "communication");
  assert.equal(destinationForType("attendance.summary"), "communication");
  assert.equal(destinationForType("unknown.event"), "");
});

test("event IDs are stable when supplied and generated otherwise", () => {
  assert.equal(eventIdFrom("evt_fixed_123456"), "evt_fixed_123456");
  assert.match(eventIdFrom(""), /^evt_\d+_[a-f0-9]{12}$/);
});

test("score dispatch requires canonical identity and dedupe keys", () => {
  assert.doesNotThrow(() => validateScoreRows([{
    studentcode: "TEST123",
    assignment_id: "A2-7.18",
    dedupe_id: "TEST123__A2-7.18",
    score: 91,
  }]));
  assert.throws(() => validateScoreRows([{ studentcode: "TEST123", score: 91 }]), /assignment ID and dedupe ID/i);
});

test("communication dispatch requires topic and body", () => {
  assert.doesNotThrow(() => validateCommunicationRows([{
    topic: "Class Reminder",
    announcement: "Class begins soon.",
    email: "student@example.com",
  }]));
  assert.throws(() => validateCommunicationRows([{ topic: "Class Reminder" }]), /announcement body/i);
});

test("browser services contain no Apps Script secrets or direct webhook URLs", () => {
  const marking = read("src/services/markingServiceBase.js");
  const communication = read("src/services/communicationService.js");
  const integration = read("src/services/integrationEventService.js");

  assert.match(marking, /dispatchIntegrationEvent/);
  assert.match(communication, /dispatchIntegrationEvent/);
  assert.match(integration, /\/api\/integrations\/dispatch/);

  assert.doesNotMatch(marking, /Xenomexpress7727|VITE_SCORES_WEBHOOK_TOKEN|script\.google\.com\/macros/);
  assert.doesNotMatch(communication, /VITE_ANNOUNCEMENT_WEBHOOK_TOKEN|VITE_ANNOUNCEMENT_WEBHOOK_URL|script\.google\.com\/macros/);
  assert.doesNotMatch(integration, /SCORES_WEBHOOK_TOKEN|ANNOUNCEMENT_WEBHOOK_TOKEN/);
});

test("server gateway owns webhook configuration and Admin verification", () => {
  const server = read("api/integration-hub.js");
  const router = read("api/router.js");

  assert.match(server, /SCORES_WEBHOOK_TOKEN/);
  assert.match(server, /ANNOUNCEMENT_WEBHOOK_TOKEN/);
  assert.match(server, /verifyFirebaseAdminUser/);
  assert.match(server, /Administrator access is required/);
  assert.match(server, /event_id/);
  assert.match(server, /requested_by/);
  assert.match(router, /integrations\/dispatch/);
  assert.match(router, /integrations\/health/);
});

test("Communication hub exposes integration event status and retry", () => {
  const hub = read("src/pages/CommunicationHubPage.jsx");
  const panel = read("src/components/IntegrationEventPanel.jsx");
  assert.match(hub, /System events/);
  assert.match(hub, /IntegrationEventPanel/);
  assert.match(panel, /Integration events/);
  assert.match(panel, /Retry/);
  assert.match(panel, /Score sheet/);
  assert.match(panel, /Communication worker/);
});
