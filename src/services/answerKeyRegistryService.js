import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";

function formatDateValue(value) {
  if (!value) return "";

  try {
    if (typeof value.toDate === "function") {
      return value.toDate().toLocaleString();
    }

    if (typeof value.seconds === "number") {
      return new Date(value.seconds * 1000).toLocaleString();
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
    }
  } catch {
    return "";
  }

  return String(value);
}

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
      syncedAt: formatDateValue(data.syncedAt || data.updatedAt || data.importedAt || ""),
      source: data.source || "",
    });
  });

  return rows
    .sort((a, b) => String(a.assignmentKey || a.id).localeCompare(String(b.assignmentKey || b.id), undefined, { numeric: true }))
    .slice(0, maxRows);
}
