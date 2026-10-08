import { auth } from "../firebase.js";

// The learner application is the authoritative publisher of new coursebook tasks.
// The API is staff-only: never move answer keys to a public projection.
export const LEARNER_MARKING_CONTRACT_URL =
  import.meta.env?.VITE_LEARNER_MARKING_CONTRACT_URL ||
  "https://www.falowen.app/api/internal/marking-manifest";

const normalizeId = value => String(value || "").trim().toUpperCase();
const normalizedAnswer = value => String(value ?? "").trim().replace(/\s+/g, " ");
const flattenAnswers = answers => {
  const flat = new Map();
  if (!answers || typeof answers !== "object") return flat;
  for (const [key, value] of Object.entries(answers)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [question, answer] of Object.entries(value)) {
        flat.set(`${key.toLowerCase()}.${question.toLowerCase()}`, normalizedAnswer(answer));
      }
    } else {
      flat.set(`main.${key.toLowerCase()}`, normalizedAnswer(value));
    }
  }
  return flat;
};

export function comparePublishedAnswerKeys(current = {}, incoming = {}) {
  const existing = flattenAnswers(current);
  const next = flattenAnswers(incoming);
  if (!next.size) return { safe: false, reason: "Published answer key is empty." };
  if (!existing.size) return { safe: true, reason: "No older answer key exists." };
  if (existing.size !== next.size || [...existing].some(([key, value]) => next.get(key) !== value)) {
    return { safe: false, reason: "Coursebook answer keys differ from the current Admin key; tutor review is required before replacing them." };
  }
  return { safe: true, reason: "" };
}

export function mergePublishedMarkingContract(referenceEntry = {}, contract = {}) {
  const requested = normalizeId(referenceEntry.assignmentKey || referenceEntry.assignmentId || referenceEntry.assignment_id);
  if (!requested || contract.schemaVersion !== 1 || normalizeId(contract.assignmentId) !== requested) {
    return { referenceEntry, warning: "Invalid or mismatched published assignment contract.", sourceVersion: "" };
  }
  const published = contract.answerKey?.answers;
  const previous = referenceEntry.rawAnswers || referenceEntry.answers || {};
  const comparison = published ? comparePublishedAnswerKeys(previous, published) : { safe: true };
  const safeAnswerKey = Boolean(published && comparison.safe);
  const writing = contract.writingTask && normalizeId(contract.writingTask.assignmentKey) === requested
    ? contract.writingTask : null;
  const merged = {
    ...referenceEntry,
    ...(safeAnswerKey ? { rawAnswers: published, answers: published } : {}),
    ...(writing ? {
      questionAwareWritingTask: {
        assignmentKey: requested,
        level: requested.split("-")[0],
        ...writing,
        source: "learner-coursebook",
        sourceVersion: contract.sourceVersion,
      },
    } : {}),
  };
  return {
    referenceEntry: merged,
    warning: comparison.safe ? "" : comparison.reason,
    sourceVersion: contract.sourceVersion || "",
    writingUpdated: Boolean(writing),
    answersUpdated: safeAnswerKey,
  };
}

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
