const crypto = require("crypto");

const PROCESSING_STALE_MS = 30 * 60 * 1000;
const RESULT_URL = "https://www.falowen.app/campus/results";
const FINAL_MOCK_SOURCES = new Set(["a1_final_mock", "a2_final_mock"]);

function text(value) {
  return String(value == null ? "" : value).trim();
}

function lower(value) {
  return text(value).toLowerCase();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatScore(value) {
  const parsed = number(value, 0);
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(1);
}

function isFinalMockScore(score = {}) {
  return FINAL_MOCK_SOURCES.has(lower(score.source));
}

function levelFromScore(score = {}) {
  const direct = text(score.level).toUpperCase();
  if (direct === "A1" || direct === "A2") return direct;
  return lower(score.source) === "a2_final_mock" ? "A2" : "A1";
}

function attemptLabelFromScore(score = {}) {
  const explicit = text(score.attemptLabel);
  if (explicit) return explicit;
  const attempt = Math.max(1, number(score.attempt, 1));
  if (score.firstAttempt === true || lower(score.attemptType) === "readiness" || attempt === 1) {
    return "First readiness attempt";
  }
  return `Practice attempt ${attempt}`;
}

function passStatus(score = {}) {
  const passed = score.passed === true || lower(score.status) === "passed" || number(score.score ?? score.finalScore) >= 60;
  return { passed, label: passed ? "PASS" : "NEEDS MORE PRACTICE" };
}

function sectionScores(score = {}) {
  const sections = score.sectionScores && typeof score.sectionScores === "object"
    ? score.sectionScores
    : {};
  return {
    lesen: number(sections.lesen),
    hoeren: number(sections.hoeren),
    schreiben: number(sections.schreiben),
    sprechen: number(sections.sprechen),
  };
}

function buildFinalMockResultMessage(score = {}) {
  const level = levelFromScore(score);
  const name = text(score.studentName || score.name) || "Student";
  const overall = number(score.score ?? score.finalScore);
  const attemptLabel = attemptLabelFromScore(score);
  const status = passStatus(score);
  const sections = sectionScores(score);
  const strongest = text(score.strongestArea);
  const practiseNext = text(score.practiseNext);

  return [
    `Hello ${name},`,
    "",
    `Your ${level} Final Mock Exam result is ready.`,
    attemptLabel,
    "",
    `Overall: ${formatScore(overall)}/100 — ${status.label}`,
    `Lesen: ${formatScore(sections.lesen)}/25`,
    `Hören: ${formatScore(sections.hoeren)}/25`,
    `Schreiben: ${formatScore(sections.schreiben)}/25`,
    `Sprechen: ${formatScore(sections.sprechen)}/25`,
    ...(strongest ? ["", `Strongest area: ${strongest}`] : []),
    ...(practiseNext ? [`Practise next: ${practiseNext}`] : []),
    "",
    "This is a readiness/practice mock result and does not issue a course certificate.",
    "Open Falowen Results to review your result and feedback.",
    "",
    "Best regards,",
    "Learn Language Education Academy (Falowen)",
  ].join("\n");
}

function isoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(safe);
}

function buildFinalMockAnnouncementRow(score = {}, { scoreId = "", now = new Date() } = {}) {
  const level = levelFromScore(score);
  const overall = number(score.score ?? score.finalScore);
  const status = passStatus(score);
  const attemptLabel = attemptLabelFromScore(score);
  const sections = sectionScores(score);
  const email = lower(score.email || score.studentEmail);

  return {
    announcement: buildFinalMockResultMessage(score),
    class: text(score.className || score.class || level),
    date: isoDate(now),
    link: RESULT_URL,
    topic: `${level} Final Mock Exam result — ${attemptLabel}`,
    email,
    attach_certificate: "FALSE",
    cert_level: level,
    delivery_mode: "individual",
    allow_bcc_fallback: "FALSE",
    email_type: "final_mock_result",
    show_progress: "FALSE",
    show_review: "FALSE",
    show_app_button: "TRUE",
    show_class: "TRUE",
    show_date: "TRUE",
    button_label: "Open Falowen Results",
    student_code: text(score.studentCode || score.studentcode),
    student_name: text(score.studentName || score.name),
    assignment: text(score.assignment || `${level} Final Mock Exam`),
    assignment_id: text(score.assignmentId || score.assignment_id),
    attempt_label: attemptLabel,
    attempt_type: text(score.attemptType),
    attempt_number: String(Math.max(1, number(score.attempt, 1))),
    mock_attempt_id: text(score.mockAttemptId),
    score_id: text(scoreId),
    event_id: upstreamEventId(scoreId),
    idempotency_key: upstreamEventId(scoreId),
    score: formatScore(overall),
    score_max: "100",
    result_status: status.passed ? "passed" : "needs_more_practice",
    lesen_score: formatScore(sections.lesen),
    hoeren_score: formatScore(sections.hoeren),
    schreiben_score: formatScore(sections.schreiben),
    sprechen_score: formatScore(sections.sprechen),
    strongest_area: text(score.strongestArea),
    practise_next: text(score.practiseNext),
    source: lower(score.source),
  };
}

