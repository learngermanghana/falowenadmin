import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { loadPublishedStudentRows, readPublishedClassName, readPublishedLevel } from "./publishedSheetService.js";
import { resolveWithSheetThenFirestore } from "./fallbackResolvers.js";

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

function normalizeClassArchiveMetadata(data = {}) {
  const rawStatus = String(data.status || "").trim().toLowerCase();
  const archived = rawStatus === "archived" || data.archived === true || data.isArchived === true;
  const status = archived ? "archived" : rawStatus || (data.active === false ? "inactive" : "active");
  return {
    archived,
    isArchived: archived,
    active: !archived && !["graduated", "inactive"].includes(status),
    status,
  };
}

function resolveClassKey(data = {}) {
  return normalizeToCanonicalClassId(data.classId || data.className || data.group || data.groupId || data.groupName || data.name || data.id);
}

function dateToMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  const text = String(value).trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000Z`)
    : new Date(text);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function statusPriority(status) {
  return {
    active: 6,
    ongoing: 6,
    upcoming: 5,
    draft: 3,
    graduated: 2,
    inactive: 1,
    archived: 0,
  }[String(status || "").toLowerCase()] ?? 1;
}

function normalizeFirestoreClass(docSnap) {
  const data = docSnap.data() || {};
  const classId = resolveClassKey({ id: docSnap.id, ...data });
  if (!classId) return null;

  const archiveMetadata = normalizeClassArchiveMetadata(data);
  const levelId = String(data.levelId || data.level || data.courseLevel || data.languageLevel || "").toUpperCase();

  return {
    id: docSnap.id,
    classRecordId: docSnap.id,
    classId,
    name: normalizeToCanonicalClassId(data.name || data.className || data.classId || classId),
    levelId,
    level: data.level || levelId,
    courseLevel: data.courseLevel || levelId,
    languageLevel: data.languageLevel || levelId,
    startDate: data.startDate || "",
    endDate: data.endDate || "",
    startsAt: data.startsAt || "",
    timezone: data.timezone || "Africa/Accra",
    scheduleRules: Array.isArray(data.scheduleRules) ? data.scheduleRules : [],
    generatedSessionCount: Number(data.generatedSessionCount || 0),
    registrationOpen: data.registrationOpen,
    publicVisible: data.publicVisible,
    registrationLink: data.registrationLink || data.classUrl || data.link || "",
    classUrl: data.classUrl || "",
    link: data.link || data.classUrl || "",
    price: data.price || "",
    fee: data.fee || "",
    tuition: data.tuition || "",
    currency: data.currency || "",
    ...archiveMetadata,
  };
}

function choosePreferredClassRecord(current, candidate) {
  if (!current) return candidate;
  if (current.archived !== candidate.archived) return candidate.archived ? current : candidate;

  const priorityDifference = statusPriority(candidate.status) - statusPriority(current.status);
  if (priorityDifference !== 0) return priorityDifference > 0 ? candidate : current;

  const candidateStart = dateToMillis(candidate.startDate);
  const currentStart = dateToMillis(current.startDate);
  if (candidateStart !== currentStart) return candidateStart > currentStart ? candidate : current;

  return candidate;
}

async function loadFirestoreClassMetadata({
  collectionFn,
  getDocsFn,
  orderByFn,
  queryFn,
  dbInstance,
}) {
  const classesCollection = collectionFn(dbInstance, "classes");
  const classesSnap = await getDocsFn(queryFn(classesCollection, orderByFn("name", "asc")));
  const metadataByClassId = new Map();

  classesSnap.forEach((docSnap) => {
    const candidate = normalizeFirestoreClass(docSnap);
    if (!candidate) return;

    const lookupValues = [candidate.classId, candidate.name]
      .map(normalizeToCanonicalClassId)
      .filter(Boolean);

    lookupValues.forEach((lookupValue) => {
      const current = metadataByClassId.get(lookupValue);
      metadataByClassId.set(lookupValue, choosePreferredClassRecord(current, candidate));
    });
  });

  return metadataByClassId;
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
    loadFromSheet: async () => {
      const [sheetClasses, firestoreMetadata] = await Promise.all([
        listClassesFromPublishedSheet(),
        loadFirestoreClassMetadata({ collectionFn, getDocsFn, orderByFn, queryFn, dbInstance }),
      ]);

      const mergedByClassId = new Map();

      sheetClasses.forEach((klass) => {
        const classId = normalizeToCanonicalClassId(klass.classId || klass.name);
        if (!classId) return;

        const metadata = firestoreMetadata.get(classId) || {};
        mergedByClassId.set(classId, {
          ...klass,
          ...metadata,
          classId,
          name: metadata.name || normalizeToCanonicalClassId(klass.name || classId),
        });
      });

      // Include newly-created Firestore classes even before students appear in
      // the published student sheet. This keeps the Communication page's
      // "Promote upcoming class" dropdown from hiding new A2/A2.2 cohorts.
      firestoreMetadata.forEach((metadata) => {
        const classId = normalizeToCanonicalClassId(metadata.classId || metadata.name);
        if (!classId || mergedByClassId.has(classId)) return;

        mergedByClassId.set(classId, {
          ...metadata,
          classId,
          name: metadata.name || classId,
        });
      });

      return [...mergedByClassId.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
    loadFromFirestore: async () => {
      const classesCollection = collectionFn(dbInstance, "classes");
      const classesSnap = await getDocsFn(queryFn(classesCollection, orderByFn("name", "asc")));

      if (!classesSnap.empty) {
        const preferredByClassId = new Map();
        classesSnap.docs.forEach((docSnap) => {
          const candidate = normalizeFirestoreClass(docSnap);
          if (!candidate) return;
          preferredByClassId.set(
            candidate.classId,
            choosePreferredClassRecord(preferredByClassId.get(candidate.classId), candidate),
          );
        });
        return [...preferredByClassId.values()].sort((a, b) => a.name.localeCompare(b.name));
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

export async function listClasses() {
  return listClassesWithDeps();
}

export async function setClassArchived(classId, archived, classRecordId = "") {
  const normalizedClassId = normalizeToCanonicalClassId(classId);
  if (!normalizedClassId) throw new Error("Missing class id");

  const targetRecordId = normalizeClassId(classRecordId) || normalizedClassId;
  const identityPatch = targetRecordId === normalizedClassId
    ? { classId: normalizedClassId, name: normalizedClassId }
    : {};

  await setDoc(
    doc(db, "classes", targetRecordId),
    {
      ...identityPatch,
      archived,
      isArchived: archived,
      active: !archived,
      status: archived ? "archived" : "active",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
