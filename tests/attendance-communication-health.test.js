import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

import {
  normalizeAttendanceDeliveryRecord,
  summarizeAttendanceDeliveryHealth,
} from "../src/services/attendanceCommunicationHealthService.js";

const require = createRequire(import.meta.url);
const retryModule = require("../functions/attendanceConfirmationRetry.js");

const servicePath = new URL("../src/services/attendanceCommunicationHealthService.js", import.meta.url);
const panelPath = new URL("../src/components/AttendanceCommunicationHealthPanel.jsx", import.meta.url);
const overviewPath = new URL("../src/pages/AttendanceOverviewPage.jsx", import.meta.url);
const indexPath = new URL("../functions/index.js", import.meta.url);
const patchPath = new URL("../scripts/patchAttendanceConfirmationEmails.mjs", import.meta.url);
const vercelPath = new URL("../vercel.json", import.meta.url);

async function source(path) {
  return readFile(path, "utf8");
}

test("delivery health summary separates sent, failed and processing records", () => {
  const records = [
    normalizeAttendanceDeliveryRecord("sent-1", { status: "sent", attemptCount: 1, updatedAt: "2026-09-19T10:00:00Z" }),
    normalizeAttendanceDeliveryRecord("failed-1", { status: "failed", attemptCount: 2, lastError: "Webhook timeout", updatedAt: "2026-09-19T11:00:00Z" }),
    normalizeAttendanceDeliveryRecord("processing-1", { status: "processing", attemptCount: 1, updatedAt: "2026-09-19T12:00:00Z" }),
  ];

  const summary = summarizeAttendanceDeliveryHealth(records);
  assert.equal(summary.total, 3);
  assert.equal(summary.sent, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.processing, 1);
  assert.equal(summary.totalAttempts, 4);
  assert.equal(summary.latest.id, "processing-1");
  assert.equal(summary.latestFailure.id, "failed-1");
  assert.equal(summary.healthy, false);
});

test("backend health serializer exposes delivery state without the email body", () => {
  const record = retryModule._test.deliveryHealthRecord({
    id: "delivery-1",
    data: () => ({
      classId: "class-1",
      className: "A2 Berlin Klasse",
      studentName: "Student One",
      studentEmail: "student@example.com",
      periodKey: "2026-W38",
      mode: "weekly",
      status: "failed",
      attemptCount: 3,
      lastError: "Announcement webhook returned HTTP 500",
      message: "Private email body should not be returned",
      updatedAt: new Date("2026-09-19T12:30:00.000Z"),
    }),
  });

  assert.equal(record.status, "failed");
  assert.equal(record.attemptCount, 3);
  assert.equal(record.studentEmail, "student@example.com");
  assert.equal(record.lastError, "Announcement webhook returned HTTP 500");
  assert.equal(record.updatedAt, "2026-09-19T12:30:00.000Z");
  assert.equal(Object.prototype.hasOwnProperty.call(record, "message"), false);
});

test("attendance health is read through the protected Admin API, not direct Firestore", async () => {
  const [service, index, patch] = await Promise.all([
    source(servicePath),
    source(indexPath),
    source(patchPath),
  ]);

  assert.match(service, /attendance-confirmation-emails\/health\?classId=/);
  assert.match(service, /Authorization: "Bearer " \+ token/);
  assert.doesNotMatch(service, /attendanceEmailDeliveries/);

  assert.match(index, /app\.get\("\/attendance-confirmation-emails\/health"/);
  assert.match(index, /await requireAuth\(req\)/);
  assert.match(index, /listAttendanceDeliveryHealth/);

  assert.match(patch, /healthRouteMarker/);
  assert.match(patch, /listAttendanceDeliveryHealth/);
  assert.match(patch, /Protected attendance delivery health route is missing after patch/);
});

test("Attendance tracker exposes recipient-level health and failed-only retry", async () => {
  const [panel, overview] = await Promise.all([source(panelPath), source(overviewPath)]);

  assert.match(overview, /AttendanceCommunicationHealthPanel/);
  assert.match(panel, /Email reliability/);
  assert.match(panel, /Retry failed only/);
  assert.match(panel, /Records already marked sent are never resent/);
  assert.match(panel, /Last worker status/);
  assert.match(panel, /Recipient/);
  assert.match(panel, /Reason/);
});

test("Vercel proxies health and retry routes before the generic API router", async () => {
  const config = JSON.parse(await source(vercelPath));
  const rewrites = config.rewrites || [];
  const healthIndex = rewrites.findIndex((item) => item.source === "/api/attendance-confirmation-emails/health");
  const retryIndex = rewrites.findIndex((item) => item.source === "/api/attendance-confirmation-emails/retry-failed");
  const genericIndex = rewrites.findIndex((item) => item.source === "/api/(.*)");

  assert.ok(healthIndex >= 0);
  assert.ok(retryIndex >= 0);
  assert.ok(genericIndex >= 0);
  assert.ok(healthIndex < genericIndex);
  assert.ok(retryIndex < genericIndex);
  assert.equal(
    rewrites[healthIndex].destination,
    "https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/attendance-confirmation-emails/health",
  );
});
