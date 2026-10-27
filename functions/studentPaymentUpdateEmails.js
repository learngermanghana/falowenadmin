const crypto = require("crypto");

const ACCOUNT_URL = "https://www.falowen.app/campus/account";
const DEFAULT_TIMEZONE = "Africa/Accra";
const MONEY_EPSILON = 0.01;
const PROCESSING_STALE_MS = 30 * 60 * 1000;
const SYNC_DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

const PAID_FIELDS = [
  "paid",
  "amountPaid",
  "amount_paid",
  "totalPaid",
  "initialPaymentAmount",
];

const BALANCE_FIELDS = [
  "balanceDue",
  "balance",
  "outstandingBalance",
  "amountDue",
  "balance_due",
];

const PAYMENT_REFERENCE_FIELDS = [
  "lastPaymentReference",
  "paymentReference",
  "payment_reference",
  "paystackReference",
  "transactionReference",
  "lastTransactionReference",
];

function text(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return text(value).toLowerCase();
}

function money(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value)
    .replace(/[Gg][Hh][Ss]|₵/g, "")
    .replace(/[\s,\u00A0]/g, "")
    .trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function approximatelyEqual(left, right, epsilon = MONEY_EPSILON) {
  return Math.abs(Number(left || 0) - Number(right || 0)) <= epsilon;
}

function readMoneyField(student = {}, fields = []) {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(student, field)) continue;
    const value = money(student[field]);
    if (value !== null) return { field, value: roundMoney(value), present: true };
  }
  return { field: "", value: 0, present: false };
}

function paymentReference(student = {}) {
  for (const field of PAYMENT_REFERENCE_FIELDS) {
    const value = text(student[field]);
    if (value) return value;
  }
  return "";
}

function paymentSnapshot(student = {}) {
  const paid = readMoneyField(student, PAID_FIELDS);
  const balance = readMoneyField(student, BALANCE_FIELDS);
  return {
    paid: paid.value,
    paidPresent: paid.present,
    paidField: paid.field,
    balance: balance.value,
    balancePresent: balance.present,
    balanceField: balance.field,
    email: normalizeEmail(student.email || student.emailAddress || student.studentEmail),
    name: text(student.name || student.displayName || student.firstName) || "Student",
    studentCode: text(student.studentCode || student.studentcode || student.code || student.uid),
    className: text(student.className || student.class || student.program || student.level),
    level: text(student.level).toUpperCase(),
    reference: paymentReference(student),
  };
}

