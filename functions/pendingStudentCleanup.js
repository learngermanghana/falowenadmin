const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const TRIAL_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_BATCH_LIMIT = 50;

function text(value) {
  return String(value == null ? "" : value).trim();
}

function comparable(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ");
}

function resolveLifecycleWebhookConfig(runtimeConfig = {}, env = process.env) {
  const communication = runtimeConfig.communication
    || runtimeConfig.announcements
    || runtimeConfig.announcement
    || {};
  return {
    url: text(
      env.ANNOUNCEMENT_WEBHOOK_URL
      || env.VITE_ANNOUNCEMENT_WEBHOOK_URL
      || communication.announcement_webhook_url
      || communication.webhook_url,
    ),
    token: text(
      env.ANNOUNCEMENT_WEBHOOK_TOKEN
      || env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN
      || communication.announcement_webhook_token
      || communication.webhook_token,
    ),
  };
}

function money(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value == null ? "" : value).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function studentStatus(student = {}) {
  return comparable(student.status || student.studentStatus || student.enrollmentStatus);
}

function pendingStartedAtMillis(student = {}) {
  const candidates = [
    student.trialStartedAt,
    student.trialStartAt,
    student.trialStart,
    student.trial_started_at,
    student.registrationDate,
    student.registration_date,
    student.registeredAt,
    student.registered_at,
    student.signupAt,
    student.signupDate,
    student.joined_at,
    student.joinedAt,
    student.enrollDate,
    student.enrollmentDate,
    student.createdAt,
    student.created_at,
  ];
  for (const candidate of candidates) {
    const millis = toMillis(candidate);
    if (millis > 0) return millis;
  }
  return 0;
}

function hasQualifyingPayment(student = {}) {
  const paymentStatus = comparable(student.paymentStatus || student.payment_status || student.financeStatus);
  const paidStatuses = new Set([
    "paid",
    "partial",
    "partially paid",
    "partially_paid",
    "registered paid",
    "registered_paid",
    "registered partial",
    "registered_partial",
    "success",
    "successful",
    "completed",
    "complete",
  ]);
  if (paidStatuses.has(paymentStatus)) return true;

  const amounts = [
    student.paid,
    student.paidAmount,
    student.amountPaid,
    student.initialPaymentAmount,
    student.tuitionPaid,
    student.totalPaid,
  ];
  return amounts.some((value) => money(value) > 0);
}

function trialExpiredAtMillis(student = {}) {
  const explicit = [
    student.trialExpiredAt,
    student.trialEnd,
    student.trialEndsAt,
    student.trial_end,
  ];
  for (const value of explicit) {
    const millis = toMillis(value);
    if (millis > 0) return millis;
  }
  const startedAt = pendingStartedAtMillis(student);
  return startedAt > 0 ? startedAt + TRIAL_DURATION_MS : 0;
}

function trialPurgeAtMillis(student = {}) {
  const explicit = [
    student.trialPurgeAt,
    student.trial_purge_at,
    student.purgeAt,
  ];
  for (const value of explicit) {
    const millis = toMillis(value);
    if (millis > 0) return millis;
  }
  const expiredAt = trialExpiredAtMillis(student);
  return expiredAt > 0 ? expiredAt + TRIAL_RETENTION_MS : 0;
}

function expiredPendingReason(student = {}, now = Date.now()) {
  const role = comparable(student.role);
  if (role && role !== "student") return "not_student";
  if (hasQualifyingPayment(student)) return "has_payment";

  const status = studentStatus(student);
  if (!["pending", "trial_expired"].includes(status)) return "not_pending";

  const startedAt = pendingStartedAtMillis(student);
  if (!startedAt) return "missing_start_date";
  if (startedAt > now) return "future_start_date";

  const expiredAt = trialExpiredAtMillis(student);
  const purgeAt = trialPurgeAtMillis(student);
  if (!expiredAt || !purgeAt) return "missing_start_date";
  if (now < expiredAt) return "trial_active";
  if (now < purgeAt) return status === "trial_expired" ? "retention_window" : "needs_block";
  return "purge_due";
}

function isExpiredPendingStudent(student = {}, now = Date.now()) {
  return expiredPendingReason(student, now) === "purge_due";
}

