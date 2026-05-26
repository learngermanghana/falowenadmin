import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase.js";
import { loadPublishedStudentRows, readPublishedClassName, readPublishedLevel, readPublishedStatus } from "./publishedSheetService.js";
import { resolveWithSheetThenFirestore } from "./fallbackResolvers.js";

const ARCHIVED_STATUS_VALUES = new Set([
  "inactive",
  "archived",
  "ended",
  "complete",
  "completed",
  "finished",
  "closed",
]);

const TRUE_VALUES = new Set([
  "1",
  "true",
  "yes",
  "y",
  "archived",
  "archive",
  "ended",
  "complete",
  "completed",
  "finished",
  "closed",
]);

const FALSE_VALUES = new Set([
  "0",
  "false",
  "no",
  "n",
  "active",
  "ongoing",
  "open",
  "started",
  "running",
  "in progress",
  "in-progress",
]);

const CLASS_STATUS_FIELDS = [
  "classStatus",
  "class_status",
  "courseStatus",
  "course_status",
  "groupStatus",
  "group_status",
  "batchStatus",
  "batch_status",
  "classState",
  "class_state",
  "courseState",
  "course_state",
  "state",
  "status",
];

const CLASS_ARCHIVED_FIELDS = [
  "archived",
  "isArchived",
  "is_archived",
  "archive",
  "classArchived",
  "class_archived",
  "courseArchived",
  "course_archived",
  "groupArchived",
  "group_archived",
  "batchArchived",
  "batch_archived",
  "completed",
  "isCompleted",
  "is_completed",
  "classCompleted",
  "class_completed",
  "courseCompleted",
  "course_completed",
  "ended",
  "isEnded",
  "is_ended",
];

const CLASS_ACTIVE_FIELDS = [
  "active",
  "isActive",
  "is_active",
  "classActive",
  "class_active",
  "courseActive",
  "course_active",
  "groupActive",
  "group_active",
  "batchActive",
  "batch_active",
  "enabled",
  "isEnabled",
  "is_enabled",
];

function normalizeClassId(value) {
  return String(value || "").trim();
}

