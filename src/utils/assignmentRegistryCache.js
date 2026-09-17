import { normalizeAssignmentId } from "./assignmentRegistry.js";

const registryCache = new Map();
const DEFAULT_CACHE_MS = 5 * 60 * 1000;

export function setCachedAssignmentRegistryEntry(assignmentId, value, ttlMs = DEFAULT_CACHE_MS) {
  const key = normalizeAssignmentId(assignmentId);
  if (!key) return;
  registryCache.set(key, { value, expiresAt: Date.now() + Math.max(1000, Number(ttlMs) || DEFAULT_CACHE_MS) });
}

export function getCachedAssignmentRegistryEntry(assignmentId) {
  const key = normalizeAssignmentId(assignmentId);
  if (!key) return null;
  const cached = registryCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    registryCache.delete(key);
    return null;
  }
  return cached.value || null;
}

export function clearCachedAssignmentRegistryEntry(assignmentId = "") {
  const key = normalizeAssignmentId(assignmentId);
  if (key) registryCache.delete(key);
  else registryCache.clear();
}

export function cacheAssignmentRegistryRows(rows = [], ttlMs = DEFAULT_CACHE_MS) {
  rows.forEach((row) => setCachedAssignmentRegistryEntry(row?.assignmentId || row?.id, row, ttlMs));
  return rows;
}