async function blockExpiredTrialStudent({
  admin,
  docSnap,
  now = Date.now(),
  appsScriptUrl = "",
  syncSecret = "",
}) {
  const latestSnap = await docSnap.ref.get();
  if (!latestSnap.exists) return { skipped: "already_deleted" };

  const student = { id: latestSnap.id, ...(latestSnap.data() || {}) };
  const reason = expiredPendingReason(student, now);
  if (reason !== "needs_block") return { skipped: reason };

  const expiredAt = trialExpiredAtMillis(student);
  const purgeAt = trialPurgeAtMillis(student);
  const timestamp = admin.firestore.Timestamp;
  const studentCode = text(student.studentCode || student.studentcode || student.uid || latestSnap.id);
  const email = lower(student.email);
  const trialExpiredAt = new Date(expiredAt).toISOString();
  const trialPurgeAt = new Date(purgeAt).toISOString();

  // Sync the existing Google Sheet communication source first. If that call
  // fails, leave Firestore pending so the next scheduled run can retry.
  const sheet = await syncTrialStatusToSheet({
    appsScriptUrl,
    syncSecret,
    studentId: latestSnap.id,
    studentCode,
    email,
    trialExpiredAt,
    trialPurgeAt,
  });
  if (sheet.attempted && !sheet.success) {
    throw new Error(sheet.message || "Google Sheet trial status sync failed.");
  }

  await latestSnap.ref.set({
    status: "trial_expired",
    trialStatus: "expired",
    trialExpiredAt: timestamp.fromMillis(expiredAt),
    trialPurgeAt: timestamp.fromMillis(purgeAt),
    trialAccessBlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    blocked: true,
    studentId: latestSnap.id,
    studentCode,
    email,
    trialExpiredAt,
    trialPurgeAt,
    sheet,
  };
}
function uniqueNonEmpty(values = []) {
  return [...new Set(values.map(text).filter(Boolean))];
}

function lower(value) {
  return text(value).toLowerCase();
}

async function deleteQuerySnapshot(queryRef, summary, label) {
  const snap = await queryRef.get();
  if (!snap.size) return;
  await Promise.all(snap.docs.map((docSnap) => docSnap.ref.delete()));
  summary.deleted += snap.size;
  summary.collections[label] = (summary.collections[label] || 0) + snap.size;
}

async function deleteMatchingCollectionDocs(db, collectionId, fieldNames, values, summary) {
  for (const fieldName of fieldNames) {
    for (const value of values) {
      await deleteQuerySnapshot(
        db.collection(collectionId).where(fieldName, "==", value),
        summary,
        collectionId,
      );
    }
  }
}

async function deleteMatchingCollectionGroupDocs(db, collectionId, fieldNames, values, summary) {
  for (const fieldName of fieldNames) {
    for (const value of values) {
      await deleteQuerySnapshot(
        db.collectionGroup(collectionId).where(fieldName, "==", value),
        summary,
        `${collectionId}/*`,
      );
    }
  }
}

async function deleteKnownNestedSubmissionScopes(db, studentCodeValues, summary) {
  const levelValues = ["A1", "A2", "B1", "B2", "C1", "a1", "a2", "b1", "b2", "c1"];
  for (const level of levelValues) {
    for (const code of studentCodeValues) {
      const scopeRef = db.doc(`submissions/${level}/${code}`);
      await db.recursiveDelete(scopeRef).catch(() => undefined);
      summary.deleted += 1;
      summary.collections["submissions/nested-scope"] = (summary.collections["submissions/nested-scope"] || 0) + 1;
    }
  }
}

async function removeStudentFromAttendanceMaps({ admin, db, identifierValues, summary }) {
  const sessions = await db.collectionGroup("sessions").get();
  const deleteValue = admin.firestore.FieldValue.delete();
  const exactIdentifiers = new Set(identifierValues.map(text));
  const lowerIdentifiers = new Set(identifierValues.map(lower));
  let updated = 0;

  for (const session of sessions.docs) {
    const data = session.data() || {};
    if (!data.students || typeof data.students !== "object") continue;
    const updateArgs = [];
    for (const key of Object.keys(data.students)) {
      const entry = data.students[key] || {};
      const candidates = [key, entry.studentCode, entry.studentId, entry.uid, entry.email].map(text);
      if (candidates.some((candidate) => exactIdentifiers.has(candidate) || lowerIdentifiers.has(lower(candidate)))) {
        updateArgs.push(new admin.firestore.FieldPath("students", key), deleteValue);
      }
    }
    if (updateArgs.length) {
      await session.ref.update(...updateArgs);
      updated += 1;
    }
  }
  summary.attendanceSessionMapsUpdated = updated;
}

async function deleteAuthUserIfPresent({ admin, uid, email }) {
  const candidates = uniqueNonEmpty([uid]);
  if (email) {
    const user = await admin.auth().getUserByEmail(email).catch(() => null);
    if (user?.uid) candidates.push(user.uid);
  }
  const deleted = [];
  for (const candidate of uniqueNonEmpty(candidates)) {
    await admin.auth().deleteUser(candidate)
      .then(() => deleted.push(candidate))
      .catch(() => undefined);
  }
  return deleted;
}

async function deleteStudentRowsFromSheet({ appsScriptUrl = "", syncSecret = "", studentId, studentCode, email, student }) {
  if (!text(appsScriptUrl) || !text(syncSecret)) {
    return { attempted: false, success: true, message: "Falowen Announcement webhook is not configured." };
  }
  const response = await fetch(text(appsScriptUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: text(syncSecret),
      action: "deleteStudentAccount",
      studentId,
      studentCode,
      email,
      student,
    }),
  });
  const data = await response.json().catch(() => ({}));
  return {
    attempted: true,
    success: response.ok && data?.ok !== false,
    message: data?.message || (response.ok ? "Google Sheet cleanup completed." : "Google Sheet cleanup failed."),
    details: data,
  };
}

