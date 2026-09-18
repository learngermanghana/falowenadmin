const crypto = require("crypto");

const PROCESSING_STALE_MS = 30 * 60 * 1000;

function text(value) {
  return String(value || "").trim();
}

function lower(value) {
  return text(value).toLowerCase();
}

function numberValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value)
    .replace(/[Gg][Hh][Ss]|₵/g, "")
    .replace(/[\s,\u00A0]/g, "")
    .trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function studentCode(student = {}, studentId = "") {
  return text(
    student.studentCode
    || student.studentcode
    || student.student_code
    || student.code
    || student.uid
    || studentId,
  );
}

function paymentReference(student = {}) {
  return text(
    student.lastPaymentReference
    || student.paymentReference
    || student.payment_reference
    || student.paystackReference
    || student.transactionReference
    || student.lastTransactionReference,
  );
}

function registrationRow(student = {}, studentId = "", now = new Date()) {
  return {
    student_id: text(studentId),
    uid: text(student.uid || student.userId),
    student_code: studentCode(student, studentId),
    studentCode: studentCode(student, studentId),
    name: text(student.name || student.displayName || student.firstName) || "Student",
    email: lower(student.email || student.emailAddress || student.studentEmail),
    class_name: text(student.className || student.class || student.groupName || student.program),
    className: text(student.className || student.class || student.groupName || student.program),
    class_id: text(student.classId || student.classRecordId || student.assignedClassId),
    level: text(student.level || student.levelId).toUpperCase(),
    paid: numberValue(
      student.paid
      ?? student.amountPaid
      ?? student.amount_paid
      ?? student.totalPaid
      ?? student.initialPaymentAmount,
    ),
    balance: numberValue(
      student.balanceDue
      ?? student.balance
      ?? student.outstandingBalance
      ?? student.amountDue
      ?? student.balance_due,
    ),
    payment_reference: paymentReference(student),
    registration_date: text(
      student.registrationDate
      || student.registeredAt
      || student.enrollDate
      || student.enrollmentDate
      || student.createdAt,
    ),
    event_time: now.toISOString(),
  };
}

function eventIdFor(type, studentId) {
  const kind = String(type || "registration.event")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const hash = crypto.createHash("sha256").update(text(studentId)).digest("hex").slice(0, 16);
  return `evt_${kind}_${hash}`;
}

function stateId(studentId) {
  return crypto.createHash("sha256").update(text(studentId)).digest("hex");
}

function resolveRegistrationDocsConfig(runtimeConfig = {}, env = process.env) {
  const registration = runtimeConfig.registration_docs
    || runtimeConfig.registrationDocs
    || runtimeConfig.registration_lifecycle
    || runtimeConfig.registrationLifecycle
    || {};
  const communication = runtimeConfig.communication
    || runtimeConfig.announcements
    || runtimeConfig.announcement
    || {};

  return {
    url: text(
      env.REGISTRATION_DOCS_WEBHOOK_URL
      || registration.webhook_url
      || registration.url
      || communication.registration_docs_webhook_url
      || communication.registration_webhook_url,
    ),
    token: text(
      env.REGISTRATION_DOCS_WEBHOOK_TOKEN
      || env.ANNOUNCEMENT_WEBHOOK_TOKEN
      || registration.webhook_token
      || registration.token
      || communication.registration_docs_webhook_token
      || communication.announcement_webhook_token
      || communication.webhook_token,
    ),
  };
}