function resolveAnnouncementConfig(runtimeConfig = {}, env = process.env) {
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
    sheetName: text(
      env.ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME
      || communication.announcement_sheet_name
      || communication.sheet_name,
    ),
    sheetGid: text(
      env.ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || env.VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID
      || communication.announcement_sheet_gid
      || communication.sheet_gid,
    ),
  };
}

async function postAnnouncementRow(config, row, fetchImpl = fetch) {
  if (!config.url) {
    const error = new Error("Announcement webhook is not configured for final mock result emails.");
    error.deliveryAttempted = false;
    throw error;
  }

  let response;
  try {
    response = await fetchImpl(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(config.token ? { token: config.token } : {}),
        ...(config.sheetName ? { sheet_name: config.sheetName } : {}),
        ...(config.sheetGid ? { sheet_gid: config.sheetGid } : {}),
        event_id: row.event_id,
        idempotency_key: row.idempotency_key,
        row,
        rows: [row],
      }),
    });
  } catch (fetchError) {
    fetchError.deliveryAttempted = true;
    throw fetchError;
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    const error = new Error(body?.error || body?.message || `Announcement webhook returned HTTP ${response.status}`);
    error.deliveryAttempted = true;
    throw error;
  }
  return body;
}

function stateId(scoreId = "") {
  return crypto.createHash("sha256").update(`final_mock_result::${text(scoreId)}`).digest("hex");
}

function upstreamEventId(scoreId = "") {
  return `final_mock_result_${stateId(scoreId).slice(0, 40)}`;
}

async function reserveFinalMockResultSend({ db, admin, scoreId, score = {}, now = new Date() }) {
  const ref = db.collection("finalMockResultEmailSends").doc(stateId(scoreId));
  let result = { reserved: false, ref, reason: "" };

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const current = snap.exists ? snap.data() || {} : {};
    const status = lower(current.status);
    const processingStarted = current.processingStartedAt?.toDate?.() || null;
    const processingFresh = status === "processing"
      && processingStarted
      && now.getTime() - processingStarted.getTime() < PROCESSING_STALE_MS;

    if (status === "sent") {
      result = { reserved: false, ref, reason: "already_sent" };
      return;
    }
    if (status === "delivery_uncertain") {
      result = { reserved: false, ref, reason: "delivery_uncertain" };
      return;
    }
    if (processingFresh) {
      result = { reserved: false, ref, reason: "processing" };
      return;
    }

    transaction.set(ref, {
      scoreId: text(scoreId),
      source: lower(score.source),
      level: levelFromScore(score),
      studentCode: text(score.studentCode || score.studentcode),
      studentEmail: lower(score.email || score.studentEmail),
      mockAttemptId: text(score.mockAttemptId),
      assignmentId: text(score.assignmentId || score.assignment_id),
      status: "processing",
      attemptCount: number(current.attemptCount) + 1,
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(snap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
    }, { merge: true });
    result = { reserved: true, ref, reason: "" };
  });

  return result;
}

