import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const indexPath = path.join(repoRoot, "functions", "index.js");
const workerPath = path.join(repoRoot, "functions", "attendanceConfirmationEmails.js");
const retryPath = path.join(repoRoot, "functions", "attendanceConfirmationRetry.js");

let indexSource = fs.readFileSync(indexPath, "utf8");
const requireLine = 'const { createAttendanceConfirmationEmailJob } = require("./attendanceConfirmationEmails.js");';
const retryRequireLine = 'const { retryFailedAttendanceDeliveries } = require("./attendanceConfirmationRetry.js");';
const exportLine = "exports.sendAttendanceConfirmationEmails = createAttendanceConfirmationEmailJob({ admin, db, onSchedule, runtimeConfig });";
const retryRouteMarker = 'app.post("/attendance-confirmation-emails/retry-failed"';
const retryRouteBlock = `app.post("/attendance-confirmation-emails/retry-failed", async (req, res) => {
  try {
    await requireAuth(req);
    const classId = String(req.body?.classId || "").trim();
    if (!classId) return res.status(400).json({ ok: false, error: "Select a class before retrying failed attendance emails." });
    const result = await retryFailedAttendanceDeliveries({ admin, db, classId, runtimeConfig });
    return res.json({ ok: true, ...result });
  } catch (error) {
    const unauthorized = /Authorization|Not allowed|token/i.test(String(error?.message || ""));
    return res.status(unauthorized ? 401 : 400).json({
      ok: false,
      error: error?.message || "Could not retry failed attendance emails.",
    });
  }
});

`;

if (!indexSource.includes(requireLine)) {
  const anchor = 'const { defineSecret } = require("firebase-functions/params");';
  if (!indexSource.includes(anchor)) throw new Error("Attendance confirmation patch could not find the Firebase import anchor.");
  indexSource = indexSource.replace(anchor, `${anchor}\n${requireLine}`);
}

if (!indexSource.includes(retryRequireLine)) {
  if (!indexSource.includes(requireLine)) throw new Error("Attendance confirmation scheduler import is missing before retry import patching.");
  indexSource = indexSource.replace(requireLine, `${requireLine}\n${retryRequireLine}`);
}

if (!indexSource.includes(retryRouteMarker)) {
  const anchor = indexSource.includes(exportLine) ? exportLine : "exports.api = onRequest({";
  if (!indexSource.includes(anchor)) throw new Error("Attendance retry patch could not find the API export anchor.");
  indexSource = indexSource.replace(anchor, `${retryRouteBlock}${anchor}`);
}

if (!indexSource.includes(exportLine)) {
  const anchor = "exports.api = onRequest({";
  if (!indexSource.includes(anchor)) throw new Error("Attendance confirmation patch could not find the API export anchor.");
  indexSource = indexSource.replace(anchor, `${exportLine}\n\n${anchor}`);
}

fs.writeFileSync(indexPath, indexSource);

let workerSource = fs.readFileSync(workerPath, "utf8");
const classConfigFunction = `function resolveClassWebhookConfig(klass = {}, fallback = {}) {
  const stored = klass.attendanceConfirmationEmailDelivery || {};
  return {
    url: normalize(stored.url) || fallback.url || "",
    token: normalize(stored.token) || fallback.token || "",
    sheetName: normalize(stored.sheetName) || fallback.sheetName || "",
    sheetGid: normalize(stored.sheetGid) || fallback.sheetGid || "",
  };
}
`;

if (!workerSource.includes("function resolveClassWebhookConfig(")) {
  const anchor = "function rowForDelivery({ klass, student, mode, message, date, periodKey }) {";
  if (!workerSource.includes(anchor)) throw new Error("Attendance confirmation patch could not find the worker delivery-row anchor.");
  workerSource = workerSource.replace(anchor, `${classConfigFunction}\n${anchor}`);
}

const oldRunBlock = `      if (!config.url) throw new Error("Set communication.announcement_webhook_url in FALOWEN_ADMIN_CLOUD_RUNTIME_CONFIG or ANNOUNCEMENT_WEBHOOK_URL for automatic attendance emails.");
      const result = await processClass({ admin, db, klass, allStudents, config, now, fetchImpl });`;
const newRunBlock = `      const classConfig = resolveClassWebhookConfig(klass, config);
      if (!classConfig.url) throw new Error("Save this class under Communication → Attendance confirmation emails, or set communication.announcement_webhook_url in FALOWEN_ADMIN_CLOUD_RUNTIME_CONFIG.");
      const result = await processClass({ admin, db, klass, allStudents, config: classConfig, now, fetchImpl });`;

if (!workerSource.includes(newRunBlock)) {
  if (!workerSource.includes(oldRunBlock)) throw new Error("Attendance confirmation patch could not find the worker configuration block.");
  workerSource = workerSource.replace(oldRunBlock, newRunBlock);
}

if (!workerSource.includes("resolveClassWebhookConfig,")) {
  const anchor = "    resolveWebhookConfig,";
  if (!workerSource.includes(anchor)) throw new Error("Attendance confirmation patch could not find the worker test-export anchor.");
  workerSource = workerSource.replace(anchor, `${anchor}\n    resolveClassWebhookConfig,`);
}

fs.writeFileSync(workerPath, workerSource);

const patchedIndex = fs.readFileSync(indexPath, "utf8");
const patchedWorker = fs.readFileSync(workerPath, "utf8");
const retrySource = fs.readFileSync(retryPath, "utf8");
const requiredChecks = [
  [patchedIndex.includes(requireLine), "Firebase attendance worker import is missing after patch."],
  [patchedIndex.includes(retryRequireLine), "Firebase attendance retry import is missing after patch."],
  [patchedIndex.includes(exportLine), "Firebase attendance scheduler export is missing after patch."],
  [patchedIndex.includes(retryRouteMarker), "Protected failed-attendance retry route is missing after patch."],
  [patchedIndex.includes("await requireAuth(req)"), "Failed-attendance retry route is not protected."],
  [patchedWorker.includes("function resolveClassWebhookConfig("), "Class attendance webhook configuration is missing after patch."],
  [patchedWorker.includes("config: classConfig"), "The attendance worker is not using the selected class delivery configuration."],
  [patchedWorker.includes('schedule: "*/15 * * * *"'), "The 15-minute attendance scheduler is missing after patch."],
  [retrySource.includes('status: "failed"'), "The failed-delivery retry worker is missing failure-state protection."],
  [retrySource.includes('status: "sent"'), "The failed-delivery retry worker is missing success-state updates."],
];

for (const [passed, message] of requiredChecks) {
  if (!passed) throw new Error(message);
}

console.log("Attendance confirmation email scheduler and protected failed-delivery retry route verified.");
