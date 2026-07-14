import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appPath = new URL("../src/App.jsx", import.meta.url);
const hubPath = new URL("../src/pages/CommunicationHubPage.jsx", import.meta.url);
const panelPath = new URL("../src/components/AttendanceConfirmationAutomationPanel.jsx", import.meta.url);
const servicePath = new URL("../src/services/attendanceConfirmationEmailService.js", import.meta.url);
const workerPath = new URL("../functions/attendanceConfirmationEmails.js", import.meta.url);
const patchPath = new URL("../scripts/patchAttendanceConfirmationEmails.mjs", import.meta.url);

async function source(path) {
  return readFile(path, "utf8");
}

test("Communication routes through a hub with attendance confirmation controls", async () => {
  const [app, hub] = await Promise.all([source(appPath), source(hubPath)]);
  assert.match(app, /CommunicationHubPage/);
  assert.match(app, /path="\/communication"/);
  assert.match(hub, /Attendance confirmation emails/);
  assert.match(hub, /<AttendanceConfirmationAutomationPanel/);
  assert.match(hub, /<CommunicationPage/);
});

test("the automation panel supports weekly, each-class and off modes", async () => {
  const panel = await source(panelPath);
  assert.match(panel, /After the final class each week/);
  assert.match(panel, /After every class/);
  assert.match(panel, />Off</);
  assert.match(panel, /Save attendance email automation/);
  assert.match(panel, /Last successful send/);
  assert.match(panel, /runs every 15 minutes/i);
});

test("settings persist on the selected class record", async () => {
  const service = await source(servicePath);
  assert.match(service, /attendanceConfirmationEmailEnabled/);
  assert.match(service, /attendanceConfirmationEmailMode/);
  assert.match(service, /attendanceConfirmationEmailDelayMinutes/);
  assert.match(service, /attendanceConfirmationLateMinutes/);
  assert.match(service, /setDoc\(doc\(db, "classes", id\)/);
});

test("the scheduled worker uses the Communication webhook and durable deduplication receipts", async () => {
  const worker = await source(workerPath);
  assert.match(worker, /schedule: "\*\/15 \* \* \* \*"/);
  assert.match(worker, /attendanceEmailDeliveries/);
  assert.match(worker, /status: "processing"/);
  assert.match(worker, /status: "sent"/);
  assert.match(worker, /announcement_webhook_url/);
  assert.match(worker, /delivery_mode: "individual"/);
  assert.match(worker, /waits until an open QR check-in window has ended|openTo/);
});

test("Firebase predeploy patches the scheduler export into the function entrypoint", async () => {
  const patch = await source(patchPath);
  assert.match(patch, /createAttendanceConfirmationEmailJob/);
  assert.match(patch, /exports\.sendAttendanceConfirmationEmails/);
  assert.match(patch, /Attendance confirmation email scheduler patch verified/);
});