async function postRegistrationLifecycleEvent(config, {
  type,
  row,
  eventId,
  source = "falowen-firebase",
  requestedBy = "system",
} = {}, fetchImpl = fetch) {
  if (!config?.url) {
    throw new Error("Registration document webhook is not configured.");
  }
  if (!config?.token) {
    throw new Error("Registration document webhook token is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetchImpl(config.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        token: config.token,
        action: "processRegistrationLifecycleEvent",
        event_id: eventId,
        type,
        source,
        requested_by: requestedBy,
        row,
        rows: [row],
      }),
      redirect: "follow",
      signal: controller.signal,
    });
    const raw = await response.text();
    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error("Registration document Apps Script returned an invalid response.");
    }
    if (!response.ok || body?.ok === false) {
      throw new Error(body?.error || `Registration document webhook returned HTTP ${response.status}`);
    }
    if (String(body?.result || "").toUpperCase() === "PENDING") {
      throw new Error("Registration document worker is busy. Retry the event.");
    }
    return {
      body,
      status: response.status,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Registration document Apps Script timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function serverTimestamp(admin) {
  return admin.firestore.FieldValue.serverTimestamp();
}

async function reserveLifecycleEvent({ db, admin, studentId, kind, eventId, now = new Date() }) {
  const ref = db.collection("registrationLifecycleStates").doc(stateId(studentId));
  const statusField = `${kind}Status`;
  const eventField = `${kind}EventId`;
  const startedField = `${kind}ProcessingStartedAt`;
  let result = { reserved: false, ref, reason: "" };

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const current = snap.exists ? snap.data() || {} : {};
    const status = lower(current[statusField]);
    const started = current[startedField]?.toDate?.()
      || (current[startedField] ? new Date(current[startedField]) : null);
    const processingFresh = status === "processing"
      && started
      && !Number.isNaN(started.getTime())
      && now.getTime() - started.getTime() < PROCESSING_STALE_MS;

    if (status === "processed") {
      result = { reserved: false, ref, reason: "already_processed" };
      return;
    }
    if (processingFresh) {
      result = { reserved: false, ref, reason: "processing" };
      return;
    }

    transaction.set(ref, {
      studentId: text(studentId),
      [statusField]: "processing",
      [eventField]: eventId,
      [startedField]: serverTimestamp(admin),
      updatedAt: serverTimestamp(admin),
      ...(snap.exists ? {} : { createdAt: serverTimestamp(admin) }),
    }, { merge: true });

    result = { reserved: true, ref, reason: "" };
  });

  return result;
}

async function finishLifecycleState({ reservation, admin, kind, status, error = "" }) {
  if (!reservation?.ref) return;
  await reservation.ref.set({
    [`${kind}Status`]: status,
    [`${kind}CompletedAt`]: status === "processed" ? serverTimestamp(admin) : null,
    [`${kind}LastError`]: error,
    [`${kind}ProcessingStartedAt`]: null,
    updatedAt: serverTimestamp(admin),
  }, { merge: true });
}

async function writeAuditEvent({ db, admin, eventId, type, row, status, destination, receipt = {}, error = "" }) {
  const ref = db.collection("auditLogs").doc(eventId);
  const existing = await ref.get();
  const createdAt = existing.exists && existing.data()?.createdAt
    ? existing.data().createdAt
    : serverTimestamp(admin);
  const request = {
    event_id: eventId,
    type,
    row,
    metadata: {
      automatic: true,
      source: "students-firestore",
    },
  };
  await ref.set({
    integrationEvent: true,
    eventId,
    type,
    source: "falowen-firebase",
    actor: "system",
    status,
    request,
    destinations: {
      registration: destination,
    },
    receipt,
    error,
    createdAt,
    updatedAt: serverTimestamp(admin),
    ...(status === "processed" ? { processedAt: serverTimestamp(admin) } : {}),
    ...(status === "failed" ? { failedAt: serverTimestamp(admin) } : {}),
  }, { merge: true });
}

async function processLifecycleEvent({
  db,
  admin,
  runtimeConfig = {},
  type,
  kind,
  student,
  studentId,
  fetchImpl = fetch,
  now = new Date(),
} = {}) {
  if (!studentId) return { processed: false, reason: "missing_student_id" };
  const row = registrationRow(student, studentId, now);
  if (!row.email && !row.student_code) return { processed: false, reason: "missing_student_identity" };

  const eventId = eventIdFor(type, studentId);
  const reservation = await reserveLifecycleEvent({ db, admin, studentId, kind, eventId, now });
  if (!reservation.reserved) {
    return { processed: false, reason: reservation.reason, eventId };
  }

  await writeAuditEvent({
    db,
    admin,
    eventId,
    type,
    row,
    status: "dispatching",
    destination: { status: "dispatching" },
  });

  try {
    const config = resolveRegistrationDocsConfig(runtimeConfig);
    const upstream = await postRegistrationLifecycleEvent(config, {
      type,
      row,
      eventId,
    }, fetchImpl);

    const destination = {
      status: "processed",
      httpStatus: upstream.status,
      result: text(upstream.body?.result || upstream.body?.status || "processed"),
    };
    await writeAuditEvent({
      db,
      admin,
      eventId,
      type,
      row,
      status: "processed",
      destination,
      receipt: upstream.body || {},
    });
    await finishLifecycleState({ reservation, admin, kind, status: "processed" });
    return { processed: true, eventId, result: destination.result };
  } catch (error) {
    const message = error?.message || String(error);
    await writeAuditEvent({
      db,
      admin,
      eventId,
      type,
      row,
      status: "failed",
      destination: { status: "failed", error: message },
      error: message,
    });
    await finishLifecycleState({ reservation, admin, kind, status: "failed", error: message });
    return { processed: false, eventId, reason: "dispatch_failed", error: message };
  }
}