async function syncTrialStatusToSheet({
  appsScriptUrl = "",
  syncSecret = "",
  studentId,
  studentCode,
  email,
  trialExpiredAt,
  trialPurgeAt,
}) {
  if (!text(appsScriptUrl) || !text(syncSecret)) {
    return { attempted: false, success: true, message: "Falowen Announcement webhook is not configured." };
  }
  const response = await fetch(text(appsScriptUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: text(syncSecret),
      action: "syncStudentTrialStatus",
      studentId,
      studentCode,
      email,
      trialExpiredAt,
      trialPurgeAt,
    }),
  });
  const data = await response.json().catch(() => ({}));
  return {
    attempted: true,
    success: response.ok && data?.ok !== false,
    message: data?.message || (response.ok ? "Google Sheet trial status updated." : "Google Sheet trial status sync failed."),
    details: data,
  };
}

async function deleteExpiredPendingStudent({ admin, db, docSnap, now = Date.now(), appsScriptUrl = "", syncSecret = "" }) {
  const latestSnap = await docSnap.ref.get();
  if (!latestSnap.exists) return { skipped: "already_deleted" };
  const student = { id: latestSnap.id, ...(latestSnap.data() || {}) };
  const reason = expiredPendingReason(student, now);
  if (reason !== "purge_due") return { skipped: reason };

  const studentId = text(latestSnap.id);
  const studentCode = text(student.studentCode || student.studentcode || student.uid || studentId);
  const email = lower(student.email);
  const studentDocIds = uniqueNonEmpty([studentId, studentCode, student.uid]);
  const codeValues = uniqueNonEmpty([studentCode, student.studentCode, student.studentcode, student.uid, studentId]);
  const emailValues = uniqueNonEmpty([email, student.email]);
  const allValues = uniqueNonEmpty([...studentDocIds, ...codeValues, ...emailValues]);
  const summary = { deleted: 0, collections: {}, attendanceSessionMapsUpdated: 0, authUsersDeleted: [] };

  // Delete the sheet rows first. If Apps Script is temporarily unavailable,
  // keep the Firestore student so this purge remains retryable.
  const sheet = await deleteStudentRowsFromSheet({
    appsScriptUrl,
    syncSecret,
    studentId,
    studentCode,
    email,
    student,
  });
  if (sheet.attempted && !sheet.success) {
    throw new Error(sheet.message || "Google Sheet cleanup failed.");
  }

  for (const docId of studentDocIds) {
    const ref = db.collection("students").doc(docId);
    const snap = await ref.get();
    if (snap.exists) {
      await db.recursiveDelete(ref);
      summary.deleted += 1;
      summary.collections.students = (summary.collections.students || 0) + 1;
    }
  }

  await deleteMatchingCollectionDocs(db, "students", ["studentCode", "studentcode", "uid", "email"], allValues, summary);
  await deleteMatchingCollectionDocs(db, "submissions", ["studentCode", "studentcode", "studentId", "uid", "email", "studentEmail"], allValues, summary);
  await deleteMatchingCollectionDocs(db, "scores", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
  await deleteMatchingCollectionDocs(db, "markingResults", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
  await deleteMatchingCollectionDocs(db, "markingJobs", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
  await deleteMatchingCollectionDocs(db, "aiAudits", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
  await deleteMatchingCollectionDocs(db, "studentNotifications", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
  await deleteMatchingCollectionGroupDocs(db, "notifications", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
  await deleteMatchingCollectionGroupDocs(db, "checkins", ["studentCode", "studentcode", "studentId", "uid", "email"], allValues, summary);
  await deleteKnownNestedSubmissionScopes(db, codeValues, summary);
  await removeStudentFromAttendanceMaps({ admin, db, identifierValues: allValues, summary });
  summary.authUsersDeleted = await deleteAuthUserIfPresent({ admin, uid: student.uid || studentId, email });

  return { deleted: true, studentId, studentCode, email, firestore: summary, sheet };
}
async function runExpiredPendingStudentCleanup({
  admin,
  db,
  now = Date.now(),
  appsScriptUrl = "",
  syncSecret = "",
  batchLimit = DEFAULT_BATCH_LIMIT,
} = {}) {
  const snap = await db.collection("students").get();
  const actions = snap.docs
    .map((docSnap) => ({
      docSnap,
      reason: expiredPendingReason({ id: docSnap.id, ...(docSnap.data() || {}) }, now),
    }))
    .filter((item) => item.reason === "needs_block" || item.reason === "purge_due")
    .slice(0, Math.max(1, Number(batchLimit) || DEFAULT_BATCH_LIMIT));

  const results = [];
  for (const item of actions) {
    try {
      if (item.reason === "needs_block") {
        results.push(await blockExpiredTrialStudent({
          admin,
          docSnap: item.docSnap,
          now,
          appsScriptUrl,
          syncSecret,
        }));
      } else {
        results.push(await deleteExpiredPendingStudent({
          admin, db, docSnap: item.docSnap, now, appsScriptUrl, syncSecret,
        }));
      }
    } catch (error) {
      console.error("pending_student_trial_lifecycle_failed", {
        studentId: item.docSnap.id,
        action: item.reason,
        message: error?.message || String(error),
      });
      results.push({
        studentId: item.docSnap.id,
        action: item.reason,
        error: error?.message || String(error),
      });
    }
  }

  const blocked = results.filter((result) => result?.blocked === true).length;
  const deleted = results.filter((result) => result?.deleted === true).length;
  return {
    checked: snap.size,
    candidates: actions.length,
    blocked,
    purged: deleted,
    deleted,
    results,
  };
}

function createExpiredPendingStudentCleanupJob({
  admin,
  db,
  onSchedule,
  runtimeConfig = {},
  env = process.env,
} = {}) {
  return onSchedule({
    schedule: "*/5 * * * *",
    timeZone: "Africa/Accra",
    retryCount: 1,
    memory: "256MiB",
  }, async () => {
    const communication = resolveLifecycleWebhookConfig(runtimeConfig, env);
    const result = await runExpiredPendingStudentCleanup({
      admin,
      db,
      now: Date.now(),
      appsScriptUrl: communication.url,
      syncSecret: communication.token,
    });
    console.log("pending_student_trial_lifecycle", {
      checked: result.checked,
      candidates: result.candidates,
      blocked: result.blocked,
      purged: result.purged,
    });
    return result;
  });
}

module.exports = {
  TRIAL_DURATION_MS,
  TRIAL_RETENTION_MS,
  resolveLifecycleWebhookConfig,
  pendingStartedAtMillis,
  trialExpiredAtMillis,
  trialPurgeAtMillis,
  hasQualifyingPayment,
  expiredPendingReason,
  isExpiredPendingStudent,
  blockExpiredTrialStudent,
  syncTrialStatusToSheet,
  deleteExpiredPendingStudent,
  runExpiredPendingStudentCleanup,
  createExpiredPendingStudentCleanupJob,
};
