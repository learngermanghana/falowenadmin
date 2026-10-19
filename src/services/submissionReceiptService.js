import { collection, collectionGroup, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase.js";
import { lookupSubmissionReceipts } from "../utils/submissionReceiptLookup.js";

const record = snapshot => ({ ...snapshot.data(), id: snapshot.id, path: snapshot.ref.path });

export function fetchSubmissionReceipts(options) {
  const groupFallbacks = new Map();
  return lookupSubmissionReceipts({ ...options, read: async ({ kind, path, field, value }) => {
    if (kind === "document") {
      const snapshot = await getDoc(doc(db, path));
      return snapshot.exists() ? [record(snapshot)] : [];
    }
    const source = kind === "group" ? collectionGroup(db, path) : collection(db, path);
    // Do not truncate a student's history before filtering assignment aliases.
    try {
      const snapshot = await getDocs(field ? query(source, where(field, "==", value)) : source);
      return snapshot.docs.map(record);
    } catch (error) {
      // Older deployments have no group-scoped single-field indexes. Match the
      // Marking Hub's supported unfiltered group read, once per group per search.
      // Permission/network failures still reject rather than report zero receipts.
      if (kind !== "group" || !["failed-precondition", "firestore/failed-precondition"].includes(error?.code)) throw error;
      if (!groupFallbacks.has(path)) {
        groupFallbacks.set(path, getDocs(source).then(snapshot => snapshot.docs.map(record)));
      }
      return (await groupFallbacks.get(path)).filter(row => row[field] === value);
    }
  } });
}