function paymentAmount(student = {}) {
  return numberValue(
    student.paid
    ?? student.amountPaid
    ?? student.amount_paid
    ?? student.totalPaid
    ?? student.initialPaymentAmount,
  );
}

function balanceAmount(student = {}) {
  return numberValue(
    student.balanceDue
    ?? student.balance
    ?? student.outstandingBalance
    ?? student.amountDue
    ?? student.balance_due,
  );
}

function firstPaymentTransition(before = {}, after = {}) {
  const beforePaid = paymentAmount(before);
  const afterPaid = paymentAmount(after);
  if (beforePaid <= 0 && afterPaid > 0) {
    return { confirmed: true, source: "paid_increase", amount: afterPaid - beforePaid };
  }

  const beforeBalance = balanceAmount(before);
  const afterBalance = balanceAmount(after);
  if (beforePaid <= 0 && afterPaid <= 0 && beforeBalance > 0 && afterBalance >= 0 && afterBalance < beforeBalance) {
    return { confirmed: true, source: "balance_decrease", amount: beforeBalance - afterBalance };
  }

  return { confirmed: false, source: "", amount: 0 };
}

function createRegistrationLifecycleTriggers({
  admin,
  db,
  onDocumentCreated,
  onDocumentUpdated,
  runtimeConfig = {},
} = {}) {
  if (!admin?.firestore?.FieldValue?.serverTimestamp || !db?.collection) {
    throw new Error("Registration lifecycle dependencies are incomplete.");
  }
  if (typeof onDocumentCreated !== "function" || typeof onDocumentUpdated !== "function") {
    throw new Error("Registration lifecycle Firestore triggers are unavailable.");
  }

  const registrationReceived = onDocumentCreated({
    document: "students/{studentId}",
    retry: true,
  }, async (event) => {
    const student = event?.data?.data?.() || {};
    const studentId = text(event?.params?.studentId || event?.data?.id);
    const registration = await processLifecycleEvent({
      db,
      admin,
      runtimeConfig,
      type: "registration.received",
      kind: "registration",
      student,
      studentId,
    });

    const initialPaid = paymentAmount(student);
    let enrollment = null;
    if (initialPaid > 0) {
      enrollment = await processLifecycleEvent({
        db,
        admin,
        runtimeConfig,
        type: "enrollment.confirmed",
        kind: "enrollment",
        student,
        studentId,
      });
    }

    const result = { registration, enrollment };
    console.log("registration_lifecycle_created", result);
    return result;
  });

  const enrollmentConfirmed = onDocumentUpdated({
    document: "students/{studentId}",
    retry: true,
  }, async (event) => {
    const before = event?.data?.before?.data?.() || {};
    const after = event?.data?.after?.data?.() || {};
    const studentId = text(event?.params?.studentId || event?.data?.after?.id || event?.data?.before?.id);
    const transition = firstPaymentTransition(before, after);
    if (!transition.confirmed) {
      return { processed: false, reason: "not_first_payment" };
    }

    const result = await processLifecycleEvent({
      db,
      admin,
      runtimeConfig,
      type: "enrollment.confirmed",
      kind: "enrollment",
      student: after,
      studentId,
    });
    console.log("registration_lifecycle_payment_confirmed", {
      ...result,
      paymentSource: transition.source,
      amount: transition.amount,
    });
    return result;
  });

  return { registrationReceived, enrollmentConfirmed };
}

module.exports = {
  createRegistrationLifecycleTriggers,
  firstPaymentTransition,
  processLifecycleEvent,
  registrationRow,
  resolveRegistrationDocsConfig,
  _test: {
    eventIdFor,
    paymentAmount,
    balanceAmount,
    postRegistrationLifecycleEvent,
    stateId,
  },
};
