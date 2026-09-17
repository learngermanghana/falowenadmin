import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase.js";
import {
  assignmentVersionId,
  normalizeAssignmentId,
  toPublicAssignmentRecord,
  validateAssignmentRegistryDraft,
} from "../utils/assignmentRegistry.js";

export const ASSIGNMENT_REGISTRY_COLLECTIONS = Object.freeze({
  PRIVATE_CURRENT: "assignmentRegistry",
  PRIVATE_VERSIONS: "assignmentVersions",
  PUBLIC_CURRENT: "assignmentPublicRegistry",
  PUBLIC_VERSIONS: "assignmentPublicVersions",
});

const entryCache = new Map();
const CACHE_MS = 5 * 60 * 1000;

function cacheEntry(assignmentId, value) {
  entryCache.set(normalizeAssignmentId(assignmentId), { value, expiresAt: Date.now() + CACHE_MS });
}

export function clearAssignmentRegistryCache(assignmentId = "") {
  const key = normalizeAssignmentId(assignmentId);
  if (key) entryCache.delete(key);
  else entryCache.clear();
}

export async function loadPublishedAssignmentRegistryEntry(assignmentId, { bypassCache = false } = {}) {
  const key = normalizeAssignmentId(assignmentId);
  if (!key) return null;
  const cached = entryCache.get(key);
  if (!bypassCache && cached?.expiresAt > Date.now()) return cached.value;

  const snap = await getDoc(doc(db, ASSIGNMENT_REGISTRY_COLLECTIONS.PRIVATE_CURRENT, key));
  const value = snap.exists() ? { id: snap.id, ...snap.data() } : null;
  cacheEntry(key, value);
  return value;
}

export async function loadAssignmentRegistryPreview() {
  const snap = await getDocs(collection(db, ASSIGNMENT_REGISTRY_COLLECTIONS.PRIVATE_CURRENT));
  const rows = [];
  snap.forEach((docSnap) => rows.push({ id: docSnap.id, ...docSnap.data() }));
  return rows.sort((a, b) => String(a.assignmentId || a.id).localeCompare(String(b.assignmentId || b.id), undefined, { numeric: true }));
}

function publishedBy() {
  return auth?.currentUser?.email || auth?.currentUser?.uid || "falowen-admin";
}

export async function publishAssignmentRegistryDraft(draft = {}) {
  const errors = validateAssignmentRegistryDraft(draft);
  if (errors.length) {
    const error = new Error(errors.join(" "));
    error.code = "ASSIGNMENT_REGISTRY_VALIDATION";
    error.validationErrors = errors;
    throw error;
  }

  const assignmentId = normalizeAssignmentId(draft.assignmentId);
  const currentPrivateRef = doc(db, ASSIGNMENT_REGISTRY_COLLECTIONS.PRIVATE_CURRENT, assignmentId);
  const currentPublicRef = doc(db, ASSIGNMENT_REGISTRY_COLLECTIONS.PUBLIC_CURRENT, assignmentId);

  const result = await runTransaction(db, async (transaction) => {
    const currentSnap = await transaction.get(currentPrivateRef);
    const currentVersion = Number(currentSnap.exists() ? currentSnap.data()?.version : 0) || 0;
    const version = currentVersion + 1;
    const versionId = assignmentVersionId(assignmentId, version);
    const privateVersionRef = doc(db, ASSIGNMENT_REGISTRY_COLLECTIONS.PRIVATE_VERSIONS, versionId);
    const publicVersionRef = doc(db, ASSIGNMENT_REGISTRY_COLLECTIONS.PUBLIC_VERSIONS, versionId);
    const now = serverTimestamp();

    const privateRecord = {
      ...draft,
      assignmentId,
      version,
      status: "published",
      publishedAt: now,
      updatedAt: now,
      publishedBy: publishedBy(),
    };
    const publicRecord = {
      ...toPublicAssignmentRecord({ ...privateRecord, publishedAt: null }),
      version,
      publishedAt: now,
      updatedAt: now,
    };

    transaction.set(currentPrivateRef, privateRecord);
    transaction.set(privateVersionRef, privateRecord);
    transaction.set(currentPublicRef, publicRecord);
    transaction.set(publicVersionRef, publicRecord);

    return { assignmentId, version, versionId };
  });

  clearAssignmentRegistryCache(assignmentId);
  return result;
}
