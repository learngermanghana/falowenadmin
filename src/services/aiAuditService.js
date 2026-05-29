import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase.js";

function readTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function loadAIMarkingAudit() {
  const snap = await getDocs(query(collection(db, "aiMarkingAudit")));
  const rows = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    rows.push({
      id: docSnap.id,
      ...data,
      createdAtDate: readTimestamp(data.createdAt),
      updatedAtDate: readTimestamp(data.updatedAt),
    });
  });

  return rows.sort((a, b) => (b.createdAtDate?.getTime() || 0) - (a.createdAtDate?.getTime() || 0));
}
