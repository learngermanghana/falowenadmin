function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function classCanonicalIds(klass = {}) {
  return new Set([klass.id, klass.classId, klass.classRecordId].map(normalize).filter(Boolean));
}

function classDisplayNames(klass = {}) {
  return new Set([klass.name, klass.className].map(normalize).filter(Boolean));
}

function sessionCanonicalIds(session = {}) {
  return [session.classRecordId, session.classId].map(normalize).filter(Boolean);
}

function acceptClassNameSessionMatch(session = {}, klass = {}) {
  const canonicalClassIds = classCanonicalIds(klass);
  const displayNames = classDisplayNames(klass);
  const canonicalSessionIds = sessionCanonicalIds(session);

  if (!canonicalSessionIds.length) return true;
  if (canonicalSessionIds.some((value) => canonicalClassIds.has(value))) return true;

  // Older session writers sometimes stored the display name in classId.
  // Treat that as a legacy name-only record, not as a conflicting canonical ID.
  const legacyNameOnly = !normalize(session.classRecordId)
    && canonicalSessionIds.every((value) => displayNames.has(value));
  return legacyNameOnly;
}

module.exports = {
  acceptClassNameSessionMatch,
  _test: {
    classCanonicalIds,
    classDisplayNames,
    sessionCanonicalIds,
  },
};
