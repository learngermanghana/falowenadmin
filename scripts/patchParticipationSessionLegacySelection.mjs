import fs from "node:fs";

const targetPath = new URL("../functions/classParticipationApi.js", import.meta.url);
const MARKER = "// PARTICIPATION LEGACY SESSION SELECTION HARDENING";

let source = fs.readFileSync(targetPath, "utf8");
const alreadyInstalled = source.includes(MARKER);
if (alreadyInstalled) {
  console.log("Participation legacy session selection hardening is already installed.");
}

const oldBlock = `async function resolveParticipationSessionStorageId(db, payload = {}) {
  const preferredSessionId = lessonSessionId(payload);
  const canonicalClassSessionId = clean(payload.classSessionId);
  if (!canonicalClassSessionId) return preferredSessionId;

  try {
    const preferredSnap = await db.collection(SESSION_COLLECTION).doc(preferredSessionId).get();
    if (preferredSnap.exists) return preferredSessionId;
  } catch {
    // Continue with compatibility lookups.
  }

  try {
    const snap = await db.collection(SESSION_COLLECTION)
      .where("classSessionId", "==", canonicalClassSessionId)
      .limit(4)
      .get();
    const existing = snap.docs.find((docSnap) => clean(docSnap.id) === preferredSessionId) || snap.docs[0];
    if (existing) return clean(existing.id);
  } catch {
    // Fall through to deterministic legacy keys.
  }

  const fallbackIds = [
    stableId(
      payload.classRecordId || payload.classId,
      canonicalClassSessionId,
      payload.sessionDate,
    ),
    stableId(
      payload.classId,
      payload.assignmentId || payload.lessonId,
      payload.requestedSessionDate || payload.sessionDate,
    ),
  ];

  const seen = new Set([preferredSessionId]);
  for (const candidate of fallbackIds) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      const snap = await db.collection(SESSION_COLLECTION).doc(candidate).get();
      if (snap.exists) return candidate;
    } catch {
      // Keep trying the remaining compatibility keys.
    }
  }

  return preferredSessionId;
}`;

const newBlock = `${MARKER}
function participationSessionTimestampMillis(value) {
  if (!value) return 0;
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  const time = date?.getTime?.();
  return Number.isFinite(time) ? time : 0;
}

function participationSessionRevision(value) {
  const revision = Number(value || 0);
  return Number.isFinite(revision) ? revision : 0;
}

async function resolveParticipationSessionStorageId(db, payload = {}) {
  const preferredSessionId = lessonSessionId(payload);
  const canonicalClassSessionId = clean(payload.classSessionId);
  if (!canonicalClassSessionId) return preferredSessionId;

  const exactLegacyIds = [
    stableId(
      payload.classRecordId || payload.classId,
      canonicalClassSessionId,
      payload.sessionDate,
    ),
    stableId(
      payload.classId,
      payload.assignmentId || payload.lessonId,
      payload.requestedSessionDate || payload.sessionDate,
    ),
  ];
  const seen = new Set();

  for (const candidate of [preferredSessionId, ...exactLegacyIds]) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      const snap = await db.collection(SESSION_COLLECTION).doc(candidate).get();
      if (snap.exists) return candidate;
    } catch {
      // Keep trying compatibility candidates before the broad legacy query.
    }
  }

  try {
    const snap = await db.collection(SESSION_COLLECTION)
      .where("classSessionId", "==", canonicalClassSessionId)
      .get();
    const candidates = snap.docs
      .map((docSnap) => ({ id: clean(docSnap.id), ...(docSnap.data() || {}) }))
      .filter((row) => row.id)
      .sort((a, b) => {
        const revisionDelta = participationSessionRevision(b.revision) - participationSessionRevision(a.revision);
        if (revisionDelta) return revisionDelta;

        const updatedDelta = participationSessionTimestampMillis(b.updatedAt || b.createdAt)
          - participationSessionTimestampMillis(a.updatedAt || a.createdAt);
        if (updatedDelta) return updatedDelta;

        const dateDelta = clean(b.sessionDate).localeCompare(clean(a.sessionDate));
        if (dateDelta) return dateDelta;

        return a.id.localeCompare(b.id);
      });
    if (candidates[0]) return candidates[0].id;
  } catch {
    // If compatibility lookup fails, use the stable canonical ID for the next save.
  }

  return preferredSessionId;
}`;

if (!alreadyInstalled) {
  if (!source.includes(oldBlock)) {
    throw new Error("Could not patch deterministic participation legacy-session selection.");
  }

  source = source.replace(oldBlock, newBlock);
  fs.writeFileSync(targetPath, source, "utf8");
  console.log("Participation legacy sessions now prefer exact keys and deterministic newest-state selection.");
}
