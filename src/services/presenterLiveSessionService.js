import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export const PRESENTER_LAST_CLASS_KEY = "falowen:presenter:last-class";
export const PRESENTER_LAST_CLASS_RECORD_KEY = "falowen:presenter:last-class-record";
export const PRESENTER_LAST_SESSION_KEY = "falowen:presenter:last-session";
export const PRESENTER_CLASS_CONTEXT_EVENT = "falowen:presenter:class-context";
const PRESENTER_DEVICE_KEY = "falowen:presenter:device-id";

function normalize(value) {
  return String(value || "").trim();
}

export function presenterLocalDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeStorageGet(storage, key) {
  try {
    return storage?.getItem?.(key) || "";
  } catch {
    return "";
  }
}

function safeStorageSet(storage, key, value) {
  try {
    if (value) storage?.setItem?.(key, value);
    else storage?.removeItem?.(key);
  } catch {
    // Live presenter sync remains optional when browser storage is unavailable.
  }
}

export function getPresenterDeviceId() {
  if (typeof window === "undefined") return "server";
  const existing = safeStorageGet(window.sessionStorage, PRESENTER_DEVICE_KEY);
  if (existing) return existing;
  const generated = globalThis.crypto?.randomUUID?.()
    || `presenter-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  safeStorageSet(window.sessionStorage, PRESENTER_DEVICE_KEY, generated);
  return generated;
}

export function getPresenterClassContext() {
  if (typeof window === "undefined") return { classId: "", classRecordId: "", sessionKey: "" };
  return {
    classId: normalize(safeStorageGet(window.localStorage, PRESENTER_LAST_CLASS_KEY)),
    classRecordId: normalize(safeStorageGet(window.localStorage, PRESENTER_LAST_CLASS_RECORD_KEY)),
    sessionKey: normalize(safeStorageGet(window.localStorage, PRESENTER_LAST_SESSION_KEY)),
  };
}

export function setPresenterClassContext({
  classId = "",
  classRecordId = "",
  sessionKey = "",
} = {}) {
  const next = {
    classId: normalize(classId),
    classRecordId: normalize(classRecordId),
    sessionKey: normalize(sessionKey),
  };
  if (typeof window === "undefined") return next;
  safeStorageSet(window.localStorage, PRESENTER_LAST_CLASS_KEY, next.classId);
  safeStorageSet(window.localStorage, PRESENTER_LAST_CLASS_RECORD_KEY, next.classRecordId);
  safeStorageSet(window.localStorage, PRESENTER_LAST_SESSION_KEY, next.sessionKey);
  window.dispatchEvent(new CustomEvent(PRESENTER_CLASS_CONTEXT_EVENT, { detail: next }));
  return next;
}

export function subscribePresenterClassContext(listener) {
  if (typeof window === "undefined" || typeof listener !== "function") return () => {};
  const notify = () => listener(getPresenterClassContext());
  const onCustom = (event) => listener(event?.detail || getPresenterClassContext());
  const onStorage = (event) => {
    if (![PRESENTER_LAST_CLASS_KEY, PRESENTER_LAST_CLASS_RECORD_KEY, PRESENTER_LAST_SESSION_KEY].includes(event?.key)) return;
    notify();
  };
  window.addEventListener(PRESENTER_CLASS_CONTEXT_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  notify();
  return () => {
    window.removeEventListener(PRESENTER_CLASS_CONTEXT_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

function cleanPatch(patch = {}) {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  );
}

function sessionStateFromClassData(data = {}, requestedSessionKey = "") {
  const activeSessionKey = normalize(data.presenterActiveSessionKey);
  const sessionKey = normalize(requestedSessionKey) || activeSessionKey;
  const sessions = data.presenterSessions && typeof data.presenterSessions === "object"
    ? data.presenterSessions
    : {};
  const session = sessionKey && sessions[sessionKey] && typeof sessions[sessionKey] === "object"
    ? sessions[sessionKey]
    : null;

  if (session) {
    return {
      ...session,
      sessionKey,
      activeSessionKey,
      isActiveSession: Boolean(activeSessionKey && sessionKey === activeSessionKey),
    };
  }

  const legacy = data.presenterLiveSession && typeof data.presenterLiveSession === "object"
    ? data.presenterLiveSession
    : {};
  return {
    ...legacy,
    sessionKey: "",
    activeSessionKey,
    isActiveSession: false,
    legacyState: true,
  };
}

function sessionUpdates(sessionKey, patch = {}) {
  const key = normalize(sessionKey);
  if (!key) return {};
  const safePatch = cleanPatch(patch);
  const updates = {};
  Object.entries(safePatch).forEach(([field, value]) => {
    updates[`presenterSessions.${key}.${field}`] = value;
  });
  updates[`presenterSessions.${key}.updatedAt`] = serverTimestamp();
  updates[`presenterSessions.${key}.updatedAtMs`] = Date.now();
  updates[`presenterSessions.${key}.updatedBy`] = getPresenterDeviceId();
  return updates;
}

export function subscribePresenterLiveSession(classRecordId, listener, onError, sessionKey = "") {
  const id = normalize(classRecordId);
  if (!id || typeof listener !== "function") return () => {};
  return onSnapshot(
    doc(db, "classes", id),
    (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() || {} : {};
      listener({
        ...sessionStateFromClassData(data, sessionKey),
        classRecordId: id,
        pendingWrites: Boolean(snapshot.metadata?.hasPendingWrites),
      });
    },
    (error) => onError?.(error),
  );
}

export async function readPresenterLiveSession(classRecordId, sessionKey = "") {
  const id = normalize(classRecordId);
  if (!id) return { ok: false, reason: "missing-class-record", state: {} };
  const snapshot = await getDoc(doc(db, "classes", id));
  const data = snapshot.exists() ? snapshot.data() || {} : {};
  return {
    ok: snapshot.exists(),
    state: {
      ...sessionStateFromClassData(data, sessionKey),
      classRecordId: id,
    },
  };
}

export async function publishPresenterLiveSession(classRecordId, patch = {}, sessionKey = "") {
  const id = normalize(classRecordId);
  if (!id) return { ok: false, reason: "missing-class-record" };

  const key = normalize(sessionKey);
  if (key) {
    await updateDoc(doc(db, "classes", id), sessionUpdates(key, patch));
    return { ok: true, sessionKey: key };
  }

  const safePatch = cleanPatch(patch);
  const updates = {};
  Object.entries(safePatch).forEach(([field, value]) => {
    updates[`presenterLiveSession.${field}`] = value;
  });
  updates["presenterLiveSession.updatedAt"] = serverTimestamp();
  updates["presenterLiveSession.updatedAtMs"] = Date.now();
  updates["presenterLiveSession.updatedBy"] = getPresenterDeviceId();
  await updateDoc(doc(db, "classes", id), updates);
  return { ok: true, legacy: true };
}

export async function startPresenterLiveSession(classRecordId, sessionKey, patch = {}) {
  const id = normalize(classRecordId);
  const key = normalize(sessionKey);
  if (!id) return { ok: false, reason: "missing-class-record" };
  if (!key) return { ok: false, reason: "missing-session-key" };

  const classRef = doc(db, "classes", id);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(classRef);
    if (!snapshot.exists()) {
      return { ok: false, reason: "missing-class-record" };
    }

    const data = snapshot.data() || {};
    const existing = sessionStateFromClassData(data, key);
    const existingStart = Number(existing.classStartedAtMs || 0);
    if (existing.sessionKey === key && existingStart > 0) {
      const nowMs = Date.now();
      const activeSessionKey = normalize(data.presenterActiveSessionKey);
      const wasActive = activeSessionKey === key;
      const sessionEnded = existing.classLifecycleStatus === "ended"
        || existing.classStatus === "ended"
        || Number(existing.classEndedAtMs || 0) > 0;
      const activeSession = activeSessionKey && activeSessionKey !== key
        ? sessionStateFromClassData(data, activeSessionKey)
        : {};
      const activeSessionEnded = activeSession.classLifecycleStatus === "ended"
        || activeSession.classStatus === "ended"
        || Number(activeSession.classEndedAtMs || 0) > 0;
      const activeSessionStart = Number(activeSession.classStartedAtMs || 0);
      const blockedByNewerActiveSession = Boolean(
        !wasActive
        && !sessionEnded
        && activeSessionKey
        && activeSessionKey !== key
        && !activeSessionEnded
        && activeSessionStart >= existingStart
      );
      const shouldReactivate = !wasActive && !sessionEnded && !blockedByNewerActiveSession;
      if (shouldReactivate) {
        transaction.update(classRef, {
          presenterActiveSessionKey: key,
          presenterActiveSessionUpdatedAt: serverTimestamp(),
          presenterActiveSessionUpdatedAtMs: nowMs,
        });
      }
      return {
        ok: true,
        created: false,
        reactivated: shouldReactivate,
        stale: blockedByNewerActiveSession,
        blockedBySessionKey: blockedByNewerActiveSession ? activeSessionKey : "",
        sessionKey: key,
        state: {
          ...existing,
          ...(shouldReactivate ? { activeSessionKey: key, isActiveSession: true } : {}),
          classRecordId: id,
        },
      };
    }

    const requestedStart = Number(patch.classStartedAtMs || 0);
    const activeSessionKey = normalize(data.presenterActiveSessionKey);
    if (activeSessionKey && activeSessionKey !== key && requestedStart > 0) {
      const activeSession = sessionStateFromClassData(data, activeSessionKey);
      const activeSessionEnded = activeSession.classLifecycleStatus === "ended"
        || activeSession.classStatus === "ended"
        || Number(activeSession.classEndedAtMs || 0) > 0;
      const activeSessionStart = Number(activeSession.classStartedAtMs || 0);
      if (!activeSessionEnded && activeSessionStart > 0 && activeSessionStart >= requestedStart) {
        return {
          ok: false,
          reason: "newer-active-session",
          activeSessionKey,
          activeSessionStart,
        };
      }
    }

    const nowMs = Date.now();
    const sessionPatch = {
      ...patch,
      classStatus: "active",
      classLifecycleStatus: "running",
      sessionTimingAuthority: normalize(patch.sessionTimingAuthority)
        || (patch.classStartSource === "checkin" ? "attendance" : "presenter"),
    };
    transaction.update(classRef, {
      presenterActiveSessionKey: key,
      presenterActiveSessionUpdatedAt: serverTimestamp(),
      presenterActiveSessionUpdatedAtMs: nowMs,
      ...sessionUpdates(key, sessionPatch),
    });

    return {
      ok: true,
      created: true,
      sessionKey: key,
      state: {
        ...sessionPatch,
        sessionKey: key,
        activeSessionKey: key,
        isActiveSession: true,
        classRecordId: id,
      },
    };
  });
}

export async function endPresenterLiveSession(classRecordId, sessionKey, patch = {}) {
  const id = normalize(classRecordId);
  const key = normalize(sessionKey);
  if (!id) return { ok: false, reason: "missing-class-record" };
  if (!key) return { ok: false, reason: "missing-session-key" };

  const endedAtMs = Number(patch.classEndedAtMs || Date.now());
  await updateDoc(doc(db, "classes", id), {
    presenterLastCompletedSessionKey: key,
    presenterLastCompletedAt: serverTimestamp(),
    presenterLastCompletedAtMs: endedAtMs,
    ...sessionUpdates(key, {
      ...patch,
      classStatus: "ended",
      classLifecycleStatus: "ended",
    }),
  });
  return { ok: true, sessionKey: key };
}

export function isPresenterLiveSessionForToday(state = {}, now = new Date()) {
  return normalize(state.sessionDate) === presenterLocalDateKey(now);
}
