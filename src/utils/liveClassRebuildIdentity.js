export function canonicalRebuildClassPayload(classId, payload = {}) {
  const canonicalId = String(classId || payload.id || payload.classId || "").trim();
  if (!canonicalId) throw new Error("classId is required");

  return {
    ...payload,
    id: canonicalId,
    classId: canonicalId,
    classRecordId: canonicalId,
  };
}
