"use strict";

const SUPPORTED_ORIENTATION_LEVELS = new Set(["A1", "A2", "B1"]);

function text(value) {
  return String(value ?? "").trim();
}

function comparable(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizedLevel(value) {
  return text(value).toUpperCase();
}

function money(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasQualifyingPayment(student = {}) {
  const paymentStatus = comparable(student.paymentStatus || student.payment_status);
  if (["paid", "partial", "partially paid", "partially_paid"].includes(paymentStatus)) {
    return true;
  }

  return [student.paid, student.paidAmount, student.initialPaymentAmount]
    .some((value) => money(value) > 0);
}

function paymentFingerprint(student = {}) {
  return JSON.stringify({
    paymentStatus: comparable(student.paymentStatus || student.payment_status),
    paid: money(student.paid),
    paidAmount: money(student.paidAmount),
    initialPaymentAmount: money(student.initialPaymentAmount),
  });
}

function studentClassTokens(student = {}) {
  return [
    student.classId,
    student.classRecordId,
    student.className,
    student.classname,
    student.class,
    student.group,
    student.groupId,
    student.groupName,
    student.cohort,
    student.cohortId,
    student.cohortName,
  ].map(comparable).filter(Boolean);
}

function studentIdentityFingerprint(student = {}) {
  return JSON.stringify({
    studentCode: comparable(student.studentCode || student.studentcode || student.id),
    email: comparable(student.email),
    name: comparable(student.name || student.fullName),
    level: normalizedLevel(student.level),
    classes: studentClassTokens(student).sort(),
  });
}

function shouldAutoSyncAfterUpdate(before = {}, after = {}) {
  if (!hasQualifyingPayment(after)) return false;
  if (!hasQualifyingPayment(before)) return true;
  if (studentIdentityFingerprint(before) !== studentIdentityFingerprint(after)) return true;
  return paymentFingerprint(before) !== paymentFingerprint(after);
}

function classTokens(klass = {}) {
  return [
    klass.id,
    klass.classId,
    klass.classRecordId,
    klass.name,
    klass.className,
    klass.title,
    klass.slug,
  ].map(comparable).filter(Boolean);
}

function findMatchingClass(student = {}, classes = []) {
  const wanted = new Set(studentClassTokens(student));
  if (!wanted.size) return null;

  return (classes || []).find((klass) =>
    classTokens(klass).some((token) => wanted.has(token))) || null;
}

function dateOnly(value) {
  if (!value) return "";
  if (typeof value?.toDate === "function") return dateOnly(value.toDate());
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return dateOnly(new Date(Number(value.seconds) * 1000));
  }

  const source = text(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) return source;
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function buildOrientationTarget(student = {}, klass = {}) {
  const name = text(student.name || student.fullName);
  const email = text(student.email).toLowerCase();
  const studentCode = text(student.studentCode || student.studentcode || student.id);
  const level = normalizedLevel(klass.levelId || klass.level || student.level);
  const startDate = dateOnly(
    klass.startDate || klass.startsAt || student.classStartDate || student.startDate,
  );
  const classId = text(klass.id || klass.classId || klass.classRecordId || student.classId);
  const className = text(
    klass.name || klass.className || klass.title || student.className || student.class,
  );

  if (!name) throw new Error("Orientation auto-sync requires the student's name.");
  if (!email) throw new Error("Orientation auto-sync requires the student's email.");
  if (!SUPPORTED_ORIENTATION_LEVELS.has(level)) {
    throw new Error(`Orientation auto-sync supports A1, A2 and B1 only. Received: ${level || "missing"}`);
  }
  if (!startDate) throw new Error("The selected class has no valid start date for orientation sync.");

  return { name, email, studentCode, level, startDate, classId, className };
}

function orientationSyncKey(target = {}) {
  return [
    comparable(target.studentCode || target.email),
    normalizedLevel(target.level),
    comparable(target.classId || target.className),
    text(target.startDate),
  ].join("__");
}

function markerFor(student = {}) {
  const marker = student.orientationAutoSync;
  return marker && typeof marker === "object" ? marker : {};
}

function markerAlreadySucceeded(student = {}, syncKey = "") {
  const marker = markerFor(student);
  return comparable(marker.status) === "success" && text(marker.syncKey) === text(syncKey);
}

async function listClasses(db) {
  const snapshot = await db.collection("classes").get();
  return (snapshot?.docs || []).map((doc) => ({ id: doc.id, ...(doc.data?.() || {}) }));
}

async function currentStudentFromRef(studentRef, fallback = {}) {
  if (!studentRef || typeof studentRef.get !== "function") return fallback;
  const snapshot = await studentRef.get();
  if (!snapshot?.exists) return fallback;
  return { id: snapshot.id, ...(snapshot.data?.() || {}) };
}

function boundedError(error) {
  return text(error?.message || error || "Unknown orientation sync error").slice(0, 500);
}

function resolveSecret(valueOrLoader) {
  return text(typeof valueOrLoader === "function" ? valueOrLoader() : valueOrLoader);
}

function createOrientationAutoSyncHandler({
  db,
  appsScriptUrl,
  syncSecret,
  fetchImpl = globalThis.fetch,
  logger = console,
  now = () => new Date(),
} = {}) {
  if (!db) throw new Error("Orientation auto-sync requires Firestore.");
  if (typeof fetchImpl !== "function") throw new Error("Orientation auto-sync requires fetch.");

  return async function autoSyncPaidStudentOrientation(event) {
    const beforeSnapshot = event?.data?.before;
    const afterSnapshot = event?.data?.after;
    if (!afterSnapshot?.exists) return { skipped: true, reason: "student_deleted" };

    const before = beforeSnapshot?.exists ? beforeSnapshot.data() || {} : {};
    const after = afterSnapshot.data() || {};
    if (!shouldAutoSyncAfterUpdate(before, after)) {
      return { skipped: true, reason: "payment_or_identity_unchanged" };
    }

    const studentRef = afterSnapshot.ref;
    const current = await currentStudentFromRef(studentRef, {
      id: afterSnapshot.id || event?.params?.studentCode,
      ...after,
    });
    if (!hasQualifyingPayment(current)) {
      return { skipped: true, reason: "payment_not_eligible" };
    }

    let syncKey = studentIdentityFingerprint(current);
    try {
      const classes = await listClasses(db);
      const klass = findMatchingClass(current, classes);
      if (!klass) {
        throw new Error(`No created class matches ${text(current.className || current.classId || "the student's class")}.`);
      }

      const target = buildOrientationTarget(current, klass);
      syncKey = orientationSyncKey(target);
      if (markerAlreadySucceeded(current, syncKey)) {
        return { skipped: true, reason: "already_synced", syncKey };
      }

      const url = resolveSecret(appsScriptUrl);
      const secret = resolveSecret(syncSecret);
      if (!url) throw new Error("Missing required secret: ORIENTATION_APPS_SCRIPT_URL");
      if (!secret) throw new Error("Missing required secret: ORIENTATION_SYNC_SECRET");

      const attemptedAt = now().toISOString();
      if (studentRef?.set) {
        await studentRef.set({
          orientationAutoSync: {
            status: "pending",
            syncKey,
            classId: target.classId,
            className: target.className,
            level: target.level,
            startDate: target.startDate,
            attemptedAt,
            eventId: text(event?.id),
            lastError: "",
          },
        }, { merge: true });
      }

      const payload = {
        secret,
        name: target.name,
        email: target.email,
        level: target.level,
        startDate: target.startDate,
        studentCode: target.studentCode,
        classId: target.classId,
        className: target.className,
        syncId: syncKey,
        source: "automatic_paid_student_sync",
      };
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok || responseJson?.ok === false) {
        throw new Error(responseJson?.error || `Orientation Apps Script returned ${response.status}.`);
      }

      const syncedAt = now().toISOString();
      if (studentRef?.set) {
        await studentRef.set({
          orientationAutoSync: {
            status: "success",
            syncKey,
            classId: target.classId,
            className: target.className,
            level: target.level,
            startDate: target.startDate,
            attemptedAt,
            syncedAt,
            eventId: text(event?.id),
            lastError: "",
          },
        }, { merge: true });
      }

      logger.log?.("automatic_orientation_sync_success", {
        studentCode: target.studentCode,
        className: target.className,
        startDate: target.startDate,
        syncKey,
      });
      return { ok: true, syncKey, response: responseJson };
    } catch (error) {
      const lastError = boundedError(error);
      if (studentRef?.set) {
        await studentRef.set({
          orientationAutoSync: {
            status: "failed",
            syncKey,
            attemptedAt: now().toISOString(),
            eventId: text(event?.id),
            lastError,
          },
        }, { merge: true }).catch(() => {});
      }
      logger.error?.("automatic_orientation_sync_failed", {
        studentCode: text(current.studentCode || current.studentcode || current.id),
        message: lastError,
      });
      throw error;
    }
  };
}

module.exports = {
  SUPPORTED_ORIENTATION_LEVELS,
  buildOrientationTarget,
  createOrientationAutoSyncHandler,
  dateOnly,
  findMatchingClass,
  hasQualifyingPayment,
  markerAlreadySucceeded,
  orientationSyncKey,
  shouldAutoSyncAfterUpdate,
  studentIdentityFingerprint,
};
