"use strict";

// Only fields with an existing column in the student master sheet may be written.
// In particular, Status != paymentStatus, Paid != tuitionFee, and class transfers
// are handled separately. Unknown keys must never create columns.
const PROFILE_SHEET_FIELDS = Object.freeze({
  name: "Name",
  phone: "Phone",
  location: "Location",
  level: "Level",
  balanceDue: "Balance",
  contractStart: "ContractStart",
  contractEnd: "ContractEnd",
  studentCode: "StudentCode",
  email: "Email",
  status: "Status",
});

function sheetPatchFromUpdates(updates = {}) {
  const patch = {};
  for (const field of Object.keys(PROFILE_SHEET_FIELDS)) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      patch[field] = String(updates[field] == null ? "" : updates[field]).trim();
    }
  }
  return patch;
}

function resolveStudentSheetSyncConfig(runtimeConfig = {}, env = process.env) {
  const config = runtimeConfig.student_profile_sheet || runtimeConfig.student_sheet_sync || {};
  const deletion = runtimeConfig.student_delete || {};
  return {
    url: String(
      env.STUDENT_PROFILE_SHEET_WEBHOOK_URL ||
      env.STUDENT_DELETE_APPS_SCRIPT_URL ||
      config.webhook_url || config.apps_script_url ||
      deletion.apps_script_url || "",
    ).trim(),
    secret: String(
      env.STUDENT_PROFILE_SHEET_SYNC_SECRET ||
      env.STUDENT_DELETE_SYNC_SECRET ||
      config.sync_secret || config.webhook_token ||
      deletion.sync_secret || "",
    ).trim(),
  };
}

function sheetSyncIdentity(student = {}, studentId = "") {
  return {
    uid: String(student.uid || student.authUid || "").trim(),
    studentCode: String(student.studentCode || student.studentcode || "").trim(),
    email: String(student.email || "").trim(),
  };
}

async function writeProfileToStudentSheet({
  studentId,
  identity = {},
  updates = {},
  config = {},
  fetchImpl = globalThis.fetch,
} = {}) {
  const patch = sheetPatchFromUpdates(updates);
  if (!Object.keys(patch).length) return { status: "not_applicable", fields: [] };
  if (!config.url || !config.secret) {
    return { status: "failed", fields: Object.keys(patch), error: "Student sheet sync is not configured. Set the student-sheet Apps Script URL and secret." };
  }
  if (!identity.uid && !identity.studentCode && !identity.email) {
    return { status: "failed", fields: Object.keys(patch), error: "Student sheet sync requires a UID, student code, or email." };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetchImpl(config.url, {
      method: "POST",
      redirect: "follow",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "syncStudentProfile",
        secret: config.secret,
        studentId,
        identity,
        updates: patch,
      }),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok || data?.ok !== true || data?.verified !== true || Number(data?.matchedRows) !== 1) {
      throw new Error(data?.error || "The student sheet did not confirm exactly one verified row.");
    }
    const expected = Object.keys(patch).sort();
    const confirmed = Array.isArray(data.verifiedFields) ? [...data.verifiedFields].sort() : [];
    if (JSON.stringify(expected) !== JSON.stringify(confirmed)) {
      throw new Error("Student sheet did not verify every changed field.");
    }
    return { status: "synced", fields: expected, row: Number(data.row) || undefined };
  } catch (error) {
    return {
      status: "failed",
      fields: Object.keys(patch),
      error: error?.name === "AbortError" ? "Student sheet verification timed out. Retry the sync." :
        String(error?.message || "Student sheet sync failed.").slice(0, 240),
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  PROFILE_SHEET_FIELDS,
  sheetPatchFromUpdates,
  sheetSyncIdentity,
  resolveStudentSheetSyncConfig,
  writeProfileToStudentSheet,
};
