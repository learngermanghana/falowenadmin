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
  validateAssignmentRegistryDraft,
} from "../utils/assignmentRegistry.js";
import {
  cacheAssignmentRegistryRows,
  clearCachedAssignmentRegistryEntry,
  getCachedAssignmentRegistryEntry,
  setCachedAssignmentRegistryEntry,
} from "../utils/assignmentRegistryCache.js";

// Phase 1 deliberately reuses the existing admin-only answerKeyRegistry collection.
// This avoids a new Vercel API route and avoids requiring a Firestore-rules deployment
// before Falowen Admin can use the canonical writing-task registry. The student-safe
// public projection is added only when falowenexamtrainer is connected in phase 2.
export const ASSIGNMENT_REGISTRY_HOST_COLLECTION = "answerKeyRegistry";
const CURRENT_FIELD = "assignmentRegistry";
const VERSIONS_FIELD = "assignmentRegistryVersions";

export function clearAssignmentRegistryCache(assignmentId = "") {
  clearCachedAssignmentRegistryEntry(assignmentId);
}

function extractRegistryRecord(docSnap) {
  if (!docSnap?.exists?.()) return null;
  const host = docSnap.data() || {};
  const record = host[CURRENT_FIELD];
  if (!record || typeof record !== "object") return null;
  return { id: docSnap.id, ...record };
}

export async function loadPublishedAssignmentRegistryEntry(assignmentId, { bypassCache = false } = {}) {
  const key = normalizeAssignmentId(assignmentId);
  if (!key) return null;
  if (!bypassCache) {
    const cached = getCachedAssignmentRegistryEntry(key);
    if (cached) return cached;
  }

  const snap = await getDoc(doc(db, ASSIGNMENT_REGISTRY_HOST_COLLECTION, key));
  const value = extractRegistryRecord(snap);
  if (value) setCachedAssignmentRegistryEntry(key, value);
  return value;
}

export async function loadAssignmentRegistryPreview() {
  const snap = await getDocs(collection(db, ASSIGNMENT_REGISTRY_HOST_COLLECTION));
  const rows = [];
  snap.forEach((docSnap) => {
    const row = extractRegistryRecord(docSnap);
    if (row) rows.push(row);
  });
  rows.sort((a, b) => String(a.assignmentId || a.id).localeCompare(String(b.assignmentId || b.id), undefined, { numeric: true }));
  return cacheAssignmentRegistryRows(rows);
}

export async function warmAssignmentRegistryCache() {
  return loadAssignmentRegistryPreview();
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
  const hostRef = doc(db, ASSIGNMENT_REGISTRY_HOST_COLLECTION, assignmentId);

  const result = await runTransaction(db, async (transaction) => {
    const hostSnap = await transaction.get(hostRef);
    const host = hostSnap.exists() ? hostSnap.data() || {} : {};
    const current = host[CURRENT_FIELD] || null;
    const currentVersion = Number(current?.version || 0) || 0;
    const version = currentVersion + 1;
    const versionId = assignmentVersionId(assignmentId, version);
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

    const existingVersions = host[VERSIONS_FIELD] && typeof host[VERSIONS_FIELD] === "object"
      ? host[VERSIONS_FIELD]
      : {};

    transaction.set(hostRef, {
      assignmentKey: host.assignmentKey || assignmentId,
      level: host.level || draft.level || "",
      [CURRENT_FIELD]: privateRecord,
      [VERSIONS_FIELD]: {
        ...existingVersions,
        [versionId]: privateRecord,
      },
      assignmentRegistryUpdatedAt: now,
    }, { merge: true });

    return { assignmentId, version, versionId, privateRecord };
  });

  setCachedAssignmentRegistryEntry(assignmentId, result.privateRecord);
  return { assignmentId: result.assignmentId, version: result.version, versionId: result.versionId };
}
