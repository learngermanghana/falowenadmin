import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export const PRESENTER_LAST_CLASS_KEY = "falowen:presenter:last-class";
export const PRESENTER_LAST_CLASS_RECORD_KEY = "falowen:presenter:last-class-record";
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
  if (typeof window === "undefined") return { classId: "", classRecordId: "" };
  return {
    classId: normalize(safeStorageGet(window.localStorage, PRESENTER_LAST_CLASS_KEY)),
    classRecordId: normalize(safeStorageGet(window.localStorage, PRESENTER_LAST_CLASS_RECORD_KEY)),
  };
}

export function setPresenterClassContext({ classId = "", classRecordId = "" } = {}) {
  const next = {
    classId: normalize(classId),
    classRecordId: normalize(classRecordId),
  };
  if (typeof window === "undefined") return next;
  safeStorageSet(window.localStorage, PRESENTER_LAST_CLASS_KEY, next.classId);
  safeStorageSet(window.localStorage, PRESENTER_LAST_CLASS_RECORD_KEY, next.classRecordId);
  window.dispatchEvent(new CustomEvent(PRESENTER_CLASS_CONTEXT_EVENT, { detail: next }));
  return next;
}

export function subscribePresenterClassContext(listener) {
  if (typeof window === "undefined" || typeof listener !== "function") return () => {};
  const notify = () => listener(getPresenterClassContext());
  const onCustom = (event) => listener(event?.detail || getPresenterClassContext());
  const onStorage = (event) => {
    if (![PRESENTER_LAST_CLASS_KEY, PRESENTER_LAST_CLASS_RECORD_KEY].includes(event?.key)) return;
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

export function subscribePresenterLiveSession(classRecordId, listener, onError) {
  const id = normalize(classRecordId);
  if (!id || typeof listener !== "function") return () => {};
  return onSnapshot(
    doc(db, "classes", id),
    (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() || {} : {};
      const live = data.presenterLiveSession && typeof data.presenterLiveSession === "object"
        ? data.presenterLiveSession
        : {};
      listener({
        ...live,
        classRecordId: id,
        pendingWrites: Boolean(snapshot.metadata?.hasPendingWrites),
      });
    },
    (error) => onError?.(error),
  );
}

function cleanPatch(patch = {}) {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  );
}

export async function publishPresenterLiveSession(classRecordId, patch = {}) {
  const id = normalize(classRecordId);
  if (!id) return { ok: false, reason: "missing-class-record" };
  const safePatch = cleanPatch(patch);
  const updates = {};
  Object.entries(safePatch).forEach(([key, value]) => {
    updates[`presenterLiveSession.${key}`] = value;
  });
  updates["presenterLiveSession.updatedAt"] = serverTimestamp();
  updates["presenterLiveSession.updatedAtMs"] = Date.now();
  updates["presenterLiveSession.updatedBy"] = getPresenterDeviceId();
  await updateDoc(doc(db, "classes", id), updates);
  return { ok: true };
}

export function isPresenterLiveSessionForToday(state = {}, now = new Date()) {
  return normalize(state.sessionDate) === presenterLocalDateKey(now);
}
