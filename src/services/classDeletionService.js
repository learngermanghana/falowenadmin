import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";

const MAX_BATCH_OPERATIONS = 450;

async function deleteReferencesInChunks(references) {
  for (let index = 0; index < references.length; index += MAX_BATCH_OPERATIONS) {
    const batch = writeBatch(db);
    references
      .slice(index, index + MAX_BATCH_OPERATIONS)
      .forEach((reference) => batch.delete(reference));
    await batch.commit();
  }
}

async function loadSelectedClass(classId) {
  const canonicalId = String(classId || "").trim();
  if (!canonicalId) throw new Error("Select a class before deleting it.");

  const classRef = doc(db, "classes", canonicalId);
  const snapshot = await getDoc(classRef);
  if (!snapshot.exists()) throw new Error("The selected class no longer exists in Firestore.");

  return {
    classRef,
    klass: {
      ...snapshot.data(),
      id: snapshot.id,
    },
  };
}

export async function deleteClassCohort(classId, { adminId = "admin" } = {}) {
  const { classRef, klass } = await loadSelectedClass(classId);
  const canonicalId = classRef.id;

  const sessionsSnapshot = await getDocs(
    query(collection(db, "classSessions"), where("classId", "==", canonicalId)),
  );

  const referencesToDelete = [];
  sessionsSnapshot.docs.forEach((sessionSnapshot) => {
    referencesToDelete.push(sessionSnapshot.ref);
    referencesToDelete.push(
      doc(db, "attendance", canonicalId, "sessions", sessionSnapshot.id),
    );
  });

  referencesToDelete.push(doc(db, "attendance", canonicalId));
  referencesToDelete.push(doc(db, "calendarFeeds", canonicalId));
  referencesToDelete.push(classRef);

  await deleteReferencesInChunks(referencesToDelete);

  const verification = await getDoc(classRef);
  if (verification.exists()) {
    throw new Error(`Firestore did not delete classes/${canonicalId}. Please try again.`);
  }

  await setDoc(doc(collection(db, "auditLogs")), {
    type: "classCohort.deleted",
    classId: canonicalId,
    className: String(klass.name || ""),
    sessionCount: sessionsSnapshot.size,
    actorId: adminId,
    reason: "Administrator permanently deleted the selected class from Live Classes.",
    verifiedDeleted: true,
    createdAt: serverTimestamp(),
  });

  return {
    classId: canonicalId,
    deletedSessionCount: sessionsSnapshot.size,
    verifiedDeleted: true,
  };
}
