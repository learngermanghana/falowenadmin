import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Build on the canonical automatic-completion/undo patch first so this guard can
// safely target one stable generated service + page shape in every lifecycle.
await import("./patchAutomaticSessionCompletionUi.mjs");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const servicePath = path.join(root, "src/services/liveClassServiceBase.js");
const compatibilityPath = path.join(root, "src/services/liveClassCompatibilityServiceBase.js");
const pagePath = path.join(root, "src/pages/LiveClassesPageV2.jsx");

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`${label} anchor changed; update patchEarlySessionCompletionGuard.mjs`);
  return source.replace(before, after);
}

function patchService() {
  let source = fs.readFileSync(servicePath, "utf8");

  if (!source.includes('../utils/sessionCompletionGuard.js')) {
    source = replaceOnce(
      source,
      'import { db } from "../firebase.js";',
      'import { db } from "../firebase.js";\nimport {\n  EARLY_COMPLETION_ERROR_CODE,\n  activeSessionStatusRestoresReminders,\n  requiresEarlySessionCompletionOverride,\n} from "../utils/sessionCompletionGuard.js";',
      "live class completion guard import",
    );
  }

  source = replaceOnce(
    source,
    'export async function markSessionCompleted(sessionId, adminId = "admin", classId = "") {',
    'export async function markSessionCompleted(sessionId, adminId = "admin", classId = "", { allowEarlyCompletion = false } = {}) {',
    "manual completion options",
  );

  source = replaceOnce(
    source,
    '    const session = { ...sessionSnap.data(), id: sessionSnap.id };\n    const canonicalClassId = String(classId || session.classRecordId || session.classId || "").trim();',
    '    const session = { ...sessionSnap.data(), id: sessionSnap.id };\n    const earlyCompletion = requiresEarlySessionCompletionOverride(session);\n    if (earlyCompletion && !allowEarlyCompletion) {\n      const error = new Error("This class has not reached its scheduled end time. Confirm the early-completion override before marking it completed.");\n      error.code = EARLY_COMPLETION_ERROR_CODE;\n      throw error;\n    }\n    const canonicalClassId = String(classId || session.classRecordId || session.classId || "").trim();',
    "early completion mutation guard",
  );

  source = replaceOnce(
    source,
    '      completionPreviousStatus: previousStatus,\n      completedBy: adminId,',
    '      completionPreviousStatus: previousStatus,\n      earlyCompletionOverride: Boolean(earlyCompletion && allowEarlyCompletion),\n      ...(earlyCompletion && allowEarlyCompletion ? { earlyCompletionOverrideAt: serverTimestamp() } : {}),\n      completedBy: adminId,',
    "early completion audit state",
  );

  source = replaceOnce(
    source,
    '      completionSource: "manual",\n      actorId: adminId,',
    '      completionSource: "manual",\n      earlyCompletionOverride: Boolean(earlyCompletion && allowEarlyCompletion),\n      actorId: adminId,',
    "early completion audit log",
  );

  source = replaceOnce(
    source,
    '    const assignmentIds = hasCurriculumPatch ? normalizeAssignmentIds(patch) : normalizeAssignmentIds(session);\n    const nextPatch = {\n      ...patch,',
    '    const assignmentIds = hasCurriculumPatch ? normalizeAssignmentIds(patch) : normalizeAssignmentIds(session);\n    const restoresReminders = Object.prototype.hasOwnProperty.call(patch, "status")\n      && activeSessionStatusRestoresReminders(patch.status);\n    const nextPatch = {\n      ...patch,\n      ...(restoresReminders ? { remindersSuppressed: false } : {}),',
    "generic active-session reminder restoration",
  );

  fs.writeFileSync(servicePath, source, "utf8");
}

function patchCompatibilityService() {
  let source = fs.readFileSync(compatibilityPath, "utf8");

  if (!source.includes('../utils/sessionCompletionGuard.js')) {
    source = replaceOnce(
      source,
      'import { db } from "../firebase.js";',
      'import { db } from "../firebase.js";\nimport { activeSessionStatusRestoresReminders } from "../utils/sessionCompletionGuard.js";',
      "compatibility reminder restoration import",
    );
  }

  source = replaceOnce(
    source,
    '  const assignmentIds = currentAssignmentIds(merged);\n  const nextPatch = {\n    ...patch,',
    '  const assignmentIds = currentAssignmentIds(merged);\n  const restoresReminders = Object.prototype.hasOwnProperty.call(patch, "status")\n    && activeSessionStatusRestoresReminders(patch.status);\n  const nextPatch = {\n    ...patch,\n    ...(restoresReminders ? { remindersSuppressed: false } : {}),',
    "compatible active-session reminder restoration",
  );

  fs.writeFileSync(compatibilityPath, source, "utf8");
}

function patchPage() {
  let source = fs.readFileSync(pagePath, "utf8");

  if (!source.includes('../utils/sessionCompletionGuard.js')) {
    source = `import { requiresEarlySessionCompletionOverride } from "../utils/sessionCompletionGuard.js";\n${source}`;
  }

  const oldCompletion = `      if (action === "complete") {
        if (!window.confirm("Mark this session completed now? Automatic completion normally happens 30 minutes after the class ends.")) return;
        await markSessionCompleted(session.id, adminId, canonicalClassId);
        successMessage = "Session marked completed.";
      }`;
  const guardedCompletion = `      if (action === "complete") {
        if (!window.confirm("Mark this session completed now? Automatic completion normally happens 30 minutes after the class ends.")) return;
        const earlyCompletion = requiresEarlySessionCompletionOverride(session);
        if (earlyCompletion && !window.confirm("This class has NOT reached its scheduled end time. Completing it early will stop class-start reminder emails and mark the session completed. Confirm EARLY completion override?")) return;
        await markSessionCompleted(session.id, adminId, canonicalClassId, { allowEarlyCompletion: earlyCompletion });
        successMessage = earlyCompletion ? "Session marked completed with an early-completion override." : "Session marked completed.";
      }`;
  source = replaceOnce(source, oldCompletion, guardedCompletion, "Live Classes early-completion confirmation");

  fs.writeFileSync(pagePath, source, "utf8");
}

patchService();
patchCompatibilityService();
patchPage();

for (const [filePath, markers] of [
  [servicePath, [
    "EARLY_COMPLETION_ERROR_CODE",
    "allowEarlyCompletion = false",
    "requiresEarlySessionCompletionOverride(session)",
    "remindersSuppressed: false",
  ]],
  [compatibilityPath, ["activeSessionStatusRestoresReminders", "remindersSuppressed: false"]],
  [pagePath, ["Confirm EARLY completion override?", "allowEarlyCompletion: earlyCompletion"]],
]) {
  const source = fs.readFileSync(filePath, "utf8");
  markers.forEach((marker) => {
    if (!source.includes(marker)) throw new Error(`Early completion guard marker missing in ${path.basename(filePath)}: ${marker}`);
  });
}

console.log("Early live-class completion now requires an explicit override and active sessions restore reminder delivery.");
