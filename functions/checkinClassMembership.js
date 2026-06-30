function normalizeClassMatchKey(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function studentClassValues(student = {}) {
  return [
    student.classId,
    student.classRecordId,
    student.className,
    student.classname,
    student.class,
    student.group,
    student.groupId,
    student.groupName,
    student.cohort,
    student.cohortId,
    student.cohortName,
  ];
}

function canonicalClassValues(classId, classRecord = {}, documentId = "") {
  return [
    classId,
    documentId,
    classRecord.id,
    classRecord.classId,
    classRecord.classRecordId,
    classRecord.name,
    classRecord.className,
    classRecord.slug,
  ];
}

function buildCanonicalClassKeys(classId, classRecord = {}, documentId = "") {
  return new Set(
    canonicalClassValues(classId, classRecord, documentId)
      .map(normalizeClassMatchKey)
      .filter(Boolean),
  );
}

function studentMatchesCanonicalClass(student = {}, canonicalKeys = new Set()) {
  if (!(canonicalKeys instanceof Set) || canonicalKeys.size === 0) return false;
  return studentClassValues(student)
    .map(normalizeClassMatchKey)
    .filter(Boolean)
    .some((value) => canonicalKeys.has(value));
}

module.exports = {
  normalizeClassMatchKey,
  buildCanonicalClassKeys,
  studentMatchesCanonicalClass,
};
