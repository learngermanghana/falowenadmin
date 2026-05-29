import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";

export async function loadAnswerKeyRegistryPreview(maxRows = 120) {
  const snap = await getDocs(collection(db, "answerKeyRegistry"));
  const rows = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    rows.push({
      id: docSnap.id,
      assignmentKey: data.assignmentKey || docSnap.id,
      title: data.title || "",
      level: data.level || "",
      totalAnswers: data.totalAnswers ?? "",
      storagePath: data.storagePath || data.activeStoragePath || "",
      syncedAt: data.syncedAt || data.updatedAt || data.importedAt || "",
      source: data.source || "",
    });
  });

  return rows
    .sort((a, b) => String(a.assignmentKey || a.id).localeCompare(String(b.assignmentKey || b.id), undefined, { numeric: true }))
    .slice(0, maxRows);
}
