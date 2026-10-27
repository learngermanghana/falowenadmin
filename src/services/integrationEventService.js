import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase.js";

const INTEGRATION_DISPATCH_URL = "/api/integrations/dispatch";
const INTEGRATION_HEALTH_URL = "/api/integrations/health";
const EVENT_COLLECTION = "auditLogs";

function normalize(value) {
  return String(value || "").trim();
}

function eventId(type = "event") {
  const prefix = normalize(type).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "event";
  const random = globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 12)
    || Math.random().toString(36).slice(2, 14);
  return `evt_${prefix}_${Date.now()}_${random}`;
}

function timestampMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getAdminToken() {
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error("Sign in again before using Falowen integrations.");
  return {
    currentUser,
    idToken: await currentUser.getIdToken(),
  };
}

async function writeAuditEvent(id, payload) {
  try {
    await setDoc(doc(db, EVENT_COLLECTION, id), {
      integrationEvent: true,
      eventId: id,
      ...payload,
    }, { merge: true });
  } catch (error) {
    console.warn("Could not write integration event to audit log.", error);
  }
}

async function authenticatedFetch(url, options = {}) {
  const { currentUser, idToken } = await getAdminToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${idToken}`,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    const error = new Error(body?.error || `Integration request failed (${response.status}).`);
    error.status = response.status;
    error.body = body;
    error.currentUser = currentUser;
    throw error;
  }
  return { body, currentUser };
}

export async function dispatchIntegrationEvent({
  type,
  rows,
  row,
  metadata = {},
  eventId: explicitEventId = "",
  retryOf = "",
} = {}) {
  const id = normalize(explicitEventId) || eventId(type);
  const now = new Date().toISOString();
  const request = {
    event_id: id,
    type: normalize(type),
    ...(Array.isArray(rows) ? { rows } : {}),
    ...(row && typeof row === "object" ? { row } : {}),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  };

  const actor = auth?.currentUser?.email || "";
  await writeAuditEvent(id, {
    type: request.type,
    source: "falowen-admin",
    status: "dispatching",
    actor,
    retryOf: normalize(retryOf),
    request,
    createdAt: now,
    updatedAt: now,
  });

  try {
    const { body, currentUser } = await authenticatedFetch(INTEGRATION_DISPATCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const processedAt = new Date().toISOString();
    await writeAuditEvent(id, {
      status: body.event?.status || "processed",
      actor: currentUser.email || actor,
      destinations: body.event?.destinations || {},
      receipt: body.receipt || {},
      updatedAt: processedAt,
      processedAt,
    });
    return body;
  } catch (error) {
    const failedAt = new Date().toISOString();
    await writeAuditEvent(id, {
      status: "failed",
      destinations: error.body?.event?.destinations || {},
      error: error.message,
      updatedAt: failedAt,
      failedAt,
    });
    throw error;
  }
}

export async function fetchIntegrationHealth() {
  const { body } = await authenticatedFetch(INTEGRATION_HEALTH_URL, { method: "GET" });
  return body;
}

export async function listIntegrationEvents({ limit = 50 } = {}) {
  const snapshot = await getDocs(
    query(collection(db, EVENT_COLLECTION), where("integrationEvent", "==", true)),
  );
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .sort((left, right) => timestampMs(right.createdAt) - timestampMs(left.createdAt))
    .slice(0, Math.max(1, Number(limit) || 50));
}

export async function retryIntegrationEvent(event = {}) {
  const request = event.request || {};
  if (!request.type) throw new Error("This event does not contain a retryable request.");
  return dispatchIntegrationEvent({
    type: request.type,
    rows: request.rows,
    row: request.row,
    metadata: {
      ...(request.metadata || {}),
      retry: true,
      retryOf: event.id || event.eventId || "",
    },
    retryOf: event.id || event.eventId || "",
  });
}

export { INTEGRATION_DISPATCH_URL, INTEGRATION_HEALTH_URL };
