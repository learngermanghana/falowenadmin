import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appPath = new URL("../src/App.jsx", import.meta.url);
const hubPath = new URL("../src/pages/CommunicationHubPage.jsx", import.meta.url);
const panelPath = new URL("../src/components/AttendanceConfirmationAutomationPanel.jsx", import.meta.url);
const retryPanelPath = new URL("../src/components/AttendanceFailedDeliveryRetryPanel.jsx", import.meta.url);
const servicePath = new URL("../src/services/attendanceConfirmationEmailService.js", import.meta.url);
const retryServicePath = new URL("../src/services/attendanceConfirmationRetryService.js", import.meta.url);
const workerPath = new URL("../functions/attendanceConfirmationEmails.js", import.meta.url);
const retryWorkerPath = new URL("../functions/attendanceConfirmationRetry.js", import.meta.url);
const patchPath = new URL("../scripts/patchAttendanceConfirmationEmails.mjs", import.meta.url);

async function source(path) {
  return readFile(path, "utf8");
}

test("Communication uses the attendance confirmation hub", async () => {
  const [app, hub] = await Promise.all([source(appPath), source(hubPath)]);
  assert.match(app, /CommunicationHubPage/);
  assert.match(app, /path="\/communication"/);
  assert.match(hub, /Attendance confirmation emails/);
  assert.match(hub, /AttendanceConfirmationAutomationPanel/);
  assert.match(hub, /AttendanceFailedDeliveryRetryPanel/);
  assert.match(hub, /CommunicationPage/);
});

test("attendance automation UI exposes modes, recovery and job status", async () => {
  const [panel, retryPanel] = await Promise.all([source(panelPath), source(retryPanelPath)]);
  assert.match(panel, /After the final class each week/);
  assert.match(panel, /After every class/);
  assert.match(panel, />Off</);
  assert.match(panel, /Save automation/);
  assert.match(panel, /Last job check/);
  assert.match(panel, /Last successful send/);
  assert.match(panel, /Reload classes/);
  assert.match(retryPanel, /Retry failed attendance emails/);
  assert.match(retryPanel, /Retry failed emails/);
  assert.match(retryPanel, /Emails already marked sent are never resent/);
});

test("attendance settings persist on the class document", async () => {
  const service = await source(servicePath);
  assert.match(service, /attendanceConfirmationEmailEnabled/);
  assert.match(service, /attendanceConfirmationEmailMode/);
  assert.match(service, /attendanceConfirmationEmailDelayMinutes/);
  assert.match(service, /attendanceConfirmationLateMinutes/);
  assert.match(service, /setDoc/);
});

test("failed attendance retry calls a protected Admin endpoint", async () => {
  const [service, worker] = await Promise.all([source(retryServicePath), source(retryWorkerPath)]);
  assert.match(service, /attendance-confirmation-emails\/retry-failed/);
  assert.match(service, /Authorization: `Bearer \$\{token\}`/);
  assert.match(worker, /attendanceEmailDeliveries/);
  assert.match(worker, /status: "processing"/);
  assert.match(worker, /status: "failed"/);
  assert.match(worker, /status: "sent"/);
  assert.match(worker, /show_progress: "FALSE"/);
});

test("scheduled attendance delivery keeps deduplication and individual delivery", async () => {
  const worker = await source(workerPath);
  assert.match(worker, /attendanceEmailDeliveries/);
  assert.match(worker, /status: "processing"/);
  assert.match(worker, /status: "sent"/);
  assert.match(worker, /delivery_mode: "individual"/);
  assert.match(worker, /openTo/);
  assert.match(worker, /schedule: "\*\/15 \* \* \* \*"/);
});

test("Firebase predeploy registers and validates scheduler plus retry route", async () => {
  const patch = await source(patchPath);
  assert.match(patch, /createAttendanceConfirmationEmailJob/);
  assert.match(patch, /sendAttendanceConfirmationEmails/);
  assert.match(patch, /retryFailedAttendanceDeliveries/);
  assert.match(patch, /attendance-confirmation-emails\/retry-failed/);
  assert.match(patch, /await requireAuth\(req\)/);
  assert.match(patch, /resolveClassWebhookConfig/);
  assert.match(patch, /config: classConfig/);
  assert.match(patch, /schedule: "\*\/15 \* \* \* \*"/);
  assert.match(patch, /requiredChecks/);
  assert.match(patch, /protected failed-delivery retry route verified/);
});