function normalizeClassLookupKey(value) {
  return normalizeClassId(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeFieldKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function readRecordValue(data = {}, fieldNames = []) {
  const normalizedEntries = new Map(
    Object.entries(data).map(([key, value]) => [normalizeFieldKey(key), value]),
  );

  for (const fieldName of fieldNames) {
    if (Object.prototype.hasOwnProperty.call(data, fieldName)) {
      return data[fieldName];
    }

    const normalizedFieldName = normalizeFieldKey(fieldName);
    if (normalizedEntries.has(normalizedFieldName)) {
      return normalizedEntries.get(normalizedFieldName);
    }
  }

  return "";
}

function parseBooleanLike(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const text = normalizeClassLookupKey(value);
  if (!text) return null;
  if (TRUE_VALUES.has(text)) return true;
  if (FALSE_VALUES.has(text)) return false;
  return null;
}

const CLASS_ID_ALIASES = new Map([
  ["a1 dortmund", "A1 Dortmund Klasse"],
  ["a1 dortmund klasse", "A1 Dortmund Klasse"],
  ["a1 berlin", "A1 Berlin Klasse"],
  ["a1 berlin klasse", "A1 Berlin Klasse"],
  ["a1 hamburg", "A1 Hamburg Klasse"],
  ["a1 hamburg klasse", "A1 Hamburg Klasse"],
  ["a1 leipzig", "A1 Leipzig Klasse"],
  ["a1 leipzig klasse", "A1 Leipzig Klasse"],
  ["a1 leipzip", "A1 Leipzig Klasse"],
  ["a1 leipzip klasse", "A1 Leipzig Klasse"],
  ["a2 stuttgart", "A2 Stuttgart Klasse"],
  ["a2 stuttgart klasse", "A2 Stuttgart Klasse"],
  ["a2 freiburg", "A2 Freiburg Klasse"],
  ["a2 freiburg klasse", "A2 Freiburg Klasse"],
]);

function normalizeToCanonicalClassId(value) {
  const normalized = normalizeClassId(value);
  if (!normalized) return "";

  return CLASS_ID_ALIASES.get(normalizeClassLookupKey(normalized)) || normalized;
}

function resolveClassKey(data = {}) {
  return normalizeToCanonicalClassId(data.classId || data.className || data.group || data.groupId || data.groupName || data.name || data.id);
}

function extractClassMetadata(data = {}) {
  const rawStatus = readRecordValue(data, CLASS_STATUS_FIELDS) || readPublishedStatus(data);
  const status = normalizeClassLookupKey(rawStatus);
  const archived = parseBooleanLike(readRecordValue(data, CLASS_ARCHIVED_FIELDS));
  const active = parseBooleanLike(readRecordValue(data, CLASS_ACTIVE_FIELDS));

  const metadata = {};

  if (status) {
    metadata.status = status;
  }

  if (archived !== null) {
    metadata.archived = archived;
  }

  if (active !== null) {
    metadata.active = active;
  }

  return metadata;
}

function mergeClassMetadata(existing = {}, metadata = {}) {
  const next = { ...existing };

  if (metadata.status) {
    const status = normalizeClassLookupKey(metadata.status);
    if (ARCHIVED_STATUS_VALUES.has(status) || !next.status) {
      next.status = status;
    }
  }

  if (metadata.archived === true) {
    next.archived = true;
  } else if (metadata.archived === false && typeof next.archived === "undefined") {
    next.archived = false;
  }

  if (metadata.active === false) {
    next.active = false;
  } else if (metadata.active === true && typeof next.active === "undefined") {
    next.active = true;
  }

  return next;
}

function resolvePublishedClassIdentifier(row) {
  const className = normalizeToCanonicalClassId(readPublishedClassName(row));
  if (className) return className;
  return normalizeToCanonicalClassId(readPublishedLevel(row));
}

export async function listClassesFromPublishedSheetWithLoader(loadRows = loadPublishedStudentRows) {
  const rows = await loadRows();
  const classesMap = new Map();

  rows.forEach((row) => {
    const classIdentifier = resolvePublishedClassIdentifier(row);
    if (!classIdentifier) return;

    const existing = classesMap.get(classIdentifier) || {
      classId: classIdentifier,
      name: classIdentifier,
    };

    classesMap.set(classIdentifier, mergeClassMetadata(existing, extractClassMetadata(row)));
  });

  return [...classesMap.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function listClassesWithDeps(
  {
    listClassesFromPublishedSheet = listClassesFromPublishedSheetWithLoader,
    collectionFn = collection,
    getDocsFn = getDocs,
    orderByFn = orderBy,
    queryFn = query,
    dbInstance = db,
  } = {},
) {
  return resolveWithSheetThenFirestore({
    loadFromSheet: () => listClassesFromPublishedSheet(),
    loadFromFirestore: async () => {
      const classesCollection = collectionFn(dbInstance, "classes");
      const classesSnap = await getDocsFn(queryFn(classesCollection, orderByFn("name", "asc")));

      if (!classesSnap.empty) {
        return classesSnap.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .map((c) => {
            const classId = resolveClassKey(c);
            const name = normalizeToCanonicalClassId(c.name || c.className || c.classId || c.id);
            return mergeClassMetadata(
              {
                ...c,
                classId,
                name,
              },
              extractClassMetadata(c),
            );
          })
          .filter((c) => c.classId);
      }

      const studentsSnap = await getDocsFn(collectionFn(dbInstance, "students"));
      const classesMap = new Map();

      studentsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const classId = resolveClassKey(data);
        if (!classId) return;
        const existing = classesMap.get(classId) || {
          classId,
          name: normalizeToCanonicalClassId(data.className || data.groupName || data.group || classId),
        };

        classesMap.set(classId, mergeClassMetadata(existing, extractClassMetadata(data)));
      });

      return [...classesMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

export async function listClasses() {
  return listClassesWithDeps();
}
