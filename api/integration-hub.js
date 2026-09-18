import crypto from "node:crypto";
import { Buffer } from "node:buffer";

const DEFAULT_ADMIN_EMAILS = ["moxflex@gmail.com"];
const MAX_ROWS = 100;

function envValue(...names) {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();
    if (value) return value;
  }
  return "";
}

function adminEmails() {
  const configured = envValue("FALOWEN_ADMIN_EMAILS", "ADMIN_EMAILS");
  const values = configured
    ? configured.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_ADMIN_EMAILS;
  return new Set(values);
}

async function readJsonBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};
    return req.body || {};
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function bearerToken(req) {
  const header = String(req.headers.authorization || "").trim();
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

async function verifyFirebaseAdminUser(idToken) {
  const apiKey = envValue("FIREBASE_API_KEY", "VITE_FIREBASE_API_KEY");
  if (!apiKey) {
    throw Object.assign(new Error("Firebase API key is not configured on the server."), { statusCode: 503 });
  }
  if (!idToken) {
    throw Object.assign(new Error("Authentication is required."), { statusCode: 401 });
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  const body = await response.json().catch(() => ({}));
  const account = Array.isArray(body.users) ? body.users[0] : null;
  if (!response.ok || !account?.localId) {
    throw Object.assign(new Error("Your Falowen session is invalid or expired."), { statusCode: 401 });
  }

  const email = String(account.email || "").trim().toLowerCase();
  if (!email || !adminEmails().has(email)) {
    throw Object.assign(new Error("Administrator access is required."), { statusCode: 403 });
  }
  return { uid: account.localId, email };
}

function eventIdFrom(value = "") {
  const explicit = String(value || "").trim();
  if (explicit && /^[a-zA-Z0-9._:-]{8,180}$/.test(explicit)) return explicit;
  return `evt_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function eventTypeFrom(value = "") {
  return String(value || "").trim().toLowerCase();
}

function destinationForType(type = "") {
  const normalized = eventTypeFrom(type);
  if (normalized.startsWith("score.")) return "scores";
  if (
    normalized.startsWith("registration.")
    || normalized.startsWith("enrollment.")
  ) {
    return "registration";
  }
  if (
    normalized.startsWith("communication.")
    || normalized.startsWith("announcement.")
    || normalized.startsWith("certificate.")
    || normalized.startsWith("attendance.")
  ) {
    return "communication";
  }
  return "";
}

function normalizeRows(rows, row) {
  const value = Array.isArray(rows) ? rows : row ? [row] : [];
  if (!value.length) {
    throw Object.assign(new Error("No integration rows were supplied."), { statusCode: 400 });
  }
  if (value.length > MAX_ROWS) {
    throw Object.assign(new Error(`A maximum of ${MAX_ROWS} rows can be dispatched at once.`), { statusCode: 400 });
  }
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw Object.assign(new Error("Every integration row must be an object."), { statusCode: 400 });
    }
    return { ...item };
  });
}

function validateScoreRows(rows) {
  return rows.map((row) => {
    const studentCode = String(row.studentcode || row.studentCode || "").trim();
    const assignmentId = String(row.assignment_id || row.assignmentId || "").trim();
    const dedupeId = String(row.dedupe_id || row.dedupeId || "").trim();
    if (!studentCode || !assignmentId || !dedupeId) {
      throw Object.assign(
        new Error("Every score row needs a student code, assignment ID and dedupe ID."),
        { statusCode: 400 },
      );
    }
    return row;
  });
}

function validateCommunicationRows(rows) {
  return rows.map((row) => {
    const announcement = String(row.announcement || row.body || "").trim();
    const topic = String(row.topic || row.title || row.subject || "").trim();
    if (!announcement || !topic) {
      throw Object.assign(
        new Error("Every communication row needs a topic and announcement body."),
        { statusCode: 400 },
      );
    }
    return row;
  });
}

function validateRegistrationRows(rows) {
  return rows.map((row) => {
    const studentCode = String(row.student_code || row.studentCode || row.studentcode || "").trim();
    const email = String(row.email || row.studentEmail || "").trim();
    if (!studentCode && !email) {
      throw Object.assign(
        new Error("Every registration lifecycle row needs a student code or email."),
        { statusCode: 400 },
      );
    }
    return row;
  });
}

function scoreConfig() {
  return {
    url: envValue("SCORES_WEBHOOK_URL", "VITE_SCORES_WEBHOOK_URL"),
    token: envValue("SCORES_WEBHOOK_TOKEN", "VITE_SCORES_WEBHOOK_TOKEN"),
    sheetName: envValue("SCORES_WEBHOOK_SHEET_NAME", "VITE_SCORES_WEBHOOK_SHEET_NAME"),
    sheetGid: envValue("SCORES_WEBHOOK_SHEET_GID", "VITE_SCORES_WEBHOOK_SHEET_GID"),
  };
}

function communicationConfig() {
  return {
    url: envValue("ANNOUNCEMENT_WEBHOOK_URL", "VITE_ANNOUNCEMENT_WEBHOOK_URL"),
    token: envValue("ANNOUNCEMENT_WEBHOOK_TOKEN", "VITE_ANNOUNCEMENT_WEBHOOK_TOKEN"),
    sheetName: envValue("ANNOUNCEMENT_WEBHOOK_SHEET_NAME", "VITE_ANNOUNCEMENT_WEBHOOK_SHEET_NAME"),
    sheetGid: envValue("ANNOUNCEMENT_WEBHOOK_SHEET_GID", "VITE_ANNOUNCEMENT_WEBHOOK_SHEET_GID"),
  };
}

function registrationConfig() {
  return {
    url: envValue("REGISTRATION_DOCS_WEBHOOK_URL"),
    token: envValue(
      "REGISTRATION_DOCS_WEBHOOK_TOKEN",
      "ANNOUNCEMENT_WEBHOOK_TOKEN",
      "VITE_ANNOUNCEMENT_WEBHOOK_TOKEN",
    ),
  };
}

async function postAppsScript(url, payload) {
  if (!url) {
    throw Object.assign(new Error("The requested integration webhook is not configured on the server."), { statusCode: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      throw Object.assign(new Error("The Apps Script webhook returned an invalid response."), { statusCode: 502 });
    }

    if (!response.ok || body?.ok === false) {
      throw Object.assign(
        new Error(body?.error || `The Apps Script webhook failed (${response.status}).`),
        { statusCode: 502, upstreamStatus: response.status },
      );
    }
    return { body, status: response.status };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw Object.assign(new Error("The Apps Script webhook timed out."), { statusCode: 504 });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function verifiedScoreReceipt(body = {}) {
  return body?.ok === true && (
    body.action === "upsertScoreRows"
    || body.mode === "upsert"
    || body.upsert === true
  );
}

async function dispatchScoreRows({ rows, eventId, user }) {
  const config = scoreConfig();
  const safeRows = validateScoreRows(rows).map((row) => ({
    ...row,
    event_id: eventId,
    source: row.source || "falowen_admin",
  }));
  const payload = {
    ...(config.token ? { token: config.token } : {}),
    ...(config.sheetName ? { sheet_name: config.sheetName } : {}),
    ...(config.sheetGid ? { sheet_gid: config.sheetGid } : {}),
    event_id: eventId,
    source: "falowen-admin",
    requested_by: user.email,
    action: "upsertScoreRows",
    mode: "upsert",
    dedupe_columns: ["studentcode", "assignment_id"],
    remove_duplicate_rows: true,
    create_missing_columns: true,
    rows: safeRows,
  };

  const upstream = await postAppsScript(config.url, payload);
  if (!verifiedScoreReceipt(upstream.body)) {
    throw Object.assign(
      new Error("The deployed score-sheet webhook is still append-only. Upgrade and redeploy its Apps Script."),
      { statusCode: 409 },
    );
  }

  return {
    receipt: upstream.body,
    destination: {
      status: "processed",
      httpStatus: upstream.status,
      inserted: Number(upstream.body.inserted || 0),
      updated: Number(upstream.body.updated || 0),
      duplicatesRemoved: Number(upstream.body.duplicatesRemoved || upstream.body.duplicates_removed || 0),
    },
  };
}

async function dispatchCommunicationRows({ rows, eventId, user }) {
  const config = communicationConfig();
  const safeRows = validateCommunicationRows(rows).map((row) => ({
    ...row,
    event_id: eventId,
  }));
  const payload = {
    ...(config.token ? { token: config.token } : {}),
    ...(config.sheetName ? { sheet_name: config.sheetName } : {}),
    ...(config.sheetGid ? { sheet_gid: config.sheetGid } : {}),
    event_id: eventId,
    source: "falowen-admin",
    requested_by: user.email,
    row: safeRows[0],
    rows: safeRows,
  };

  const upstream = await postAppsScript(config.url, payload);
  return {
    receipt: upstream.body,
    destination: {
      status: "processed",
      httpStatus: upstream.status,
      acceptedRows: Number(upstream.body.count || safeRows.length),
    },
  };
}

async function dispatchRegistrationRows({ rows, eventId, user, type }) {
  const config = registrationConfig();
  const safeRows = validateRegistrationRows(rows).map((row) => ({
    ...row,
    event_id: eventId,
  }));
  const payload = {
    ...(config.token ? { token: config.token } : {}),
    action: "processRegistrationLifecycleEvent",
    event_id: eventId,
    type,
    source: "falowen-admin",
    requested_by: user.email,
    row: safeRows[0],
    rows: safeRows,
  };

  const upstream = await postAppsScript(config.url, payload);
  const result = String(upstream.body?.result || upstream.body?.status || "processed").trim();
  if (result.toUpperCase() === "PENDING") {
    throw Object.assign(new Error("Registration document worker is busy. Retry the event."), { statusCode: 409 });
  }

  return {
    receipt: upstream.body,
    destination: {
      status: "processed",
      httpStatus: upstream.status,
      result,
      acceptedRows: Number(upstream.body.count || safeRows.length),
    },
  };
}

function healthPayload() {
  const scores = scoreConfig();
  const communication = communicationConfig();
  const registration = registrationConfig();
  return {
    ok: true,
    eventStore: "firestore:auditLogs",
    integrations: {
      scores: {
        configured: Boolean(scores.url && scores.token),
        urlConfigured: Boolean(scores.url),
        tokenConfigured: Boolean(scores.token),
      },
      communication: {
        configured: Boolean(communication.url && communication.token),
        urlConfigured: Boolean(communication.url),
        tokenConfigured: Boolean(communication.token),
      },
      registration: {
        configured: Boolean(registration.url && registration.token),
        urlConfigured: Boolean(registration.url),
        tokenConfigured: Boolean(registration.token),
      },
    },
    reconciliation: {
      legacyScoreWatcherMayRemainEnabled: true,
      announcementRunnerMayRemainEnabled: true,
      registrationSheetWatcherMayRemainEnabled: true,
    },
  };
}

export default async function integrationHubHandler(req, res) {
  let eventId = "";
  let type = "";
  let destination = "";
  try {
    const user = await verifyFirebaseAdminUser(bearerToken(req));
    const path = String(req.query?.path || req.query?.route || "").replace(/^\/+|\/+$/g, "");

    if (req.method === "GET" && path.endsWith("integrations/health")) {
      return res.status(200).json(healthPayload());
    }
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    const body = await readJsonBody(req);
    eventId = eventIdFrom(body.event_id || body.eventId);
    type = eventTypeFrom(body.type || body.event_type || body.eventType);
    destination = destinationForType(type);
    if (!destination) {
      return res.status(400).json({ ok: false, error: "Unsupported integration event type." });
    }

    const rows = normalizeRows(body.rows, body.row);
    const dispatched = destination === "scores"
      ? await dispatchScoreRows({ rows, eventId, user })
      : destination === "registration"
        ? await dispatchRegistrationRows({ rows, eventId, user, type })
        : await dispatchCommunicationRows({ rows, eventId, user });

    return res.status(200).json({
      ok: true,
      event: {
        id: eventId,
        type,
        source: "falowen-admin",
        status: "processed",
        actor: user.email,
        destinations: {
          [destination]: dispatched.destination,
        },
      },
      receipt: dispatched.receipt,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    console.error("integration_event_dispatch_failed", {
      eventId,
      type,
      destination,
      statusCode,
      message: error?.message || String(error),
    });
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || "Integration dispatch failed.",
      event: eventId ? {
        id: eventId,
        type,
        source: "falowen-admin",
        status: "failed",
        destinations: destination ? {
          [destination]: {
            status: "failed",
            error: error?.message || "Integration dispatch failed.",
          },
        } : {},
      } : null,
    });
  }
}

export {
  adminEmails,
  bearerToken,
  communicationConfig,
  destinationForType,
  registrationConfig,
  envValue,
  eventIdFrom,
  healthPayload,
  readJsonBody,
  scoreConfig,
  validateCommunicationRows,
  validateRegistrationRows,
  validateScoreRows,
  verifyFirebaseAdminUser,
  verifiedScoreReceipt,
};
