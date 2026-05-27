import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { loadPublishedStudentRows, readPublishedClassName, readPublishedLevel } from "./publishedSheetService.js";
import { resolveWithSheetThenFirestore } from "./fallbackResolvers.js";

const CLASS_COMPLETION_COLLECTION = "classCompletionStatuses";

function normalizeClassId(value) {
  return String(value || "").trim();
}

function normalizeClassLookupKey(value) {
  return normalizeClassId(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
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

function completionDocIdFor(classId) {
  return encodeURIComponent(normalizeToCanonicalClassId(classId));
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveClassKey(data = {}) {
  return normalizeToCanonicalClassId(data.classId || data.className || data.group || data.groupId || data.groupName || data.name || data.id);
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

    if (!classesMap.has(classIdentifier)) {
      classesMap.set(classIdentifier, {
        classId: classIdentifier,
        name: classIdentifier,
      });
    }
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
          .map((c) => ({
            classId: resolveClassKey(c),
            name: normalizeToCanonicalClassId(c.name || c.className || c.classId || c.id),
          }))
          .filter((c) => c.classId);
      }

      const studentsSnap = await getDocsFn(collectionFn(dbInstance, "students"));
      const classesMap = new Map();

      studentsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const classId = resolveClassKey(data);
        if (!classId) return;
        if (!classesMap.has(classId)) {
          classesMap.set(classId, {
            classId,
            name: normalizeToCanonicalClassId(data.className || data.groupName || data.group || classId),
          });
        }
      });

      return [...classesMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

export async function listClassCompletionStatusesWithFirestore(
  firestore = { collection, getDocs, db },
) {
  const snap = await firestore.getDocs(firestore.collection(firestore.db, CLASS_COMPLETION_COLLECTION));
  const statusMap = {};

  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const classId = normalizeToCanonicalClassId(data.classId || safeDecodeURIComponent(docSnap.id));
    if (!classId) return;

    statusMap[classId] = {
      completed: Boolean(data.completed),
      completedAt: data.completedAt || null,
      reopenedAt: data.reopenedAt || null,
      updatedAt: data.updatedAt || null,
    };
  });

  return statusMap;
}

export async function setClassCompletedStatusWithFirestore(
  classId,
  completed,
  firestore = { doc, setDoc, serverTimestamp, db },
) {
  const safeClassId = normalizeToCanonicalClassId(classId);
  if (!safeClassId) {
    throw new Error("Class ID is required");
  }

  const payload = {
    classId: safeClassId,
    completed: Boolean(completed),
    updatedAt: firestore.serverTimestamp(),
  };

  if (completed) {
    payload.completedAt = firestore.serverTimestamp();
  } else {
    payload.reopenedAt = firestore.serverTimestamp();
  }

  await firestore.setDoc(
    firestore.doc(firestore.db, CLASS_COMPLETION_COLLECTION, completionDocIdFor(safeClassId)),
    payload,
    { merge: true },
  );
}

export async function listClasses() {
  return listClassesWithDeps();
}

export async function listClassCompletionStatuses() {
  return listClassCompletionStatusesWithFirestore();
}

export async function setClassCompletedStatus(classId, completed) {
  return setClassCompletedStatusWithFirestore(classId, completed);
}
