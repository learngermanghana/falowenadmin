// Apply the same legacy ownership rules as the Live Classes dashboard while
// requiring a positive owner match for email delivery. classRecordId wins over
// classId so a foreign canonical owner cannot be rescued by a shared name.
const text = (value) => String(value || "").trim();

export function sessionBelongsToVerifiedClass(session = {}, klass = {}, classId = "") {
  const canonicalId = text(classId);
  if (!canonicalId) return false;

  const aliases = new Set([
    canonicalId,
    klass.classId,
    klass.classRecordId,
    klass.name,
    klass.className,
    klass.slug,
  ].map(text).filter(Boolean));

  const canonicalOwner = text(session.classRecordId);
  if (canonicalOwner) return aliases.has(canonicalOwner);

  // Legacy records may have stored the class name or slug as classId.
  // Unlike read-only timetable compatibility, invitations require an owner.
  const legacyOwner = text(session.classId);
  return Boolean(legacyOwner && aliases.has(legacyOwner));
}
