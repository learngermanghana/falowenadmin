function normalize(value) {
  return String(value || "").trim();
}

function safePart(value, fallback) {
  const cleaned = normalize(value)
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return cleaned || fallback;
}

function hashKey(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function presenterSessionKey({
  sessionDate = "",
  sessionId = "",
  assignmentId = "",
} = {}) {
  const rawDate = normalize(sessionDate);
  const rawSession = normalize(sessionId);
  const rawAssignment = normalize(assignmentId);
  const raw = [rawDate, rawSession, rawAssignment].join("|");
  return [
    safePart(rawDate, "no-date"),
    safePart(rawSession, "session"),
    safePart(rawAssignment, "lesson"),
    hashKey(raw),
  ].join("__");
}