function detectPaymentChange(before = {}, after = {}) {
  const previous = paymentSnapshot(before);
  const current = paymentSnapshot(after);

  const paidIncrease = previous.paidPresent && current.paidPresent
    ? roundMoney(current.paid - previous.paid)
    : 0;
  const balanceDecrease = previous.balancePresent && current.balancePresent
    ? roundMoney(previous.balance - current.balance)
    : 0;

  let amount = 0;
  let source = "";
  if (paidIncrease > MONEY_EPSILON) {
    amount = paidIncrease;
    source = "paid_increase";
  } else if (balanceDecrease > MONEY_EPSILON) {
    amount = balanceDecrease;
    source = "balance_decrease";
  }

  if (amount <= MONEY_EPSILON) return null;

  const totalPaid = current.paidPresent
    ? current.paid
    : roundMoney((previous.paidPresent ? previous.paid : 0) + amount);
  const balance = current.balancePresent
    ? Math.max(0, current.balance)
    : Math.max(0, roundMoney((previous.balancePresent ? previous.balance : 0) - amount));

  return {
    amount: roundMoney(amount),
    source,
    paidIncrease: Math.max(0, paidIncrease),
    balanceDecrease: Math.max(0, balanceDecrease),
    totalPaid: roundMoney(totalPaid),
    balance: roundMoney(balance),
    previous,
    current,
    reference: current.reference || previous.reference,
  };
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(Number(value.seconds))) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isoDate(value = new Date(), timezone = DEFAULT_TIMEZONE) {
  const date = asDate(value) || new Date();
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatMoney(value) {
  return roundMoney(value).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildPaymentMessage({ student = {}, change = {} } = {}) {
  const snapshot = paymentSnapshot(student);
  const fullyPaid = Number(change.balance || 0) <= MONEY_EPSILON;
  const statusLine = fullyPaid
    ? "Your course payment is now complete."
    : `Your remaining balance is GHS ${formatMoney(change.balance)}.`;

  return [
    `Hello ${snapshot.name},`,
    "",
    `We have received and recorded your payment of GHS ${formatMoney(change.amount)}.`,
    `Total paid: GHS ${formatMoney(change.totalPaid)}.`,
    statusLine,
    "",
    "Your Falowen account and payment record have been updated. You can view your current details and receipt here:",
    ACCOUNT_URL,
    "",
    "Questions about this update? Reply to this email.",
    "",
    "Best regards,",
    "Learn Language Education Academy (Falowen)",
  ].join("\n");
}

function rowForPaymentUpdate({ student = {}, change = {}, now = new Date() } = {}) {
  const snapshot = paymentSnapshot(student);
  return {
    announcement: buildPaymentMessage({ student, change }),
    class: snapshot.className,
    date: isoDate(now),
    link: ACCOUNT_URL,
    topic: "Payment received and account updated",
    email: snapshot.email,
    attach_certificate: "FALSE",
    cert_level: snapshot.level,
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
    email_type: "payment_update",
    show_progress: "FALSE",
    show_review: "FALSE",
    show_app_button: "TRUE",
    show_class: "TRUE",
    show_date: "TRUE",
    button_label: "View account and receipt",
  };
}

function resolveWebhookConfig(runtimeConfig = {}, env = process.env) {
  const communication = runtimeConfig.communication || runtimeConfig.announcements || runtimeConfig.announcement || {};
  const payments = runtimeConfig.payment_updates || runtimeConfig.paymentUpdateEmails || runtimeConfig.payments || {};
  return {
    url: text(
      env.STUDENT_PAYMENT_UPDATE_WEBHOOK_URL
      || env.ANNOUNCEMENT_WEBHOOK_URL
      || env.VITE_ANNOUNCEMENT_WEBHOOK_URL
      || payments.webhook_url
      || payments.url
      || communication.payment_update_webhook_url
      || communication.announcement_webhook_url
      || communication.webhook_url,
    ),
    token: text(
      env.STUDENT_PAYMENT_UPDATE_WEBHOOK_TOKEN
      || env.ANNOUNCEMENT_WEBHOOK_TOKEN
      || env.VITE_ANNOUNCEMENT_WEBHOOK_TOKEN
      || payments.webhook_token
      || payments.token
      || communication.payment_update_webhook_token
      || communication.announcement_webhook_token
      || communication.webhook_token,
    ),
    sheetName: text(
      env.STUDENT_PAYMENT_UPDATE_SHEET_NAME
      || env.ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || payments.sheet_name
      || communication.payment_update_sheet_name
      || communication.announcement_sheet_name
      || communication.sheet_name,
    ),
    sheetGid: text(
      env.STUDENT_PAYMENT_UPDATE_SHEET_GID
      || env.ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || payments.sheet_gid
      || communication.payment_update_sheet_gid
      || communication.announcement_sheet_gid
      || communication.sheet_gid,
    ),
  };
}

async function postPaymentRow(config, row, fetchImpl = fetch) {
  if (!config.url) {
    throw new Error("Payment-update email webhook is not configured");
  }
  const response = await fetchImpl(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(config.token ? { token: config.token } : {}),
      ...(config.sheetName ? { sheet_name: config.sheetName } : {}),
      ...(config.sheetGid ? { sheet_gid: config.sheetGid } : {}),
      row,
      rows: [row],
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error || body?.message || `Payment email webhook returned HTTP ${response.status}`);
  }
  return body;
}

function stateId(studentId) {
  return crypto.createHash("sha256").update(text(studentId)).digest("hex");
}

function sameStoredTotals(state = {}, change = {}) {
  return approximatelyEqual(state.lastPaid, change.totalPaid)
    && approximatelyEqual(state.lastBalance, change.balance);
}

function isLikelySecondHalfOfSameSync(state = {}, change = {}, now = new Date()) {
  const sentAt = asDate(state.lastSentAt || state.updatedAt);
  if (!sentAt || now.getTime() - sentAt.getTime() > SYNC_DUPLICATE_WINDOW_MS) return false;
  if (change.reference && state.lastReference) return change.reference === state.lastReference;
  if (!approximatelyEqual(state.lastPaymentAmount, change.amount)) return false;

  const paidCaughtUp = change.source === "paid_increase"
    && approximatelyEqual(state.lastBalance, change.balance)
    && change.totalPaid > Number(state.lastPaid || 0) + MONEY_EPSILON;
  const balanceCaughtUp = change.source === "balance_decrease"
    && approximatelyEqual(state.lastPaid, change.totalPaid)
    && change.balance < Number(state.lastBalance || 0) - MONEY_EPSILON;
  return paidCaughtUp || balanceCaughtUp;
}

async function reservePaymentEmail({ db, admin, studentId, change, eventId = "", now = new Date() }) {
  const ref = db.collection("studentPaymentUpdateEmailStates").doc(stateId(studentId));
  let result = { reserved: false, ref, reason: "" };

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const state = snap.exists ? snap.data() || {} : {};
    const stateUpdatedAt = asDate(state.processingStartedAt || state.updatedAt);
    const processingFresh = text(state.status).toLowerCase() === "processing"
      && stateUpdatedAt
      && now.getTime() - stateUpdatedAt.getTime() < PROCESSING_STALE_MS;

    if (change.reference && state.lastReference === change.reference && text(state.status).toLowerCase() === "sent") {
      result = { reserved: false, ref, reason: "duplicate_reference" };
      return;
    }
    if (sameStoredTotals(state, change) && text(state.status).toLowerCase() === "sent") {
      result = { reserved: false, ref, reason: "duplicate_totals" };
      return;
    }
    if (isLikelySecondHalfOfSameSync(state, change, now)) {
      transaction.set(ref, {
        lastPaid: change.totalPaid,
        lastBalance: change.balance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      result = { reserved: false, ref, reason: "duplicate_sync" };
      return;
    }
    if (processingFresh) {
      result = { reserved: false, ref, reason: "processing" };
      return;
    }

    const token = crypto.createHash("sha256").update([
      text(studentId),
      text(eventId),
      String(change.totalPaid),
      String(change.balance),
      change.reference,
    ].join("::")).digest("hex");
    transaction.set(ref, {
      studentId: text(studentId),
      status: "processing",
      processingToken: token,
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      pendingPaid: change.totalPaid,
      pendingBalance: change.balance,
      pendingAmount: change.amount,
      pendingReference: change.reference,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(snap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
    }, { merge: true });
    result = { reserved: true, ref, token, reason: "" };
  });

  return result;
}

async function processStudentPaymentUpdate({
  event,
  db,
  admin,
  runtimeConfig = {},
  fetchImpl = fetch,
  now = new Date(),
} = {}) {
  const before = event?.data?.before?.data?.() || {};
  const after = event?.data?.after?.data?.() || {};
  const studentId = text(event?.params?.studentId || event?.data?.after?.id || event?.data?.before?.id);
  if (!studentId) return { sent: false, reason: "missing_student_id" };

  const change = detectPaymentChange(before, after);
  if (!change) return { sent: false, reason: "no_payment_change" };
  if (!change.current.email) return { sent: false, reason: "missing_email" };

  const reservation = await reservePaymentEmail({
    db,
    admin,
    studentId,
    change,
    eventId: event?.id || "",
    now,
  });
  if (!reservation.reserved) return { sent: false, reason: reservation.reason };

  const row = rowForPaymentUpdate({ student: after, change, now });
  const config = resolveWebhookConfig(runtimeConfig);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  try {
    const upstream = await postPaymentRow(config, row, fetchImpl);
    await reservation.ref.set({
      status: "sent",
      lastPaid: change.totalPaid,
      lastBalance: change.balance,
      lastPaymentAmount: change.amount,
      lastReference: change.reference,
      lastSentAt: timestamp,
      updatedAt: timestamp,
      lastError: "",
      processingToken: "",
      upstreamCount: Number(upstream?.count || upstream?.sent || 1),
    }, { merge: true });
    return { sent: true, amount: change.amount, balance: change.balance, studentId };
  } catch (error) {
    await reservation.ref.set({
      status: "failed",
      failedAt: timestamp,
      updatedAt: timestamp,
      lastError: error?.message || String(error),
      processingToken: "",
    }, { merge: true });
    throw error;
  }
}

function createStudentPaymentUpdateEmailTrigger({
  admin,
  db,
  onDocumentUpdated,
  runtimeConfig = {},
} = {}) {
  if (!admin?.firestore?.FieldValue?.serverTimestamp || !db?.collection || typeof onDocumentUpdated !== "function") {
    throw new Error("Student payment update email trigger dependencies are incomplete");
  }

  return onDocumentUpdated({
    document: "students/{studentId}",
    retry: true,
  }, async (event) => {
    const result = await processStudentPaymentUpdate({ event, db, admin, runtimeConfig });
    console.log("student_payment_update_email", result);
    return result;
  });
}

module.exports = {
  createStudentPaymentUpdateEmailTrigger,
  processStudentPaymentUpdate,
  _test: {
    ACCOUNT_URL,
    PAID_FIELDS,
    BALANCE_FIELDS,
    approximatelyEqual,
    buildPaymentMessage,
    detectPaymentChange,
    formatMoney,
    isLikelySecondHalfOfSameSync,
    money,
    paymentSnapshot,
    resolveWebhookConfig,
    rowForPaymentUpdate,
    sameStoredTotals,
    stateId,
  },
};