async function writeAnnouncementHistory({
  db,
  admin,
  scoreId,
  score = {},
  row = {},
  status = "sent",
  error = "",
  upstream = {},
} = {}) {
  const historyId = `final-mock-result-${text(scoreId).replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 160)}`;
  await db.collection("announcements").doc(historyId).set({
    ...row,
    source: "final_mock_result",
    scoreId: text(scoreId),
    mockSource: lower(score.source),
    mockAttemptId: text(score.mockAttemptId),
    deliveryStatus: status,
    recipientCount: 1,
    successCount: status === "sent" ? 1 : 0,
    failureCount: status === "sent" ? 0 : 1,
    deliveryError: text(error),
    upstreamCount: number(upstream?.count || upstream?.sent || (status === "sent" ? 1 : 0)),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return historyId;
}

async function processFinalMockResultScore({
  db,
  admin,
  runtimeConfig = {},
  scoreId = "",
  score = {},
  now = new Date(),
  fetchImpl = fetch,
} = {}) {
  if (!isFinalMockScore(score)) return { sent: false, reason: "not_final_mock" };
  const email = lower(score.email || score.studentEmail);
  if (!email) return { sent: false, reason: "missing_email" };

  const reservation = await reserveFinalMockResultSend({ db, admin, scoreId, score, now });
  if (!reservation.reserved) return { sent: false, reason: reservation.reason };

  const row = buildFinalMockAnnouncementRow(score, { scoreId, now });
  const config = resolveAnnouncementConfig(runtimeConfig);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  let historyId = "";
  try {
    historyId = await writeAnnouncementHistory({
      db, admin, scoreId, score, row, status: "processing",
    });
  } catch (historyError) {
    const message = historyError?.message || String(historyError);
    await reservation.ref.set({
      status: "failed",
      failedAt: timestamp,
      updatedAt: timestamp,
      lastError: message,
    }, { merge: true });
    throw historyError;
  }

  try {
    const upstream = await postAnnouncementRow(config, row, fetchImpl);

    // Mark the dedupe state as sent immediately after the webhook succeeds.
    // A later history-write problem must never cause the student's email to be sent twice.
    await reservation.ref.set({
      status: "sent",
      sentAt: timestamp,
      updatedAt: timestamp,
      lastError: "",
      historyId,
      upstreamCount: number(upstream?.count || upstream?.sent || 1),
    }, { merge: true });

    await writeAnnouncementHistory({
      db, admin, scoreId, score, row, status: "sent", upstream,
    }).catch((historyError) => {
      console.warn("final_mock_result_history_update_failed", {
        scoreId: text(scoreId),
        message: historyError?.message || String(historyError),
      });
    });

    return {
      sent: true,
      scoreId: text(scoreId),
      level: levelFromScore(score),
      email,
      historyId,
    };
  } catch (error) {
    const message = error?.message || String(error);

    if (error?.deliveryAttempted === false) {
      await reservation.ref.set({
        status: "failed",
        failedAt: timestamp,
        updatedAt: timestamp,
        lastError: message,
        historyId,
      }, { merge: true });
      await writeAnnouncementHistory({
        db, admin, scoreId, score, row, status: "failed", error: message,
      }).catch(() => undefined);
      throw error;
    }

    // Once the POST has been attempted, a transport failure can be ambiguous:
    // Apps Script may already have accepted and emailed the row even if Firebase
    // never received the response. Do not make this reservation immediately
    // reusable and do not throw into Firestore automatic retries, otherwise the
    // same learner can receive the same result twice.
    await reservation.ref.set({
      status: "delivery_uncertain",
      deliveryUncertainAt: timestamp,
      updatedAt: timestamp,
      lastError: message,
      historyId,
      eventId: row.event_id,
    }, { merge: true });
    await writeAnnouncementHistory({
      db, admin, scoreId, score, row, status: "delivery_uncertain", error: message,
    }).catch(() => undefined);

    return {
      sent: false,
      reason: "delivery_uncertain",
      retryable: false,
      scoreId: text(scoreId),
      level: levelFromScore(score),
      email,
      eventId: row.event_id,
      error: message,
    };
  }
}

function createFinalMockResultEmailTrigger({
  db,
  admin,
  onDocumentCreated,
  runtimeConfig = {},
  fetchImpl = fetch,
} = {}) {
  if (!db?.collection || !admin?.firestore?.FieldValue?.serverTimestamp || typeof onDocumentCreated !== "function") {
    throw new Error("Final mock result email trigger dependencies are incomplete.");
  }

  return onDocumentCreated({
    document: "scores/{scoreId}",
    retry: false,
  }, async (event) => {
    const snap = event?.data;
    if (!snap?.exists) return { sent: false, reason: "score_missing" };
    const score = snap.data?.() || {};
    const scoreId = text(event?.params?.scoreId || snap.id);
    const result = await processFinalMockResultScore({
      db,
      admin,
      runtimeConfig,
      scoreId,
      score,
      now: new Date(),
      fetchImpl,
    });
    console.log("final_mock_result_email", result);
    return result;
  });
}

module.exports = {
  createFinalMockResultEmailTrigger,
  processFinalMockResultScore,
  _test: {
    FINAL_MOCK_SOURCES,
    RESULT_URL,
    attemptLabelFromScore,
    buildFinalMockAnnouncementRow,
    buildFinalMockResultMessage,
    isFinalMockScore,
    levelFromScore,
    passStatus,
    resolveAnnouncementConfig,
    sectionScores,
    stateId,
    upstreamEventId,
  },
};
