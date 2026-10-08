import { auth } from "../firebase.js";
import { mergePublishedMarkingContract } from "../utils/publishedMarkingContract.js";

// The learner application is the authoritative publisher of new coursebook tasks.
// The API is staff-only: never move answer keys to a public projection.
export const LEARNER_MARKING_CONTRACT_URL =
  import.meta.env?.VITE_LEARNER_MARKING_CONTRACT_URL ||
  "https://www.falowen.app/api/internal/marking-manifest";


const normalizeId = value => String(value || "").trim().toUpperCase();

export async function loadLiveMarkingContract(assignmentId, referenceEntry = {}) {
  const id = normalizeId(assignmentId);
  if (!/^(A1|A2|B1|B2|C1|C2)-[A-Z0-9.]+$/.test(id)) return null;
  try {
    const user = auth?.currentUser;
    if (!user?.getIdToken) return null;
    const token = await user.getIdToken();
    const url = new URL(LEARNER_MARKING_CONTRACT_URL);
    url.searchParams.set("assignmentId", id);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.warn("Learner marking manifest unavailable", { assignmentId: id, status: response.status });
      return null;
    }
    return mergePublishedMarkingContract(referenceEntry, await response.json());
  } catch (error) {
    console.warn("Could not refresh learner marking contract", { assignmentId: id, message: error?.message });
    return null;
  }
}
