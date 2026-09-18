import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  destinationForType,
  eventIdFrom,
  registrationConfig,
  validateCommunicationRows,
  validateRegistrationRows,
  validateScoreRows,
} from "../api/integration-hub.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("integration event types route to the correct worker", () => {
  assert.equal(destinationForType("score.upsert"), "scores");
  assert.equal(destinationForType("communication.send"), "communication");
  assert.equal(destinationForType("certificate.send"), "communication");
  assert.equal(destinationForType("attendance.summary"), "communication");
  assert.equal(destinationForType("registration.received"), "registration");
  assert.equal(destinationForType("enrollment.confirmed"), "registration");
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

test("registration lifecycle dispatch requires a student identity", () => {
  assert.doesNotThrow(() => validateRegistrationRows([{ student_code: "Adu123" }]));
  assert.doesNotThrow(() => validateRegistrationRows([{ email: "student@example.com" }]));
  assert.throws(() => validateRegistrationRows([{ name: "Student" }]), /student code or email/i);
});

test("registration integration hub defaults to the deployed Registration Docs URL", () => {
  const previousUrl = process.env.REGISTRATION_DOCS_WEBHOOK_URL;
  const previousRegistrationToken = process.env.REGISTRATION_DOCS_WEBHOOK_TOKEN;
  const previousAnnouncementToken = process.env.ANNOUNCEMENT_WEBHOOK_TOKEN;
  try {
    delete process.env.REGISTRATION_DOCS_WEBHOOK_URL;
    delete process.env.REGISTRATION_DOCS_WEBHOOK_TOKEN;
    process.env.ANNOUNCEMENT_WEBHOOK_TOKEN = "existing-announcement-secret";
    const config = registrationConfig();
    assert.equal(config.url, "https://script.google.com/macros/s/AKfycbxWsVmzNdDMXtUd0CwChFXR_Iy6lbb7oVVt8ao_6_8oYYFI9Te9Y7pD0FgIJTjAozYOQg/exec");
    assert.equal(config.token, "existing-announcement-secret");
  } finally {
    if (previousUrl === undefined) delete process.env.REGISTRATION_DOCS_WEBHOOK_URL;
    else process.env.REGISTRATION_DOCS_WEBHOOK_URL = previousUrl;
    if (previousRegistrationToken === undefined) delete process.env.REGISTRATION_DOCS_WEBHOOK_TOKEN;
    else process.env.REGISTRATION_DOCS_WEBHOOK_TOKEN = previousRegistrationToken;
    if (previousAnnouncementToken === undefined) delete process.env.ANNOUNCEMENT_WEBHOOK_TOKEN;
    else process.env.ANNOUNCEMENT_WEBHOOK_TOKEN = previousAnnouncementToken;
  }
});

test("registration document worker reuses the Announcement token", () => {
  const previousUrl = process.env.REGISTRATION_DOCS_WEBHOOK_URL;
  const previousRegistrationToken = process.env.REGISTRATION_DOCS_WEBHOOK_TOKEN;
  const previousAnnouncementToken = process.env.ANNOUNCEMENT_WEBHOOK_TOKEN;
  try {
    process.env.REGISTRATION_DOCS_WEBHOOK_URL = "https://script.google.com/macros/s/registration/exec";
    delete process.env.REGISTRATION_DOCS_WEBHOOK_TOKEN;
    process.env.ANNOUNCEMENT_WEBHOOK_TOKEN = "existing-announcement-secret";
    const config = registrationConfig();
    assert.equal(config.url, "https://script.google.com/macros/s/registration/exec");
    assert.equal(config.token, "existing-announcement-secret");
  } finally {
    if (previousUrl === undefined) delete process.env.REGISTRATION_DOCS_WEBHOOK_URL;
    else process.env.REGISTRATION_DOCS_WEBHOOK_URL = previousUrl;
    if (previousRegistrationToken === undefined) delete process.env.REGISTRATION_DOCS_WEBHOOK_TOKEN;
    else process.env.REGISTRATION_DOCS_WEBHOOK_TOKEN = previousRegistrationToken;
    if (previousAnnouncementToken === undefined) delete process.env.ANNOUNCEMENT_WEBHOOK_TOKEN;
    else process.env.ANNOUNCEMENT_WEBHOOK_TOKEN = previousAnnouncementToken;
  }
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
  assert.match(server, /REGISTRATION_DOCS_WEBHOOK_URL/);
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
  assert.match(panel, /Registration documents/);
});
