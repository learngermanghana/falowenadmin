function normalizeClassMatchKey(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const STUDENT_CLASS_FIELDS = [
  "classId",
  "classRecordId",
  "className",
  "classname",
  "class",
  "classes",
  "classIds",
  "classRecordIds",
  "classNames",
  "enrolledClass",
  "enrolledClasses",
  "group",
  "groups",
  "groupId",
  "groupIds",
  "groupName",
  "groupNames",
  "cohort",
  "cohorts",
  "cohortId",
  "cohortIds",
  "cohortName",
  "cohortNames",
];

const CLASS_RECORD_FIELDS = [
  "id",
  "classId",
  "classRecordId",
  "name",
  "className",
  "slug",
  "aliases",
  "alias",
  "classAliases",
  "classNames",
  "legacyClassIds",
  "legacyClassNames",
];

function collectComparableClassValues(value, seenObjects = new WeakSet()) {
  if (value === null || value === undefined) return [];

  if (["string", "number", "boolean"].includes(typeof value)) {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectComparableClassValues(item, seenObjects));
  }

  if (typeof value === "object") {
    if (seenObjects.has(value)) return [];
    seenObjects.add(value);

    const values = [];
    for (const key of ["id", "classId", "classRecordId", "name", "className", "label", "value", "slug"]) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        values.push(...collectComparableClassValues(value[key], seenObjects));
      }
    }
    return values;
  }

  return [];
}

function studentClassValues(student = {}) {
  return STUDENT_CLASS_FIELDS.flatMap((field) => collectComparableClassValues(student[field]));
}

function canonicalClassValues(classId, classRecord = {}, documentId = "") {
  return [
    classId,
    documentId,
    ...CLASS_RECORD_FIELDS.flatMap((field) => collectComparableClassValues(classRecord[field])),
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
