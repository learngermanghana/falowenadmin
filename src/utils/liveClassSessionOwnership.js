function normalize(value) {
  return String(value || "").trim();
}

export function belongsToSelectedClass(session = {}, classId = "") {
  const resolvedClassId = normalize(classId);
  if (!resolvedClassId) return false;

  const owners = [...new Set([
    session.classId,
    session.classRecordId,
  ].map(normalize).filter(Boolean))];

  // Legacy sessions may have no explicit owner IDs and are still readable for
  // compatibility. But once an owner ID is present, an explicitly foreign
  // same-name cohort must never enter another class's dashboard/session view.
  return !owners.length || owners.includes(resolvedClassId);
}
