function normalize(value) {
  return String(value || "").trim();
}

export function belongsToSelectedClass(session = {}, classId = "", aliases = []) {
  const resolvedClassId = normalize(classId);
  if (!resolvedClassId) return false;

  const acceptedIds = new Set([
    resolvedClassId,
    ...(Array.isArray(aliases) ? aliases : []),
  ].map(normalize).filter(Boolean));

  const classRecordId = normalize(session.classRecordId);
  const legacyClassId = normalize(session.classId);

  // classRecordId is the canonical owner when present. A conflicting canonical
  // record must never be rescued merely because classId/className matches a
  // shared cohort label.
  if (classRecordId) return acceptedIds.has(classRecordId);

  // Older sessions may store only the class name or slug in classId. Keep those
  // compatible aliases readable when there is no canonical owner to contradict
  // them. Truly ownerless records also remain readable for legacy classes.
  if (!legacyClassId) return true;
  return acceptedIds.has(legacyClassId);
}
